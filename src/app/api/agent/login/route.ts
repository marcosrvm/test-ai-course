import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/agent/session";

export const runtime = "nodejs";

const GENERIC_ERROR = "Invalid name or password.";
const MAX_NAME = 60;

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest();
const delay = () => new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

export async function POST(request: Request) {
  const expected = process.env.AGENT_PASSWORD;
  if (!expected) return Response.json({ error: "Agent login is not configured." }, { status: 500 });

  let name = "";
  let password = "";
  try {
    const body = (await request.json()) as { name?: unknown; password?: unknown };
    name = typeof body.name === "string" ? body.name.trim() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    // Treated like a wrong password below.
  }

  // Constant-time comparison of equal-length digests.
  const ok = name.length > 0 && name.length <= MAX_NAME && timingSafeEqual(sha256(password), sha256(expected));
  if (!ok) {
    await delay();
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(name), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
