import Link from "next/link";
import { ArrowDownToLine, ArrowRight, Mic } from "lucide-react";
import { getUser } from "../session";
import { MarketingFooter, MarketingHeader } from "../marketing";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = {
  title: `User guide · ${SITE.name}`,
  description: `Learn how to set up ${SITE.name}, talk to the bench assistant, and reconcile supplier credit.`,
};
const TOC = [
  ["quick-start", "Quick start"],
  ["policies", "Supplier policies"],
  ["purchases", "Purchases & CSV import"],
  ["voice", "Talking to the assistant"],
  ["approvals", "Approving the return"],
  ["credits", "Credits & short credit"],
  ["statuses", "What the statuses mean"],
  ["troubleshooting", "Troubleshooting"],
  ["glossary", "Glossary"],
];
const STATUSES = [
  ["Needs inspection", "The core has not been inspected and confirmed yet."],
  ["Ready to return", "A person confirmed the match and prepared the return. It is waiting to be dispatched."],
  ["In transit", "You recorded a real dispatch. Waiting for the supplier to receive it."],
  ["Awaiting credit", "The supplier received it; no credit memo has been posted yet."],
  ["Short credit", "A credit was posted but is less than the deposit. Follow up or accept a documented deduction."],
  ["Credited", "Posted supplier credit covers the deposit in full."],
  ["Closed with deduction", "You accepted a documented supplier deduction. Reported separately from recovered credit."],
];
const GLOSSARY = [
  ["Core", "A used, rebuildable part (here: an alternator or starter) returned to the supplier for a deposit refund."],
  ["Core deposit", "The refundable amount added to the price of a remanufactured part until you return the old one."],
  ["Deadline basis", "Whether the supplier counts the return window to the date you dispatch the core or the date they receive it."],
  ["RMA", "A supplier authorization reference some suppliers require before accepting a return."],
  ["Credit memo", "The supplier’s document showing the credit they applied. Only posted memos count as credited."],
  ["Policy snapshot", "The copy of the supplier terms stored on each purchase, so later policy changes never rewrite history."],
];
export default async function Guide() {
  const user = await getUser();
  return (
    <div className="mk">
      <MarketingHeader signedIn={!!user} />
      <main className="mk-container guide" id="main">
        <aside className="guide-toc" aria-label="On this page">
          <div className="eyebrow">On this page</div>
          {TOC.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </aside>
        <article className="prose">
          <div className="eyebrow">User guide</div>
          <h1>Using {SITE.name}</h1>
          <p className="lede sm">
            {SITE.name} starts as an empty, private workspace. This guide walks
            through setting it up, talking to the bench assistant, and following
            a deposit until the credit arrives.
          </p>

          <h2 id="quick-start">Quick start</h2>
          <ol className="num-list">
            <li>
              <b>Create a workspace.</b> Sign up with an email and password (no
              verification needed) or start as a guest.
            </li>
            <li>
              <b>Add a supplier policy.</b> Copy the supplier’s real return
              terms.
            </li>
            <li>
              <b>Add purchases.</b> Enter one by hand or import a CSV.
            </li>
            <li>
              <b>Open a record and start a bench conversation.</b> Or use the
              inspection form if you prefer typing.
            </li>
            <li>
              <b>Confirm, prepare and download</b> the return packet, then
              record the real dispatch.
            </li>
            <li>
              <b>Post supplier credit memos</b> when they arrive.
            </li>
          </ol>
          <div className="callout">
            Press <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">K</kbd>{" "}
            (or <kbd className="kbd">⌘ K</kbd>) anywhere in the workspace to
            search purchases and jump to any action.
          </div>

          <h2 id="policies">Supplier policies</h2>
          <p>
            A policy describes what your supplier requires. The assistant only
            quotes policies you have saved. Fields:
          </p>
          <dl className="defs">
            <dt>Supplier, name, version</dt>
            <dd>
              Identify the terms, for example “Acme Parts · Core returns · v3
              2026”. Add a new version whenever the supplier updates its terms.
            </dd>
            <dt>Return window (days)</dt>
            <dd>How many days you have, counted from the shipped date on the purchase.</dd>
            <dt>Deadline basis</dt>
            <dd>
              <b>Dispatch</b>: you must send the core by the deadline.{" "}
              <b>Receipt</b>: the supplier must have it by the deadline. Dispatch
              alone never satisfies a receipt-based deadline.
            </dd>
            <dt>Alternative packaging</dt>
            <dd>
              If the original box may be replaced, describe exactly what is
              allowed (container type, pallet, securing, label). The assistant
              asks about every condition you list.
            </dd>
            <dt>Complete assembly / RMA required</dt>
            <dd>Turn on the conditions your supplier enforces.</dd>
            <dt>Credit follow-up (days)</dt>
            <dd>How long after receipt to chase a missing credit.</dd>
            <dt>Source</dt>
            <dd>Where the terms came from (a URL, a rep’s name, a contract clause). Always check them against an authorized source.</dd>
          </dl>

          <h2 id="purchases">Purchases &amp; CSV import</h2>
          <p>
            Each record is <b>one physical core</b>. If an invoice line covers
            several units, split it into separate references (for example
            line “1a”, “1b”). A purchase is unique by supplier, invoice and line.
          </p>
          <h3>Purchases CSV</h3>
          <pre className="code">
            {`invoice,purchase_line,job,part,description,deposit_usd,shipped_date
INV-1001,1,JOB-100,ALT-000,Alternator,150.00,2026-01-15`}
          </pre>
          <h3>Credit memos CSV</h3>
          <pre className="code">
            {`invoice,purchase_line,job,part,memo,memo_line,credit_usd,date,note
INV-1001,1,JOB-100,ALT-000,CM-0001,1,150.00,2026-02-10,Full credit`}
          </pre>
          <p>
            Imports validate first and show a preview. They are all-or-nothing:
            if any row fails, nothing is imported. Limits: 200 rows and 500 KB
            per file; amounts in US dollars; dates as YYYY-MM-DD. A supplier
            memo line can be posted only once, so reverse a mistaken posting
            before reusing it.
          </p>
          <div className="btn-row">
            <a
              className="btn"
              href="/templates/coreback-purchases-template.csv"
              download
            >
              <ArrowDownToLine size={15} /> Purchases template
            </a>
            <a
              className="btn"
              href="/templates/coreback-credits-template.csv"
              download
            >
              <ArrowDownToLine size={15} /> Credits template
            </a>
          </div>

          <h2 id="voice">Talking to the assistant</h2>
          <p>
            Open a record and choose <b>Start bench conversation</b>. Accept the
            consent notice, then allow the microphone when your browser asks. Use
            headphones so the assistant does not hear itself.
          </p>
          <h3>What to say</h3>
          <ul className="bullets">
            <li>
              The <b>job or invoice</b> and the <b>part number</b> on the tag.
              It reads them back; confirm or correct.
            </li>
            <li>
              Whether the assembly is <b>complete</b>, in your own words: “all
              required components are present”.
            </li>
            <li>
              The <b>packaging</b> you actually have: “I have the original box”
              or “original box is missing, it’s in a sealed crate on a pallet”.
            </li>
            <li>
              Whether the <b>invoice label</b> is attached.
            </li>
          </ul>
          <h3>Rules it follows</h3>
          <ul className="bullets">
            <li>
              It asks <b>one question at a time</b> and keeps answers short.
            </li>
            <li>
              A fact is saved only with a <b>verbatim quote</b> from what you
              said in this session. A bare “yes” is not evidence.
            </li>
            <li>
              If saving fails, nothing was saved. It will ask again; just state
              the condition clearly.
            </li>
            <li>
              You can <b>correct</b> yourself at any time: “actually, the label
              is not attached”.
            </li>
            <li>
              Sessions last up to <b>10 minutes</b>; each account gets{" "}
              <b>8 per day</b>. The assistant is an AI and says so.
            </li>
          </ul>
          <div className="btn-row">
            <Link
              className="btn primary"
              href={user ? "/workspace" : "/signin?mode=signup"}
            >
              <Mic size={15} /> {user ? "Open workspace" : "Create workspace"}
            </Link>
          </div>

          <h2 id="approvals">Approving the return</h2>
          <p>
            Voice never approves anything. On the record, review the checklist,
            then <b>confirm the purchase match</b> (exact part, invoice, line and
            job) and <b>prepare the return</b>. Download the PDF or text packet,
            pack the core, and use <b>Record a real dispatch</b> with the pickup
            or tracking reference. Dispatched evidence is locked. Later, record
            the supplier’s receipt.
          </p>
          <p>
            If you correct an inspection fact after preparing, the earlier
            preparation is invalidated and you must review and prepare again.
          </p>

          <h2 id="credits">Credits &amp; short credit</h2>
          <p>
            Post each supplier credit memo against its purchase (manually or by
            CSV). Only posted memos count as <b>credited</b>. If the credit is
            lower than the deposit, the record becomes <b>Short credit</b> and
            stays open. Either post further credits, add a follow-up note, or
            accept a documented deduction, which is reported separately and never
            counted as recovered.
          </p>

          <h2 id="statuses">What the statuses mean</h2>
          <div className="status-table">
            {STATUSES.map(([s, d]) => (
              <div key={s}>
                <b>{s}</b>
                <span>{d}</span>
              </div>
            ))}
          </div>

          <h2 id="troubleshooting">Troubleshooting</h2>
          <dl className="defs">
            <dt>“Voice key needed”</dt>
            <dd>The server has no AssemblyAI key. The administrator sets ASSEMBLYAI_API_KEY and restarts.</dd>
            <dt>The browser can’t hear me</dt>
            <dd>Click the lock icon in the address bar, allow the microphone, and check that the operating system allows browser microphone access.</dd>
            <dt>“Refresh and try again; your input remains on screen”</dt>
            <dd>The save did not go through, usually because the record changed elsewhere (another tab or the voice session) or the connection dropped. Refresh, check the record, and repeat the action.</dd>
            <dt>Session limit reached</dt>
            <dd>Voice is capped per account per day. Use the inspection form; it records the same facts.</dd>
            <dt>Import rejected</dt>
            <dd>Read the row number in the message. Check dates (YYYY-MM-DD), dollar amounts, and that invoice, job and part match exactly one purchase.</dd>
            <dt>Guest workspace and sign-out</dt>
            <dd>A guest workspace lives in that browser. Create an account from Settings before signing out or clearing data.</dd>
          </dl>

          <h2 id="glossary">Glossary</h2>
          <dl className="defs">
            {GLOSSARY.map(([t, d]) => (
              <div key={t} className="def-pair">
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <p className="fine">
            {SITE.name} prepares and tracks returns. Your supplier decides
            acceptance and credit. It does not ship parts, move money or access
            bank accounts.{" "}
            <Link className="text-link" href="/privacy">
              Privacy & data <ArrowRight size={13} />
            </Link>
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
