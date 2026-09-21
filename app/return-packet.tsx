"use client";
import { ArrowDownToLine, FileText } from "lucide-react";
import { inspectReadiness, money, type Core } from "@/lib/domain";
import { download } from "@/lib/client";
import { SITE } from "@/lib/site";

export function ReturnPacket({ core }: { core: Core }) {
  const r = inspectReadiness(core);
  return (
    <>
      <div className="packet-preview">
        <div className="eyebrow">{SITE.name} · Core return packet</div>
        <h2>{core.supplier}</h2>
        <p className="subtitle">
          Prepared {core.state.preparedAt?.slice(0, 10)} · {core.policy.version}
        </p>
        <div className="packet-amount">
          {money(core.depositCents)}
          <span> expected deposit credit</span>
        </div>
        {[
          ["Part", `${core.part} · ${core.description}`],
          [
            "Purchase",
            `${core.invoice} / line ${core.purchaseLine} / ${core.job}`,
          ],
          ["Return deadline", `${r.deadline} (${core.policy.deadlineBasis})`],
          ["Packaging", core.state.packaging.replaceAll("_", " ")],
          ["Complete assembly", core.state.complete],
          [
            "Invoice label",
            core.state.labelAttached ? "Attached (reported)" : "Not confirmed",
          ],
          [
            "Authorization",
            core.state.rma || "Not required by configured policy",
          ],
        ].map(([a, b]) => (
          <div className="settings-item" key={a}>
            <span>{a}</span>
            <b>{b}</b>
          </div>
        ))}
        <p className="instruction">{core.state.conditionNote}</p>
        <p className="subtitle">{core.policy.instructions}</p>
        <div className="quote">
          Prepared by {core.state.preparedBy}. This packet is not a shipping
          label, supplier authorization or guarantee of credit.
        </div>
      </div>
      <div className="form-actions">
        <button
          className="btn"
          onClick={() =>
            download(
              `return-${core.invoice}.txt`,
              returnText(core),
              "text/plain",
            )
          }
        >
          <ArrowDownToLine size={15} />
          Download text
        </button>
        <button
          className="btn primary"
          onClick={async () => {
            const { downloadReturnPdf } = await import("@/lib/return-pdf");
            await downloadReturnPdf(core);
          }}
        >
          <FileText size={15} />
          Download PDF
        </button>
      </div>
    </>
  );
}
export function returnText(c: Core) {
  return `${SITE.name.toUpperCase()} - CORE RETURN\nSupplier: ${c.supplier}\nPolicy: ${c.policy.version}\nPart: ${c.part} / ${c.description}\nInvoice: ${c.invoice}\nJob: ${c.job}\nExpected deposit: ${money(c.depositCents)}\nReturn by: ${inspectReadiness(c).deadline} (${c.policy.deadlineBasis})\nPackaging: ${c.state.packaging}\nComplete: ${c.state.complete}\nLabel attached: ${c.state.labelAttached}\nNotes: ${c.state.conditionNote}\nPrepared by: ${c.state.preparedBy}\n\n${c.policy.instructions}\n\nNot a shipping label or guarantee of supplier credit.`;
}
