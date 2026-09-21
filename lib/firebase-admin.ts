import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type Credential,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import webConfig from "./firebase-config.json";

// On Google Cloud, credentials are automatic. On other hosts (Vercel, Render…)
// set FIREBASE_SERVICE_ACCOUNT to the service-account key JSON, either raw or
// base64-encoded. Locally, GOOGLE_APPLICATION_CREDENTIALS (a file path) works.
function credential(): Credential {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return applicationDefault();
  const json = raw.startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return cert(JSON.parse(json));
}
function app() {
  return (
    getApps()[0] ||
    initializeApp({
      credential: credential(),
      projectId:
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCLOUD_PROJECT ||
        webConfig.projectId,
    })
  );
}
export function adminAuth() {
  return getAuth(app());
}
export function firestore() {
  return getFirestore(app(), process.env.FIRESTORE_DATABASE_ID || "(default)");
}
