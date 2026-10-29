import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type AgentSession } from "./session";

// Second line of defence behind proxy.ts: every agent page and API re-checks the cookie.

export async function getAgent(): Promise<AgentSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

// Pages: redirect to the login page without a valid session.
export async function requireAgentPage(): Promise<AgentSession> {
  const agent = await getAgent();
  if (!agent) redirect("/v2/agent/login");
  return agent;
}

// APIs: the session, or a 401 response to return as is.
export async function requireAgentApi(): Promise<AgentSession | Response> {
  const agent = await getAgent();
  return agent ?? Response.json({ error: "Not logged in" }, { status: 401 });
}
