"use client";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Check, Monitor, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

export function LogoMark({ size = 32 }: { size?: number }) {
  // A bold "C" (the core) with a solid coin in its opening (the deposit coming back).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="logo-mark"
    >
      <rect width="32" height="32" rx="8" fill="#0f766e" />
      <path
        d="M22.1 10.9A8 8 0 1 0 22.1 21.1"
        fill="none"
        stroke="#fff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="22.4" cy="16" r="2.7" fill="#5eead4" />
    </svg>
  );
}
export function Brand({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      href={href}
      aria-label="CoreBack home"
    >
      <LogoMark size={30} />
      <span>
        core<b>back</b>
      </span>
    </Link>
  );
}
const noop = () => () => {};
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? theme : "system";
  const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Switch to ${next}.`}
      title={`Theme: ${current}`}
    >
      <Icon size={17} />
    </button>
  );
}
export function Badge({ status }: { status: string }) {
  const tone =
    status === "Credited"
      ? "green"
      : status === "Ready to return"
        ? "blue"
        : status === "Short credit"
          ? "red"
          : status === "Awaiting credit"
            ? "amber"
            : status === "In transit"
              ? "sky"
              : "";
  return (
    <span className={`badge ${tone}`}>
      {status === "Credited" && <Check size={12} />} {status}
    </span>
  );
}
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && ref.current) {
        const all = Array.from(
          ref.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href],input:not(:disabled),textarea,select",
          ),
        );
        const first = all[0],
          last = all.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = previous;
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="close" onClick={close} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
export function Metric({
  label,
  value,
  caption,
  icon,
  tone = "",
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  tone?: "" | "warning" | "good";
}) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-label">
        {label}
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value num">{value}</div>
      <div className="metric-caption">{caption}</div>
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
