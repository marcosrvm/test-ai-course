"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type CategoryOption = { key: string; label: string; subcategories: { key: string; label: string }[] };

type Values = {
  category: string;
  sub_category: string;
  priority: string;
  queue: string;
  status: string;
  assigned_agent: string;
};

const PRIORITIES = ["P1", "P2", "P3"];
const QUEUES = ["general", "senior", "dental"];
const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "closed"];

// The human decision. Saving updates the ticket only – the AI suggestion stays unchanged.
export function TicketDecisionForm({
  ticketId,
  initial,
  categories,
}: {
  ticketId: string;
  initial: Values;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const subcategories = categories.find((c) => c.key === values.category)?.subcategories ?? [];

  const set = (field: keyof Values, value: string) => {
    setMessage(null);
    setValues((current) =>
      field === "category" ? { ...current, category: value, sub_category: "" } : { ...current, [field]: value },
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/agent/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(response.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error ?? "Saving failed." });
      if (response.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "Saving failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="su-agent-form" onSubmit={onSubmit} aria-label="Human decision">
      <label>
        Category
        <select name="category" value={values.category} onChange={(e) => set("category", e.target.value)} required>
          {!values.category && <option value="">Unclassified – choose …</option>}
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sub-category
        <select name="sub_category" value={values.sub_category} onChange={(e) => set("sub_category", e.target.value)}>
          <option value="">–</option>
          {subcategories.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select name="priority" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Queue
        <select name="queue" value={values.queue} onChange={(e) => set("queue", e.target.value)}>
          {QUEUES.map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" value={values.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Assigned agent
        <input name="assigned_agent" maxLength={60} value={values.assigned_agent} onChange={(e) => set("assigned_agent", e.target.value)} />
      </label>
      <div className="su-agent-form-actions">
        <button type="submit" className="su-agent-btn" disabled={busy || !values.category}>
          {busy ? "Saving …" : "Save decision"}
        </button>
        {message && (
          <span className={message.ok ? "su-agent-muted" : "su-agent-error"} role="status">
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
