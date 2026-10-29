import { ticketRef } from "@/lib/agent/format";
import { classifyTicket, type QuizContext } from "@/lib/chatbot/classify";
import type { ChatMessage } from "@/lib/chatbot/llm";
import { checkConversation } from "@/lib/chatbot/medical-guard";
import { createTicket, type Contact } from "@/lib/crm/createTicket";

export const runtime = "nodejs";

const ERROR_TEXT = "Das hat leider nicht geklappt. Bitte versuch es noch einmal.";
const CONFIRM = {
  urgentPhone:
    "Danke! Unser Zahnärzteteam ruft dich so schnell wie möglich zurück. Wenn die Beschwerden stark sind, geh bitte direkt zu einer Zahnarztpraxis oder zum zahnärztlichen Notdienst.",
  urgentEmail:
    "Danke! Unser Zahnärzteteam meldet sich so schnell wie möglich per E-Mail bei dir. Wenn die Beschwerden stark sind, geh bitte direkt zu einer Zahnarztpraxis oder zum zahnärztlichen Notdienst.",
  dentist: "Danke! Unser Zahnärzteteam meldet sich bei dir.",
  team: "Danke! Unser Team meldet sich bei dir.",
};

const MAX_MESSAGES = 20;
const MAX_USER_CHARS = 500;
// Assistant turns are our own earlier answers; the cap only guards against abuse.
const MAX_ASSISTANT_CHARS = 2000;
const MAX_NAME_CHARS = 100;
const MAX_QUIZ_CHARS = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9][0-9\s\-/()]{5,24}$/;
const RESULT_TYPES = ["retainer", "strong_crowding", "suitable"];

type HandoverInput = { contact: Contact; messages: ChatMessage[]; quiz: QuizContext | null };

// The reason is for the developer console only; it never contains submitted values.
const reject = (reason: string, status = 400) =>
  Response.json({ ok: false, error: ERROR_TEXT, reason }, { status });

const optionalString = (value: unknown) => value === undefined || value === null || typeof value === "string";

function parseInput(body: unknown): HandoverInput | string {
  if (!body || typeof body !== "object") return "invalid body";
  const { contact, consent, messages, quiz, website } = body as Record<string, unknown>;

  if (website !== undefined && website !== "") return "honeypot filled";
  if (consent !== true) return "consent required";

  if (!contact || typeof contact !== "object") return "contact missing";
  const { name, email, phone } = contact as Record<string, unknown>;
  if (!optionalString(name) || !optionalString(email) || !optionalString(phone)) return "invalid contact";
  const clean: Contact = {
    name: (name as string | undefined)?.trim() || undefined,
    email: (email as string | undefined)?.trim() || undefined,
    phone: (phone as string | undefined)?.trim() || undefined,
  };
  if (!clean.email && !clean.phone) return "e-mail or phone required";
  if (clean.email && (clean.email.length > 254 || !EMAIL.test(clean.email))) return "invalid e-mail";
  if (clean.phone && !PHONE.test(clean.phone)) return "invalid phone";
  if (clean.name && clean.name.length > MAX_NAME_CHARS) return "name too long";

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return "invalid number of messages";
  for (const m of messages) {
    const { role, content } = (m ?? {}) as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return "invalid role";
    if (typeof content !== "string" || !content.trim()) return "invalid message";
    if (content.length > (role === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) return "message too long";
  }
  const chat = (messages as ChatMessage[]).map(({ role, content }) => ({ role, content }));
  if (!chat.some((m) => m.role === "user")) return "no customer message";

  let quizContext: QuizContext | null = null;
  if (quiz !== undefined && quiz !== null) {
    if (typeof quiz !== "object") return "invalid quiz";
    const q = quiz as Record<string, unknown>;
    if (!RESULT_TYPES.includes(q.result_type as string)) return "invalid quiz result_type";
    const answers: Record<string, string | null> = {};
    for (const key of ["q1", "q2", "q3", "q4", "q5", "q6"]) {
      if (!optionalString(q[key]) || ((q[key] as string | undefined)?.length ?? 0) > MAX_QUIZ_CHARS) return "invalid quiz answer";
      answers[key] = (q[key] as string | undefined) || null;
    }
    quizContext = { ...answers, result_type: q.result_type as QuizContext["result_type"] };
  }

  return { contact: clean, messages: chat, quiz: quizContext };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reject("invalid JSON");
  }
  const input = parseInput(body);
  if (typeof input === "string") return reject(input);

  // Guard again on the server, over ALL customer messages – never trust a route or alert from the browser.
  const guard = checkConversation(input.messages.filter((m) => m.role === "user").map((m) => m.content));

  try {
    const { ai, final } = await classifyTicket({ messages: input.messages, guard, quiz: input.quiz });
    // An urgent case is never rejected for a missing phone: e-mail alone is accepted.
    const { ticketId } = await createTicket({ contact: input.contact, messages: input.messages, final, ai, quiz: input.quiz });

    const dentist = final.queue === "dental" && final.automation_level === "dentist_handover";
    const confirmation =
      final.alert === "red"
        ? input.contact.phone ? CONFIRM.urgentPhone : CONFIRM.urgentEmail
        : dentist ? CONFIRM.dentist : CONFIRM.team;

    return Response.json({ ok: true, ticketRef: ticketRef(ticketId), confirmation });
  } catch (error) {
    console.error(`handover: ${error instanceof Error ? error.message : "unknown error"}`);
    return reject("server error", 500);
  }
}
