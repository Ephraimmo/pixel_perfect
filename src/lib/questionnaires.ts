// Questionnaire helpers — question types, answer validation, progress,
// submission state and template rules. Pure so pages and tests share them.

import type {
  Answer,
  Question,
  QuestionType,
  Questionnaire,
  QuestionnaireTemplate,
} from "./questionnaires-data";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short: "Short answer",
  long: "Paragraph",
  choice: "Single choice",
  multi: "Multiple choice",
  date: "Date",
  number: "Number",
  yesno: "Yes / No",
};

export const hasOptions = (t: QuestionType) => t === "choice" || t === "multi";

export function isAnswered(a: Answer | undefined): boolean {
  if (Array.isArray(a)) return a.length > 0;
  return typeof a === "string" && a.trim() !== "";
}

/** Answered / total and a 0–100 percentage. */
export function responseProgress(questions: Question[], answers: Record<string, Answer>) {
  const answered = questions.filter((q) => isAnswered(answers[q.id])).length;
  return {
    answered,
    total: questions.length,
    percent: questions.length ? Math.round((answered / questions.length) * 100) : 0,
  };
}

/** Per-question errors for a client's submission. */
export function validateAnswers(
  questions: Question[],
  answers: Record<string, Answer>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    const a = answers[q.id];
    if (!isAnswered(a)) {
      if (q.required)
        errors[q.id] =
          q.type === "multi" ? "Choose at least one option." : "This question is required.";
      continue;
    }
    const v = Array.isArray(a) ? a : a!.trim();
    if (q.type === "number" && (typeof v !== "string" || !/^\d+(\.\d+)?$/.test(v)))
      errors[q.id] = "Enter a number, e.g. 6.";
    else if (q.type === "date" && (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)))
      errors[q.id] = "Pick a date.";
    else if (q.type === "choice" && typeof v === "string" && !q.options.includes(v))
      errors[q.id] = "Choose one of the options.";
    else if (q.type === "multi" && Array.isArray(v) && v.some((x) => !q.options.includes(x)))
      errors[q.id] = "Choose from the listed options.";
    else if (q.type === "yesno" && v !== "yes" && v !== "no") errors[q.id] = "Choose yes or no.";
    else if (typeof v === "string" && v.length > 2000)
      errors[q.id] = "Please keep it under 2,000 characters.";
  }
  return errors;
}

export type ResponseState = "not_started" | "in_progress" | "submitted" | "overdue";

export const RESPONSE_STATE_LABELS: Record<ResponseState, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  overdue: "Overdue",
};

/** Where the client is: submitted wins; otherwise past due is overdue. */
export function responseState(q: Questionnaire, today: string): ResponseState {
  if (q.status === "submitted") return "submitted";
  if (q.dueDate < today) return "overdue";
  return q.status === "in_progress" ? "in_progress" : "not_started";
}

export type QuestionnaireTab = "all" | "awaiting" | "submitted" | "overdue";

export const QUESTIONNAIRE_TABS: { value: QuestionnaireTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting" },
  { value: "overdue", label: "Overdue" },
  { value: "submitted", label: "Submitted" },
];

export function questionnaireTab(
  q: Questionnaire,
  today: string,
): Exclude<QuestionnaireTab, "all"> {
  const s = responseState(q, today);
  return s === "submitted" ? "submitted" : s === "overdue" ? "overdue" : "awaiting";
}

export function countQuestionnaires(
  list: Questionnaire[],
  today: string,
): Record<QuestionnaireTab, number> {
  const out: Record<QuestionnaireTab, number> = {
    all: list.length,
    awaiting: 0,
    submitted: 0,
    overdue: 0,
  };
  for (const q of list) out[questionnaireTab(q, today)] += 1;
  return out;
}

export type QuestionnaireView = "sent" | "templates" | "library";

export interface QuestionnaireSearch {
  view?: Exclude<QuestionnaireView, "sent">;
  tab?: QuestionnaireTab;
}

export function validateQuestionnaireSearch(raw: Record<string, unknown>): QuestionnaireSearch {
  const out: QuestionnaireSearch = {};
  const { view, tab } = raw;
  if (view === "templates" || view === "library") out.view = view;
  if (QUESTIONNAIRE_TABS.some((t) => t.value === tab) && tab !== "all")
    out.tab = tab as QuestionnaireTab;
  return out;
}

/** Overdue first, then awaiting by due date, then newest submissions. */
export function sortQuestionnaires(list: Questionnaire[], today: string): Questionnaire[] {
  const rank = { overdue: 0, in_progress: 1, not_started: 1, submitted: 2 } as const;
  return [...list].sort((a, b) => {
    const ra = rank[responseState(a, today)];
    const rb = rank[responseState(b, today)];
    if (ra !== rb) return ra - rb;
    if (ra === 2) return (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "");
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/** Template must have a name and at least one valid question. */
export function validateTemplate(t: Pick<QuestionnaireTemplate, "name" | "questions">) {
  const errors: { name?: string; questions?: string; byQuestion: Record<string, string> } = {
    byQuestion: {},
  };
  if (!t.name.trim()) errors.name = "Name the template.";
  if (t.questions.length === 0) errors.questions = "Add at least one question.";
  for (const q of t.questions) {
    if (!q.label.trim()) errors.byQuestion[q.id] = "Write the question.";
    else if (hasOptions(q.type) && q.options.filter((o) => o.trim()).length < 2)
      errors.byQuestion[q.id] = "Add at least two options.";
    else if (
      hasOptions(q.type) &&
      new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length
    )
      errors.byQuestion[q.id] = "Options must be different.";
  }
  return errors;
}

export const templateHasErrors = (e: ReturnType<typeof validateTemplate>) =>
  !!e.name || !!e.questions || Object.keys(e.byQuestion).length > 0;

/** An answer as plain text for the studio's read-only view. */
export function formatAnswer(q: Question, a: Answer | undefined): string {
  if (!isAnswered(a)) return "";
  if (Array.isArray(a)) return a.join(", ");
  if (q.type === "yesno") return a === "yes" ? "Yes" : "No";
  if (q.type === "date")
    return new Date(`${a}T12:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  return a!;
}

/** Move an item one step up or down. */
export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to]!, next[index]!];
  return next;
}
