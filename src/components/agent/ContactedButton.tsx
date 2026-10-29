"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContactedButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markContacted = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/agent/tickets/${ticketId}/contacted`, { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError("Could not update the ticket.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="su-agent-actions">
      <button type="button" className="su-agent-btn" onClick={markContacted} disabled={busy}>
        {busy ? "Saving …" : "Mark as contacted (call / e-mail)"}
      </button>
      {error && <span className="su-agent-error">{error}</span>}
    </div>
  );
}
