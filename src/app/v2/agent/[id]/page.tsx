import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentBar } from "@/components/agent/AgentBar";
import { ContactedButton } from "@/components/agent/ContactedButton";
import { DraftPanel, type DraftView } from "@/components/agent/DraftPanel";
import { TicketDecisionForm, type CategoryOption } from "@/components/agent/TicketDecisionForm";
import { requireAgentPage } from "@/lib/agent/auth";
import { customerMessages, customerName, getTicketDetail, isClinical, OPEN_STATUSES, type TicketDetail } from "@/lib/agent/data";
import { sourcesFromIds } from "@/lib/agent/draft";
import { MIGRATION_002_MESSAGE } from "@/lib/agent/schema";
import { dateTime, formatDuration, nowMs, relative, since, ticketRef } from "@/lib/agent/format";
import { categoryLabel, subLabel } from "@/lib/agent/labels";
import { listCategories } from "@/lib/chatbot/taxonomy";

export const metadata: Metadata = { title: "Ticket" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const greetingName = (firstName: string | null) => (firstName ?? "").replace(/\s*\(Demo\)\s*$/, "").trim();

// Fixed German template (customer-facing) for urgent tickets without a phone number.
const phoneTemplate = (firstName: string | null) => {
  const name = greetingName(firstName);
  return `Hallo${name ? ` ${name}` : ""}, danke für deine Nachricht. Damit unser Zahnärzteteam dich schnell erreichen kann, schick uns bitte deine Telefonnummer. Wenn die Beschwerden stark sind, geh bitte direkt zu einer Zahnarztpraxis oder zum zahnärztlichen Notdienst.`;
};

// Fixed internal summary for the dentist (English; the customer's words stay German). No AI.
function clinicalSummary(d: TicketDetail): string {
  const t = d.ticket;
  const messages = customerMessages(d).map((m) => `  „${m}“`).join("\n") || "  –";
  return [
    `Category: ${categoryLabel(t.category)}${t.sub_category ? ` / ${subLabel(t.category, t.sub_category)}` : ""}`,
    `Alert: ${t.alert === "red" ? "RED – urgent, contact as soon as possible" : "none"}`,
    `Priority / queue: ${t.priority} / ${t.queue}`,
    `Customer message (German):\n${messages}`,
    `Quiz result: ${d.quiz?.result_type ?? "none"}`,
    `Contact: ${d.lead.phone ? `phone ${d.lead.phone}` : "no phone – contact by e-mail"}${d.lead.email ? `, e-mail ${d.lead.email}` : ""}`,
  ].join("\n");
}

function Compare({ d }: { d: TicketDetail }) {
  const s = d.suggestion;
  const t = d.ticket;
  if (!s) {
    return <p className="su-agent-muted">{isClinical(t) ? "No AI suggestion (rule-based routing)" : "AI unavailable"}</p>;
  }
  const rows: { label: string; ai: string; human: string; compare: boolean }[] = [
    { label: "Category", ai: categoryLabel(s.ai_category), human: categoryLabel(t.category), compare: true },
    { label: "Sub-category", ai: subLabel(s.ai_category, s.ai_sub_category), human: subLabel(t.category, t.sub_category), compare: true },
    { label: "Priority", ai: s.ai_priority ?? "–", human: t.priority, compare: true },
    { label: "Queue", ai: s.ai_queue ?? "–", human: t.queue, compare: true },
    { label: "Sentiment", ai: s.ai_sentiment ?? "–", human: "–", compare: false },
    { label: "Summary", ai: s.ai_summary ?? "–", human: t.summary ?? "–", compare: false },
    { label: "Confidence", ai: s.confidence === null ? "–" : `${Math.round(Number(s.confidence) * 100)} %`, human: "–", compare: false },
  ];
  return (
    <table className="su-agent-compare">
      <thead>
        <tr>
          <th />
          <th>AI suggestion</th>
          <th>Human decision</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const changed = r.compare && r.ai !== r.human;
          return (
            <tr key={r.label} className={changed ? "su-agent-changed" : undefined}>
              <th scope="row">{r.label}</th>
              <td>{r.ai}</td>
              <td>
                {r.human}
                {changed && <span className="su-agent-changed-tag">changed by human</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function AgentTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentPage();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  let detail: TicketDetail | null;
  try {
    detail = await getTicketDetail(id);
  } catch {
    return (
      <>
        <AgentBar agentName={agent.name} />
        <main className="su-agent-main">
          <p className="su-agent-error">Could not load the ticket from the database.</p>
        </main>
      </>
    );
  }
  if (!detail) notFound();

  const { ticket: t, lead, quiz } = detail;
  const now = nowMs();
  const clinical = isClinical(t);
  const open = OPEN_STATUSES.includes(t.status);
  const categories: CategoryOption[] = listCategories().map((c) => ({
    key: c.key,
    label: c.label,
    subcategories: c.subcategories.map((s) => ({ key: s.key, label: s.label })),
  }));
  const draft: DraftView | null = detail.draft
    ? {
        id: detail.draft.id,
        text: detail.draft.draft_text,
        confidence: Number(detail.draft.confidence ?? 0),
        approved: detail.draft.approved,
        approvedBy: detail.draft.approved_by,
        editPercentage: detail.draft.edit_percentage === null ? null : Number(detail.draft.edit_percentage),
        finalText: detail.draft.final_text ?? null,
        sentAt: detail.draft.sent_at ? dateTime(detail.draft.sent_at) : null,
        // Saved sources (titles + URLs from knowledge-base.json), not a new search.
        sources: sourcesFromIds(detail.draft.source_chunk_ids),
      }
    : null;

  return (
    <>
      <AgentBar agentName={agent.name} />
      <main className="su-agent-main">
        <Link href="/v2/agent" className="su-agent-back">
          ← All tickets
        </Link>
        <div className="su-agent-head">
          <h1>Ticket {ticketRef(t.id)}</h1>
          <span className={`su-agent-badge su-agent-badge-${t.priority}`}>{t.priority}</span>
          {t.alert === "red" && <span className="su-agent-badge su-agent-badge-red">RED ALERT</span>}
          <span className="su-agent-badge su-agent-badge-status">{t.status}</span>
          <span className="su-agent-muted">
            Created {dateTime(t.created_at)} ({relative(t.created_at, now)}) ·{" "}
            {t.first_response_at
              ? `First response after ${formatDuration(new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime())}`
              : open
                ? <span className="su-agent-waiting">Waiting {since(t.created_at, now)}</span>
                : "No first response recorded"}
          </span>
        </div>

        <div className="su-agent-detail">
          <div className="su-agent-stack">
            <section className="su-agent-card" aria-label="Customer">
              <h2>Customer (CRM data)</h2>
              <dl className="su-agent-facts">
                <dt>Name</dt>
                <dd>{customerName(lead)}</dd>
                <dt>E-mail</dt>
                <dd>{lead.email ?? "–"}</dd>
                <dt>Phone</dt>
                <dd>{lead.phone ?? (t.alert === "red" ? <span className="su-agent-nophone">No phone – contact by e-mail</span> : "–")}</dd>
                <dt>Funnel stage</dt>
                <dd>{lead.funnel_stage ?? "–"}</dd>
                <dt>Entry path</dt>
                <dd>{lead.entry_path ?? "–"}</dd>
                <dt>Quiz result</dt>
                <dd>
                  {quiz
                    ? `${quiz.result_type} (${[quiz.q1, quiz.q2, quiz.q3, quiz.q4, quiz.q5, quiz.q6].map((q, i) => `Q${i + 1}: ${q || "–"}`).join(" · ")})`
                    : "–"}
                </dd>
                <dt>Tickets</dt>
                <dd data-testid="lead-ticket-count">
                  {detail.leadTickets.length} {detail.leadTickets.length === 1 ? "ticket" : "tickets"} for this customer
                  <ul className="su-agent-history">
                    {detail.leadTickets.map((lt) => (
                      <li key={lt.id}>
                        {lt.id === t.id ? (
                          <strong>{ticketRef(lt.id)} (this ticket)</strong>
                        ) : (
                          <Link href={`/v2/agent/${lt.id}`}>{ticketRef(lt.id)}</Link>
                        )}{" "}
                        – {categoryLabel(lt.category)} – {lt.status} – {relative(lt.created_at, now)}
                      </li>
                    ))}
                  </ul>
                </dd>
              </dl>
            </section>

            <section className="su-agent-card" aria-label="Conversation">
              <h2>Conversation</h2>
              <div className="su-agent-conv" lang="de">
                {(detail.conversation ?? [{ role: "user", content: t.message ?? "–" }]).map((m, i) => (
                  <div key={i} className={`su-agent-turn su-agent-turn-${m.role === "user" ? "user" : "assistant"}`}>
                    <small>{m.role === "user" ? "Customer" : "Bot"}</small>
                    {m.content}
                  </div>
                ))}
              </div>
              {!detail.conversation && <p className="su-agent-muted">Channel: {t.channel ?? "–"} (no chat conversation)</p>}
            </section>
          </div>

          <div className="su-agent-stack">
            <section className="su-agent-card" aria-label="AI suggestion vs human decision">
              <h2>AI suggestion vs human decision</h2>
              <Compare d={detail} />
            </section>

            <section className="su-agent-card" aria-label="Edit">
              <h2>Human decision</h2>
              <TicketDecisionForm
                ticketId={t.id}
                categories={categories}
                initial={{
                  category: t.category ?? "",
                  sub_category: t.sub_category ?? "",
                  priority: t.priority,
                  queue: t.queue,
                  status: t.status,
                  assigned_agent: t.assigned_agent ?? agent.name,
                }}
              />
            </section>

            <section className="su-agent-card" aria-label="Reply">
              <h2>Reply</h2>
              {clinical ? (
                <>
                  <p>
                    <strong>Clinical topics are handled by the dentist team – no AI reply</strong>
                  </p>
                  <p className="su-agent-muted" style={{ margin: "8px 0 4px" }}>
                    Clinical summary for the dentist (internal, fixed template – no AI):
                  </p>
                  <pre className="su-agent-pre" data-testid="clinical-summary">{clinicalSummary(detail)}</pre>
                  {t.alert === "red" && !lead.phone && (
                    <>
                      <p className="su-agent-muted" style={{ margin: "12px 0 0" }}>
                        No phone – customer template (German) asking for the phone number:
                      </p>
                      <div className="su-agent-template" lang="de" data-testid="phone-template">
                        {phoneTemplate(lead.first_name)}
                      </div>
                    </>
                  )}
                  {t.first_response_at ? (
                    <p className="su-agent-muted" style={{ marginTop: 12 }}>
                      Contacted: first response {dateTime(t.first_response_at)}
                      {t.assigned_agent ? ` · ${t.assigned_agent}` : ""}
                    </p>
                  ) : null}
                  <ContactedButton ticketId={t.id} />
                </>
              ) : (
                <>
                  {detail.draftAuditMissing && (
                    <p className="su-agent-error" role="alert" style={{ marginBottom: 12 }}>
                      {MIGRATION_002_MESSAGE}
                    </p>
                  )}
                  <DraftPanel ticketId={t.id} initial={draft} />
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
