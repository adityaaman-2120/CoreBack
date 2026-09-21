# Free deployment (no billing): Vercel + Firebase Spark

This path needs **no credit card**. Cloud Run (the path in [deployment.md](deployment.md)) requires the paid Blaze plan; Vercel's Hobby plan and Firebase's Spark plan do not.

| Piece | Service | Cost |
| --- | --- | --- |
| App (Next.js) | Vercel Hobby | Free |
| Sign-in | Firebase Authentication | Free |
| Database | Cloud Firestore `(default)` database, Spark quota | Free within quota |
| Voice | AssemblyAI (browser connects directly) | Provider credit (has its own free/paid terms) |

Vercel's Hobby plan is for **non-commercial** use. If CoreBack becomes a business, move to a paid plan or the Cloud Run path.

## Steps

### 1. Prepare Firebase (once)
In the Firebase console for your project:
1. **Authentication → Sign-in method**: enable *Email/Password* (and *Anonymous* for guest workspaces).
2. **Firestore Database**: make sure the `(default)` database exists, in production mode.
3. **Project settings → Service accounts → Generate new private key**. Keep the downloaded JSON private.

Turn the key into one line for Vercel (base64 avoids quoting problems):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("D:\Buyer\secrets\heavyhaul-key.json"))
```
```sh
base64 -w0 key.json      # macOS/Linux
```

### 2. Import the repository into Vercel
1. Sign up at vercel.com with your GitHub account (no card needed on Hobby).
2. **Add New → Project →** pick `adityaaman-2120/CoreBack` → Framework is detected as Next.js.
3. Before deploying, add **Environment Variables**:

| Name | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | the base64 string from step 1 |
| `GOOGLE_CLOUD_PROJECT` | your Firebase project id |
| `FIRESTORE_DATABASE_ID` | `(default)` |
| `ASSEMBLYAI_API_KEY` | your AssemblyAI key (optional; voice is off without it) |
| `APP_ORIGINS` | `https://YOUR-APP.vercel.app` (set after you know the URL, then redeploy) |
| `SITE_URL` | the same URL |

4. Click **Deploy**.

### 3. Set the real address
Vercel shows your URL, for example `https://coreback.vercel.app`. Put it into `APP_ORIGINS` and `SITE_URL` (Project → Settings → Environment Variables), then **Deployments → Redeploy**. Sign-in is rejected until `APP_ORIGINS` matches the exact origin (no trailing slash, no path).

If you add a custom domain later, list both origins comma-separated in `APP_ORIGINS`.

### 4. Check it works
Open the URL, create an account, add a policy and a purchase, reload, and (with a microphone and AssemblyAI credit) start a voice conversation.

## Notes
- The Firebase web config in `lib/firebase-config.json` is public by design; the service-account key is the secret. Never commit it.
- Function region: Vercel defaults to the US. If your Firestore database is elsewhere (for example Mumbai), add `{ "regions": ["bom1"] }` to a `vercel.json` to reduce latency.
- Free Firestore quota is generous for a small shop (50k reads and 20k writes per day). Watch usage in the Firebase console.
- Voice sessions are metered by AssemblyAI, not Vercel. Sessions are capped at 10 minutes and 8 per account per day.
