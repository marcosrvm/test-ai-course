// Migration 002 (ai_draft.final_text, sent_at, source_chunk_ids) may not have been run yet.
// The agent view then keeps working and shows this message instead of crashing.

export const MIGRATION_002_MESSAGE =
  "Database update 002 has not been run yet: sent reply texts and their sources cannot be stored. Run supabase/migrations/002_draft_audit.sql in the Supabase SQL editor.";

// 42703 = Postgres "undefined column" (select); PGRST204 = PostgREST "column not in schema cache" (insert/update).
export const isMissingColumn = (error: { code?: string } | null | undefined) =>
  error?.code === "42703" || error?.code === "PGRST204";
