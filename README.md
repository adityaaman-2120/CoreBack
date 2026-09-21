# CoreBack

**Recover every core deposit, by voice.**

CoreBack is a voice-first workspace for repair shops. It matches an old alternator or starter to the purchase behind it, walks the technician through the supplier's return rules at the bench, prepares the return packet, and follows the deposit until the supplier credit actually lands.

- **Talk at the bench.** A live assistant, CoreBack Voice (built on the AssemblyAI Voice Agent API), asks one question at a time and saves structured observations, each backed by a verbatim quote from you.
- **A person approves everything.** The assistant can record observations. Confirming a purchase match, preparing or dispatching a return, and posting credit are human actions enforced by the server.
- **Expected is not recovered.** Deposits paid, credit posted, deductions accepted and balance outstanding are tracked separately, in integer cents.
- **Starts empty.** No sample data. Add your own supplier policies and purchases (by hand or CSV).

## Features

| Area | What you get |
| --- | --- |
| Landing, guide, privacy | Public marketing page, a full user guide with CSV templates, and a privacy page |
| Sign-in | Email/password (no email verification) and optional anonymous guest workspaces |
| Recovery desk | KPIs, recovery-progress bar, status pipeline, searchable/filterable table, onboarding checklist |
| Command palette | `Ctrl`/`⌘` + `K` to search purchases and run any action |
| Bench assistant | Live voice with consent, mute, 10-minute session cap, transcript and audit trail |
| Policies & purchases | Versioned supplier policies, per-purchase policy snapshots, CSV import (200 rows, all-or-nothing) |
| Returns | Deadline tracking (dispatch vs receipt), return packet as PDF/text, dispatch and receipt records |
| Credit ledger | Credit memo import, partial/short credit handling, reversals, accepted deductions, CSV export |
| Data control | Per-core evidence JSON, complete workspace export, resumable workspace deletion |
| Design | Light/dark/system themes, responsive layout with mobile tab bar, accessible focus states |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Firebase Authentication · Cloud Firestore (Admin SDK, transactions) · AssemblyAI Voice Agent API · Vitest with the Firestore emulator.

## Getting started

Requires Node.js 22.13+ and npm. Java 21+ is needed only to run the test suite (Firestore emulator).

```sh
npm ci
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://127.0.0.1:5173
```

Minimum configuration for a working local app:

1. **Firebase project.** Enable *Authentication* (Email/Password, and Anonymous if you want guest workspaces) and create a *Firestore* database. Put the project's web config in `lib/firebase-config.json`.
2. **Server credentials.** Create a service-account key (Project settings → Service accounts) and point `GOOGLE_APPLICATION_CREDENTIALS` at it. Set `FIRESTORE_DATABASE_ID` to the database you created (`(default)` unless you named it).
3. **Voice (optional).** Set `ASSEMBLYAI_API_KEY`. The account needs Voice Agent API access and credit. Without it, everything except live voice works, including the inspection form.

Open the app, create an account, then follow the in-app checklist or the [user guide](http://127.0.0.1:5173/guide).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 5173 |
| `npm test` | Full test suite against a local Firestore emulator |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run build` / `npm start` | Production build and server |
| `npm run deploy` | Deploy to Google Cloud (see [deployment](docs/deployment.md)) |

## Deploying

`npm run deploy` provisions and deploys Cloud Run + Firebase Hosting + Firestore rules in one idempotent step. Use `node scripts/deploy.mjs --dry-run` to preview. Full instructions, required IAM roles and post-deploy checks are in [docs/deployment.md](docs/deployment.md).

## Project layout

```
app/            Next.js routes: landing, guide, sign-in, privacy, workspace, API
lib/            Domain rules, database layer, voice client, PDF, site config
public/         Static assets, CSV templates, audio worklet
scripts/        Test runner and deploy script
tests/          Domain, API (Firestore emulator), auth and audio tests
docs/           Architecture, deployment and operations
```

Branding (name, tagline, owner, URL) lives in one file: [`lib/site.ts`](lib/site.ts).

## Documentation

- [Architecture and trust boundaries](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Operations](docs/operations.md)
- [Testing](tests/README.md)

## Limits

Single-owner workspaces (no team roles); no ERP, carrier, supplier or bank integration; the assistant is scoped to dry alternator and starter cores. CoreBack prepares and tracks returns; the supplier decides acceptance and credit.

## License

MIT. See [LICENSE](LICENSE).
