// Pixora questionnaires demo data — a library of reusable questions,
// templates built from them, and questionnaires sent to clients.

export type QuestionType = "short" | "long" | "choice" | "multi" | "date" | "number" | "yesno";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  /** Choices for "choice" and "multi" questions. */
  options: string[];
  help: string;
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  updatedAt: string; // ISO date
}

/** "submitted" is final until the studio reopens it; "overdue" is derived. */
export type QuestionnaireStatus = "sent" | "in_progress" | "submitted";

export type Answer = string | string[];

export interface Questionnaire {
  id: string;
  title: string;
  templateId?: string | undefined;
  clientId: string;
  projectId?: string | undefined;
  /** Snapshot of the questions when sent, so template edits don't change it. */
  questions: Question[];
  answers: Record<string, Answer>;
  status: QuestionnaireStatus;
  sentAt: string; // ISO date-time
  dueDate: string; // ISO date
  lastSavedAt?: string | undefined;
  submittedAt?: string | undefined;
  remindedAt?: string | undefined;
}

const q = (
  id: string,
  label: string,
  type: QuestionType,
  required = false,
  options: string[] = [],
  help = "",
): Question => ({ id, label, type, required, options, help });

export function seedQuestionLibrary(): Question[] {
  return [
    q("ql-names", "Your names (as you'd like them in the gallery)", "short", true),
    q(
      "ql-venue",
      "Ceremony and reception venues",
      "long",
      true,
      [],
      "Include addresses if they're not well known.",
    ),
    q(
      "ql-timeline",
      "Rough timeline for the day",
      "long",
      false,
      [],
      "Getting ready, ceremony, speeches, first dance…",
    ),
    q("ql-must", "Must-have shots or moments", "long"),
    q(
      "ql-family",
      "Family group photos — who should be in them?",
      "long",
      false,
      [],
      "List the groupings, e.g. “Couple + bride's parents”.",
    ),
    q(
      "ql-dynamics",
      "Anything about family dynamics we should know?",
      "long",
      false,
      [],
      "Divorced parents, someone camera-shy… this stays private.",
    ),
    q("ql-style", "Which photo style do you prefer?", "choice", true, [
      "Candid & documentary",
      "Classic & posed",
      "A mix of both",
    ]),
    q("ql-usage", "What will you use the photos for?", "multi", true, [
      "Website",
      "Social media",
      "Print & albums",
      "Advertising",
    ]),
    q("ql-people", "How many people will be photographed?", "number", true),
    q("ql-date", "Preferred session date", "date"),
    q("ql-pets", "Will any pets be joining?", "yesno"),
    q(
      "ql-wardrobe",
      "Wardrobe plans or colour palette",
      "long",
      false,
      [],
      "We'll send outfit ideas if you're unsure.",
    ),
    q("ql-brand", "Brand colours and fonts", "short"),
    q("ql-access", "Any accessibility or mobility needs?", "long"),
  ];
}

export function seedQuestionnaireTemplates(lib: Question[]): QuestionnaireTemplate[] {
  const pick = (prefix: string, ids: string[]) =>
    ids.map((id) => ({ ...lib.find((x) => x.id === id)!, id: `${prefix}-${id.slice(3)}` }));
  return [
    {
      id: "qt-wedding",
      name: "Wedding Day Questionnaire",
      description: "Timeline, venues, must-have shots and family groupings.",
      questions: pick("qtw", [
        "ql-names",
        "ql-venue",
        "ql-timeline",
        "ql-must",
        "ql-family",
        "ql-dynamics",
        "ql-style",
      ]),
      updatedAt: "2025-02-02",
    },
    {
      id: "qt-family",
      name: "Family Session Prep",
      description: "Who's coming, pets, wardrobe and any access needs.",
      questions: pick("qtf", [
        "ql-people",
        "ql-pets",
        "ql-wardrobe",
        "ql-style",
        "ql-date",
        "ql-access",
      ]),
      updatedAt: "2024-12-10",
    },
    {
      id: "qt-brand",
      name: "Brand Shoot Brief",
      description: "Usage, brand guidelines and the shots you can't miss.",
      questions: pick("qtb", ["ql-usage", "ql-brand", "ql-must", "ql-date"]),
      updatedAt: "2025-03-15",
    },
  ];
}

export function seedQuestionnaires(templates: QuestionnaireTemplate[]): Questionnaire[] {
  const tpl = (id: string) => templates.find((t) => t.id === id)!;
  const wed = tpl("qt-wedding").questions;
  const fam = tpl("qt-family").questions;
  const brand = tpl("qt-brand").questions;
  return [
    {
      id: "qn1",
      title: "Wedding Day Questionnaire",
      templateId: "qt-wedding",
      clientId: "c1",
      projectId: "pr1",
      questions: wed,
      answers: {
        [wed[0]!.id]: "Sarah & James",
        [wed[1]!.id]: "Ceremony: St. George's Chapel. Reception: Lakeside Estate boathouse.",
        [wed[2]!.id]:
          "13:00 getting ready · 15:00 ceremony · 16:30 portraits · 18:00 reception · 21:00 first dance",
        [wed[3]!.id]: "Boathouse at golden hour, James's grandmother's ring, sparkler exit.",
        [wed[4]!.id]: "Couple + both families; couple + bridal party; Sarah + her sisters.",
        [wed[5]!.id]: "",
        [wed[6]!.id]: "A mix of both",
      },
      status: "submitted",
      sentAt: "2025-03-22T14:00:00",
      dueDate: "2025-04-05",
      lastSavedAt: "2025-03-27T20:10:00",
      submittedAt: "2025-03-28T09:41:00",
    },
    {
      id: "qn2",
      title: "Wedding Day Questionnaire",
      templateId: "qt-wedding",
      clientId: "c10",
      projectId: "pr5",
      questions: wed,
      answers: {
        [wed[0]!.id]: "Liam & Aoife",
        [wed[1]!.id]: "Both at La Petite Ferme, Franschhoek.",
        [wed[6]!.id]: "Candid & documentary",
      },
      status: "in_progress",
      sentAt: "2025-04-15T10:00:00",
      dueDate: "2025-05-15",
      lastSavedAt: "2025-04-18T21:32:00",
    },
    {
      id: "qn3",
      title: "Family Session Prep",
      templateId: "qt-family",
      clientId: "c3",
      projectId: "pr7",
      questions: fam,
      answers: {},
      status: "sent",
      sentAt: "2025-04-11T09:00:00",
      dueDate: "2025-04-19",
    },
    {
      id: "qn4",
      title: "Brand Shoot Brief",
      templateId: "qt-brand",
      clientId: "c11",
      projectId: "pr8",
      questions: brand,
      answers: {},
      status: "sent",
      sentAt: "2025-04-18T16:00:00",
      dueDate: "2025-04-30",
    },
    {
      id: "qn5",
      title: "Family Session Prep",
      templateId: "qt-family",
      clientId: "c6",
      projectId: "pr3",
      questions: fam,
      answers: {
        [fam[0]!.id]: "7",
        [fam[1]!.id]: "yes",
        [fam[2]!.id]: "Earthy tones — rust, cream and denim. Grandma in her green dress.",
        [fam[3]!.id]: "Candid & documentary",
        [fam[4]!.id]: "2025-04-05",
        [fam[5]!.id]: "Grandpa uses a walking stick — a bench nearby would help.",
      },
      status: "submitted",
      sentAt: "2025-03-20T10:00:00",
      dueDate: "2025-03-30",
      submittedAt: "2025-03-26T18:05:00",
    },
  ];
}
