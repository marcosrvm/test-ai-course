import { requireAgentApi } from "@/lib/agent/auth";
import { editPercentage } from "@/lib/agent/edit-distance";
import { isMissingColumn, MIGRATION_002_MESSAGE } from "@/lib/agent/schema";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEXT = 4000;
// EU AI Act transparency: added to every reply that was drafted with AI.
const AI_DISCLOSURE = "Diese Antwort wurde mit KI-Unterstützung erstellt und von unserem Team geprüft.";

// "Mark as sent" (prototype: no e-mail is sent).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentApi();
  if (agent instanceof Response) return agent;
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Unknown draft" }, { status: 404 });

  let text = "";
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!text || text.length > MAX_TEXT) return Response.json({ error: "Reply text is empty or too long" }, { status: 400 });

  const db = getSupabase();
  const { data: draft, error } = await db.from("ai_draft").select("ticket_id, draft_text, approved").eq("id", id).maybeSingle();
  if (error) return Response.json({ error: "Database error" }, { status: 500 });
  if (!draft) return Response.json({ error: "Unknown draft" }, { status: 404 });
  if (draft.approved !== null) return Response.json({ error: "This draft was already handled" }, { status: 409 });

  // Edit % compares the AI draft with the agent's text before the disclosure line.
  const edits = editPercentage(draft.draft_text, text);
  const finalText = `${text}\n\n${AI_DISCLOSURE}`;

  // One update: if the 002 columns are missing, nothing is changed.
  const updated = await db
    .from("ai_draft")
    .update({ approved: true, approved_by: agent.name, edit_percentage: edits, final_text: finalText, sent_at: new Date().toISOString() })
    .eq("id", id);
  if (isMissingColumn(updated.error)) return Response.json({ error: MIGRATION_002_MESSAGE }, { status: 503 });
  if (updated.error) return Response.json({ error: "Database error" }, { status: 500 });

  const { data: ticket } = await db.from("ticket").select("first_response_at").eq("id", draft.ticket_id).single();
  const ticketUpdate = await db
    .from("ticket")
    .update({ first_response_at: ticket?.first_response_at ?? new Date().toISOString(), status: "waiting_customer" })
    .eq("id", draft.ticket_id);
  if (ticketUpdate.error) return Response.json({ error: "Database error" }, { status: 500 });

  console.log(`agent: draft ${id} sent for ticket ${draft.ticket_id}`);
  return Response.json({ ok: true, finalText, editPercentage: edits });
}
