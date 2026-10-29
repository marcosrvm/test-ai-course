"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Source = { title: string; url: string };
export type DraftView = {
  id: string;
  text: string;
  confidence: number;
  approved: boolean | null;
  approvedBy: string | null;
  editPercentage: number | null;
  sources: Source[];
};

const VERIFIED = 0.85; // Po's QA guardrail

function ConfidenceTag({ confidence }: { confidence: number }) {
  const verified = confidence >= VERIFIED;
  return (
    <span className={`su-agent-badge ${verified ? "su-agent-badge-verified" : "su-agent-badge-verify"}`}>
      {verified ? "Verified by KB" : "Needs verification"} · {Math.round(confidence * 100)} %
    </span>
  );
}

// AI reply draft (German, for the customer): generate → edit → mark as sent, or reject.
export function DraftPanel({ ticketId, initial }: { ticketId: string; initial: DraftView | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [text, setText] = useState(initial?.approved === null ? initial.text : "");
  const [sent, setSent] = useState<{ finalText: string; editPercentage: number } | null>(null);
  const [busy, setBusy] = useState<"generate" | "send" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = async (url: string, body?: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
    return data;
  };

  const generate = async () => {
    setBusy("generate");
    setError(null);
    setSent(null);
    try {
      const data = (await call(`/api/agent/tickets/${ticketId}/draft`)) as { id: string; text: string; confidence: number; sources: Source[] };
      setDraft({ id: data.id, text: data.text, confidence: data.confidence, approved: null, approvedBy: null, editPercentage: null, sources: data.sources });
      setText(data.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const markSent = async () => {
    if (!draft) return;
    setBusy("send");
    setError(null);
    try {
      const data = (await call(`/api/agent/drafts/${draft.id}/send`, { text })) as { finalText: string; editPercentage: number };
      setSent(data);
      setDraft({ ...draft, approved: true, editPercentage: data.editPercentage });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!draft) return;
    setBusy("reject");
    setError(null);
    try {
      await call(`/api/agent/drafts/${draft.id}/reject`);
      setDraft({ ...draft, approved: false });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pending = draft && draft.approved === null;

  return (
    <div className="su-agent-draft">
      {error && (
        <p className="su-agent-error" role="alert">
          {error}
        </p>
      )}

      {sent && (
        <>
          <p>
            <strong>Marked as sent</strong> <span className="su-agent-muted">(prototype – no e-mail is sent) · edit {sent.editPercentage} %</span>
          </p>
          <pre className="su-agent-pre" data-testid="final-text">{sent.finalText}</pre>
        </>
      )}

      {!sent && draft?.approved === true && (
        <p className="su-agent-muted">
          Last AI draft sent by {draft.approvedBy ?? "an agent"} · edit {draft.editPercentage ?? "–"} %. The sent text is not stored in the prototype.
        </p>
      )}
      {draft?.approved === false && <p className="su-agent-muted">Last AI draft was rejected.</p>}

      {pending && (
        <>
          <div className="su-agent-actions" style={{ marginTop: 0, marginBottom: 8 }}>
            <ConfidenceTag confidence={draft.confidence} />
            <span className="su-agent-muted">AI draft (German, for the customer) – edit before sending</span>
          </div>
          <textarea className="su-agent-textarea" aria-label="Reply draft" value={text} onChange={(e) => setText(e.target.value)} />
          {draft.sources.length > 0 ? (
            <>
              <p className="su-agent-muted" style={{ margin: "8px 0 0" }}>Knowledge-base sources:</p>
              <ul className="su-agent-sources">
                {draft.sources.map((s) => (
                  <li key={s.title}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="su-agent-muted">No matching knowledge-base chunk – holding reply only.</p>
          )}
          <div className="su-agent-actions">
            <button type="button" className="su-agent-btn" onClick={markSent} disabled={busy !== null || !text.trim()}>
              {busy === "send" ? "Saving …" : "Mark as sent"}
            </button>
            <button type="button" className="su-agent-btn su-agent-btn-secondary" onClick={reject} disabled={busy !== null}>
              {busy === "reject" ? "Saving …" : "Reject draft"}
            </button>
            <span className="su-agent-muted">The AI disclosure line is added automatically.</span>
          </div>
        </>
      )}

      {!pending && (
        <div className="su-agent-actions">
          <button type="button" className="su-agent-btn" onClick={generate} disabled={busy !== null}>
            {busy === "generate" ? "Generating …" : draft ? "Generate new AI draft" : "Generate AI draft"}
          </button>
        </div>
      )}
    </div>
  );
}
