import { requireAgentApi } from "@/lib/agent/auth";
import { CLOSED_STATUSES, type Status } from "@/lib/agent/data";
import { getSupabase } from "@/lib/db/supabase";
import { getCategory } from "@/lib/chatbot/taxonomy";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIORITIES = ["P1", "P2", "P3"];
const QUEUES = ["general", "senior", "dental"];
const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "closed"];

// The human decision: updates the ticket only. The ai_suggestion is never changed (traceability).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgentApi();
  if (agent instanceof Response) return agent;
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Unknown ticket" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const category = getCategory(String(body.category ?? ""));
  if (!category) return Response.json({ error: "Unknown category" }, { status: 400 });
  const subCategory = body.sub_category ? String(body.sub_category) : null;
  if (subCategory && !category.subcategories.some((s) => s.key === subCategory)) {
    return Response.json({ error: "Sub-category does not belong to the category" }, { status: 400 });
  }
  if (!PRIORITIES.includes(String(body.priority))) return Response.json({ error: "Invalid priority" }, { status: 400 });
  if (!QUEUES.includes(String(body.queue))) return Response.json({ error: "Invalid queue" }, { status: 400 });
  if (!STATUSES.includes(String(body.status))) return Response.json({ error: "Invalid status" }, { status: 400 });
  const assigned = typeof body.assigned_agent === "string" ? body.assigned_agent.trim().slice(0, 60) : "";
  const status = body.status as Status;

  const db = getSupabase();
  const current = await db.from("ticket").select("resolved_at").eq("id", id).maybeSingle();
  if (current.error) return Response.json({ error: "Database error" }, { status: 500 });
  if (!current.data) return Response.json({ error: "Unknown ticket" }, { status: 404 });

  const closed = CLOSED_STATUSES.includes(status);
  const { error } = await db
    .from("ticket")
    .update({
      category: category.key,
      sub_category: subCategory,
      priority: body.priority,
      queue: body.queue,
      status,
      assigned_agent: assigned || null,
      // Resolved / closed → resolved_at (kept if already set); reopened → cleared.
      resolved_at: closed ? (current.data.resolved_at ?? new Date().toISOString()) : null,
    })
    .eq("id", id);
  if (error) return Response.json({ error: "Database error" }, { status: 500 });
  console.log(`agent: ticket ${id} updated`);
  return Response.json({ ok: true });
}
