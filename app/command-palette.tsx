"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CornerDownLeft, Search } from "lucide-react";

export type PaletteItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
};
export function CommandPalette(props: {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}) {
  // Mounting fresh on each open resets the query and selection.
  return props.open ? <PaletteDialog {...props} /> : null;
}
function PaletteDialog({
  onClose,
  items,
}: {
  onClose: () => void;
  items: PaletteItem[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.filter((i) => i.group !== "Purchases").slice(0, 12);
    return items
      .filter((i) =>
        `${i.label} ${i.hint || ""} ${i.keywords || ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 14);
  }, [items, query]);
  useEffect(() => {
    document
      .querySelector<HTMLElement>(`[data-palette-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const groups = Array.from(new Set(results.map((r) => r.group)));
  const run = (item?: PaletteItem) => {
    if (!item) return;
    onClose();
    item.run();
  };
  return (
    <div
      className="palette-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            run(results[active]);
          }
        }}
      >
        <div className="palette-input">
          <Search size={18} />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search purchases, jump to a page, or run an action…"
            aria-label="Search commands and purchases"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" role="listbox">
          {!results.length && (
            <div className="palette-empty">No matches for “{query}”.</div>
          )}
          {groups.map((g) => (
            <div key={g}>
              <div className="palette-group">{g}</div>
              {results
                .map((r, index) => ({ r, index }))
                .filter(({ r }) => r.group === g)
                .map(({ r, index }) => (
                  <button
                    key={r.id}
                    role="option"
                    aria-selected={index === active}
                    data-palette-index={index}
                    className={`palette-item ${index === active ? "active" : ""}`}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(r)}
                  >
                    <span className="palette-icon">{r.icon}</span>
                    <span className="palette-label">{r.label}</span>
                    {r.hint && <span className="palette-hint">{r.hint}</span>}
                    {index === active && <CornerDownLeft size={14} />}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>Ctrl</kbd> <kbd>K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
