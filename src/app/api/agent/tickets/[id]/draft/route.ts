import { requireAgentApi } from "@/lib/agent/auth";
import { customerMessages, getTicketDetail, isClinical } from "@/lib/agent/data";
import { generateDraft } from "@/lib/agent/draft";
import { isMissingColumn, MIGRATION_002_MESSAGE } from "@/lib/agent/schema";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Generates and stores an AI reply draft (non-clinical tickets only).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentApi();
  if (agent instanceof Response) return agent;
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Unknown ticket" }, { status: 404 });

  let detail;
  try {
    detail = await getTicketDetail(id);
  } catch {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  if (!detail) return Response.json({ error: "Unknown ticket" }, { status: 404 });
  if (isClinical(detail.ticket)) {
    return Response.json({ error: "Clinical topics are handled by the dentist team – no AI reply" }, { status: 400 });
  }

  // Check for migration 002 before spending an LLM call.
  const probe = await getSupabase().from("ai_draft").select("source_chunk_ids").limit(1);
  if (isMissingColumn(probe.error)) return Response.json({ error: MIGRATION_002_MESSAGE }, { status: 503 });

  let draft;
  try {
    draft = await generateDraft({
      category: detail.ticket.category,
      firstName: detail.lead.first_name,
      customerMessages: customerMessages(detail),
    });
  } catch (error) {
    const status = (error as { status?: number }).status;
    console.error(`agent: draft generation failed${status ? ` (status ${status})` : ""}`);
    return Response.json({ error: "AI draft unavailable – please write the reply yourself." }, { status: 502 });
  }

  const { data, error } = await getSupabase()
    .from("ai_draft")
    .insert({ ticket_id: id, draft_text: draft.text, confidence: draft.confidence, source_chunk_ids: draft.sourceIds })
    .select("id")
    .single();
  if (isMissingColumn(error)) return Response.json({ error: MIGRATION_002_MESSAGE }, { status: 503 });
  if (error || !data) return Response.json({ error: "Database error" }, { status: 500 });
  console.log(`agent: draft ${data.id} created for ticket ${id}`);
  return Response.json({ id: data.id, text: draft.text, confidence: draft.confidence, sources: draft.sources });
}
