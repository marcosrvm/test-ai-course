import "server-only";
import { getSupabase } from "@/lib/db/supabase";
import { isMissingColumn } from "./schema";

// Read access for the agent view (server only). Writes live in the /api/agent routes.

export type Priority = "P1" | "P2" | "P3";
export type Queue = "general" | "senior" | "dental";
export type Status = "new" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export const OPEN_STATUSES: Status[] = ["new", "in_progress", "waiting_customer"];
export const CLOSED_STATUSES: Status[] = ["resolved", "closed"];

export type Lead = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  entry_path: string | null;
  funnel_stage: string | null;
};

export type Ticket = {
  id: string;
  lead_id: string;
  quiz_response_id: string | null;
  channel: string | null;
  message: string | null;
  category: string | null;
  sub_category: string | null;
  priority: Priority;
  queue: Queue;
  automation_level: string | null;
  status: Status;
  alert: "none" | "red";
  summary: string | null;
  assigned_agent: string | null;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
};

export type TicketListRow = Ticket & { lead: Pick<Lead, "first_name" | "last_name" | "email" | "phone"> | null };

export type AiSuggestion = {
  ai_category: string | null;
  ai_sub_category: string | null;
  ai_priority: Priority | null;
  ai_queue: Queue | null;
  ai_sentiment: string | null;
  ai_summary: string | null;
  confidence: number | null;
};

export type AiDraft = {
  id: string;
  draft_text: string;
  confidence: number | null;
  approved: boolean | null;
  approved_by: string | null;
  edit_percentage: number | null;
  created_at: string;
  // Migration 002 – absent until it has been run.
  final_text?: string | null;
  sent_at?: string | null;
  source_chunk_ids?: unknown;
};

export type QuizResponse = {
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  q6: string | null;
  result_type: string | null;
};

export type ChatTurn = { role: string; content: string };

function must<T>(step: string, result: { data: T | null; error: { message?: string } | null }): T {
  if (result.error) throw new Error(`Agent data: ${step} failed`);
  return result.data as T;
}

// "First Last (Demo)" – the seed marks demo people in the first name ("Julia (Demo)").
// Without a name: the e-mail, then the phone.
export const customerName = (lead: Pick<Lead, "first_name" | "last_name" | "email" | "phone"> | null) => {
  const parts = [lead?.first_name, lead?.last_name].filter((p): p is string => !!p?.trim());
  const demo = parts.some((p) => /(Demo)/.test(p));
  const name = parts.map((p) => p.replace(/s*(Demo)s*/g, " ").trim()).filter(Boolean).join(" ");
  if (name) return demo ? `${name} (Demo)` : name;
  return lead?.email || lead?.phone || "Unknown";
};

export const isClinical = (t: Pick<Ticket, "category" | "automation_level">) =>
  t.category === "8_medical" || t.automation_level === "dentist_handover";

const PRIORITY_ORDER: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 };

// Red alerts first, then P1 → P3, then newest first.
export const sortTickets = <T extends Pick<Ticket, "alert" | "priority" | "created_at">>(rows: T[]) =>
  [...rows].sort(
    (a, b) =>
      Number(b.alert === "red") - Number(a.alert === "red") ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.created_at.localeCompare(a.created_at),
  );

export async function listTickets(filter: { queue: Queue | "all"; status: "open" | "closed" | "all" }) {
  let query = getSupabase().from("ticket").select("*, lead(first_name, last_name, email, phone)");
  if (filter.queue !== "all") query = query.eq("queue", filter.queue);
  if (filter.status === "open") query = query.in("status", OPEN_STATUSES);
  if (filter.status === "closed") query = query.in("status", CLOSED_STATUSES);
  return sortTickets(must<TicketListRow[]>("list tickets", await query));
}

