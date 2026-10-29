// Agent session cookie: "<payload>.<signature>", payload = base64url JSON { name, exp }.
// Signed with HMAC-SHA-256 (Web Crypto); the key is derived from AGENT_PASSWORD, so changing
// the password logs everyone out. Used by proxy.ts and by every agent page / API.
// No "server-only" import here: proxy.ts does not run in the React server layer.

export const SESSION_COOKIE = "su_agent";
export const SESSION_MAX_AGE = 8 * 60 * 60; // seconds

export type AgentSession = { name: string; exp: number };

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (text: string) => {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

async function signingKey(): Promise<CryptoKey | null> {
  const password = process.env.AGENT_PASSWORD;
  if (!password) return null;
  // Separate key material for signing: SHA-256 over a context label and the password.
  const material = await crypto.subtle.digest("SHA-256", encoder.encode(`smileunion-agent-session:${password}`));
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(name: string): Promise<string> {
  const key = await signingKey();
  if (!key) throw new Error("AGENT_PASSWORD is not set");
  const session: AgentSession = { name, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

// Returns the session if the signature is valid and it has not expired; otherwise null.
export async function verifySessionToken(token: string | undefined): Promise<AgentSession | null> {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const key = await signingKey();
  if (!key) return null;
  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AgentSession;
    if (typeof session.name !== "string" || typeof session.exp !== "number") return null;
    return session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
}
