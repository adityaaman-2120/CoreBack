import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
  History,
  LockKeyhole,
  Mic,
  ReceiptText,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { getUser } from "./session";
import { MarketingFooter, MarketingHeader } from "./marketing";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: <FileText size={20} />,
    title: "Save your supplier’s terms",
    text: "Enter the real return window, deadline basis, packaging rules and credit follow-up time. Each purchase keeps its own policy snapshot.",
  },
  {
    icon: <ReceiptText size={20} />,
    title: "Add what you paid",
    text: "Type a purchase or import up to 200 rows from CSV. One record per physical core, tied to the exact invoice, line and job.",
  },
  {
    icon: <Mic size={20} />,
    title: "Talk it through at the bench",
    text: "Say the part number, invoice and condition. The assistant checks the paperwork and records only what you actually say.",
  },
  {
    icon: <ClipboardCheck size={20} />,
    title: "Approve and prepare the return",
    text: "You confirm the purchase match and prepare a return packet as a PDF. Nothing ships or posts without a person.",
  },
  {
    icon: <Wallet size={20} />,
    title: "Reconcile the credit",
    text: "Post supplier credit memos. Expected is not recovered, so a short credit stays open until it is resolved.",
  },
];
const FEATURES = [
  {
    icon: <Mic size={20} />,
    title: "Voice inspection",
    text: "A hands-free assistant that asks one question at a time and saves structured observations, not a rambling transcript.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Evidence-quoted facts",
    text: "Every completeness, packaging and label fact must be backed by a verbatim quote from you. A bare “yes” is rejected.",
  },
  {
    icon: <CalendarClock size={20} />,
    title: "Deadline tracking",
    text: "Return-by dates that respect whether your supplier counts dispatch or receipt, with a seven-day urgency view.",
  },
  {
    icon: <Wallet size={20} />,
    title: "Honest credit ledger",
    text: "Deposits paid, credit posted, deductions accepted and balance outstanding stay separate, in integer cents.",
  },
  {
    icon: <FileText size={20} />,
    title: "Return packets",
    text: "One-click PDF and text packets with the exact purchase, policy version, deadline and condition notes.",
  },
  {
    icon: <History size={20} />,
    title: "Full audit trail",
    text: "Every change is versioned with who, when and why. Export a per-core evidence package or your whole workspace.",
  },
];
const FAQ = [
  [
    "Does CoreBack store my audio?",
    "No. Microphone audio streams to AssemblyAI for speech recognition and the spoken reply. CoreBack saves the transcript text and the structured observations only.",
  ],
  [
    "Can the assistant approve a return or post a credit?",
    "No. It can record observations and add follow-up notes. Confirming the purchase match, preparing the return, dispatching, and posting or reversing credit are human actions enforced by the server.",
  ],
  [
    "What if my supplier changes its policy?",
    "Add the new version as a policy. Existing purchases keep the version they were bought under, so history never rewrites itself.",
  ],
  [
    "Does it connect to my bank, supplier or accounting system?",
    "No. Credits are entered or imported from the supplier memos you receive. CoreBack does not move money, ship parts or verify settlement.",
  ],
  [
    "What parts does it handle?",
    "It is scoped to dry alternator and starter cores, the assemblies most commonly sold with refundable deposits.",
  ],
  [
    "What does the voice cost?",
    "Voice runs on AssemblyAI’s Voice Agent API, published at $0.075 per minute. Sessions are capped at 10 minutes and 8 per account per day.",
  ],
  [
    "Which browsers work?",
    "Current Chrome, Edge, Safari and Firefox. You will be asked to allow microphone access. If you would rather not, every step also works through forms.",
  ],
];

