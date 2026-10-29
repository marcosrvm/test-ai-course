# smileunion – website redesign & AI customer service chatbot

> **Student project** for the course *Business AI for Marketing and Sales* (University of Mannheim, Fall 2026).
> **Not affiliated with smileunion GmbH.** Not the official website. All data is synthetic.
> Brand names, logos, seals and images belong to their respective owners and are used for educational purposes only.

**Live demo:** https://smileunion-redesign-student.vercel.app

Group case study on how a German direct-to-consumer clear-aligner company can use AI in marketing, sales and customer service.

---

## What's inside

| Part | Description |
|---|---|
| **Website redesign** (`/v2`) | Desktop-first redesign of the homepage: clearer hero, one main call to action |
| **Suitability quiz** (`/v2/bin-ich-geeignet`) | 6 questions → result (suitable / strong crowding / retainer), with hidden fields for the CRM |
| **AI chatbot** | Answers customer questions only from verified website content, cites its sources, routes health questions to the dentist team and hands over to a human with a classified ticket |
| **Agent view** | Where the team sees the tickets: red alerts on top, AI suggestion next to the human decision |

## The chatbot

**Principle: the CRM is the foundation, AI is a layer on top.** Critical rules live in code. The AI only writes the answer.

```
Question → medical guard (code) → cache → retrieval (BM25) → LLM (Gemini) → answer + sources
                                                              ↓
                                     handover → lead + consent + classified ticket → agent view
```

- **RAG:** verified chunks from the public website (`src/lib/chatbot/knowledge-base.json`). BM25 search (MiniSearch) with a German stemmer and synonyms; top 3 chunks above a score threshold.
- **Grounded answers:** the LLM answers only from the retrieved chunks and returns JSON (`answered`, `answer`, `used_ids`). If nothing relevant is found, the AI is not called and the bot offers a human.
- **Medical guard (in code, before the AI):** any health question goes to the dentist team. Urgent cases (bleeding, swelling, severe pain, broken tooth) create an internal red alert. The bot never gives medical advice and never says whether someone is suitable.
- **Human handover:** the customer leaves a phone number or e-mail with consent; a ticket is created with category, priority and queue from the taxonomy. The AI suggestion is stored next to the final human decision.
- **Transparency:** AI disclosure in the welcome message (EU AI Act); a "talk to a human" option is always visible.
- **Swappable parts:** knowledge source (`loadKnowledge()`), LLM provider (`CHAT_PROVIDER`) and ticket storage (`createTicket()`).
- **Tested** with scenario tests and an evaluation set (pricing, eligibility, medical, urgent, follow-ups, off-topic).

Finding along the way: the original website contradicts itself in 9 places (prices, interest rates, guarantee conditions, care instructions). See `docs/knowledge-base-review.md`.

## Tech stack

Next.js 16 · TypeScript · MiniSearch (BM25) · Google Gemini API · Supabase (Postgres) · Vercel

## Run locally

```bash
npm install
cp .env.example .env.local   # add your keys (see .env.example)
npm run dev
```

Then open http://localhost:3000.

## Deploy

- Deployed on Vercel from `main` (every push triggers a new deployment). Other branches get preview deployments.
- In production, `/` redirects to `/v2` and `/bin-ich-geeignet` redirects to `/v2/bin-ich-geeignet` (temporary 307 redirects, see `next.config.ts`).
- The redesign is desktop-first: `HeaderV2` is used from 1200px up. Below that, the original mobile header and layout are kept, with a slim student-project notice on top.
- All pages are `noindex, nofollow`, and `robots.txt` disallows everything.
- API keys are Vercel environment variables and are only used on the server.