export type Kpis = {
  openTickets: number;
  openRedAlerts: number;
  avgFirstResponseMs: number | null;
  avgResolutionMs: number | null;
  aiAgreement: number | null; // 0–1
  aiCompared: number;
  draftAcceptance: number | null; // 0–1
  drafts: number;
  avgEditPercentage: number | null;
  escalations: number;
};

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export async function getKpis(): Promise<Kpis> {
  const db = getSupabase();
  const [tickets, suggestions, drafts, escalations] = await Promise.all([
    db.from("ticket").select("id, status, alert, category, created_at, first_response_at, resolved_at"),
    db.from("ai_suggestion").select("ticket_id, ai_category"),
    db.from("ai_draft").select("approved, edit_percentage"),
    db.from("chat_conversation").select("*", { count: "exact", head: true }).eq("escalated_to_human", true),
  ]);
  const t = must<Pick<Ticket, "id" | "status" | "alert" | "category" | "created_at" | "first_response_at" | "resolved_at">[]>("kpi tickets", tickets);
  const s = must<{ ticket_id: string; ai_category: string | null }[]>("kpi suggestions", suggestions);
  const d = must<{ approved: boolean | null; edit_percentage: number | null }[]>("kpi drafts", drafts);
  if (escalations.error) throw new Error("Agent data: kpi escalations failed");

  const open = t.filter((x) => OPEN_STATUSES.includes(x.status));
  const span = (from: string, to: string) => new Date(to).getTime() - new Date(from).getTime();
  const categoryById = new Map(t.map((x) => [x.id, x.category]));
  const compared = s.filter((x) => categoryById.has(x.ticket_id));
  const edits = d.filter((x) => x.approved === true && x.edit_percentage !== null).map((x) => Number(x.edit_percentage));

  return {
    openTickets: open.length,
    openRedAlerts: open.filter((x) => x.alert === "red").length,
    avgFirstResponseMs: average(t.filter((x) => x.first_response_at).map((x) => span(x.created_at, x.first_response_at!))),
    avgResolutionMs: average(t.filter((x) => x.resolved_at).map((x) => span(x.created_at, x.resolved_at!))),
    aiAgreement: compared.length ? compared.filter((x) => x.ai_category === categoryById.get(x.ticket_id)).length / compared.length : null,
    aiCompared: compared.length,
    draftAcceptance: d.length ? d.filter((x) => x.approved === true).length / d.length : null,
    drafts: d.length,
    avgEditPercentage: average(edits),
    escalations: escalations.count ?? 0,
  };
}

export type TicketDetail = {
  ticket: Ticket;
  lead: Lead;
  leadTickets: Pick<Ticket, "id" | "category" | "status" | "created_at">[];
  conversation: ChatTurn[] | null;
  suggestion: AiSuggestion | null;
  draft: AiDraft | null;
  // true when migration 002 has not been run (no audit columns on ai_draft yet).
  draftAuditMissing: boolean;
  quiz: QuizResponse | null;
};

const DRAFT_COLUMNS = "id, draft_text, confidence, approved, approved_by, edit_percentage, created_at";

async function latestDraft(ticketId: string): Promise<{ draft: AiDraft | null; auditMissing: boolean }> {
  const query = (columns: string) =>
    getSupabase().from("ai_draft").select(columns).eq("ticket_id", ticketId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const full = await query(`${DRAFT_COLUMNS}, final_text, sent_at, source_chunk_ids`);
  if (!isMissingColumn(full.error)) return { draft: must<AiDraft | null>("draft", full as never), auditMissing: false };
  return { draft: must<AiDraft | null>("draft", (await query(DRAFT_COLUMNS)) as never), auditMissing: true };
}

export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  const db = getSupabase();
  const ticket = must<Ticket | null>("ticket", await db.from("ticket").select("*").eq("id", id).maybeSingle());
  if (!ticket) return null;

  const [lead, leadTickets, conversation, suggestion, draft, quiz] = await Promise.all([
    db.from("lead").select("id, email, phone, first_name, last_name, entry_path, funnel_stage").eq("id", ticket.lead_id).single(),
    db.from("ticket").select("id, category, status, created_at").eq("lead_id", ticket.lead_id).order("created_at", { ascending: false }),
    db.from("chat_conversation").select("messages").eq("ticket_id", id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("ai_suggestion").select("ai_category, ai_sub_category, ai_priority, ai_queue, ai_sentiment, ai_summary, confidence").eq("ticket_id", id).maybeSingle(),
    latestDraft(id),
    ticket.quiz_response_id
      ? db.from("quiz_response").select("q1, q2, q3, q4, q5, q6, result_type").eq("id", ticket.quiz_response_id).maybeSingle()
      : db.from("quiz_response").select("q1, q2, q3, q4, q5, q6, result_type").eq("lead_id", ticket.lead_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const messages = must<{ messages: unknown } | null>("conversation", conversation)?.messages;
  return {
    ticket,
    lead: must<Lead>("lead", lead),
    leadTickets: must("lead tickets", leadTickets) ?? [],
    conversation: Array.isArray(messages) ? (messages as ChatTurn[]) : null,
    suggestion: must<AiSuggestion | null>("suggestion", suggestion),
    draft: draft.draft,
    draftAuditMissing: draft.auditMissing,
    quiz: must<QuizResponse | null>("quiz", quiz),
  };
}

// Customer messages of a ticket: the chat conversation, or the ticket message.
export const customerMessages = (detail: Pick<TicketDetail, "ticket" | "conversation">) =>
  detail.conversation
    ? detail.conversation.filter((m) => m.role === "user").map((m) => m.content)
    : [detail.ticket.message ?? ""].filter(Boolean);
