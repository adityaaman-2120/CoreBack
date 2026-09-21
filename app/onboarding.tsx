"use client";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Mic,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";

export function Onboarding({
  hasPolicy,
  hasPurchase,
  hasConversation,
  openModal,
  openFirstCore,
}: {
  hasPolicy: boolean;
  hasPurchase: boolean;
  hasConversation: boolean;
  openModal: (m: string) => void;
  openFirstCore: () => void;
}) {
  const steps = [
    {
      done: hasPolicy,
      icon: <FileText size={18} />,
      title: "Add your supplier's return policy",
      text: "Copy the real terms: return window, deadline basis, packaging rules and credit follow-up time. Every purchase keeps its own policy snapshot.",
      locked: false,
      action: (
        <button className="btn primary" onClick={() => openModal("new-policy")}>
          <Plus size={16} /> Add supplier policy
        </button>
      ),
    },
    {
      done: hasPurchase,
      icon: <Upload size={18} />,
      title: "Add the deposits you paid",
      text: "Enter a purchase by hand or import up to 200 rows from a CSV. One record per physical core, with the exact invoice, line and job.",
      locked: !hasPolicy,
      action: (
        <>
          <button
            className="btn primary"
            disabled={!hasPolicy}
            onClick={() => openModal("new-core")}
          >
            <Plus size={16} /> Add purchase
          </button>
          <button
            className="btn"
            disabled={!hasPolicy}
            onClick={() => openModal("import-purchases")}
          >
            <Upload size={15} /> Import CSV
          </button>
        </>
      ),
    },
    {
      done: hasConversation,
      icon: <Mic size={18} />,
      title: "Talk through the part at the bench",
      text: "Open a record and start a bench conversation. Say the part number, invoice and condition; the assistant records what you actually say.",
      locked: !hasPurchase,
      action: (
        <button
          className="btn primary"
          disabled={!hasPurchase}
          onClick={openFirstCore}
        >
          <Mic size={16} /> Open a record
        </button>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <section className="onboarding panel" aria-label="Get started">
      <div className="onboarding-head">
        <div>
          <div className="eyebrow">Get started</div>
          <h2>Set up your recovery desk in three steps</h2>
          <p className="subtitle">
            Your workspace starts empty and private. Nothing is pre-filled.
          </p>
        </div>
        <div className="progress-ring" aria-label={`${doneCount} of 3 complete`}>
          <svg viewBox="0 0 44 44" width="64" height="64">
            <circle cx="22" cy="22" r="18" className="ring-bg" />
            <circle
              cx="22"
              cy="22"
              r="18"
              className="ring-fg"
              strokeDasharray={`${(doneCount / 3) * 113.1} 113.1`}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <span>{doneCount}/3</span>
        </div>
      </div>
      <ol className="onboarding-steps">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={`onboarding-step ${s.done ? "done" : ""} ${s.locked ? "locked" : ""}`}
          >
            <span className="step-badge">
              {s.done ? <Check size={16} /> : i + 1}
            </span>
            <div className="step-body">
              <h3>
                {s.icon}
                {s.title}
              </h3>
              <p>{s.text}</p>
              {!s.done && <div className="step-actions">{s.action}</div>}
            </div>
          </li>
        ))}
      </ol>
      <div className="onboarding-foot">
        <span>
          <ShieldCheck size={15} /> You approve every return. The assistant only
          records observations.
        </span>
        <Link className="text-link" href="/guide">
          <BookOpen size={14} /> Read the full guide <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
