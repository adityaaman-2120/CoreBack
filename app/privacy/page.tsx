import { getUser } from "../session";
import { MarketingFooter, MarketingHeader } from "../marketing";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `Privacy & data · ${SITE.name}` };
export default async function Privacy() {
  const user = await getUser();
  return (
    <div className="mk">
      <MarketingHeader signedIn={!!user} />
      <main className="mk-container narrow prose privacy" id="main">
        <div className="eyebrow">Privacy & data</div>
        <h1>Your shop’s records stay your shop’s records.</h1>
        <p>
          {SITE.name} prepares and tracks parts-core returns; suppliers decide
          acceptance and credit. It is operated by {SITE.owner}
          {SITE.supportEmail ? ` (${SITE.supportEmail})` : ""}.
        </p>
        <h2>What is stored</h2>
        <p>
          Workspaces store purchase identifiers, supplier policies, inspection
          observations, correction history, dispatch and receipt references,
          credit-memo entries and final conversation transcripts. Identity comes
          from Firebase Authentication. Records are scoped to the signed-in
          account.
        </p>
        <h2>Voice processing</h2>
        <p>
          Starting a voice conversation sends microphone audio to AssemblyAI for
          speech recognition, reasoning and spoken responses. {SITE.name} does
          not retain audio files. AssemblyAI’s own processing and retention terms
          apply. The browser submits transcript text and tool requests to{" "}
          {SITE.name}; these are not cryptographically authenticated recordings.
        </p>
        <p>
          <a
            className="text-link"
            href="https://www.assemblyai.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            AssemblyAI privacy policy
          </a>
        </p>
        <h2>Hosting and access</h2>
        <p>
          Records are stored in Google Cloud Firestore. Firebase Authentication
          verifies sign-in, and a secure, HTTP-only session cookie protects your
          workspace. Guest accounts are tied to one browser until linked to an
          email account. Server API keys are never sent to the browser. Voice
          uses short-lived tokens, bounded sessions and issuance quotas.
        </p>
        <h2>Control and retention</h2>
        <p>
          Export your records as CSV, individual evidence packages as JSON, or
          your complete workspace as JSON. Records remain until removed through
          workspace deletion or the administrator’s retention process. Download
          anything you need before deleting a workspace. Provider logs or
          backups may follow separate retention schedules.
        </p>
        <h2>What the assistant cannot do</h2>
        <p>
          The assistant cannot approve returns, initiate shipments, issue
          refunds, post financial credits, access bank accounts or override
          supplier requirements. People confirm those records against their
          actual source documents. Do not enter payment credentials, customer
          personal data, hazardous-material instructions or secrets into a
          conversation.
        </p>
        <p className="fine">Last updated: September 22, 2026.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
