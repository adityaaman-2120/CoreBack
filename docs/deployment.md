# Deployment

CoreBack runs as a Next.js server on **Cloud Run**, fronted by **Firebase Hosting**, with data in **Cloud Firestore** and identity from **Firebase Authentication**. The AssemblyAI key lives in **Secret Manager**.

## Prerequisites

- A Google Cloud project with **billing enabled** (Blaze plan). Cloud Run, Cloud Build, Artifact Registry and Secret Manager are not available on the free Spark plan.
- The [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) authenticated as a project owner: `gcloud auth login`.
- Node.js 22.13+.
- In the Firebase console for the project:
  - **Authentication → Sign-in method**: enable *Email/Password* (and *Anonymous* if guest workspaces are wanted).
  - The project's web app config saved in `lib/firebase-config.json`.

## One command

```sh
# optional: store or rotate the voice key in Secret Manager
export ASSEMBLYAI_API_KEY=...            # PowerShell: $env:ASSEMBLYAI_API_KEY="..."
npm run deploy
```

Preview every command first with `node scripts/deploy.mjs --dry-run`.

The script is idempotent. It:

1. Enables the required APIs.
2. Creates the Artifact Registry repository and a dedicated runtime service account (`coreback-runtime`) with `datastore.user`, `firebaseauth.admin` and `secretmanager.secretAccessor`.
3. Creates the Firestore database if missing.
4. Stores `ASSEMBLYAI_API_KEY` in Secret Manager when provided (the app deploys with voice disabled if no key exists).
5. Builds the container with Cloud Build (no secrets are passed to the build).
6. Deploys Cloud Run with 0–3 instances, 512 MiB, concurrency 40.
7. Deploys Firebase Hosting (rewrites everything to Cloud Run) and the deny-all Firestore browser rules.

### Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `GCP_PROJECT` | `projectId` in `lib/firebase-config.json` | Project to deploy to |
| `GCP_REGION` | region in `firebase.json` | Cloud Run region |
| `SERVICE_NAME` | service in `firebase.json` | Cloud Run service (must match `firebase.json`) |
| `FIRESTORE_DATABASE_ID` | `(default)` | Firestore database id |
| `FIRESTORE_LOCATION` | `nam5` | Location used only if the database is created |
| `APP_ORIGINS` | `https://<project>.web.app,https://<project>.firebaseapp.com` | HTTPS origins allowed to sign in. Add any custom domain here |
| `SITE_URL` | first `APP_ORIGINS` entry | Canonical URL for metadata and sitemap |

### Custom domain

Add the domain in Firebase Hosting, then redeploy with both origins:

```sh
APP_ORIGINS=https://app.example.com,https://<project>.web.app SITE_URL=https://app.example.com npm run deploy
```

## After the first deploy

Verify on the public URL (a green build is not evidence these work):

1. Create an account and sign in; refresh and confirm the session persists.
2. Add a policy and a purchase; reload and confirm they persist.
3. Sign in as a second account and confirm you cannot see the first account's data.
4. Start a voice conversation (needs a real microphone and AssemblyAI credit).
5. Post a credit memo and export the workspace.

## Rollback

Cloud Run keeps prior revisions. Route traffic back with `gcloud run services update-traffic coreback --to-revisions=<REVISION>=100 --region <region>`. Confirm the older revision understands current document shapes first.

## Costs

Firestore reads/writes, Cloud Run, Cloud Build, Artifact Registry, Secret Manager and AssemblyAI voice usage are billable. Voice is published at $0.075/minute; sessions are capped at 10 minutes and 8 per account per UTC day (20 globally per day). These are issuance limits, not spend caps. Set a billing budget alert.
