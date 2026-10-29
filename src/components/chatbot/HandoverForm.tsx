"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { readQuizContext } from "@/lib/chatbot/quiz-context";

export type HandoverMode = "team" | "dentist" | "callback";
export type ChatTurn = { role: "user" | "assistant"; content: string };

const MAX_CONCERN = 500;
const MAX_HISTORY = 20;

const copy = {
  intro: {
    team: "Hinterlass uns deine Kontaktdaten – unser Team meldet sich bei dir.",
    dentist: "Hinterlass uns deine Kontaktdaten – unser Zahnärzteteam meldet sich bei dir.",
    callback: "Hinterlass uns deine Telefonnummer – unser Zahnärzteteam ruft dich zurück.",
  },
  name: "Name (optional)",
  email: "E-Mail",
  phone: "Telefon",
  phoneRecommended: "Telefon (empfohlen)",
  concern: "Dein Anliegen",
  contactHint: "Bitte gib deine E-Mail-Adresse oder Telefonnummer an.",
  consent:
    "Ich bin einverstanden, dass smileunion meine Angaben und diesen Chatverlauf – auch Angaben zu meiner Gesundheit – speichert, um mich zu meiner Anfrage zu kontaktieren. Ich kann diese Einwilligung jederzeit widerrufen.",
  nudge: "Mit deiner Telefonnummer kann dich unser Zahnärzteteam schneller erreichen.",
  addPhone: "Nummer hinzufügen",
  sendWithoutPhone: "Ohne Nummer senden",
  send: "Anfrage senden",
  sending: "Wird gesendet …",
  cancel: "Abbrechen",
  error: "Das hat leider nicht geklappt. Bitte versuch es noch einmal.",
};

type Props = {
  mode: HandoverMode;
  // Real customer questions and API answers only (no welcome text, no client-side replies).
  history: ChatTurn[];
  // The last bot answer had the internal red alert → nudge for a phone number.
  urgent: boolean;
  onSuccess: (confirmation: string, ticketRef: string) => void;
  onCancel: () => void;
};

export function HandoverForm({ mode, history, urgent, onSuccess, onCancel }: Props) {
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [concern, setConcern] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactHint, setContactHint] = useState(false);
  const [nudge, setNudge] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  // Without a question so far, the customer writes the concern here.
  const needsConcern = !history.some((m) => m.role === "user");

  const noticeRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, [mode]);

  // Keep the nudge, hint or error visible inside the scrolling chat log.
  useEffect(() => {
    noticeRef.current?.querySelector("[role=alert]")?.scrollIntoView({ block: "nearest" });
  }, [nudge, contactHint, error]);

  const send = async () => {
    setNudge(false);
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { name: name.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined },
          consent,
          messages: needsConcern ? [{ role: "user", content: concern.trim() }] : history.slice(-MAX_HISTORY),
          // Read only now, with consent given.
          quiz: readQuizContext(),
          website,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; ticketRef?: string; confirmation?: string; error?: string };
      if (!response.ok || !data.ok || !data.ticketRef || !data.confirmation) {
        setError(data.error ?? copy.error);
        return;
      }
      onSuccess(data.confirmation, data.ticketRef);
    } catch {
      setError(copy.error);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!email.trim() && !phone.trim()) {
      setContactHint(true);
      return;
    }
    // Never blocks: the customer can always send without a number.
    if (urgent && !phone.trim()) {
      setNudge(true);
      return;
    }
    send();
  };

  const phoneField = (
    <label key="phone" className="su-chat-field">
      <span>{mode === "callback" ? copy.phoneRecommended : copy.phone}</span>
      <input
        ref={mode === "callback" ? firstRef : phoneRef}
        type="tel"
        name="phone"
        autoComplete="tel"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          setContactHint(false);
          setNudge(false);
        }}
        maxLength={30}
      />
    </label>
  );
  const emailField = (
    <label key="email" className="su-chat-field">
      <span>{copy.email}</span>
      <input
        ref={mode === "callback" ? undefined : firstRef}
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setContactHint(false);
        }}
        maxLength={254}
      />
    </label>
  );

  return (
    <form ref={noticeRef} className="su-chat-handover" onSubmit={onSubmit} aria-labelledby={`${id}-intro`}>
      <p id={`${id}-intro`} className="su-chat-handover-intro">
        {copy.intro[mode]}
      </p>
      {error && (
        <p className="su-chat-handover-error" role="alert">
          {error}
        </p>
      )}

      {needsConcern && (
        <label className="su-chat-field">
          <span>{copy.concern}</span>
          <textarea
            name="concern"
            required
            rows={3}
            maxLength={MAX_CONCERN}
            value={concern}
            onChange={(event) => setConcern(event.target.value)}
          />
        </label>
      )}
      <label className="su-chat-field">
        <span>{copy.name}</span>
        <input type="text" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
      </label>
      {mode === "callback" ? [phoneField, emailField] : [emailField, phoneField]}
      {contactHint && (
        <p className="su-chat-handover-hint" role="alert">
          {copy.contactHint}
        </p>
      )}

      {/* Honeypot: invisible and unreachable for people; bots that fill it are rejected. */}
      <div className="su-chat-hp" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      <label className="su-chat-consent">
        <input type="checkbox" name="consent" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
        <span>{copy.consent}</span>
      </label>

      {nudge && (
        <div className="su-chat-nudge" role="alert">
          <p>{copy.nudge}</p>
          <div className="su-chat-nudge-actions">
            <button
              type="button"
              className="su-chat-chip"
              onClick={() => {
                setNudge(false);
                (mode === "callback" ? firstRef : phoneRef).current?.focus();
              }}
            >
              {copy.addPhone}
            </button>
            <button type="button" className="su-chat-chip" onClick={send} disabled={sending}>
              {copy.sendWithoutPhone}
            </button>
          </div>
        </div>
      )}

      <div className="su-chat-handover-actions">
        <button type="submit" className="su-chat-human-btn" disabled={!consent || sending}>
          {sending ? copy.sending : copy.send}
        </button>
        <button type="button" className="su-chat-handover-cancel" onClick={onCancel} disabled={sending}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
