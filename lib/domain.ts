import { z } from "zod";

export type Packaging =
  | "unknown"
  | "original"
  | "approved_alternative"
  | "missing";
export type Policy = {
  id: string;
  supplier: string;
  name: string;
  version: string;
  windowDays: number;
  deadlineBasis: "dispatch" | "receipt";
  allowAlternative: boolean;
  alternativeInstructions: string;
  requireComplete: boolean;
  requireRma: boolean;
  creditDays: number;
  instructions: string;
  source: string;
};
export type Credit = {
  id: string;
  memo: string;
  lineRef: string;
  amountCents: number;
  date: string;
  note: string;
  reversedAt?: string;
  reversalReason?: string;
};
export type CoreState = {
  revision: number;
  observedPart: string;
  observedInvoice: string;
  observedJob: string;
  observedPurchaseLine?: string;
  deduction?: {
    amountCents: number;
    reason: string;
    at: string;
    actor: string;
  };
  complete: "unknown" | "yes" | "no";
  packaging: Packaging;
  conditionNote: string;
  labelAttached: boolean;
  rma: string;
  matchConfirmed: boolean;
  preparedAt: string | null;
  preparedBy: string;
  dispatchedAt: string | null;
  dispatchRef: string;
  receivedAt: string | null;
  receiptRef: string;
  followup: string;
  credits: Credit[];
};
export type Core = {
  id: string;
  invoice: string;
  purchaseLine: string;
  job: string;
  part: string;
  description: string;
  depositCents: number;
  shippedDate: string;
  supplier: string;
  policy: Policy;
  state: CoreState;
  createdAt: string;
};
export type AuditEvent = {
  id: string;
  coreId: string;
  action: string;
  actor: string;
  source: string;
  at: string;
  before: CoreState;
  after: CoreState;
  note: string;
};
export type Transcript = {
  id: string;
  speaker: string;
  text: string;
  coreId?: string;
};
export const emptyState = (): CoreState => ({
  revision: 0,
  observedPart: "",
  observedInvoice: "",
  observedJob: "",
  complete: "unknown",
  packaging: "unknown",
  conditionNote: "",
  labelAttached: false,
  rma: "",
  matchConfirmed: false,
  preparedAt: null,
  preparedBy: "",
  dispatchedAt: null,
  dispatchRef: "",
  receivedAt: null,
  receiptRef: "",
  followup: "",
  credits: [],
});
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Use a valid date in YYYY-MM-DD format.",
  );
export const moneySchema = z.number().int().min(1).max(100000000);
export const policySchema = z
  .object({
    supplier: z.string().trim().min(2).max(120),
    name: z.string().trim().min(3).max(120),
    version: z.string().trim().min(1).max(50),
    windowDays: z.number().int().min(1).max(730),
    deadlineBasis: z.enum(["dispatch", "receipt"]),
    allowAlternative: z.boolean(),
    alternativeInstructions: z.string().max(1000),
    requireComplete: z.boolean(),
    requireRma: z.boolean(),
    creditDays: z.number().int().min(1).max(180),
    instructions: z.string().trim().min(10).max(4000),
    source: z.string().max(500),
  })
  .refine(
    (p) => !p.allowAlternative || p.alternativeInstructions.trim().length >= 10,
    "Describe the approved alternative packaging.",
  );
