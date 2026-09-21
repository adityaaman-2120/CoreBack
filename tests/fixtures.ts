import {
  addDays,
  emptyState,
  todayUTC,
  type Core,
  type CoreState,
  type Policy,
} from "../lib/domain";
// Fictional supplier and purchase records used only by the automated tests.
export function samplePolicy(): Policy {
  return {
    id: "policy-northline",
    supplier: "Northline Parts",
    name: "Dry electrical core returns",
    version: "Demo terms · v1",
    windowDays: 60,
    deadlineBasis: "dispatch",
    allowAlternative: true,
    alternativeInstructions:
      "Use a sturdy protective container secured on a pallet, with the invoice/core identification label attached. Confirm these sample terms with the actual supplier before a real shipment.",
    requireComplete: true,
    requireRma: false,
    creditDays: 45,
    instructions:
      "Return the matching, complete alternator or starter. Original packaging or the specified approved alternative is accepted. Keep the invoice reference with the core. The supplier inspects the returned unit and determines actual credit; the deposit is not a guarantee of acceptance. These are fictional demonstration terms.",
    source: "Fictional supplier policy for the automated tests.",
  };
}
export function sampleCores(today = todayUTC()): Core[] {
  const p = samplePolicy();
  const base = {
    purchaseLine: "1",
    supplier: p.supplier,
    policy: p,
    createdAt: new Date().toISOString(),
  };
  const complete: CoreState = {
    ...emptyState(),
    revision: 4,
    observedPart: "STR-12-90",
    observedInvoice: "INV-7998",
    observedJob: "WO-403",
    complete: "yes",
    packaging: "original",
    labelAttached: true,
    matchConfirmed: true,
    preparedAt: today + "T08:00:00Z",
    preparedBy: "Test parts manager",
  };
  return [
    {
      ...base,
      id: "core-418",
      invoice: "INV-8042",
      job: "WO-418",
      part: "ALT-24-160",
      description: "24V reman alternator",
      depositCents: 24000,
      shippedDate: addDays(today, -56),
      state: emptyState(),
    },
    {
      ...base,
      id: "core-403",
      invoice: "INV-7998",
      job: "WO-403",
      part: "STR-12-90",
      description: "12V heavy-duty starter",
      depositCents: 18000,
      shippedDate: addDays(today, -43),
      state: complete,
    },
    {
      ...base,
      id: "core-397",
      invoice: "INV-7901",
      job: "WO-397",
      part: "ALT-24-160",
      description: "24V reman alternator",
      depositCents: 24000,
      shippedDate: addDays(today, -65),
      state: {
        ...complete,
        revision: 7,
        observedPart: "ALT-24-160",
        observedInvoice: "INV-7901",
        observedJob: "WO-397",
        dispatchedAt: addDays(today, -22),
        dispatchRef: "PICKUP-091",
        receivedAt: addDays(today, -20),
        receiptRef: "RCV-091",
        credits: [
          {
            id: "credit-old",
            memo: "CM-201",
            lineRef: "1",
            amountCents: 24000,
            date: addDays(today, -5),
            note: "Sample full supplier credit",
          },
        ],
      },
    },
    {
      ...base,
      id: "core-409",
      invoice: "INV-8016",
      job: "WO-409",
      part: "STR-24-110",
      description: "24V gear-reduction starter",
      depositCents: 32000,
      shippedDate: addDays(today, -31),
      state: {
        ...complete,
        revision: 6,
        observedPart: "STR-24-110",
        observedInvoice: "INV-8016",
        observedJob: "WO-409",
        dispatchedAt: addDays(today, -8),
        dispatchRef: "PICKUP-104",
        receivedAt: addDays(today, -6),
        receiptRef: "RCV-104",
        credits: [
          {
            id: "credit-partial",
            memo: "CM-214",
            lineRef: "1",
            amountCents: 27500,
            date: addDays(today, -2),
            note: "Sample credit memo; deduction reason not supplied.",
          },
        ],
      },
    },
    {
      ...base,
      id: "core-422",
      invoice: "INV-8061",
      job: "WO-422",
      part: "ALT-12-130",
      description: "12V reman alternator",
      depositCents: 16500,
      shippedDate: addDays(today, -15),
      state: emptyState(),
    },
  ];
}
