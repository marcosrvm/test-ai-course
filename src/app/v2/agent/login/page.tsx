import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/agent/LoginForm";
import { getAgent } from "@/lib/agent/auth";

export const metadata: Metadata = { title: "Login" };

// Public (excluded in proxy.ts). Already signed in → straight to the ticket list.
export default async function AgentLoginPage() {
  if (await getAgent()) redirect("/v2/agent");
  return (
    <main className="su-agent-main">
      <LoginForm />
    </main>
  );
}
