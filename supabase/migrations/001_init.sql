-- smileunion chatbot – database schema, layers 1 (CRM core) and 2 (AI layer).
-- Source of truth: docs/data-model.dbml (layer 3 is not created yet).
--
-- Run ONCE on an EMPTY Supabase project (SQL editor → paste → Run).
-- It is not idempotent: running it a second time fails because the types and tables already exist.
--
-- Conventions:
--   * ids: uuid default gen_random_uuid()
--   * timestamps: timestamptz. Creation timestamps (created_at, started_at, given_at,
--     updated_at) default to now(). Event timestamps that are empty until something
--     happens (first_response_at, resolved_at, withdrawn_at, quiz_completed_at) have no
--     default – otherwise a new ticket would look already answered/resolved.

-- ---------- Enums ----------
create type entry_path as enum (
  'quiz_form', 'direct_kit', 'direct_appointment', 'newsletter', 'contact_page',
  'phone', 'whatsapp', 'social_dm', 'practice_referral',
  'chatbot', 'email'  -- prototype additions
);
create type funnel_stage as enum ('lead', 'kit_or_appointment', 'plan_sent', 'customer', 'in_treatment', 'completed', 'lost');
create type identity_level as enum ('contactable', 'identified', 'customer');
create type follow_up_status as enum ('none', 'single_email', 'sequence');
create type result_type as enum ('retainer', 'strong_crowding', 'suitable');
create type consent_type as enum ('contact_request', 'marketing');
create type ticket_priority as enum ('P1', 'P2', 'P3');
create type ticket_queue as enum ('general', 'senior', 'dental');
create type ticket_status as enum ('new', 'in_progress', 'waiting_customer', 'resolved', 'closed');
create type automation_level as enum ('zero_touch', 'ai_draft_approval', 'dentist_handover', 'manual');
create type ticket_alert as enum ('none', 'red');  -- prototype addition: red = urgent medical, internal only

-- ---------- Layer 1 – CRM core (works without AI) ----------

-- Created before web_session because web_session.lead_id references it.
create table lead (
  id uuid primary key default gen_random_uuid(),
  email varchar unique,
  phone varchar unique,
  first_name varchar,
  last_name varchar,
  entry_path entry_path,
  funnel_stage funnel_stage,
  identity_level identity_level,
  follow_up_status follow_up_status,
  created_at timestamptz default now(),
  -- DBML note: at least one of email / phone required.
  constraint lead_email_or_phone check (email is not null or phone is not null)
);

-- Anonymous visit. No personal data. Requires cookie consent.
create table web_session (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  entry_page varchar,
  quiz_started boolean,
  quiz_last_step varchar,
  quiz_completed boolean,
  quiz_completed_at timestamptz,
  lead_id uuid references lead (id)  -- empty until contact data or purchase
);

-- Health data – separate table, restricted access. Saved only once contact data is left.
create table quiz_response (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead (id),
  session_id uuid references web_session (id),
  q1 varchar,
  q2 varchar,
  q3 varchar,
  q4 varchar,
  q5 varchar,
  q6 varchar,
  result_type result_type,
  created_at timestamptz default now()
);

-- Checked before any message is sent.
create table consent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead (id),
  type consent_type,
  given_at timestamptz default now(),
  double_opt_in_confirmed boolean,
  withdrawn_at timestamptz
);

-- Created only when there is a question. Final values chosen by rules or agent.
create table ticket (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead (id),
  quiz_response_id uuid references quiz_response (id),
  channel entry_path,
  message text,
  -- Taxonomy category keys, written out: SQL cannot read src/lib/chatbot/taxonomy.json.
  category varchar check (category in (
    '1_pre_purchase', '2_kit_appointment', '3_treatment_plan', '4_payment',
    '5_shipping', '6_aligner_fit', '7_complaints', '8_medical'
  )),
  sub_category varchar,
  priority ticket_priority,
  queue ticket_queue,
  automation_level automation_level,
  status ticket_status default 'new',
  alert ticket_alert default 'none',  -- prototype addition
  summary text,                       -- prototype addition
  assigned_agent varchar,
  created_at timestamptz default now(),
  first_response_at timestamptz,
  resolved_at timestamptz
);

-- Agent view: open tickets by status and priority, newest first; red alerts on top.
create index ticket_status_priority_created_idx on ticket (status, priority, created_at);
create index ticket_alert_idx on ticket (alert);

-- Verified FAQ, prices and policies. Only source the AI may use.
-- (Empty for now: the chatbot reads src/lib/chatbot/knowledge-base.json via loadKnowledge().)
create table knowledge_article (
  id uuid primary key default gen_random_uuid(),
  title varchar,
  content text,
  category varchar,
  verified boolean,
  updated_at timestamptz default now()
);

-- ---------- Layer 2 – AI layer (suggests, never replaces) ----------

-- AI suggestion kept next to the final ticket values (traceability).
create table ai_suggestion (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references ticket (id),
  ai_category varchar,
  ai_sub_category varchar,   -- prototype addition
  ai_priority ticket_priority,
  ai_queue ticket_queue,     -- prototype addition
  ai_sentiment varchar,
  ai_summary text,
  confidence numeric,
  created_at timestamptz default now()
);

create table ai_draft (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references ticket (id),
  draft_text text,
  confidence numeric,
  approved boolean,
  approved_by varchar,
  edit_percentage numeric,
  created_at timestamptz default now()
);

-- Which knowledge articles the AI used for each draft.
create table ai_draft_source (
  draft_id uuid not null references ai_draft (id),
  article_id uuid not null references knowledge_article (id),
  primary key (draft_id, article_id)
);

create table chat_conversation (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead (id),
  session_id uuid references web_session (id),
  channel varchar,           -- website / whatsapp
  messages jsonb,            -- prototype change: jsonb instead of text, [{ "role", "content" }]
  topics varchar,
  escalated_to_human boolean,
  ticket_id uuid references ticket (id),  -- created if the bot cannot or must not answer
  ai_disclosure_shown boolean,
  started_at timestamptz default now()
);

-- ---------- Security ----------
-- The project was created with "automatically expose new tables" turned OFF.
-- 1. Row Level Security is enabled on every table and NO policies are created:
--    for the anon and authenticated roles (the public API keys used in browsers)
--    every row is invisible and every write is rejected.
-- 2. All table privileges are revoked from anon and authenticated, so they cannot
--    even reach the tables.
-- 3. Only service_role gets usage on the schema and select/insert/update/delete.
--    service_role bypasses RLS and is used solely by our server with the secret key
--    (SUPABASE_SECRET_KEY, src/lib/db/supabase.ts – never sent to the browser).
-- Result: only the server with the secret key can read or write.

alter table web_session enable row level security;
alter table lead enable row level security;
alter table quiz_response enable row level security;
alter table consent enable row level security;
alter table ticket enable row level security;
alter table knowledge_article enable row level security;
alter table ai_suggestion enable row level security;
alter table ai_draft enable row level security;
alter table ai_draft_source enable row level security;
alter table chat_conversation enable row level security;

revoke all on table
  web_session, lead, quiz_response, consent, ticket, knowledge_article,
  ai_suggestion, ai_draft, ai_draft_source, chat_conversation
from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table
  web_session, lead, quiz_response, consent, ticket, knowledge_article,
  ai_suggestion, ai_draft, ai_draft_source, chat_conversation
to service_role;
