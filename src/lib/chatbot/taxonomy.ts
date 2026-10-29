import knowledgeBase from "./knowledge-base.json";
import taxonomyData from "./taxonomy.json";

// Ticket taxonomy (draft from Po's case study). Data only – phase 3b uses it for tickets.

export const CATEGORY_KEYS = [
  "1_pre_purchase",
  "2_kit_appointment",
  "3_treatment_plan",
  "4_payment",
  "5_shipping",
  "6_aligner_fit",
  "7_complaints",
  "8_medical",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];
export type Priority = "P1" | "P2" | "P3";
export type Queue = "general" | "senior" | "dental";
// Same values as the DBML enum automation_level.
export type Handling = "zero_touch" | "ai_draft_approval" | "dentist_handover" | "manual";
export type Channel = "whatsapp" | "contact_form" | "email" | "phone";

export type Subcategory = {
  key: string;
  label: string;
  // One line, English: what belongs in this sub-category (also given to the classifier).
  description: string;
  priority: Priority;
  priority_note?: string;
  queue: Queue;
  handling: Handling;
};

export type Category = {
  key: CategoryKey;
  label: string;
  description: string;
  subcategories: Subcategory[];
  channels: Channel[];
  channel_note?: string;
  typical_urgency: string;
  default_priority: Priority;
  default_queue: Queue;
  default_handling: Handling;
  default_handling_note?: string;
  bot_behaviour: string;
  example_questions_de: string[];
};

type RuleTarget = {
  priority?: Priority;
  queue?: Queue;
  handling?: Handling;
  category?: CategoryKey;
  use?: string;
};

export type RoutingRule = {
  order: number;
  id: string;
  when: string;
  then: RuleTarget;
  exception?: { when: string; category: CategoryKey; subcategory: string };
  note?: string;
};

export type Taxonomy = {
  version: string;
  source: string;
  status: string;
  priorities: { key: Priority; label: string; color: string }[];
  queues: { key: Queue; label: string }[];
  handling_levels: Handling[];
  channels: Channel[];
  auto_send_confidence: { value: number; note: string };
  routing_rules: { note: string; rules: RoutingRule[] };
  categories: Category[];
};

// Single place to change if the taxonomy later comes from a database table.
export function loadTaxonomy(): Taxonomy {
  return taxonomyData as Taxonomy;
}

const taxonomy = loadTaxonomy();

export function listCategories(): Category[] {
  return taxonomy.categories;
}

export function getCategory(key: string): Category | undefined {
  return taxonomy.categories.find((c) => c.key === key);
}

// Returns a list of problems; an empty list means the taxonomy is valid.
export function validateTaxonomy(data: Taxonomy = taxonomy): string[] {
  const errors: string[] = [];
  const priorities = new Set<string>(data.priorities.map((p) => p.key));
  const queues = new Set<string>(data.queues.map((q) => q.key));
  const handling = new Set<string>(data.handling_levels);
  const channels = new Set<string>(data.channels);
  const categoryKeys = new Set<string>(data.categories.map((c) => c.key));

  const checkValues = (where: string, v: { priority?: string; queue?: string; handling?: string }) => {
    if (v.priority !== undefined && !priorities.has(v.priority)) errors.push(`${where}: unknown priority "${v.priority}"`);
    if (v.queue !== undefined && !queues.has(v.queue)) errors.push(`${where}: unknown queue "${v.queue}"`);
    if (v.handling !== undefined && !handling.has(v.handling)) errors.push(`${where}: unknown handling "${v.handling}"`);
  };

  for (const key of CATEGORY_KEYS) {
    if (!categoryKeys.has(key)) errors.push(`missing category "${key}"`);
  }
  if (categoryKeys.size !== data.categories.length) errors.push("duplicate category keys");

  for (const c of data.categories) {
    if (!(CATEGORY_KEYS as readonly string[]).includes(c.key)) errors.push(`unexpected category "${c.key}"`);
    checkValues(c.key, { priority: c.default_priority, queue: c.default_queue, handling: c.default_handling });
    for (const ch of c.channels) if (!channels.has(ch)) errors.push(`${c.key}: unknown channel "${ch}"`);
    if (c.subcategories.length === 0) errors.push(`${c.key}: no subcategories`);
    const subKeys = new Set<string>();
    for (const s of c.subcategories) {
      if (subKeys.has(s.key)) errors.push(`${c.key}: duplicate subcategory "${s.key}"`);
      subKeys.add(s.key);
      checkValues(`${c.key}.${s.key}`, s);
      if (typeof s.description !== "string" || !s.description.trim()) {
        errors.push(`${c.key}.${s.key}: description missing`);
      }
    }
    if (c.example_questions_de.length < 5) {
      errors.push(`${c.key}: only ${c.example_questions_de.length} example questions (need ≥5)`);
    }
  }

  for (const rule of data.routing_rules.rules) {
    const where = `routing rule ${rule.order} (${rule.id})`;
    checkValues(where, rule.then);
    if (rule.then.category && !categoryKeys.has(rule.then.category)) {
      errors.push(`${where}: unknown category "${rule.then.category}"`);
    }
    if (rule.exception) {
      const target = data.categories.find((c) => c.key === rule.exception!.category);
      if (!target) errors.push(`${where}: unknown exception category "${rule.exception.category}"`);
      else if (!target.subcategories.some((s) => s.key === rule.exception!.subcategory)) {
        errors.push(`${where}: unknown subcategory "${rule.exception.subcategory}" in ${target.key}`);
      }
    }
  }

  for (const chunk of knowledgeBase as { id: string; category: string }[]) {
    if (!categoryKeys.has(chunk.category)) {
      errors.push(`knowledge base chunk "${chunk.id}": category "${chunk.category}" not in taxonomy`);
    }
  }

  return errors;
}
