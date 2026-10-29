// Prints the row count per table of the chatbot database (layers 1–2). Prints no secrets.
// Run: npm run db:check   (= node --env-file=.env.local scripts/db-check.mjs, Node >= 20.6)
// Creates its own client: src/lib/db/supabase.ts imports "server-only", which throws outside Next.js.
import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "web_session",
  "lead",
  "quiz_response",
  "consent",
  "ticket",
  "knowledge_article",
  "ai_suggestion",
  "ai_draft",
  "ai_draft_source",
  "chat_conversation",
];

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const missing = [!url && "SUPABASE_URL", !secretKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
if (missing.length > 0) {
  console.error(`Missing ${missing.join(" and ")} in .env.local (see .env.example).`);
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let failed = false;
for (const table of TABLES) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    failed = true;
    // Error code and message only (they contain no keys).
    console.log(`${table.padEnd(18)} ERROR ${error.code ?? ""} ${error.message ?? ""}`.trimEnd());
  } else {
    console.log(`${table.padEnd(18)} ${count}`);
  }
}
process.exit(failed ? 1 : 0);
