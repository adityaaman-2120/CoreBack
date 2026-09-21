#!/usr/bin/env node
// Deploys CoreBack to Google Cloud: Cloud Run (app) + Firebase Hosting (public
// address) + Firestore (data and rules). Idempotent: safe to run repeatedly.
//
//   node scripts/deploy.mjs             deploy
//   node scripts/deploy.mjs --dry-run   print every command without running it
//
// Configuration (all optional; defaults come from lib/firebase-config.json and
// firebase.json):
//   GCP_PROJECT            Google Cloud / Firebase project id
//   GCP_REGION             Cloud Run region             (default: from firebase.json)
//   SERVICE_NAME           Cloud Run service name       (default: from firebase.json)
//   FIRESTORE_DATABASE_ID  Firestore database id        (default: "(default)")
//   FIRESTORE_LOCATION     Location if the DB is created (default: nam5)
//   APP_ORIGINS            Comma-separated HTTPS origins allowed to sign in
//                          (default: https://<project>.web.app + .firebaseapp.com)
//   SITE_URL               Canonical public URL         (default: first APP_ORIGINS entry)
//   ASSEMBLYAI_API_KEY     If set, stored/rotated in Secret Manager
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dry = process.argv.includes("--dry-run");
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const web = read("../lib/firebase-config.json");
const fb = read("../firebase.json");
const rewrite = fb.hosting?.rewrites?.find((r) => r.run)?.run ?? {};

const project = process.env.GCP_PROJECT || web.projectId;
const region = process.env.GCP_REGION || rewrite.region || "us-central1";
const service = process.env.SERVICE_NAME || rewrite.serviceId || "coreback";
const dbId = process.env.FIRESTORE_DATABASE_ID || "(default)";
const dbLocation = process.env.FIRESTORE_LOCATION || "nam5";
const origins =
  process.env.APP_ORIGINS ||
  `https://${project}.web.app,https://${project}.firebaseapp.com`;
const siteUrl = process.env.SITE_URL || origins.split(",")[0].trim();
const runtimeSa = `${service}-runtime@${project}.iam.gserviceaccount.com`;
const secret = `${service}-voice-key`;
const image = `${region}-docker.pkg.dev/${project}/${service}/app:${Date.now()}`;
const win = process.platform === "win32";

if (rewrite.serviceId && rewrite.serviceId !== service)
  fail(`firebase.json routes to "${rewrite.serviceId}" but SERVICE_NAME is "${service}". Edit firebase.json to match.`);
if (rewrite.region && rewrite.region !== region)
  fail(`firebase.json routes to region "${rewrite.region}" but GCP_REGION is "${region}". Edit firebase.json to match.`);
if (!origins.split(",").every((o) => /^https:\/\/[^/\s]+$/.test(o.trim())))
  fail("APP_ORIGINS must be HTTPS origins without paths, separated by commas.");

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}
function step(title) {
  console.log(`\n▸ ${title}`);
}
function run(cmd, args, { allowFail = false, input, quiet = false } = {}) {
  const shown = `${cmd} ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`;
  console.log(`  $ ${shown}`);
  if (dry) return { status: 0, stdout: "" };
  const r = spawnSync(cmd, args, {
    stdio: quiet ? ["pipe", "pipe", "pipe"] : input ? ["pipe", "inherit", "inherit"] : "inherit",
    input,
    shell: win,
    encoding: "utf8",
  });
  if (r.status !== 0 && !allowFail) fail(`Command failed (${r.status}): ${shown}`);
  return r;
}
const ok = (cmd, args) => dry || run(cmd, args, { allowFail: true, quiet: true }).status === 0;
const g = (...a) => ["--project", project, ...a];

console.log(`CoreBack deploy${dry ? " (dry run)" : ""}
  project    ${project}
  region     ${region}
  service    ${service}
  database   ${dbId}
  origins    ${origins}
  public url ${siteUrl}`);

if (!dry) {
  const auth = spawnSync("gcloud", ["auth", "list", "--filter=status:ACTIVE", "--format=value(account)"], { shell: win, encoding: "utf8" });
  if (auth.status !== 0) fail("gcloud is not installed or not on PATH. Install the Google Cloud CLI.");
  if (!auth.stdout.trim()) fail("No active gcloud account. Run: gcloud auth login");
}

