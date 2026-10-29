import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client with the secret key (bypasses Row Level Security).
// "server-only" makes the build fail if a client component imports this file,
// so the key can never reach the browser bundle. Never use a NEXT_PUBLIC_ variable here.

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const missing = [!url && "SUPABASE_URL", !secretKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Supabase is not configured: ${missing.join(" and ")} missing in .env.local (see .env.example).`);
  }
  client = createClient(url!, secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
