# smileunion – website redesign & AI customer service chatbot

Student project for the course **Business AI for Marketing and Sales** (University of Mannheim, Fall 2026).
Not affiliated with smileunion GmbH. Not the official website. All data is synthetic. Brand names, logos, seals and images belong to their respective owners and are used for educational purposes only.

**Live demo:** https://smileunion-redesign-student.vercel.app

Group case study on how a German direct-to-consumer clear-aligner company can use AI in marketing, sales and customer service.

## What's inside

| Part | Description |
|---|---|
| Website redesign (`/v2`) | Desktop-first redesign: centred logo, one "Menü" drop-down, one main call to action, consistent prices and financing. Also includes So funktioniert's, Preise and Abdruckbox with the same navigation. |
| Suitability quiz (`/v2/bin-ich-geeignet`) | 6 questions → result (suitable / strong crowding / retainer). The "Noch Fragen?" form at the end creates a real ticket with the quiz answers attached. |
| AI chatbot | On every v2 page. Answers only from verified website content, cites its sources, routes health questions to the dentist team and hands over to a human with a classified ticket. |
| Agent view (`/v2/agent`) | Password-protected inbox for the team: red alerts on top, KPIs, AI suggestion next to the human decision, AI reply drafts with a confidence tag. |

## The chatbot

**Principle:** the CRM is the foundation, AI is a layer on top. Critical rules live in code. The AI only writes the answer.

```
Question → medical guard (code) → cache → retrieval (BM25) → LLM (Gemini) → answer + sources
                                                              ↓
                                     handover → lead + consent + classified ticket → agent view
```


- **RAG:** verified chunks from the public website smileunion.de (`src/lib/chatbot/knowledge-base.json`), plus one smileunion.eu chunk on Klarna/Splitit instalments that is only used for Klarna, Splitit or 36-month questions (smileunion.eu was otherwise used only for the .de vs .eu comparison). BM25 search (MiniSearch) with a German stemmer and synonyms; top 3 chunks above a score threshold.
- **Languages:** German, English and Spanish. English and Spanish questions that find nothing are translated to German once and searched again. All chat answers, including the dentist replies, follow the language of the customer's last message; fixed UI texts stay German.
- **Grounded answers:** every fact must come from the retrieved chunks; no general knowledge. If nothing relevant is found, the bot says so and offers a human.
- **Medical guard (in code, before the AI):** any health question goes to the dentist team, in German, English or Spanish. Urgent cases (bleeding, swelling, severe pain, broken tooth) create an internal red alert. The bot never gives medical advice and never says whether someone is suitable.
- **Transparency:** AI disclosure in the welcome message (EU AI Act); a "talk to a human" option is always visible.

## Human handover and data model

- **Two entry points:** the chatbot ("Mit einem Menschen sprechen" / "Rückruf anfordern") and the quiz form ("Noch Fragen?"). Both use the same path: `/api/handover` → `classify.ts` → `createTicket.ts`.
- **One lead, many tickets:** the e-mail is unique (not the primary key). A returning customer is matched by e-mail and gets a new ticket on the same lead; existing data is never overwritten. The agent sees the customer's other tickets.
- **Consent:** contact consent is required. Marketing consent is optional and stored as not yet confirmed (double opt-in not sent in the prototype).
- **Classification:** category, priority and queue from the taxonomy. The quiz answers are never sent to the AI; they are used only for rules and shown to the agent.
- **Protection:** rate limits on chat and handover, a honeypot field against spam, keys only on the server, row-level security in the database.
- **Swappable parts:** knowledge source (`loadKnowledge()`), LLM provider (`CHAT_PROVIDER`) and ticket storage (`createTicket()`, the swap point for a real CRM such as HubSpot or Salesforce).

## Testing

Scenario tests and an evaluation set (`npm run eval`): pricing, eligibility, financing, delivery, medical, urgent, follow-ups, off-topic, in German, English and Spanish.
Last run: **33/33 chat scenarios**, **100 % medical recall**, **0 % false positives**, **84 % retrieval**. See `docs/evaluation-results.md`.

**Finding along the way:** the original website contradicts itself in several places (prices, interest rates, financing, guarantee conditions, care instructions). See `docs/knowledge-base-review.md`.

## How it was built

Built with Claude Code in VS Code. Every session followed the project rules in `CLAUDE.md` (scope, data rules, what never to do). Later changes went through a branch, the evaluation gates and a Vercel preview before being merged into `main`.

## Tech stack

Next.js 16 · TypeScript · MiniSearch (BM25) · Google Gemini API · Supabase (Postgres, EU) · Vercel

## Run locally

```bash
npm install
cp .env.example .env.local   # add your keys (see .env.example)
npm run dev
```

Then open http://localhost:3000.

## Deploy

Deployed on Vercel from `main` (every push triggers a new deployment). Other branches get preview deployments.
In production, `/` redirects to `/v2` and `/bin-ich-geeignet` redirects to `/v2/bin-ich-geeignet` (temporary 307 redirects, see `next.config.ts`).
The redesign is desktop-first: `HeaderV2` is used from 1200px up. Below that, the original mobile header and layout are kept, with a slim student-project notice on top.
All pages are `noindex, nofollow`, and `robots.txt` disallows everything.
API keys are Vercel environment variables and are only used on the server.
