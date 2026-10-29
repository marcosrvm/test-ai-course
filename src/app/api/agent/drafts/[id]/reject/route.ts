import { requireAgentApi } from "@/lib/agent/auth";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentApi();
  if (agent instanceof Response) return agent;
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Unknown draft" }, { status: 404 });

  const db = getSupabase();
  const { data: draft, error } = await db.from("ai_draft").select("approved").eq("id", id).maybeSingle();
  if (error) return Response.json({ error: "Database error" }, { status: 500 });
  if (!draft) return Response.json({ error: "Unknown draft" }, { status: 404 });
  if (draft.approved !== null) return Response.json({ error: "This draft was already handled" }, { status: 409 });

  const updated = await db.from("ai_draft").update({ approved: false, approved_by: agent.name }).eq("id", id);
  if (updated.error) return Response.json({ error: "Database error" }, { status: 500 });
  console.log(`agent: draft ${id} rejected`);
  return Response.json({ ok: true });
}
