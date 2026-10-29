"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AgentBar({ agentName }: { agentName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await fetch("/api/agent/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/v2/agent/login");
    router.refresh();
  };

  return (
    <header className="su-agent-bar">
      <Link href="/v2/agent" className="su-agent-brand">
        smileunion <span>· Agent view (prototype)</span>
      </Link>
      <div className="su-agent-user">
        <span>
          Signed in as <strong>{agentName}</strong>
        </span>
        <button type="button" className="su-agent-btn su-agent-btn-secondary" onClick={logout} disabled={busy}>
          Log out
        </button>
      </div>
    </header>
  );
}