export const coreInputSchema = z.object({
  invoice: z.string().trim().min(1).max(80),
  purchaseLine: z.string().trim().min(1).max(80).default("1"),
  job: z.string().trim().min(1).max(80),
  part: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(160),
  depositCents: moneySchema,
  shippedDate: dateSchema,
  policyId: z.string().min(1).max(80),
});
export const actionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("settle_deduction"),
      reason: z.string().trim().min(12).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("reopen_deduction"),
      reason: z.string().trim().min(8).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("correct_return"),
      dispatchDate: dateSchema,
      dispatchRef: z.string().trim().min(3).max(200),
      receiptDate: z.union([dateSchema, z.literal("")]),
      receiptRef: z.string().max(200),
      reason: z.string().trim().min(12).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("observe"),
      part: z.string().max(100),
      invoice: z.string().max(80),
      job: z.string().max(80),
      purchaseLine: z.string().trim().min(1).max(80).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("inspect"),
      complete: z.enum(["unknown", "yes", "no"]),
      packaging: z.enum([
        "unknown",
        "original",
        "approved_alternative",
        "missing",
      ]),
      labelAttached: z.boolean(),
      rma: z.string().max(120),
      note: z.string().max(2000),
    })
    .strict(),
  z.object({ type: z.literal("confirm_match") }).strict(),
  z.object({ type: z.literal("prepare_return") }).strict(),
  z
    .object({
      type: z.literal("dispatch"),
      reference: z.string().trim().min(3).max(200),
      date: dateSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("add_credit"),
      memo: z.string().trim().min(2).max(100),
      lineRef: z.string().trim().min(1).max(80).default("1"),
      amountCents: moneySchema,
      date: dateSchema,
      note: z.string().max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("record_receipt"),
      reference: z.string().trim().min(3).max(200),
      date: dateSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("reverse_credit"),
      creditId: z.string().min(1),
      reason: z.string().trim().min(8).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("historical_return"),
      reference: z.string().trim().min(3).max(200),
      date: dateSchema,
      evidence: z.string().trim().min(12).max(2000),
    })
    .strict(),
  z
    .object({
      type: z.literal("followup"),
      note: z.string().trim().min(3).max(2000),
    })
    .strict(),
]);
export type CoreAction = z.infer<typeof actionSchema>;
export function normalizeId(s: string) {
  return s.trim().toUpperCase().replace(/[\s-]/g, "");
}
export function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
export function inspectReadiness(core: Core, today = todayUTC()) {
  const s = core.state;
  const p = core.policy;
  const deadline = addDays(core.shippedDate, p.windowDays);
  const daysLeft = Math.round(
    (Date.parse(deadline) - Date.parse(today)) / 86400000,
  );
  const matched =
    normalizeId(s.observedPart) === normalizeId(core.part) &&
    normalizeId(s.observedInvoice) === normalizeId(core.invoice) &&
    normalizeId(s.observedJob) === normalizeId(core.job) &&
    normalizeId(s.observedPurchaseLine || "1") ===
      normalizeId(core.purchaseLine);
  const blockers: string[] = [];
  if (!matched) blockers.push("Confirm the exact part, invoice and job match");
  if (!s.matchConfirmed)
    blockers.push("A person must confirm the purchase match");
  if (p.requireComplete && s.complete !== "yes")
    blockers.push(
      s.complete === "no"
        ? "Core is incomplete; ask the supplier before proceeding"
        : "Confirm all required components are present",
    );
  if (s.packaging === "unknown" || s.packaging === "missing")
    blockers.push("Confirm acceptable return packaging");
  if (s.packaging === "approved_alternative" && !p.allowAlternative)
    blockers.push("This policy requires original packaging");
  if (!s.labelAttached)
    blockers.push("Attach the invoice / core identification label");
  if (p.requireRma && !s.rma.trim())
    blockers.push("Add the supplier return authorization");
  if (daysLeft < 0 && !s.dispatchedAt)
    blockers.push("Return window has passed; contact the supplier");
  const creditedCents = s.credits.reduce(
    (a, c) => a + (c.reversedAt ? 0 : c.amountCents),
    0,
  );
  const deductionCents = s.deduction?.amountCents || 0;
  const outstandingCents = core.depositCents - creditedCents - deductionCents;
  const creditDue = s.receivedAt
    ? addDays(s.receivedAt.slice(0, 10), p.creditDays)
    : null;
  const deadlineEvent =
    p.deadlineBasis === "receipt" ? s.receivedAt : s.dispatchedAt;
  const timely = deadlineEvent ? deadlineEvent.slice(0, 10) <= deadline : null;
  const receiptPending = !!s.dispatchedAt && !s.receivedAt;
  if (s.dispatchedAt && p.deadlineBasis === "receipt" && !s.receivedAt)
    blockers.push(
      "Supplier receipt is unconfirmed; dispatch does not establish an on-time return",
    );
  if (timely === false)
    blockers.push(
      "The recorded return event is after the policy deadline; supplier review required",
    );
  const status =
    creditedCents >= core.depositCents
      ? "Credited"
      : outstandingCents === 0 && deductionCents > 0
        ? "Closed with deduction"
        : creditedCents > 0
          ? "Short credit"
          : s.dispatchedAt
            ? s.receivedAt
              ? "Awaiting credit"
              : "In transit"
            : s.preparedAt
              ? "Ready to return"
              : "Needs inspection";
  return {
    deadline,
    daysLeft,
    timely,
    receiptPending,
    matched,
    blockers,
    ready: blockers.length === 0,
    creditedCents,
    deductionCents,
    outstandingCents,
    creditDue,
    creditOverdue: !!creditDue && today > creditDue && outstandingCents > 0,
    status,
  };
}
/** Business transitions are independent of model prompts. Voice cannot approve, dispatch or post money. */
export function applyAction(
  core: Core,
  action: CoreAction,
  actor: string,
  role: "owner" | "agent",
  at = new Date().toISOString(),
): CoreState {
  const s = structuredClone(core.state);
  const today = at.slice(0, 10);
  if (
    role === "agent" &&
    !["observe", "inspect", "followup"].includes(action.type)
  )
    throw new Error(
      "A person must confirm purchases, prepare returns, record dispatch and post supplier credits.",
    );
  if (
    s.dispatchedAt &&
    ["observe", "inspect", "confirm_match", "prepare_return"].includes(
      action.type,
    )
  )
    throw new Error(
      "This core has already been dispatched. The return evidence is locked. Add a follow-up note instead.",
    );
  switch (action.type) {
    case "settle_deduction": {
      const remaining = inspectReadiness(core, today).outstandingCents;
      if (!s.dispatchedAt || remaining <= 0 || s.deduction)
        throw new Error(
          "A returned core with an unresolved balance is required.",
        );
      s.deduction = {
        amountCents: remaining,
        reason: action.reason,
        actor,
        at,
      };
      break;
    }
    case "reopen_deduction":
      if (!s.deduction)
        throw new Error("There is no accepted deduction to reopen.");
      delete s.deduction;
      s.followup = "Deduction reopened: " + action.reason;
      break;
    case "correct_return": {
      if (!s.dispatchedAt) throw new Error("Record an actual dispatch first.");
      if (action.dispatchDate < core.shippedDate || action.dispatchDate > today)
        throw new Error(
          "Corrected dispatch must be between purchase shipment and today.",
        );
      if (
        action.receiptDate &&
        (action.receiptDate < action.dispatchDate ||
          action.receiptDate > today ||
          action.receiptRef.trim().length < 3)
      )
        throw new Error(
          "Corrected receipt needs a reference and a date between dispatch and today.",
        );
      if (s.credits.some((c) => !c.reversedAt && c.date < action.dispatchDate))
        throw new Error(
          "Dispatch cannot be later than a posted credit. Correct the credit first.",
        );
      s.dispatchedAt = action.dispatchDate;
      s.dispatchRef = action.dispatchRef;
      s.receivedAt = action.receiptDate || null;
      s.receiptRef = action.receiptDate ? action.receiptRef : "";
      s.followup = "Return dates corrected: " + action.reason;
      break;
    }
    case "observe":
      s.observedPart = action.part.trim();
      s.observedInvoice = action.invoice.trim();
      s.observedJob = action.job.trim();
      s.observedPurchaseLine = action.purchaseLine?.trim() || "1";
      s.matchConfirmed = false;
      s.preparedAt = null;
      s.preparedBy = "";
      break;
    case "inspect":
      s.complete = action.complete;
      s.packaging = action.packaging;
      s.labelAttached = action.labelAttached;
      s.rma = action.rma.trim();
      s.conditionNote = action.note.trim();
      s.preparedAt = null;
      s.preparedBy = "";
      break;
    case "confirm_match":
      if (!inspectReadiness(core, today).matched)
        throw new Error(
          "Part, invoice and job must all match before confirmation.",
        );
      s.matchConfirmed = true;
      break;
    case "prepare_return": {
      const r = inspectReadiness(core, today);
      if (!r.ready)
        throw new Error("Return blocked: " + r.blockers.join("; ") + ".");
      s.preparedAt = at;
      s.preparedBy = actor;
      break;
    }
    case "dispatch":
      if (!s.preparedAt)
        throw new Error(
          "Review and prepare the return before recording dispatch.",
        );
      if (s.dispatchedAt)
        throw new Error("Dispatch has already been recorded.");
      if (action.date < core.shippedDate || action.date > today)
        throw new Error(
          "Dispatch date must be between the purchase shipment date and today.",
        );
      s.dispatchedAt = action.date;
      s.dispatchRef = action.reference;
      break;
    case "record_receipt":
      if (!s.dispatchedAt)
        throw new Error("Record dispatch before supplier receipt.");
      if (s.receivedAt)
        throw new Error(
          "Receipt has already been recorded. Add a correction note if needed.",
        );
      if (action.date < s.dispatchedAt.slice(0, 10) || action.date > today)
        throw new Error("Receipt date must be between dispatch and today.");
      s.receivedAt = action.date;
      s.receiptRef = action.reference;
      break;
    case "historical_return":
      if (s.dispatchedAt || s.preparedAt)
        throw new Error("This record already has a preparation or dispatch.");
      if (action.date < core.shippedDate || action.date > today)
        throw new Error(
          "Historical dispatch date must be between purchase shipment and today.",
        );
      s.dispatchedAt = action.date;
      s.dispatchRef = action.reference;
      s.followup =
        "Historical return imported from shop evidence: " + action.evidence;
      break;
    case "reverse_credit": {
      if (s.deduction)
        throw new Error(
          "Reopen the accepted deduction before changing credits.",
        );
      const credit = s.credits.find((c) => c.id === action.creditId);
      if (!credit || credit.reversedAt)
        throw new Error(
          "This credit does not exist or has already been reversed.",
        );
      credit.reversedAt = at;
      credit.reversalReason = action.reason;
      break;
    }
    case "add_credit":
      if (s.deduction)
        throw new Error(
          "Reopen the accepted deduction before posting more credit.",
        );
      if (!s.dispatchedAt)
        throw new Error(
          "Record the physical return before posting a supplier credit.",
        );
      if (action.date < s.dispatchedAt.slice(0, 10) || action.date > today)
        throw new Error("Credit date must be between dispatch and today.");
      if (
        s.credits.some(
          (c) =>
            !c.reversedAt &&
            normalizeId(c.memo) === normalizeId(action.memo) &&
            normalizeId(c.lineRef || "1") === normalizeId(action.lineRef),
        )
      )
        throw new Error("This credit memo is already posted to this core.");
      if (
        s.credits.reduce((n, c) => n + (c.reversedAt ? 0 : c.amountCents), 0) +
          action.amountCents >
        core.depositCents
      )
        throw new Error(
          "Credit exceeds the remaining deposit. Check the memo or record an external adjustment.",
        );
      s.credits.push({
        id: crypto.randomUUID(),
        memo: action.memo,
        lineRef: action.lineRef,
        amountCents: action.amountCents,
        date: action.date,
        note: action.note,
      });
      break;
    case "followup":
      s.followup = action.note;
      break;
  }
  s.revision++;
  return s;
}
export function searchCores(cores: Core[], query: string, limit = 12) {
  const q = normalizeId(query);
  if (!q) return [];
  return cores
    .filter((c) =>
      [c.invoice, c.job, c.part, c.description].some((s) =>
        normalizeId(s).includes(q),
      ),
    )
    .slice(0, limit);
}
export function csvCell(v: unknown) {
  const s = String(v ?? "");
  return (
    '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
  );
}
export function exportCsv(cores: Core[]) {
  return [
    [
      "invoice",
      "purchase_line",
      "job",
      "part",
      "supplier",
      "deposit_usd",
      "credited_usd",
      "accepted_deduction_usd",
      "outstanding_usd",
      "deadline",
      "status",
      "dispatch_reference",
    ],
    ...cores.map((c) => {
      const r = inspectReadiness(c);
      return [
        c.invoice,
        c.purchaseLine,
        c.job,
        c.part,
        c.supplier,
        (c.depositCents / 100).toFixed(2),
        (r.creditedCents / 100).toFixed(2),
        (r.deductionCents / 100).toFixed(2),
        (r.outstandingCents / 100).toFixed(2),
        r.deadline,
        r.status,
        c.state.dispatchRef,
      ];
    }),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
/** RFC4180-style CSV parser; handles quoted commas/newlines and rejects ragged rows. */
export function parseCsv(text: string): Record<string, string>[] {
  if (text.length > 500000) throw new Error("CSV exceeds 500 KB.");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("CSV contains an unclosed quote.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  const header = rows.shift()?.map((x) => x.trim().toLowerCase());
  if (!header?.length || new Set(header).size !== header.length)
    throw new Error("CSV needs a unique header row.");
  if (rows.length > 200) throw new Error("Import up to 200 rows at a time.");
  return rows.map((r, i) => {
    if (r.length !== header.length)
      throw new Error(
        `Row ${i + 2} has ${r.length} fields; expected ${header.length}.`,
      );
    return Object.fromEntries(header.map((h, j) => [h, r[j].trim()]));
  });
}
export function dollarsToCents(s: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(s))
    throw new Error(
      "Amounts must be positive numbers with up to two decimal places.",
    );
  const [a, b = ""] = s.split(".");
  return Number(a) * 100 + Number(b.padEnd(2, "0"));
}
