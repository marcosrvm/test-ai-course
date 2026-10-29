// Quiz context for the human handover: the v2 suitability quiz saves its answers when it
// reaches a result; the chat widget reads them only when the handover form is sent (with consent).
// Never shown in the chat and never sent to /api/chat. sessionStorage can throw or be empty.

export const QUIZ_STORAGE_KEY = "su_quiz";

const RESULT_TYPES = ["retainer", "strong_crowding", "suitable"] as const;

export type StoredQuiz = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  result_type: (typeof RESULT_TYPES)[number];
};

export function saveQuizContext(quiz: StoredQuiz) {
  try {
    sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quiz));
  } catch {
    // Private mode or blocked storage: the handover simply goes without quiz context.
  }
}

export function readQuizContext(): StoredQuiz | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(QUIZ_STORAGE_KEY) ?? "null");
    if (!data || !RESULT_TYPES.includes(data.result_type)) return null;
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    return {
      q1: text(data.q1),
      q2: text(data.q2),
      q3: text(data.q3),
      q4: text(data.q4),
      q5: text(data.q5),
      q6: text(data.q6),
      result_type: data.result_type,
    };
  } catch {
    return null;
  }
}
