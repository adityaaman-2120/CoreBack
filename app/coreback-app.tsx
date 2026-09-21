"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  HelpCircle,
  Home,
  Loader2,
  LogOut,
  Mic,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  exportCsv,
  inspectReadiness,
  money,
  searchCores,
  type AuditEvent,
  type Core,
  type CoreAction,
  type Policy,
  type Transcript,
} from "@/lib/domain";
import { api, download } from "@/lib/client";
import { SITE } from "@/lib/site";
import {
  CoreDetail,
  CoreForm,
  ImportForm,
  PolicyForm,
  RecordActionForm,
} from "./coreback-forms";
import {
  Badge,
  Brand,
  Metric,
  Modal,
  PageHeading,
  Skeleton,
  ThemeToggle,
} from "./ui";
import { CommandPalette, type PaletteItem } from "./command-palette";
import { Onboarding } from "./onboarding";
import { ReturnPacket } from "./return-packet";
import { SettingsView } from "./settings-view";

export type User = {
  userId: string;
  email: string;
  displayName: string;
} | null;

const NAV = [
  { name: "Recovery desk", icon: Activity, group: "Recover" },
  { name: "Return queue", icon: Truck, group: "Recover" },
  { name: "Credit ledger", icon: Wallet, group: "Money" },
  { name: "Supplier policies", icon: FileText, group: "Setup" },
  { name: "Settings", icon: Settings2, group: "Setup" },
] as const;
const STATUSES = [
  "Needs inspection",
  "Ready to return",
  "In transit",
  "Awaiting credit",
  "Short credit",
  "Credited",
  "Closed with deduction",
];
const STATUS_TONE: Record<string, string> = {
  "Needs inspection": "slate",
  "Ready to return": "blue",
  "In transit": "sky",
  "Awaiting credit": "amber",
  "Short credit": "red",
  Credited: "green",
  "Closed with deduction": "gray",
};

