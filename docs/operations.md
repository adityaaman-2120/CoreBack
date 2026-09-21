# Operations

For provisioning and releasing, see [deployment](deployment.md). This document covers day-to-day running, failure handling and data control.

## Runtime

Firebase Hosting rewrites all traffic to the `coreback` Cloud Run service. The service uses the dedicated `coreback-runtime` service account and the Firestore database named by `FIRESTORE_DATABASE_ID`. The AssemblyAI key is in Secret Manager as `coreback-voice-key`, exposed to the server as `ASSEMBLYAI_API_KEY`. Never place a provider key in frontend configuration, build arguments, Git, screenshots or logs. Firebase's public browser configuration is not a substitute for server authorization.

Cloud Run defaults: zero minimum instances, three maximum, 512 MiB, one CPU, concurrency 40, 300-second timeout. There is no uptime SLA; cold starts and provider failures remain possible.

## Local development

```sh
npm ci
cp .env.example .env.local
npm run dev            # http://127.0.0.1:5173
```

Local development uses real Firebase Authentication and Firestore (see the README). In development every `http://localhost:*` and `http://127.0.0.1:*` origin is accepted for sign-in; production accepts only the explicit `APP_ORIGINS` list. Do not point development mutations at production data: use a separate Firebase project.

Tests use their own Firestore emulator and never touch real data: `npm test` (Node 22.13+, Java 21+). See [test details](../tests/README.md).

A local Firestore emulator can be selected with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8787`. That affects storage only, not Firebase Authentication.

## Configuration reference

| Variable | Where | Purpose |
| --- | --- | --- |
| `ASSEMBLYAI_API_KEY` | server | Enables live voice. Missing key: voice reports unavailable, forms and exports still work |
| `GOOGLE_CLOUD_PROJECT` | server | Firebase/GCP project (defaults to `lib/firebase-config.json`) |
| `FIRESTORE_DATABASE_ID` | server | Database id, default `(default)` |
| `GOOGLE_APPLICATION_CREDENTIALS` | local only | Service-account key path. Automatic on Google Cloud |
| `APP_ORIGINS` | server | Allowed HTTPS sign-in origins in production. Never a wildcard |
| `SITE_URL` | server | Canonical URL for metadata/sitemap |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | build | Shown on the privacy page |

## Failures and corrections

- **Voice unavailable.** A missing key returns a clear unavailable response. Check native Voice Agent API entitlement and provider balance separately. Token failures release successful-issuance quota but keep the attempt limit. Never display credential-bearing upstream errors.
- **Microphone.** Capture needs HTTPS or localhost. If permission is denied, use the inspection form. A dropped socket ends the session; server-confirmed observations remain saved. Speech that was not acknowledged is not claimed as captured.
- **Sign-in fails with "unauthorized origin".** Add the exact HTTPS origin to `APP_ORIGINS` and redeploy.
- **Guest sign-in unavailable.** Enable the Anonymous provider in Firebase Authentication.
- **Revision conflict.** Reload before applying another change. Imports are atomic. Do not reuse a request ID for a different action. Correct credits through reversal and reposting, and dates through the audited correction action.

## Export, deletion and recovery

Settings offers a complete workspace JSON export (records, policies, events, final transcripts). Ledger CSV is only a summary. Export before deletion. Self-service deletion removes workspace data and keeps abuse quotas; it does not delete the Firebase Authentication account or provider-side logs.

Deletion blocks new mutations while it runs. If interrupted, retry after two minutes. Each bounded deletion transaction checks a durable lease so overlapping workers cannot delete newly created data. Do not clear the lock manually without investigating.

A self-service restore is not implemented. Backup scheduling and a restore exercise are operational gates the deployer must complete. Provider and infrastructure backups can have separate retention.

## Incident procedure

1. Restrict voice issuance or remove the runtime secret if issuance is unexpected. Keep account ownership checks intact.
2. Review sanitized Cloud Run logs and provider usage. Do not log keys, bearer tokens, raw audio or complete customer records.
3. Preserve evidence before repair. Use corrective events rather than silently rewriting financial history.
4. Fix the cause, run the relevant tests, deploy and verify the affected workflow on the public URL.
5. Contact affected users through an authorized process; the app has no outbound notification integration.

Maintain the lockfile and retest Firebase, Next.js and transitive updates. CI installs Java 21, runs the emulator-backed suite, typechecks, lints and builds.
