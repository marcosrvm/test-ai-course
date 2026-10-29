import type { Metadata } from "next";
import Link from "next/link";
import { AgentBar } from "@/components/agent/AgentBar";
import { requireAgentPage } from "@/lib/agent/auth";
import { customerName, getKpis, listTickets, OPEN_STATUSES, type Kpis, type Queue, type TicketListRow } from "@/lib/agent/data";
import { formatDuration, nowMs, percent, relative, since, ticketRef } from "@/lib/agent/format";
import { categoryLabel, subLabel } from "@/lib/agent/labels";

export const metadata: Metadata = { title: "Tickets" };

const QUEUES = ["all", "general", "senior", "dental"] as const;
const STATUS_FILTERS = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Resolved + closed" },
  { key: "all", label: "All" },
] as const;

type Search = Promise<{ [key: string]: string | string[] | undefined }>;

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function KpiStrip({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: "Open tickets", value: String(kpis.openTickets) },
    { label: "Open red alerts", value: String(kpis.openRedAlerts), red: kpis.openRedAlerts > 0 },
    { label: "Avg. first response", value: formatDuration(kpis.avgFirstResponseMs) },
    { label: "Avg. resolution time", value: formatDuration(kpis.avgResolutionMs) },
    { label: `AI–human agreement${kpis.aiCompared ? ` (${plural(kpis.aiCompared, "ticket")})` : ""}`, value: percent(kpis.aiAgreement) },
    { label: `Draft acceptance${kpis.drafts ? ` (${plural(kpis.drafts, "draft")})` : ""}`, value: percent(kpis.draftAcceptance) },
    { label: "Avg. edit of sent drafts", value: kpis.avgEditPercentage === null ? "–" : `${Math.round(kpis.avgEditPercentage)} %` },
    { label: "Chatbot escalations", value: String(kpis.escalations) },
  ];
  return (
    <section className="su-agent-kpis" aria-label="KPIs">
      {items.map((item) => (
        <div key={item.label} className={`su-agent-kpi${item.red ? " su-agent-kpi-red" : ""}`}>
          <span className="su-agent-kpi-value">{item.value}</span>
          <span className="su-agent-kpi-label">{item.label}</span>
        </div>
      ))}
    </section>
  );
}

function Row({ t, now }: { t: TicketListRow; now: number }) {
  const open = OPEN_STATUSES.includes(t.status);
  return (
    <tr className={t.alert === "red" ? "su-agent-row-red" : undefined} data-ticket={t.id}>
      <td>{t.alert === "red" ? <span className="su-agent-badge su-agent-badge-red">RED</span> : <span className="su-agent-muted">–</span>}</td>
      <td>
        <span className={`su-agent-badge su-agent-badge-${t.priority}`}>{t.priority}</span>
      </td>
      <td>
        <Link href={`/v2/agent/${t.id}`} className="su-agent-link">
          {categoryLabel(t.category)}
        </Link>
        <div className="su-agent-muted">{ticketRef(t.id)}</div>
      </td>
      <td>{subLabel(t.category, t.sub_category)}</td>
      <td>{t.queue}</td>
      <td>{t.channel ?? "–"}</td>
      <td>
        {customerName(t.lead)}
        {t.alert === "red" && !t.lead?.phone && <span className="su-agent-nophone">No phone – contact by e-mail</span>}
      </td>
      <td title={t.created_at}>{relative(t.created_at, now)}</td>
      <td>{open && !t.first_response_at ? <span className="su-agent-waiting">{since(t.created_at, now)}</span> : <span className="su-agent-muted">–</span>}</td>
      <td>
        <span className="su-agent-badge su-agent-badge-status">{t.status}</span>
      </td>
    </tr>
  );
}

export default async function AgentTicketsPage({ searchParams }: { searchParams: Search }) {
  const agent = await requireAgentPage();
  const params = await searchParams;
  const queue = pick(params.queue, QUEUES, "all") as Queue | "all";
  const status = pick(params.status, ["open", "closed", "all"] as const, "open");
  const href = (next: { queue?: string; status?: string }) =>
    `/v2/agent?${new URLSearchParams({ queue: next.queue ?? queue, status: next.status ?? status })}`;

  let tickets: TicketListRow[] = [];
  let kpis: Kpis | null = null;
  let failed = false;
  try {
    [tickets, kpis] = await Promise.all([listTickets({ queue, status }), getKpis()]);
  } catch {
    failed = true;
  }
  const now = nowMs();

  return (
    <>
      <AgentBar agentName={agent.name} />
      <main className="su-agent-main">
        <h1>Tickets</h1>
        {failed && <p className="su-agent-error">Could not load data from the database.</p>}
        {kpis && <KpiStrip kpis={kpis} />}

        <div className="su-agent-filters">
          <div className="su-agent-filter">
            <span>Queue</span>
            {QUEUES.map((q) => (
              <Link key={q} href={href({ queue: q })} className="su-agent-pill" aria-current={q === queue}>
                {q === "all" ? "All" : q}
              </Link>
            ))}
          </div>
          <div className="su-agent-filter">
            <span>Status</span>
            {STATUS_FILTERS.map((s) => (
              <Link key={s.key} href={href({ status: s.key })} className="su-agent-pill" aria-current={s.key === status}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="su-agent-table-wrap">
          <table className="su-agent-table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Sub-category</th>
                <th>Queue</th>
                <th>Channel</th>
                <th>Customer</th>
                <th>Created</th>
                <th>Waiting</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <Row key={t.id} t={t} now={now} />
              ))}
              {tickets.length === 0 && !failed && (
                <tr>
                  <td colSpan={10} className="su-agent-muted">
                    No tickets for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
