import type { FinalTicketValues, QuizContext } from "./classify";
import { getCategory } from "./taxonomy";

/*
 * Quiz contact form without a question: no text to classify, so no LLM call.
 * The ticket gets the taxonomy values of 1_pre_purchase / eligibility (a contact request
 * after the suitability quiz). Same routing rule as classify.ts: quiz result "retainer"
 * (permanent retainer wire, an eligibility question) → queue dental; category and
 * priority stay. A handover ticket is never zero touch.
 */
const CATEGORY = "1_pre_purchase";
const SUB_CATEGORY = "eligibility";

const RESULT_LABELS: Record<QuizContext["result_type"], string> = {
  suitable: "geeignet",
  strong_crowding: "starker Engstand",
  retainer: "permanenter Retainer-Draht",
};

export function classifyQuizOnly(quiz: QuizContext): FinalTicketValues {
  const sub = getCategory(CATEGORY)!.subcategories.find((s) => s.key === SUB_CATEGORY)!;
  return {
    category: CATEGORY,
    sub_category: SUB_CATEGORY,
    priority: sub.priority,
    queue: quiz.result_type === "retainer" ? "dental" : sub.queue,
    automation_level: sub.handling === "zero_touch" ? "ai_draft_approval" : sub.handling,
    alert: "none",
    summary: `Kontaktanfrage über das Quiz-Formular ohne Frage (Quiz-Ergebnis: ${RESULT_LABELS[quiz.result_type]}). Ohne KI klassifiziert.`,
  };
}