step("Enable required Google Cloud APIs");
run("gcloud", ["services", "enable", "run.googleapis.com", "cloudbuild.googleapis.com", "artifactregistry.googleapis.com", "secretmanager.googleapis.com", "firestore.googleapis.com", "identitytoolkit.googleapis.com", ...g("--quiet")]);

step("Artifact Registry repository");
if (!ok("gcloud", ["artifacts", "repositories", "describe", service, "--location", region, ...g()]))
  run("gcloud", ["artifacts", "repositories", "create", service, "--repository-format=docker", "--location", region, ...g("--quiet")]);

step("Runtime service account and permissions");
if (!ok("gcloud", ["iam", "service-accounts", "describe", runtimeSa, ...g()]))
  run("gcloud", ["iam", "service-accounts", "create", `${service}-runtime`, "--display-name", `${service} runtime`, ...g("--quiet")]);
for (const role of ["roles/datastore.user", "roles/firebaseauth.admin", "roles/secretmanager.secretAccessor"])
  run("gcloud", ["projects", "add-iam-policy-binding", project, "--member", `serviceAccount:${runtimeSa}`, "--role", role, "--condition=None", "--quiet"], { quiet: true });

step(`Firestore database ${dbId}`);
if (!ok("gcloud", ["firestore", "databases", "describe", `--database=${dbId}`, ...g()]))
  run("gcloud", ["firestore", "databases", "create", `--database=${dbId}`, `--location=${dbLocation}`, ...g("--quiet")]);

step("Voice API key (ASSEMBLYAI_API_KEY) in Secret Manager");
const haveSecret = ok("gcloud", ["secrets", "describe", secret, ...g()]);
if (process.env.ASSEMBLYAI_API_KEY) {
  if (!haveSecret) run("gcloud", ["secrets", "create", secret, "--replication-policy=automatic", ...g("--quiet")]);
  run("gcloud", ["secrets", "versions", "add", secret, "--data-file=-", ...g("--quiet")], { input: process.env.ASSEMBLYAI_API_KEY });
} else if (!haveSecret) {
  console.log("  ! No secret and ASSEMBLYAI_API_KEY is not set: the app will deploy with voice disabled.\n    Re-run with ASSEMBLYAI_API_KEY=... to enable it.");
}
const useSecret = haveSecret || !!process.env.ASSEMBLYAI_API_KEY;

step("Build container image (Cloud Build)");
run("gcloud", ["builds", "submit", "--tag", image, ...g("--quiet")]);

step("Deploy Cloud Run service");
const tmp = mkdtempSync(join(tmpdir(), "coreback-"));
const envFile = join(tmp, "env.yaml");
writeFileSync(envFile, [`GOOGLE_CLOUD_PROJECT: "${project}"`, `FIRESTORE_DATABASE_ID: "${dbId}"`, `APP_ORIGINS: "${origins}"`, `SITE_URL: "${siteUrl}"`, ""].join("\n"));
try {
  run("gcloud", [
    "run", "deploy", service, "--image", image, "--region", region,
    "--service-account", runtimeSa, "--allow-unauthenticated",
    "--min-instances=0", "--max-instances=3", "--memory=512Mi", "--cpu=1", "--concurrency=40", "--timeout=300",
    "--env-vars-file", envFile,
    ...(useSecret ? ["--set-secrets", `ASSEMBLYAI_API_KEY=${secret}:latest`] : []),
    ...g("--quiet"),
  ]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

step("Deploy Firebase Hosting and Firestore rules");
run("npx", ["--yes", "firebase-tools@latest", "deploy", "--only", "hosting,firestore:rules", "--project", project, "--non-interactive"]);

console.log(`
✔ Deployed ${siteUrl}

Remaining one-time checks in the Firebase console (Authentication > Settings):
  • Authorized domains include the hostname of ${siteUrl}
  • Sign-in methods enabled: Email/Password (and Anonymous for guest access)`);
