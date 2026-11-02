## Project rules
Context: student project (University of Mannheim). Clone of smileunion.de with a redesign under /v2 and an AI chatbot (RAG + medical guard + human handover + agent view at /v2/agent). Key code: src/lib/chatbot/, src/lib/crm/, src/app/api/, src/app/v2/, supabase/. Data model: docs/data-model.dbml.
- Never work on `main` directly. Work on a feature branch, test on the Vercel preview, merge only when Marcos says so.
- Never print or commit .env.local. Keys are server-only (never NEXT_PUBLIC_). Never write keys or passwords in this file.
- Database changes: write a new file in supabase/migrations/; Marcos runs it manually in the Supabase SQL editor. Never assume it has been run until he confirms.
- Test data only with e-mails test-<x>@example.com; delete test rows after tests (never the seed rows marked "(Demo)").
- Chatbot: the medical guard always runs first; facts only from src/lib/chatbot/knowledge-base.json (German market). Facts only from smileunion.de, except ONE smileunion.eu financing chunk (Klarna/Splitit), retrieved only on Klarna/Splitit/36-month questions. smileunion.eu was used for analysis (.de vs .eu comparison), not as a general source. Never invent prices, dates or conditions.
- Language: fixed UI texts stay German; LLM answers should follow the customer's language; the internal agent view is in English.
- After any chatbot change: npm run eval (medical recall and false positives must not get worse) and npm run build must pass.
- Keep reports short.

@AGENTS.md
