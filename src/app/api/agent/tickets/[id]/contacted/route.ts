import { requireAgentApi } from "@/lib/agent/auth";
import { isClinical } from "@/lib/agent/data";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Clinical tickets: the dentist team contacted the customer by phone or e-mail.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentApi();
  if (agent instanceof Response) return agent;
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Unknown ticket" }, { status: 404 });

  const db = getSupabase();
  const { data: ticket, error } = await db.from("ticket").select("category, automation_level, first_response_at").eq("id", id).maybeSingle();
  if (error) return Response.json({ error: "Database error" }, { status: 500 });
  if (!ticket) return Response.json({ error: "Unknown ticket" }, { status: 404 });
  if (!isClinical(ticket)) return Response.json({ error: "Not a clinical ticket" }, { status: 400 });

  const update = await db
    .from("ticket")
    .update({
      first_response_at: ticket.first_response_at ?? new Date().toISOString(),
      status: "in_progress",
      assigned_agent: agent.name,
    })
    .eq("id", id);
  if (update.error) return Response.json({ error: "Database error" }, { status: 500 });
  console.log(`agent: ticket ${id} marked as contacted`);
  return Response.json({ ok: true });
}