export default async function Home() {
  const user = await getUser();
  return (
    <div className="mk">
      <MarketingHeader signedIn={!!user} />
      <main id="main">
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="pill">
                <span className="dot" /> Voice-first core-deposit recovery
              </span>
              <h1>
                Every old part is <em>money on the shelf.</em>
              </h1>
              <p className="lede">
                {SITE.name} helps repair shops match a worn-out alternator or
                starter to the purchase behind it, prepare the supplier return,
                and follow the deposit until the credit actually lands, all by
                talking at the bench.
              </p>
              <div className="hero-cta">
                <Link
                  className="btn primary lg"
                  href={user ? "/workspace" : "/signin?mode=signup"}
                >
                  {user ? "Open your workspace" : "Create your workspace"}
                  <ArrowRight size={17} />
                </Link>
                <Link className="btn lg" href="#how">
                  See how it works
                </Link>
              </div>
              <ul className="trust-row">
                <li>
                  <BadgeCheck size={16} /> You approve every return
                </li>
                <li>
                  <LockKeyhole size={16} /> Private, owner-scoped records
                </li>
                <li>
                  <Mic size={16} /> No audio stored
                </li>
              </ul>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="mk-section band" aria-label="The problem">
          <div className="mk-container split">
            <div>
              <div className="eyebrow">The problem</div>
              <h2 className="mk-h2">
                Deposits vanish in the gap between the bench and the supplier.
              </h2>
            </div>
            <div className="problem-list">
              <p>
                A missing box, a misread part number, a deadline that counts
                from receipt instead of dispatch, a credit memo that comes back
                short. Each one quietly turns a refundable deposit into scrap.
              </p>
              <p>
                {SITE.name} keeps the rule, the record and the receipt in one
                place, and asks the right question at the moment the part is in
                your hands.
              </p>
            </div>
          </div>
        </section>

        <section className="mk-section" id="how">
          <div className="mk-container">
            <div className="section-head">
              <div className="eyebrow">How it works</div>
              <h2 className="mk-h2">From parts shelf to paid back in five steps</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="step-card">
                  <span className="step-num">{i + 1}</span>
                  <span className="step-icon">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mk-section band" id="voice">
          <div className="mk-container split voice-split">
            <div>
              <div className="eyebrow">The bench assistant</div>
              <h2 className="mk-h2">Hands on the part. Not on a keyboard.</h2>
              <p className="lede sm">
                The assistant asks one short question at a time, reads
                identifiers back, and refuses to guess. It never invents a part
                number, an RMA or a supplier approval, and it explains the
                policy only as far as the current question needs.
              </p>
              <ul className="check-list">
                <li>
                  <BadgeCheck size={17} /> Looks up your own records before it
                  answers
                </li>
                <li>
                  <BadgeCheck size={17} /> Asks about every packaging condition,
                  including pallets and labels
                </li>
                <li>
                  <BadgeCheck size={17} /> Saves facts only with a quote you
                  actually said
                </li>
                <li>
                  <BadgeCheck size={17} /> Stops at the boundary: a person
                  approves the return
                </li>
              </ul>
              <Link className="btn" href="/guide">
                <BookOpen size={16} /> Read the guide
              </Link>
            </div>
            <div className="convo" aria-label="Example conversation">
              <div className="convo-head">
                <span>
                  <Mic size={14} /> Example conversation
                </span>
                <span className="badge">Illustration</span>
              </div>
              <div className="bubble agent">
                <b>{SITE.name}</b>
                Hi, I’m {SITE.name}, an AI parts-desk assistant. What job or
                invoice is this core from?
              </div>
              <div className="bubble user">
                <b>You</b>
                It’s the 24-volt alternator from job 418.
              </div>
              <div className="bubble agent">
                <b>{SITE.name}</b>
                I found one match: invoice INV-8042, line 1. Can you read me the
                part number on the tag?
              </div>
              <div className="bubble user">
                <b>You</b>
                ALT-24-160. The original box is gone, but it’s in a sealed
                container with the label on it.
              </div>
              <div className="saved">
                <ShieldCheck size={15} />
                <span>
                  Saved with your quote: <i>“the original box is gone”</i>.
                  Packaging stays <b>unknown</b> until every alternative
                  condition is answered.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section" id="features">
          <div className="mk-container">
            <div className="section-head">
              <div className="eyebrow">Built for the details</div>
              <h2 className="mk-h2">Everything a return needs, nothing it doesn’t</h2>
            </div>
            <div className="feature-grid">
              {FEATURES.map((f) => (
                <div className="feature" key={f.title}>
                  <span className="step-icon">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mk-section band">
          <div className="mk-container">
            <div className="section-head">
              <div className="eyebrow">Guardrails</div>
              <h2 className="mk-h2">Automation with clear boundaries</h2>
            </div>
            <div className="guard-grid">
              <div className="guard yes">
                <h3>The assistant can</h3>
                <ul>
                  <li>Search your purchase records</li>
                  <li>Read your saved supplier policy</li>
                  <li>Record observations and inspection facts</li>
                  <li>Compute deadlines and balances</li>
                  <li>Add a follow-up note</li>
                </ul>
              </div>
              <div className="guard no">
                <h3>Only a person can</h3>
                <ul>
                  <li>Confirm the purchase match</li>
                  <li>Prepare or dispatch the return</li>
                  <li>Post, reverse or reopen a credit</li>
                  <li>Accept a supplier deduction</li>
                  <li>Waive any policy condition</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section" id="faq">
          <div className="mk-container narrow">
            <div className="section-head">
              <div className="eyebrow">Questions</div>
              <h2 className="mk-h2">Frequently asked</h2>
            </div>
            <div className="faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="mk-container cta-inner">
            <div>
              <h2>Stop leaving deposits on the shelf.</h2>
              <p>
                Create a private workspace in under a minute. No email
                verification, no card.
              </p>
            </div>
            <Link
              className="btn light lg"
              href={user ? "/workspace" : "/signin?mode=signup"}
            >
              {user ? "Open your workspace" : "Create your workspace"}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-chrome">
        <span />
        <span />
        <span />
        <em>Illustration · not real data</em>
      </div>
      <div className="preview-body">
        <div className="preview-side">
          <i className="active" />
          <i />
          <i />
          <i />
        </div>
        <div className="preview-main">
          <div className="pv-kpis">
            <div>
              <small>Still open</small>
              <b>$—</b>
            </div>
            <div>
              <small>Due in 7 days</small>
              <b>$—</b>
            </div>
            <div className="good">
              <small>Credited</small>
              <b>$—</b>
            </div>
          </div>
          <div className="pv-bar">
            <span style={{ width: "46%" }} />
            <span style={{ width: "18%" }} />
          </div>
          <div className="pv-rows">
            {["Needs inspection", "Ready to return", "Awaiting credit"].map(
              (s, i) => (
                <div key={s}>
                  <span className="pv-line w1" />
                  <span className="pv-line w2" />
                  <span className={`pv-tag t${i}`}>{s}</span>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="preview-voice">
          <div className="pv-orb">
            <Mic size={22} />
          </div>
          <div className="pv-wave">
            {[8, 18, 12, 26, 16, 32, 20, 12, 24, 10].map((h, i) => (
              <span
                key={i}
                style={{ height: h, animationDelay: `${i * 0.09}s` }}
              />
            ))}
          </div>
          <div className="pv-btn">
            <Truck size={13} /> Start bench conversation
          </div>
        </div>
      </div>
    </div>
  );
}
