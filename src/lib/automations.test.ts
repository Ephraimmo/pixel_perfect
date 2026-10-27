import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import type { Automation } from "@/lib/automations-data";
import {
  automationHasErrors,
  describeStep,
  describeTrigger,
  filterRuns,
  runStats,
  simulateRun,
  validateAutomation,
  validateAutomationSearch,
} from "@/lib/automations";

const state = seedState();
const auto = (id: string) => state.automations.find((a) => a.id === id)!;
const sim = (a: Automation, clientId: string) =>
  simulateRun(a, clientId, state, DEMO_TODAY, "2025-04-20T10:00:00", "t");

describe("seed", () => {
  it("has valid workflows that reference existing templates", () => {
    for (const a of state.automations)
      expect(automationHasErrors(validateAutomation(a, state)), a.id).toBe(false);
  });

  it("logs runs only for known workflows", () => {
    for (const r of state.automationRuns)
      expect(state.automations.some((a) => a.id === r.automationId)).toBe(true);
  });
});

describe("describe", () => {
  it("summarises triggers and steps in plain English", () => {
    expect(describeTrigger(auto("a3").trigger)).toBe("2 days before a session");
    expect(describeTrigger(auto("a5").trigger)).toBe("When an invoice is 3 days overdue");
    expect(describeTrigger(auto("a1").trigger)).toBe("When a new inquiry arrives");
    expect(describeStep(auto("a2").steps[0]!, state)).toBe("Send email: Booking confirmation");
    expect(describeStep(auto("a6").steps[0]!, state)).toBe(
      "Send questionnaire: Wedding Day Questionnaire",
    );
  });
});

describe("validateAutomation", () => {
  it("catches missing names, steps, bad days and dangling templates", () => {
    const e = validateAutomation(
      {
        name: " ",
        trigger: { kind: "invoice_overdue", days: 0 },
        steps: [
          { id: "x", kind: "send_email", delayDays: 0, emailTemplateId: "gone" },
          { id: "y", kind: "notify_me", delayDays: -1, text: "Hi" },
          { id: "z", kind: "create_task", delayDays: 0, text: " " },
        ],
      },
      state,
    );
    expect(e.name).toBeDefined();
    expect(e.trigger).toMatch(/1 and 60/);
    expect(e.byStep).toEqual({
      x: "Choose an email template.",
      y: "Delay must be 0–365 days.",
      z: "Write what it should say.",
    });
    expect(
      validateAutomation(
        { name: "x", trigger: { kind: "lead_received", days: 0 }, steps: [] },
        state,
      ).steps,
    ).toBeDefined();
  });
});

describe("simulateRun", () => {
  it("renders emails with the client's data", () => {
    const run = sim(auto("a2"), "c3"); // Emma: family, next session Apr 23
    expect(run.status).toBe("success");
    expect(run.test).toBe(true);
    expect(run.steps[0]).toMatchObject({ result: "done", detail: "“You're booked, Emma! 🎉”" });
    expect(run.steps[1]).toMatchObject({ result: "scheduled", detail: "Would run after 1 day" });
  });

  it("fails when a client is missing data, and skips the rest", () => {
    const run = sim(auto("a5"), "c1"); // Sarah has no unpaid invoice
    expect(run.status).toBe("failed");
    expect(run.steps[0]?.result).toBe("failed");
    expect(run.steps[0]?.detail).toContain("Unpaid invoice number (no unpaid invoice)");
    expect(run.steps[1]).toMatchObject({ result: "skipped" });
  });

  it("skips clients outside the workflow's client types", () => {
    const run = sim(auto("a6"), "c4"); // commercial, workflow is wedding-only
    expect(run.status).toBe("success");
    expect(run.steps[0]?.detail).toMatch(/only runs for wedding clients/);
  });

  it("fills task and notification text", () => {
    expect(sim(auto("a1"), "c2").steps.map((s) => s.detail)).toEqual([
      "New inquiry from James Carter",
      "Reply to James Carter within 24 hours",
    ]);
  });
});

describe("history", () => {
  it("counts the last 30 days and success rate, ignoring test runs", () => {
    expect(runStats(state.automationRuns, DEMO_TODAY)).toEqual({
      runs: 9,
      failed: 1,
      successRate: 89,
    });
    expect(runStats(state.automationRuns, DEMO_TODAY, "a5")).toEqual({
      runs: 2,
      failed: 1,
      successRate: 50,
    });
    const withTest = [
      { ...state.automationRuns[0]!, id: "t", test: true },
      ...state.automationRuns,
    ];
    expect(runStats(withTest, DEMO_TODAY).runs).toBe(9);
  });

  it("filters and sorts runs", () => {
    expect(filterRuns(state.automationRuns, { status: "failed" }).map((r) => r.id)).toEqual(["r4"]);
    expect(filterRuns(state.automationRuns, { automation: "a4" }).map((r) => r.id)).toEqual([
      "r7",
      "r9",
    ]);
    expect(filterRuns(state.automationRuns, {})[0]?.id).toBe("r1");
  });

  it("validates search", () => {
    expect(
      validateAutomationSearch({ view: "history", status: "failed", automation: "a5" }),
    ).toEqual({
      view: "history",
      status: "failed",
      automation: "a5",
    });
    expect(validateAutomationSearch({ view: "list", status: "ok" })).toEqual({});
  });
});
