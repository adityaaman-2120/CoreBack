import type { AuditEvent, Core, Policy, Transcript } from "./domain";
export type ApiResult = {
  error?: string;
  cores: Core[];
  policies: Policy[];
  policy: Policy;
  voiceConfigured: boolean;
  events: AuditEvent[];
  transcripts: Transcript[];
  state: Core["state"];
  event: AuditEvent;
};
export async function api(path: string, data?: unknown) {
  const r = await fetch(`/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const d = (await r.json().catch(() => ({}))) as ApiResult;
  if (!r.ok) throw new Error(d.error || "The request could not be completed.");
  return d;
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
