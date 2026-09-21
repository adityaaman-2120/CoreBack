"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Keyboard, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { PageHeading, useMounted } from "./ui";
import { SITE } from "@/lib/site";
import type { User } from "./coreback-app";

const SHORTCUTS: [string, string][] = [
  ["Ctrl / ⌘ + K", "Open the command palette"],
  ["Esc", "Close dialogs and the palette"],
  ["↑ ↓ then Enter", "Move through palette results"],
];
export function SettingsView({
  voiceReady,
  user,
  onDelete,
  onExport,
}: {
  voiceReady: boolean;
  user: NonNullable<User>;
  onDelete: () => void;
  onExport: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const isGuest = user.email === "Guest workspace";
  return (
    <>
      <PageHeading
        eyebrow="Workspace settings"
        title="Clear boundaries. Useful automation."
        subtitle="Know what the assistant can change and where your data goes."
      />
      <div className="settings-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Voice connection</h2>
            <span className={`badge ${voiceReady ? "green" : "amber"}`}>
              {voiceReady ? "Configured" : "Key needed"}
            </span>
          </div>
          <div className="panel-body">
            <p className="section-description">
              CoreBack Voice handles speech recognition, reasoning, tool calls,
              turn-taking and voice output through one connection. Audio is
              processed by our speech provider (AssemblyAI); see Privacy & data.
            </p>
            {[
              ["Voice", "Alba · English"],
              ["Session limit", "10 minutes"],
              ["Daily allowance", "8 sessions per account"],
              ["Provider price", "$0.075 / minute*"],
              [`Audio stored by ${SITE.name}`, "No"],
            ].map(([a, b]) => (
              <div className="settings-item" key={a}>
                <span>{a}</span>
                <b>{b}</b>
              </div>
            ))}
            <p className="subtitle">
              *Published rate, excludes hosting and support.{" "}
              <a
                className="text-link"
                href="https://www.assemblyai.com/pricing"
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </p>
            {!voiceReady && (
              <div className="alert" style={{ marginTop: 16 }}>
                Set ASSEMBLYAI_API_KEY on the server to enable live voice. No
                API key is sent to the browser.
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <h2>Built for your control</h2>
            <ShieldCheck size={19} />
          </div>
          <div className="panel-body">
            <div className="checklist">
              {[
                "Voice records observations; a person approves the return.",
                "The server checks purchase matches and supplier rules.",
                "Corrections invalidate previous preparation.",
                "Dispatched return evidence is locked.",
                "Only posted supplier credit memos count as credited.",
                "Your workspace records are scoped to your signed-in account.",
              ].map((t) => (
                <div className="checklist-row done" key={t}>
                  <CheckCircle2 size={17} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <p className="instruction">
              {SITE.name} prepares and tracks returns. The supplier decides
              acceptance and credit. No automatic shipping, refunds or bank
              access.
            </p>
            <Link className="text-link" href="/privacy">
              Privacy & data details <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <h2>Account</h2>
          </div>
          <div className="panel-body">
            <div className="settings-item">
              <span>Signed in as</span>
              <b>{isGuest ? "Guest workspace" : user.email}</b>
            </div>
            <div className="settings-item">
              <span>Appearance</span>
              <span className="segmented" role="group" aria-label="Theme">
                {["light", "system", "dark"].map((t) => (
                  <button
                    key={t}
                    className={mounted && theme === t ? "active" : ""}
                    onClick={() => setTheme(t)}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </span>
            </div>
            {isGuest && (
              <div className="instruction">
                Guest access belongs to this browser. Create an account before
                signing out or clearing browser data to keep your records.{" "}
                <a className="text-link" href="/signin?mode=signup">
                  Create an account for this workspace <ArrowRight size={13} />
                </a>
              </div>
            )}
            <div className="button-row" style={{ marginTop: 20 }}>
              <button className="btn" onClick={onExport}>
                Export complete workspace
              </button>
              <button className="btn danger" onClick={onDelete}>
                Delete workspace data
              </button>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <h2>Keyboard shortcuts</h2>
            <Keyboard size={18} />
          </div>
          <div className="panel-body">
            {SHORTCUTS.map(([k, d]) => (
              <div className="settings-item" key={k}>
                <span>{d}</span>
                <kbd className="kbd">{k}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
