"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/agent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        setPassword("");
        return;
      }
      router.replace("/v2/agent");
      router.refresh();
    } catch {
      setError("Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="su-agent-login su-agent-card" onSubmit={onSubmit}>
      <h1>Agent login</h1>
      <p className="su-agent-muted">Internal area of the smileunion student prototype.</p>
      {error && (
        <p className="su-agent-error" role="alert">
          {error}
        </p>
      )}
      <label>
        Agent name
        <input name="name" autoComplete="username" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" className="su-agent-btn" disabled={busy}>
        {busy ? "Signing in …" : "Sign in"}
      </button>
    </form>
  );
}
