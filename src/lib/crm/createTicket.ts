import type { ChatMessage } from "@/lib/chatbot/llm";
import type { AiSuggestion, FinalTicketValues, QuizContext } from "@/lib/chatbot/classify";
import { getSupabase } from "@/lib/db/supabase";

/*
 * The only place that writes handover data to the CRM.
 * Swap point: Supabase today, Salesforce / HubSpot in production – same input, same result.
 * Logs ids only, never contact data or message contents.
 */

export type Contact = { name?: string; email?: string; phone?: string };

export class CrmError extends Error {}

type Row = { id: string };

// Throws a CrmError naming the step; the database message is not passed on (it may contain values).
function check<T>(step: string, result: { data: T | null; error: { code?: string } | null }): T {
  if (result.error || result.data === null) {
    throw new CrmError(`CRM write failed at "${step}"${result.error?.code ? ` (code ${result.error.code})` : ""}`);
  }
  return result.data;
}

function splitName(name?: string): { first_name: string | null; last_name: string | null } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1] };
}

// Same e-mail or phone → same lead. If both match different leads, the e-mail match wins.
async function findOrCreateLead(contact: Contact): Promise<string> {
  const db = getSupabase();
  const email = contact.email?.trim().toLowerCase() || null;
  const phone = contact.phone?.trim().replace(/\s+/g, " ") || null;

  if (email) {
    const rows = check<Row[]>("find lead by e-mail", await db.from("lead").select("id").eq("email", email).limit(1));
    if (rows[0]) return rows[0].id;
  }
  if (phone) {
    const rows = check<Row[]>("find lead by phone", await db.from("lead").select("id").eq("phone", phone).limit(1));
    if (rows[0]) return rows[0].id;
  }

  const lead = check<Row>(
    "create lead",
    await db
      .from("lead")
      .insert({
        email,
        phone,
        ...splitName(contact.name),
        entry_path: "chatbot",
        funnel_stage: "lead",
        identity_level: "contactable",
        follow_up_status: "none",
      })
      .select("id")
      .single(),
  );
  return lead.id;
}

export async function createTicket({
  contact,
  messages,
  final,
  ai,
  quiz,
}: {
  contact: Contact;
  messages: ChatMessage[];
  final: FinalTicketValues;
  ai: AiSuggestion | null;
  quiz?: QuizContext | null;
}): Promise<{ ticketId: string }> {
  const db = getSupabase();
  const leadId = await findOrCreateLead(contact);

  check(
    "insert consent",
    await db
      .from("consent")
      .insert({ lead_id: leadId, type: "contact_request", given_at: new Date().toISOString(), double_opt_in_confirmed: false })
      .select("id")
      .single(),
  );

  let quizResponseId: string | null = null;
  if (quiz) {
    const row = check<Row>(
      "insert quiz_response",
      await db
        .from("quiz_response")
        .insert({
          lead_id: leadId,
          q1: quiz.q1 || null,
          q2: quiz.q2 || null,
          q3: quiz.q3 || null,
          q4: quiz.q4 || null,
          q5: quiz.q5 || null,
          q6: quiz.q6 || null,
          result_type: quiz.result_type,
        })
        .select("id")
        .single(),
    );
    quizResponseId = row.id;
  }

  const lastMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const ticket = check<Row>(
    "insert ticket",
    await db
      .from("ticket")
      .insert({
        lead_id: leadId,
        quiz_response_id: quizResponseId,
        channel: "chatbot",
        message: lastMessage,
        category: final.category,
        sub_category: final.sub_category,
        priority: final.priority,
        queue: final.queue,
        automation_level: final.automation_level,
        status: "new",
        alert: final.alert,
        summary: final.summary,
      })
      .select("id")
      .single(),
  );

  if (ai) {
    check(
      "insert ai_suggestion",
      await db
        .from("ai_suggestion")
        .insert({
          ticket_id: ticket.id,
          ai_category: ai.category,
          ai_sub_category: ai.sub_category,
          ai_priority: ai.priority,
          ai_queue: ai.queue,
          ai_sentiment: ai.sentiment,
          ai_summary: ai.summary,
          confidence: ai.confidence,
        })
        .select("id")
        .single(),
    );
  }

  check(
    "insert chat_conversation",
    await db
      .from("chat_conversation")
      .insert({
        lead_id: leadId,
        ticket_id: ticket.id,
        channel: "website",
        messages,
        topics: final.category,
        escalated_to_human: true,
        ai_disclosure_shown: true,
      })
      .select("id")
      .single(),
  );

  console.log(`crm: ticket ${ticket.id} created for lead ${leadId}`);
  return { ticketId: ticket.id };
}
