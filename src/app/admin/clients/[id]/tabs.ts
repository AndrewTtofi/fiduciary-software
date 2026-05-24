export type ClientTab = "overview" | "services" | "documents" | "conversation" | "activity";

export function tabFromParam(raw: string | undefined): ClientTab {
  const t = (raw ?? "").toLowerCase();
  if (t === "services" || t === "documents" || t === "conversation" || t === "activity") return t;
  return "overview";
}
