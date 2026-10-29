// Formatting for the (English) agent UI.

export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "–";
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

export const since = (iso: string, now = Date.now()) => formatDuration(now - new Date(iso).getTime());

export const relative = (iso: string, now = Date.now()) => `${since(iso, now)} ago`;

export const percent = (value: number | null) => (value === null ? "–" : `${Math.round(value * 100)} %`);

export const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }) : "–";

export const ticketRef = (id: string) => id.slice(0, 8);

// Request time for server components (kept out of render bodies for the purity lint rule).
export const nowMs = () => Date.now();
