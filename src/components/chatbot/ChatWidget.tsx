"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { RATE_LIMIT_TEXT } from "@/lib/rate-limit";
import { HandoverForm, type HandoverMode } from "./HandoverForm";

const MAX_CHARS = 500;

const copy = {
  open: "Chat öffnen",
  close: "Chat schließen",
  title: "smileunion Assistent",
  welcome:
    "Hallo! Ich bin der KI-Assistent von smileunion. Ich beantworte Fragen zu Ablauf, Preisen und Abdruckbox. Medizinische Fragen leite ich an unser Zahnärzteteam weiter.",
  topics: ["Was kostet die Behandlung?", "Abdruckbox oder Termin?", "Wie funktioniert die Ratenzahlung?"],
  human: "Mit einem Menschen sprechen",
  dentist: "Mit dem Zahnärzteteam sprechen",
  callback: "Rückruf anfordern",
  error: "Ich kann gerade leider nicht antworten. Soll ich dich mit unserem Team verbinden?",
  placeholder: "Deine Frage …",
  send: "Senden",
  sources: "Quellen:",
  typing: "Assistent schreibt …",
  reference: "Referenz:",
};

type Source = { title: string; url: string };

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  route?: Route;
  // "red" is for the team only; the customer just sees the callback button.
  alert?: "none" | "red";
  fallback?: boolean;
  // Greeting, help request or thanks: show the topic chips under the answer.
  chips?: boolean;
  // Handover confirmation: ticket reference shown under the message.
  ticketRef?: string;
  // Client-side only (handover clicks and confirmations, error notices): never sent to the API.
  local?: boolean;
};

type Route = "general" | "dentist" | "team";

type ApiResponse = { answer: string; sources: Source[]; route: Route; alert: "none" | "red"; fallback: boolean; chips?: boolean };

let nextId = 0;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [handover, setHandover] = useState<HandoverMode | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading, open, handover]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        bubbleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const add = (message: Omit<Message, "id">) =>
    setMessages((current) => [...current, { ...message, id: nextId++ }]);

  // Real conversation only: customer questions and API answers.
  const history = messages.filter((m) => !m.local).map(({ role, content }) => ({ role, content }));
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant" && !m.local);

  // Opens the handover form as a card at the end of the chat (one card at a time).
  const openHandover = (mode: HandoverMode, label: string) => {
    if (!handover) add({ role: "user", content: label, local: true });
    setHandover(mode);
  };
  const requestHuman = () => openHandover("team", copy.human);

  const ask = async (question: string) => {
    const text = question.trim().slice(0, MAX_CHARS);
    if (!text || loading) return;
    // Only real questions and API answers form the history; the welcome text is never in it.
    const chatHistory = [...history, { role: "user" as const, content: text }];
    add({ role: "user", content: text });
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });
      if (response.status === 429) {
        add({ role: "assistant", content: RATE_LIMIT_TEXT, local: true });
        return;
      }
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as ApiResponse;
      add({
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        route: data.route,
        alert: data.alert,
        fallback: data.fallback,
        chips: data.chips,
      });
    } catch {
      add({ role: "assistant", content: copy.error, route: "team", fallback: true, local: true });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  const topicButtons = copy.topics.map((topic) => (
    <button key={topic} type="button" className="su-chat-chip" onClick={() => ask(topic)} disabled={loading}>
      {topic}
    </button>
  ));

  return (
    <div className="su-chat" data-open={open}>
      {open && (
        <section className="su-chat-panel" role="dialog" aria-label={copy.title}>
          <header className="su-chat-header">
            <span className="su-chat-title">{copy.title}</span>
            <button type="button" className="su-chat-close" onClick={() => setOpen(false)} aria-label={copy.close}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={logRef} className="su-chat-log" aria-live="polite">
            <div className="su-chat-msg su-chat-msg-assistant">
              <p>{copy.welcome}</p>
            </div>
            <div className="su-chat-chips">
              {topicButtons}
              <button type="button" className="su-chat-chip" onClick={requestHuman}>
                {copy.human}
              </button>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`su-chat-msg su-chat-msg-${message.role}`}>
                <p>{message.content}</p>
                {message.ticketRef && (
                  <p className="su-chat-ref">
                    {copy.reference} {message.ticketRef}
                  </p>
                )}
                {message.sources && message.sources.length > 0 && (
                  <p className="su-chat-sources">
                    {copy.sources}{" "}
                    {message.sources.map((source, i) => (
                      <span key={source.url + source.title}>
                        {i > 0 && " · "}
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
                {message.alert === "red" && (
                  <div className="su-chat-fallback">
                    <button
                      type="button"
                      className="su-chat-human-btn su-chat-callback-btn"
                      onClick={() => openHandover("callback", copy.callback)}
                    >
                      {copy.callback}
                    </button>
                  </div>
                )}
                {message.route === "dentist" && message.alert !== "red" && (
                  <div className="su-chat-fallback">
                    <button type="button" className="su-chat-human-btn" onClick={() => openHandover("dentist", copy.dentist)}>
                      {copy.dentist}
                    </button>
                  </div>
                )}
                {message.chips && !message.fallback && <div className="su-chat-chips su-chat-chips-answer">{topicButtons}</div>}
                {message.fallback && (
                  <div className="su-chat-fallback">
                    <button type="button" className="su-chat-human-btn" onClick={requestHuman}>
                      {copy.human}
                    </button>
                    <div className="su-chat-chips">{topicButtons}</div>
                  </div>
                )}
              </div>
            ))}

            {handover && (
              <HandoverForm
                mode={handover}
                history={history}
                urgent={lastAnswer?.alert === "red"}
                onSuccess={(confirmation, ticketRef) => {
                  setHandover(null);
                  add({ role: "assistant", content: confirmation, ticketRef, local: true });
                }}
                onCancel={() => setHandover(null)}
              />
            )}

            {loading && (
              <div className="su-chat-msg su-chat-msg-assistant su-chat-typing" aria-label={copy.typing}>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <form className="su-chat-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={MAX_CHARS}
              placeholder={copy.placeholder}
              aria-label={copy.placeholder}
              enterKeyHint="send"
            />
            <button type="submit" className="su-chat-send" disabled={loading || !input.trim()} aria-label={copy.send}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 12l16-8-6 16-2-6.5L4 12z" fill="currentColor" />
              </svg>
            </button>
          </form>
          <button type="button" className="su-chat-human-link" onClick={requestHuman}>
            {copy.human}
          </button>
        </section>
      )}

      <button
        ref={bubbleRef}
        type="button"
        className="su-chat-bubble"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
