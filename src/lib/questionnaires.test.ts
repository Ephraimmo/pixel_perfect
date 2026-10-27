import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import type { Question } from "@/lib/questionnaires-data";
import {
  countQuestionnaires,
  formatAnswer,
  moveItem,
  questionnaireTab,
  responseProgress,
  responseState,
  sortQuestionnaires,
  templateHasErrors,
  validateAnswers,
  validateQuestionnaireSearch,
  validateTemplate,
} from "@/lib/questionnaires";

const { questionnaires, questionnaireTemplates, questionLibrary } = seedState();
const byId = (id: string) => questionnaires.find((q) => q.id === id)!;

const q = (
  id: string,
  type: Question["type"],
  required = true,
  options: string[] = [],
): Question => ({
  id,
  label: id,
  type,
  required,
  options,
  help: "",
});

describe("seed", () => {
  it("builds templates from library questions with their own ids", () => {
    const wedding = questionnaireTemplates.find((t) => t.id === "qt-wedding")!;
    expect(wedding.questions).toHaveLength(7);
    expect(wedding.questions[0]?.label).toBe(questionLibrary[0]?.label);
    expect(new Set(questionnaireTemplates.flatMap((t) => t.questions.map((x) => x.id))).size).toBe(
      questionnaireTemplates.reduce((s, t) => s + t.questions.length, 0),
    );
  });

  it("has valid answers on submitted questionnaires", () => {
    for (const qn of questionnaires.filter((x) => x.status === "submitted")) {
      expect(validateAnswers(qn.questions, qn.answers), qn.id).toEqual({});
    }
  });
});

describe("state", () => {
  it("derives not started, in progress, overdue and submitted", () => {
    expect(responseState(byId("qn1"), DEMO_TODAY)).toBe("submitted");
    expect(responseState(byId("qn2"), DEMO_TODAY)).toBe("in_progress");
    expect(responseState(byId("qn3"), DEMO_TODAY)).toBe("overdue"); // due Apr 19
    expect(responseState(byId("qn4"), DEMO_TODAY)).toBe("not_started");
    expect(questionnaireTab(byId("qn2"), DEMO_TODAY)).toBe("awaiting");
  });

  it("counts and sorts — overdue first, then soonest due, then latest submitted", () => {
    expect(countQuestionnaires(questionnaires, DEMO_TODAY)).toEqual({
      all: 5,
      awaiting: 2,
      overdue: 1,
      submitted: 2,
    });
    expect(sortQuestionnaires(questionnaires, DEMO_TODAY).map((x) => x.id)).toEqual([
      "qn3",
      "qn4",
      "qn2",
      "qn1",
      "qn5",
    ]);
  });

  it("tracks progress", () => {
    expect(responseProgress(byId("qn2").questions, byId("qn2").answers)).toEqual({
      answered: 3,
      total: 7,
      percent: 43,
    });
    expect(responseProgress([], {})).toEqual({ answered: 0, total: 0, percent: 0 });
  });
});

describe("validateAnswers", () => {
  const questions = [
    q("name", "short"),
    q("count", "number"),
    q("when", "date", false),
    q("style", "choice", true, ["A", "B"]),
    q("use", "multi", true, ["Web", "Print"]),
    q("pets", "yesno", false),
  ];

  it("passes a complete response", () => {
    expect(
      validateAnswers(questions, {
        name: "Zoe",
        count: "4",
        when: "2025-05-01",
        style: "A",
        use: ["Web"],
        pets: "no",
      }),
    ).toEqual({});
  });

  it("flags missing required answers and bad formats", () => {
    expect(
      validateAnswers(questions, {
        name: "  ",
        count: "four",
        when: "soon",
        style: "C",
        use: [],
        pets: "maybe",
      }),
    ).toEqual({
      name: "This question is required.",
      count: "Enter a number, e.g. 6.",
      when: "Pick a date.",
      style: "Choose one of the options.",
      use: "Choose at least one option.",
      pets: "Choose yes or no.",
    });
  });

  it("allows optional questions to be skipped", () => {
    expect(validateAnswers([q("when", "date", false)], {})).toEqual({});
  });
});

describe("templates and helpers", () => {
  it("requires a name, questions, labels and two distinct options", () => {
    const e = validateTemplate({
      name: " ",
      questions: [
        q("a", "short"),
        { ...q("b", "choice", true, ["Only"]) },
        { ...q("c", "multi", true, ["X", "x"]) },
        { ...q("d", "long"), label: "" },
      ],
    });
    expect(e.name).toBeDefined();
    expect(e.byQuestion).toEqual({
      b: "Add at least two options.",
      c: "Options must be different.",
      d: "Write the question.",
    });
    expect(templateHasErrors(e)).toBe(true);
    expect(validateTemplate({ name: "x", questions: [] }).questions).toBeDefined();
    expect(
      templateHasErrors(validateTemplate({ name: "Prep", questions: [q("a", "short")] })),
    ).toBe(false);
  });

  it("formats answers for reading", () => {
    expect(formatAnswer(q("p", "yesno"), "yes")).toBe("Yes");
    expect(formatAnswer(q("d", "date"), "2025-04-05")).toBe("April 5, 2025");
    expect(formatAnswer(q("m", "multi"), ["Web", "Print"])).toBe("Web, Print");
    expect(formatAnswer(q("s", "short"), "")).toBe("");
  });

  it("moves items within bounds", () => {
    expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });

  it("validates search", () => {
    expect(validateQuestionnaireSearch({ view: "library", tab: "overdue" })).toEqual({
      view: "library",
      tab: "overdue",
    });
    expect(validateQuestionnaireSearch({ view: "sent", tab: "all" })).toEqual({});
  });
});
