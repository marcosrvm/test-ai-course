import { getCategory } from "@/lib/chatbot/taxonomy";

// Taxonomy labels for the agent UI ("Unclassified" when the AI was unavailable).
export const categoryLabel = (key: string | null) => (key ? getCategory(key)?.label ?? key : "Unclassified");

export const subLabel = (category: string | null, sub: string | null) =>
  (category && sub && getCategory(category)?.subcategories.find((s) => s.key === sub)?.label) || sub || "–";
