-- smileunion chatbot – audit trail for AI reply drafts.
-- Runs on the CURRENT database (after 001_init.sql). Adds three nullable columns to
-- ai_draft; existing rows are not changed (the new columns stay NULL for them).
-- Safe to run more than once ("if not exists").
--
--   final_text        the text the agent marked as sent, including the AI disclosure line
--                     (empty for rejected or pending drafts)
--   sent_at           when the agent clicked "Mark as sent"
--   source_chunk_ids  ids of the knowledge-base chunks the AI used, e.g. ["ratenzahlung-bedingungen"]
--
-- Security is unchanged: RLS stays on with no policies, and the existing table grants
-- (service_role only) cover the new columns.

alter table ai_draft add column if not exists final_text text;
alter table ai_draft add column if not exists sent_at timestamptz;
alter table ai_draft add column if not exists source_chunk_ids jsonb;