export default function CoreBackApp({ user }: { user: NonNullable<User> }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [cores, setCores] = useState<Core[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<string>("Recovery desk");
  const [detail, setDetail] = useState(false);
  const [tab, setTab] = useState("Return checklist");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All cores");
  const [modal, setModal] = useState("");
  const [palette, setPalette] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [transcripts, setTranscripts] = useState<Record<string, Transcript[]>>(
    {},
  );
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const voice = useRef<{ end: () => void; mute: (v: boolean) => void } | null>(
    null,
  );
  const selected = cores.find((c) => c.id === selectedId) || cores[0];
  const isLive = voiceState !== "idle";
  const firstName = user.displayName.split(/[\s@]/)[0] || "there";

  const refresh = useCallback(async () => {
    const d = await api("workspace");
    setCores(d.cores);
    setPolicies(d.policies);
    setLoaded(true);
    return d;
  }, []);
  useEffect(() => {
    api("health")
      .then((d) => setVoiceReady(d.voiceConfigured))
      .catch(() => {});
    api("workspace")
      .then((d) => {
        setCores(d.cores);
        setPolicies(d.policies);
        setLoaded(true);
      })
      .catch((e) => {
        setError(e.message);
        setLoaded(true);
      });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const activeCoreId = selected?.id;
  useEffect(() => {
    if (!activeCoreId) return;
    api(`cores/${activeCoreId}/events`)
      .then((d) => {
        setEvents((es) => [
          ...es.filter((e) => e.coreId !== activeCoreId),
          ...d.events,
        ]);
        setTranscripts((t) => ({ ...t, [activeCoreId]: d.transcripts }));
      })
      .catch((e) => setError(e.message));
  }, [activeCoreId]);
  useEffect(() => () => voice.current?.end(), []);
  useEffect(() => {
    if (!["listening", "speaking"].includes(voiceState)) return;
    const t = setInterval(() => setVoiceSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [voiceState]);

  function updateCore(id: string, state: Core["state"]) {
    setCores((cs) => cs.map((c) => (c.id === id ? { ...c, state } : c)));
  }
  async function act(action: CoreAction, source = "manual") {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const d = await api(`cores/${selected.id}/actions`, {
        action,
        revision: selected.state.revision,
        requestId: crypto.randomUUID(),
      });
      updateCore(selected.id, d.state);
      setEvents((es) => [...es.filter((e) => e.id !== d.event.id), d.event]);
      if (source === "manual")
        setToast(
          action.type === "add_credit"
            ? "Supplier credit posted. Outstanding balance updated."
            : "Record saved. History updated.",
        );
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: string) {
    if (isLive) {
      setToast("End the voice check before switching views.");
      return;
    }
    setView(next);
    setDetail(false);
    setSearch("");
    setFilter("All cores");
    window.scrollTo({ top: 0 });
  }
  function openCore(id: string) {
    if (isLive && id !== selectedId) {
      setToast("End this voice check before opening a different core.");
      return;
    }
    setSelectedId(id);
    setDetail(true);
    setTab("Return checklist");
    setView("Recovery desk");
    window.scrollTo({ top: 0 });
  }
  async function startVoice() {
    if (!selected) return;
    const coreId = selected.id;
    setModal("");
    setError("");
    setVoiceState("connecting");
    setVoiceSeconds(0);
    setDetail(true);
    setTab("Conversation");
    try {
      const { startVoiceSession } = await import("@/lib/voice-client");
      voice.current = await startVoiceSession({
        coreId,
        onStatus: setVoiceState,
        onTranscript: (t) =>
          setTranscripts((ts) => ({
            ...ts,
            [coreId]: [...(ts[coreId] || []).filter((x) => x.id !== t.id), t],
          })),
        onState: (state, event) => {
          updateCore(coreId, state);
          if (event)
            setEvents((es) => [...es.filter((e) => e.id !== event.id), event]);
        },
        onError: setError,
        onEnd: () => {
          voice.current = null;
          setVoiceState("idle");
          setMuted(false);
        },
      });
    } catch (e) {
      setVoiceState("idle");
      setError((e as Error).message);
    }
  }
  async function signOut() {
    if (
      user.email === "Guest workspace" &&
      !window.confirm(
        "Sign out of this guest workspace? Without creating an account first, these records cannot be restored. Choose Cancel and open Settings to keep your workspace.",
      )
    )
      return;
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      const { getAuth, signOut: fbSignOut } = await import("firebase/auth");
      const { getApps, initializeApp } = await import("firebase/app");
      const config = (await import("@/lib/firebase-config.json")).default;
      await fbSignOut(getAuth(getApps()[0] || initializeApp(config)));
      // Full navigation clears cached authenticated server components.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } else setError("Could not sign out. Please try again.");
  }
  async function exportWorkspace() {
    try {
      download(
        `${SITE.name.toLowerCase()}-workspace.json`,
        JSON.stringify(await api("export"), null, 2),
        "application/json",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const info = useMemo(
    () => new Map(cores.map((c) => [c.id, inspectReadiness(c)])),
    [cores],
  );
  const total = cores.reduce((n, c) => n + c.depositCents, 0),
    credited = cores.reduce(
      (n, c) => n + (info.get(c.id)?.creditedCents ?? 0),
      0,
    ),
    deducted = cores.reduce(
      (n, c) => n + (info.get(c.id)?.deductionCents ?? 0),
      0,
    ),
    open = cores.reduce(
      (n, c) => n + (info.get(c.id)?.outstandingCents ?? 0),
      0,
    );
  const due = cores.filter(
    (c) => !c.state.dispatchedAt && (info.get(c.id)?.daysLeft ?? 99) <= 7,
  );
  const dueAmount = due.reduce((n, c) => n + c.depositCents, 0);
  const short = cores.filter((c) => info.get(c.id)?.status === "Short credit");
  const ready = cores.filter(
    (c) => info.get(c.id)?.status === "Ready to return",
  );
  const counts = STATUSES.map((s) => ({
    s,
    n: cores.filter((c) => info.get(c.id)?.status === s).length,
  }));
  const filtered = (
    search ? searchCores(cores, search, cores.length) : cores
  ).filter((c) => filter === "All cores" || info.get(c.id)?.status === filter);
  const queue = filtered
    .filter((c) => !c.state.dispatchedAt)
    .sort(
      (a, b) =>
        (info.get(a.id)?.daysLeft ?? 0) - (info.get(b.id)?.daysLeft ?? 0),
    );
  const rows = view === "Return queue" ? queue : filtered;
  const hasConversation = cores.some((c) => c.state.observedPart);
  const pct = total ? Math.round((credited / total) * 100) : 0;

  const paletteItems: PaletteItem[] = [
    ...NAV.map((n) => ({
      id: `nav-${n.name}`,
      group: "Go to",
      label: n.name,
      icon: <n.icon size={16} />,
      run: () => navigate(n.name),
    })),
    {
      id: "go-guide",
      group: "Go to",
      label: "User guide",
      icon: <BookOpen size={16} />,
      run: () => router.push("/guide"),
    },
    {
      id: "act-core",
      group: "Actions",
      label: "Add a purchase",
      icon: <Plus size={16} />,
      keywords: "new deposit core",
      run: () => setModal(policies.length ? "new-core" : "new-policy"),
    },
    {
      id: "act-policy",
      group: "Actions",
      label: "Add a supplier policy",
      icon: <FileText size={16} />,
      run: () => setModal("new-policy"),
    },
    {
      id: "act-import",
      group: "Actions",
      label: "Import purchases from CSV",
      icon: <Upload size={16} />,
      run: () => setModal(policies.length ? "import-purchases" : "new-policy"),
    },
    {
      id: "act-credits",
      group: "Actions",
      label: "Import supplier credit memos",
      icon: <Wallet size={16} />,
      run: () => setModal("import-credits"),
    },
    {
      id: "act-export",
      group: "Actions",
      label: "Export complete workspace (JSON)",
      icon: <ArrowDownToLine size={16} />,
      run: () => void exportWorkspace(),
    },
    {
      id: "act-theme",
      group: "Actions",
      label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`,
      icon: <Moon size={16} />,
      run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    },
    ...cores.map((c) => ({
      id: `core-${c.id}`,
      group: "Purchases",
      label: c.description,
      hint: `${c.invoice} · ${c.job} · ${c.part}`,
      keywords: `${c.supplier} ${c.part} ${c.invoice} ${c.job}`,
      icon: <CircleDollarSign size={16} />,
      run: () => openCore(c.id),
    })),
  ];

  const voiceCard = selected && (
    <div className={`voice-card ${isLive ? "live" : ""}`}>
      <div className="voice-top">
        <span className="voice-label">
          <Mic size={15} />
          Bench assistant
        </span>
        <span className="badge">
          {isLive
            ? `${Math.floor(voiceSeconds / 60)}:${String(voiceSeconds % 60).padStart(2, "0")}`
            : "CoreBack Voice"}
        </span>
      </div>
      <div className="voice-visual">
        <div className="voice-orb">
          <Mic size={28} strokeWidth={1.6} />
        </div>
        <h2>
          {isLive
            ? voiceState === "speaking"
              ? `${SITE.name} is speaking`
              : voiceState === "connecting"
                ? "Connecting…"
                : voiceState === "ending"
                  ? "Finishing…"
                  : muted
                    ? "Microphone muted"
                    : "Tell me about the part."
            : "Hands on the part."}
        </h2>
        <p>
          {isLive
            ? `Inspect the core while ${SITE.name} checks the paperwork.`
            : "Talk through the return. Keep your hands on the work."}
        </p>
        <div
          className={`waveform ${isLive ? "active" : ""}`}
          aria-hidden="true"
        >
          {[
            6, 12, 8, 20, 15, 30, 19, 40, 27, 15, 25, 36, 44, 26, 34, 18, 28,
            38, 22, 14, 24, 17, 10, 15, 6,
          ].map((h, i) => (
            <span
              key={i}
              style={{ height: h, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      </div>
      <div className="voice-actions">
        {isLive ? (
          <>
            <button
              className="btn primary"
              disabled={voiceState === "connecting" || voiceState === "ending"}
              onClick={() => voice.current?.end()}
            >
              <Square size={14} />
              End conversation
            </button>
            <button
              className="btn secondary"
              disabled={voiceState === "connecting" || voiceState === "ending"}
              onClick={() => {
                voice.current?.mute(!muted);
                setMuted(!muted);
              }}
            >
              {muted ? "Unmute microphone" : "Mute microphone"}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn primary"
              disabled={!!selected.state.dispatchedAt}
              onClick={() => setModal("voice")}
            >
              <Mic size={16} />
              Start bench conversation
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                setDetail(true);
                setTab("Inspection form");
              }}
            >
              Use the inspection form
            </button>
          </>
        )}
      </div>
      <div className="voice-footer">
        {isLive
          ? "Live AI conversation · 10-minute session limit"
          : voiceReady
            ? "Live voice ready · transcript saved, audio not stored"
            : "Voice key needed · forms and exports work now"}
      </div>
    </div>
  );
  const rightSide = selected && (
    <div className="stack right-stack">
      {voiceCard}
      <div className="panel right-card">
        <h3>
          <FileText size={17} />
          Supplier rule, not a guess
        </h3>
        <p className="instruction">
          {selected.policy.allowAlternative
            ? "Original box missing? This supplier permits an approved alternative. Check the exact requirements before writing off the deposit."
            : "This supplier requires original packaging. A different box needs supplier approval."}
        </p>
        <button className="text-link" onClick={() => setModal("policy")}>
          Read {selected.supplier} policy <ArrowRight size={13} />
        </button>
      </div>
      {!detail && (
        <div className="panel right-card">
          <h3>Don’t leave it on the shelf</h3>
          {due.slice(0, 3).map((c) => (
            <button
              key={c.id}
              className="task-card task-button"
              onClick={() => openCore(c.id)}
            >
              <CircleDollarSign size={17} />
              <div>
                <strong>
                  {money(c.depositCents)} · {c.job}
                </strong>
                <p>
                  {(info.get(c.id)?.daysLeft ?? 0) < 0
                    ? "Return window passed"
                    : `${info.get(c.id)?.daysLeft} days left`}{" "}
                  · {c.part}
                </p>
              </div>
              <ChevronRight size={15} style={{ marginLeft: "auto" }} />
            </button>
          ))}
          {!due.length && (
            <p className="instruction">
              No undispatched cores due within seven days.
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand light href="/workspace" />
        <div className="workspace-label">
          <span className="avatar sm">
            {user.displayName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <span className="ws-name">{firstName}’s desk</span>
            <small>Private workspace</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {["Recover", "Money", "Setup"].map((g) => (
            <div className="nav-group" key={g}>
              <div className="nav-heading">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <button
                  key={n.name}
                  className={`nav-button ${view === n.name ? "active" : ""}`}
                  onClick={() => navigate(n.name)}
                  aria-label={n.name}
                  aria-current={view === n.name ? "page" : undefined}
                >
                  <n.icon size={18} />
                  <span className="nav-text">{n.name}</span>
                  {n.name === "Return queue" && ready.length > 0 && (
                    <span className="nav-count">{ready.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className="nav-button" href="/guide">
            <BookOpen size={18} />
            <span className="nav-text">User guide</span>
          </Link>
          <button className="nav-button" onClick={() => setModal("guide")}>
            <HelpCircle size={18} />
            <span className="nav-text">How {SITE.name} works</span>
          </button>
          <div className="powered">
            VOICE ASSISTANT<strong>CoreBack Voice</strong>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.displayName.slice(0, 2).toUpperCase()}
            </span>
            <div className="profile-text">
              {user.displayName}
              <small>
                {user.email === "Guest workspace" ? "Guest" : user.email}
              </small>
            </div>
            <button
              className="icon-btn dark"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main" id="main">
        <header className="topbar">
          <div className="breadcrumb">
            <Link href="/" className="crumb-home" aria-label="Home">
              <Home size={15} />
            </Link>
            <ChevronRight size={13} />
            <b>{view}</b>
          </div>
          <button
            className="search-trigger"
            onClick={() => setPalette(true)}
            aria-label="Search and commands"
          >
            <Search size={15} />
            <span>Search purchases or run a command…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="top-actions">
            <span
              className={`status-pill ${voiceReady ? "ok" : "warn"}`}
              title={
                voiceReady ? "Voice provider configured" : "Voice key needed"
              }
            >
              <span className="dot" />
              {voiceReady ? "Voice ready" : "Voice key needed"}
            </span>
            <ThemeToggle />
            <button
              className="icon-btn sm-only"
              aria-label="Search"
              onClick={() => setPalette(true)}
            >
              <Search size={17} />
            </button>
            <button
              className="icon-btn sm-only"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="alert error alert-row" role="alert">
              <span>{error}</span>
              <button
                className="close"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}
          {!loaded ? (
            <div className="loading-state" aria-busy="true">
              <Skeleton className="sk-title" />
              <div className="metrics">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="sk-metric" />
                ))}
              </div>
              <Skeleton className="sk-panel" />
              <span className="sr-only">
                <Loader2 /> Loading your recovery desk…
              </span>
            </div>
          ) : view === "Settings" ? (
            <SettingsView
              voiceReady={voiceReady}
              user={user}
              onDelete={() => setModal("delete-workspace")}
              onExport={exportWorkspace}
            />
          ) : view === "Supplier policies" ? (
            <>
              <PageHeading
                eyebrow="The rules behind each return"
                title="Supplier policies"
                subtitle="Versioned requirements. Every purchase keeps its original policy snapshot."
                action={
                  <button
                    className="btn primary"
                    onClick={() => setModal("new-policy")}
                  >
                    <Plus size={16} />
                    Add policy
                  </button>
                }
              />
              <div className="settings-grid">
                {policies.map((p) => (
                  <div className="panel" key={p.id}>
                    <div className="panel-header">
                      <div>
                        <h2>{p.supplier}</h2>
                        <p className="subtitle">
                          {p.name} · {p.version}
                        </p>
                      </div>
                    </div>
                    <div className="panel-body">
                      <div className="settings-item">
                        <span>Return window</span>
                        <b>
                          {p.windowDays} days · {p.deadlineBasis}
                        </b>
                      </div>
                      <div className="settings-item">
                        <span>Alternative packaging</span>
                        <b>
                          {p.allowAlternative
                            ? "Allowed with conditions"
                            : "Not permitted"}
                        </b>
                      </div>
                      <div className="settings-item">
                        <span>Credit follow-up after</span>
                        <b>{p.creditDays} days</b>
                      </div>
                      <p className="instruction">{p.instructions}</p>
                      {p.allowAlternative && (
                        <div className="quote">{p.alternativeInstructions}</div>
                      )}
                      <p className="subtitle">
                        Source: {p.source || "Owner-entered policy"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {!policies.length && (
                <div className="panel large-empty">
                  <FileText size={34} className="empty-icon" />
                  <h2>No supplier policies yet</h2>
                  <p>
                    Add the return terms your supplier actually published. The
                    assistant only quotes policies you save here.
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => setModal("new-policy")}
                  >
                    <Plus size={16} /> Add your first policy
                  </button>
                </div>
              )}
            </>
          ) : view === "Credit ledger" ? (
            <>
              <PageHeading
                eyebrow="Only posted memos count"
                title="Expected is not recovered."
                subtitle="Match supplier credits to the deposit you actually paid."
                action={
                  <button
                    className="btn primary"
                    disabled={!cores.length}
                    onClick={() => setModal("import-credits")}
                  >
                    <Upload size={16} />
                    Import credit memos
                  </button>
                }
              />
              <div className="metrics">
                <Metric
                  label="Deposits paid"
                  value={money(total)}
                  caption="Across your purchase records"
                  icon={<Wallet size={17} />}
                />
                <Metric
                  label="Actually credited"
                  value={money(credited)}
                  caption="Posted supplier credit memos"
                  icon={<CheckCircle2 size={17} />}
                  tone="good"
                />
                <Metric
                  label="Still outstanding"
                  value={money(open)}
                  caption="Expected credit, not guaranteed"
                  icon={<CircleDollarSign size={17} />}
                />
                <Metric
                  label="Short credit cases"
                  value={String(short.length)}
                  caption={`${money(short.reduce((n, c) => n + (info.get(c.id)?.outstandingCents ?? 0), 0))} needs follow-up`}
                  icon={<Activity size={17} />}
                  tone="warning"
                />
              </div>
              <div className="panel">
                <div className="panel-header">
                  <h2>Credit reconciliation</h2>
                  <button
                    className="btn small"
                    disabled={!cores.length}
                    onClick={() =>
                      download(
                        `${SITE.name.toLowerCase()}-ledger.csv`,
                        exportCsv(cores),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    <ArrowDownToLine size={14} />
                    Export CSV
                  </button>
                </div>
                {cores.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Purchase</th>
                          <th>Deposit</th>
                          <th>Credited</th>
                          <th>Accepted deduction</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {cores.map((c) => {
                          const r = info.get(c.id)!;
                          return (
                            <tr key={c.id}>
                              <td>
                                <button
                                  className="location-button"
                                  onClick={() => openCore(c.id)}
                                >
                                  {c.invoice}
                                </button>
                                <div className="location-sub">
                                  {c.part} · {c.job}
                                </div>
                              </td>
                              <td className="num">{money(c.depositCents)}</td>
                              <td className="num good-text">
                                {money(r.creditedCents)}
                              </td>
                              <td className="num">{money(r.deductionCents)}</td>
                              <td
                                className={`num ${r.status === "Short credit" ? "warn-text" : ""}`}
                              >
                                {money(r.outstandingCents)}
                              </td>
                              <td>
                                <Badge status={r.status} />
                              </td>
                              <td>
                                <button
                                  className="close"
                                  aria-label={`Open ${c.invoice}`}
                                  onClick={() => openCore(c.id)}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty">
                    <Wallet size={28} />
                    <p>
                      Nothing to reconcile yet. Add purchases first; credits are
                      matched to them.
                    </p>
                  </div>
                )}
              </div>
              <p className="subtitle">
                Credits are manually entered or imported from supplier memos.{" "}
                {SITE.name} does not access bank accounts or verify settlement.
              </p>
            </>
          ) : (
            <>
              <PageHeading
                eyebrow={
                  detail
                    ? "Core return workspace"
                    : view === "Return queue"
                      ? "Make the next pickup count"
                      : "Core-deposit recovery desk"
                }
                title={
                  detail
                    ? selected?.description || "Core return"
                    : view === "Return queue"
                      ? "Ready to leave the shelf."
                      : `Welcome back, ${firstName}.`
                }
                subtitle={
                  detail
                    ? `${selected?.job} · ${selected?.invoice} · ${selected?.part}`
                    : view === "Return queue"
                      ? "Reviewed returns, dispatch references and supplier follow-through."
                      : "Find the deposit. Prepare the return. Make sure the credit comes back."
                }
                action={
                  !detail && (
                    <>
                      <button
                        className="btn"
                        disabled={!policies.length}
                        onClick={() => setModal("import-purchases")}
                      >
                        <Upload size={15} />
                        Import CSV
                      </button>
                      <button
                        className="btn primary"
                        onClick={() =>
                          setModal(policies.length ? "new-core" : "new-policy")
                        }
                      >
                        <Plus size={16} />
                        Add purchase
                      </button>
                    </>
                  )
                }
              />
              {!cores.length ? (
                <Onboarding
                  hasPolicy={policies.length > 0}
                  hasPurchase={false}
                  hasConversation={false}
                  openModal={setModal}
                  openFirstCore={() => {}}
                />
              ) : (
                <>
                  {!detail && view === "Return queue" && (
                    <div className="metrics queue-metrics">
                      <Metric
                        label="Ready to dispatch"
                        value={money(
                          ready.reduce((n, c) => n + c.depositCents, 0),
                        )}
                        caption={`${ready.length} reviewed ${ready.length === 1 ? "return" : "returns"} waiting for pickup`}
                        icon={<Truck size={17} />}
                        tone="good"
                      />
                      <Metric
                        label="Due within 7 days"
                        value={money(dueAmount)}
                        caption={`${due.length} ${due.length === 1 ? "core" : "cores"} not yet dispatched`}
                        icon={<Activity size={17} />}
                        tone={due.length ? "warning" : ""}
                      />
                      <Metric
                        label="Still needs inspection"
                        value={String(
                          counts.find((x) => x.s === "Needs inspection")?.n ??
                            0,
                        )}
                        caption="Inspect and confirm before preparing a return"
                        icon={<FileText size={17} />}
                      />
                    </div>
                  )}
                  {!detail && view === "Recovery desk" && (
                    <>
                      {!hasConversation && (
                        <Onboarding
                          hasPolicy
                          hasPurchase
                          hasConversation={false}
                          openModal={setModal}
                          openFirstCore={() => openCore(cores[0].id)}
                        />
                      )}
                      <div className="metrics">
                        <Metric
                          label="Deposits still open"
                          value={money(open)}
                          caption={`${cores.filter((c) => (info.get(c.id)?.outstandingCents ?? 0) > 0).length} cores with unresolved deposits`}
                          icon={<CircleDollarSign size={17} />}
                        />
                        <Metric
                          label="Return within 7 days"
                          value={money(dueAmount)}
                          caption={`${due.length} ${due.length === 1 ? "core needs" : "cores need"} attention`}
                          tone={due.length ? "warning" : ""}
                          icon={<Activity size={17} />}
                        />
                        <Metric
                          label="Ready for pickup"
                          value={money(
                            ready.reduce((n, c) => n + c.depositCents, 0),
                          )}
                          caption={`${ready.length} reviewed ${ready.length === 1 ? "return" : "returns"}`}
                          icon={<Truck size={17} />}
                        />
                        <Metric
                          label="Actually credited"
                          value={money(credited)}
                          caption="Supplier memos posted to the ledger"
                          icon={<CheckCircle2 size={17} />}
                          tone="good"
                        />
                      </div>
                      <div className="panel progress-panel">
                        <div className="progress-head">
                          <div>
                            <h2>Recovery progress</h2>
                            <p className="subtitle">
                              {money(credited)} credited of {money(total)} paid
                              in core deposits
                            </p>
                          </div>
                          <div className="progress-pct num">{pct}%</div>
                        </div>
                        <div
                          className="bar"
                          role="img"
                          aria-label={`${pct}% of deposits credited`}
                        >
                          <span
                            className="seg credited"
                            style={{
                              width: `${total ? (credited / total) * 100 : 0}%`,
                            }}
                          />
                          <span
                            className="seg deducted"
                            style={{
                              width: `${total ? (deducted / total) * 100 : 0}%`,
                            }}
                          />
                          <span
                            className="seg open"
                            style={{
                              width: `${total ? (open / total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <div className="legend">
                          <span>
                            <i className="lg-credited" />
                            Credited {money(credited)}
                          </span>
                          <span>
                            <i className="lg-deducted" />
                            Accepted deductions {money(deducted)}
                          </span>
                          <span>
                            <i className="lg-open" />
                            Outstanding {money(open)}
                          </span>
                        </div>
                        <div
                          className="pipeline"
                          role="group"
                          aria-label="Return pipeline"
                        >
                          {counts.map(({ s, n }) => (
                            <button
                              key={s}
                              className={`stage ${STATUS_TONE[s]} ${filter === s ? "active" : ""}`}
                              onClick={() =>
                                setFilter(filter === s ? "All cores" : s)
                              }
                              aria-pressed={filter === s}
                            >
                              <span className="stage-n num">{n}</span>
                              <span className="stage-l">{s}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {detail && (
                    <div className="details-header no-print">
                      <button
                        className="btn small"
                        onClick={() => {
                          if (isLive) {
                            setToast("End the active conversation first.");
                            return;
                          }
                          setDetail(false);
                        }}
                      >
                        <ArrowLeft size={14} />
                        All cores
                      </button>
                      <div className="details-actions">
                        <button
                          className="btn small"
                          onClick={() => {
                            download(
                              `${SITE.name.toLowerCase()}-${selected.invoice}-evidence.json`,
                              JSON.stringify(
                                {
                                  schemaVersion: 1,
                                  generatedAt: new Date().toISOString(),
                                  core: selected,
                                  events: events.filter(
                                    (e) => e.coreId === selected.id,
                                  ),
                                  transcript: transcripts[selected.id] || [],
                                  notice:
                                    "User-reported observations and posted supplier memos. Not proof of supplier acceptance.",
                                },
                                null,
                                2,
                              ),
                              "application/json",
                            );
                            setToast("Evidence package downloaded.");
                          }}
                        >
                          <ArrowDownToLine size={14} />
                          Evidence
                        </button>
                        <button
                          className="btn small"
                          disabled={!selected.state.preparedAt}
                          onClick={() => setModal("packet")}
                        >
                          <FileText size={14} />
                          Return packet
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid-main">
                    <div className="stack">
                      {detail ? (
                        <CoreDetail
                          core={selected}
                          tab={tab}
                          setTab={setTab}
                          events={events.filter(
                            (e) => e.coreId === selected.id,
                          )}
                          transcript={transcripts[selected.id] || []}
                          act={(a) => act(a)}
                          busy={busy || isLive}
                          openModal={setModal}
                        />
                      ) : (
                        <div className="panel">
                          <div className="panel-header">
                            <div>
                              <h2>
                                {view === "Return queue"
                                  ? "Return queue"
                                  : "Your core deposits"}
                              </h2>
                              <p className="subtitle">
                                One record from purchase to supplier credit.
                              </p>
                            </div>
                          </div>
                          <div className="list-toolbar">
                            <div className="search-field">
                              <Search size={15} />
                              <input
                                aria-label="Search purchases"
                                placeholder="Search part, invoice or job…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                              {search && (
                                <button
                                  className="close"
                                  aria-label="Clear search"
                                  onClick={() => setSearch("")}
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                            <select
                              aria-label="Filter by status"
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                            >
                              {["All cores", ...STATUSES].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Part & purchase</th>
                                  <th>Deposit</th>
                                  <th>Return by</th>
                                  <th>Status</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((c) => {
                                  const r = info.get(c.id)!;
                                  return (
                                    <tr
                                      className={`location-row ${c.id === selected?.id ? "selected" : ""}`}
                                      key={c.id}
                                    >
                                      <td>
                                        <button
                                          className="location-button"
                                          onClick={() => openCore(c.id)}
                                        >
                                          {c.description}
                                        </button>
                                        <div className="location-sub">
                                          <span className="mono">{c.part}</span>{" "}
                                          · {c.job} · {c.supplier}
                                        </div>
                                      </td>
                                      <td className="deposit-value num">
                                        {money(c.depositCents)}
                                      </td>
                                      <td>
                                        <span
                                          className={`due-date ${!c.state.dispatchedAt && r.daysLeft <= 7 ? "urgent" : ""}`}
                                        >
                                          {dateLabel(r.deadline)}
                                        </span>
                                        <div className="location-sub">
                                          {c.state.dispatchedAt
                                            ? "Return dispatched"
                                            : r.daysLeft < 0
                                              ? "Window passed"
                                              : `${r.daysLeft} days left`}
                                        </div>
                                      </td>
                                      <td>
                                        <Badge status={r.status} />
                                      </td>
                                      <td>
                                        <button
                                          className="close"
                                          aria-label={`Open ${c.job}`}
                                          onClick={() => openCore(c.id)}
                                        >
                                          <ChevronRight size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {!rows.length && (
                            <div className="empty">
                              {view === "Return queue"
                                ? "Nothing waiting to be dispatched."
                                : "No purchases match. Clear the search or choose another status."}
                            </div>
                          )}
                          <div className="table-footer">
                            <ShieldCheck size={14} />
                            Expected deposits stay separate from actual supplier
                            credits.
                          </div>
                        </div>
                      )}
                      {!detail && (
                        <div className="recovery-strip">
                          <span className="strip-icon">
                            <RotateCcw size={20} />
                          </span>
                          <div>
                            <h3>Old part. New possibility.</h3>
                            <p>
                              A missing box doesn’t always mean a lost deposit.
                              Your supplier’s policy decides.
                            </p>
                          </div>
                          <button
                            className="text-link"
                            onClick={() => navigate("Supplier policies")}
                          >
                            See the rules <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    {rightSide}
                  </div>
                </>
              )}
            </>
          )}
          <footer className="footer">
            <span>
              © {SITE.year} {SITE.name} · {SITE.owner}
            </span>
            <span>
              <Link href="/guide">Guide</Link> ·{" "}
              <Link href="/privacy">Privacy & data</Link>
            </span>
          </footer>
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.map((n) => (
          <button
            key={n.name}
            className={view === n.name ? "active" : ""}
            onClick={() => navigate(n.name)}
            aria-label={n.name}
          >
            <n.icon size={20} />
            <span>{n.name.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        items={paletteItems}
      />
      {modal && (
        <Modal
          title={modalTitle(modal)}
          close={() => setModal("")}
          wide={modal === "import-purchases" || modal === "import-credits"}
        >
          {modal === "voice" && selected && (
            <>
              <p className="section-description">
                You’ll speak with an AI assistant about {selected.job}. Your
                microphone audio goes to AssemblyAI for transcription and spoken
                replies. {SITE.name} saves the transcript and structured
                observations; it does not store audio.
              </p>
              <div className="alert">
                Only share information you’re authorized to use. The agent
                cannot approve a return or post a credit. Check its work before
                confirming.
              </div>
              <div className="form-actions">
                <button
                  className="btn"
                  onClick={() => {
                    setModal("");
                    setDetail(true);
                    setTab("Inspection form");
                  }}
                >
                  Use the form
                </button>
                <button
                  className="btn primary"
                  disabled={!voiceReady}
                  onClick={startVoice}
                >
                  <Mic size={15} />
                  Agree & start microphone
                </button>
              </div>
              {!voiceReady && (
                <p className="subtitle">
                  The server needs an AssemblyAI API key before live voice can
                  start.
                </p>
              )}
            </>
          )}
          {modal === "guide" && (
            <>
              <div className="checklist">
                {[
                  "Add your supplier’s actual return policy, then import purchases with core deposits.",
                  "At the bench, talk through the part, invoice, completeness and packaging.",
                  "Confirm the purchase match, review the checklist and prepare the return.",
                  "Download a return packet. Record the real pickup or dispatch reference.",
                  "Post supplier credit memos. A short credit stays open until resolved.",
                ].map((t, i) => (
                  <div className="checklist-row" key={t}>
                    <span className="badge blue">{i + 1}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <Link className="btn primary" href="/guide">
                  <BookOpen size={15} /> Open the full guide
                </Link>
              </div>
            </>
          )}
          {modal === "policy" && selected && (
            <>
              <div className="eyebrow">{selected.policy.version}</div>
              <h3>
                {selected.supplier} - {selected.policy.name}
              </h3>
              <p className="instruction">{selected.policy.instructions}</p>
              <div className="settings-item">
                <span>Deadline</span>
                <b>
                  {selected.policy.windowDays} days from shipment ·{" "}
                  {selected.policy.deadlineBasis}
                </b>
              </div>
              {selected.policy.allowAlternative && (
                <div className="quote">
                  <strong>Approved alternative</strong>
                  <br />
                  {selected.policy.alternativeInstructions}
                </div>
              )}
              <p className="subtitle">
                Source: {selected.policy.source || "Entered by the shop owner"}
              </p>
              <p className="subtitle">
                This purchase retains this policy version even if a newer policy
                is added.
              </p>
            </>
          )}
          {modal === "new-policy" && (
            <PolicyForm
              busy={busy}
              submit={async (data) => {
                setBusy(true);
                try {
                  const d = await api("policies", data);
                  setPolicies((ps) => [d.policy, ...ps]);
                  setModal("");
                  setToast("Policy saved. You can now use it for purchases.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
          {modal === "new-core" && (
            <CoreForm
              policies={policies}
              busy={busy}
              addPolicy={() => setModal("new-policy")}
              submit={async (data) => {
                setBusy(true);
                try {
                  const d = await api("cores", data);
                  setCores((cs) => [...d.cores, ...cs]);
                  setSelectedId(d.cores[0].id);
                  setModal("");
                  setToast(
                    "Purchase added. Its supplier policy is now attached.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
          {(modal === "import-purchases" || modal === "import-credits") && (
            <ImportForm
              kind={modal === "import-credits" ? "credits" : "purchases"}
              policies={policies}
              cores={cores}
              busy={busy}
              submit={async (data) => {
                setBusy(true);
                try {
                  if (modal === "import-credits") {
                    const d = await api("credits/import", data);
                    setCores((cs) =>
                      cs.map(
                        (c) => d.cores.find((n: Core) => n.id === c.id) || c,
                      ),
                    );
                    setEvents((es) => [...es, ...d.events]);
                  } else {
                    const d = await api("cores", data);
                    setCores((cs) => [...d.cores, ...cs]);
                  }
                  setModal("");
                  setToast("Import complete. The ledger is up to date.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
          {[
            "dispatch",
            "credit",
            "followup",
            "receipt",
            "historical",
            "reverse",
            "settle",
            "reopen",
            "correct-return",
          ].includes(modal) &&
            selected && (
              <RecordActionForm
                core={selected}
                kind={modal}
                busy={busy}
                submit={async (action) => {
                  await act(action);
                  setModal("");
                }}
              />
            )}
          {modal === "packet" && selected && <ReturnPacket core={selected} />}
          {modal === "delete-workspace" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setBusy(true);
                try {
                  await api("workspace-delete", {
                    confirmation: data.get("confirmation"),
                  });
                  await refresh();
                  setEvents([]);
                  setTranscripts({});
                  setDetail(false);
                  setModal("");
                  setToast("Workspace data deleted.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <p className="section-description">
                This permanently removes your core records, policies,
                transcripts and audit history. Export your complete workspace
                first. Your daily voice allowance does not reset.
              </p>
              <label className="field">
                Type DELETE MY WORKSPACE
                <input
                  name="confirmation"
                  required
                  pattern="DELETE MY WORKSPACE"
                  autoComplete="off"
                />
              </label>
              <div className="form-actions">
                <button className="btn danger-solid" disabled={busy}>
                  Permanently delete workspace data
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function dateLabel(s: string) {
  return new Date(s + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
function modalTitle(m: string) {
  return (
    (
      {
        voice: "Start a live bench conversation",
        guide: "From shelf to supplier credit",
        policy: "Supplier return policy",
        "new-policy": "Add a supplier policy",
        "new-core": "Add a core-deposit purchase",
        "import-purchases": "Import purchase records",
        "import-credits": "Reconcile supplier credit memos",
        receipt: "Record supplier receipt",
        historical: "Import an existing return",
        reverse: "Reverse a mistaken credit",
        dispatch: "Record a real dispatch",
        credit: "Post a supplier credit",
        settle: "Accept final supplier deduction",
        reopen: "Reopen accepted deduction",
        "correct-return": "Correct return dates",
        followup: "Record a follow-up",
        packet: "Return packet",
        "delete-workspace": "Delete workspace data",
      } as Record<string, string>
    )[m] || m
  );
}
