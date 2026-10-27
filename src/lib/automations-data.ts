// Pixora automation demo data — workflows (trigger → conditions → steps) and
// their execution history.

import type { ClientType } from "./demo-data";
import type { LeadStage } from "./leads-data";

export type TriggerKind =
  | "lead_received"
  | "session_booked"
  | "session_upcoming"
  | "session_completed"
  | "gallery_published"
  | "invoice_overdue"
  | "contract_signed";

export interface Trigger {
  kind: TriggerKind;
  /** For "session_upcoming" (days before) and "invoice_overdue" (days after due). */
  days: number;
}

export type ActionKind =
  "send_email" | "send_questionnaire" | "create_task" | "move_lead" | "notify_me";

export interface AutomationStep {
  id: string;
  kind: ActionKind;
  /** Wait this many days after the trigger (or previous step) before running. */
  delayDays: number;
  emailTemplateId?: string | undefined;
  questionnaireTemplateId?: string | undefined;
  /** Task title or notification message; may use {{client.name}}. */
  text?: string | undefined;
  stage?: LeadStage | undefined;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  /** Only run for these client types; empty means everyone. */
  clientTypes: ClientType[];
  steps: AutomationStep[];
  active: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export type StepResult = "done" | "scheduled" | "skipped" | "failed";

export interface AutomationRun {
  id: string;
  automationId: string;
  at: string; // ISO date-time
  /** What happened, e.g. "Session booked · Emma Wilson — Family Session". */
  event: string;
  clientId?: string | undefined;
  status: "success" | "failed";
  /** True for dry runs started from the editor. */
  test?: boolean | undefined;
  steps: { label: string; result: StepResult; detail: string }[];
}

const step = (
  id: string,
  kind: ActionKind,
  delayDays: number,
  extra: Partial<AutomationStep> = {},
): AutomationStep => ({
  id,
  kind,
  delayDays,
  ...extra,
});

export function seedAutomations(): Automation[] {
  return [
    {
      id: "a1",
      name: "New inquiry follow-up",
      description: "Get notified and create a reply task the moment an inquiry arrives.",
      trigger: { kind: "lead_received", days: 0 },
      clientTypes: [],
      steps: [
        step("a1s1", "notify_me", 0, { text: "New inquiry from {{client.name}}" }),
        step("a1s2", "create_task", 0, { text: "Reply to {{client.name}} within 24 hours" }),
      ],
      active: true,
      createdAt: "2024-11-02",
      updatedAt: "2025-02-14",
    },
    {
      id: "a2",
      name: "Booking confirmation & prep",
      description:
        "Confirm family and portrait bookings, then send the prep questionnaire the next day.",
      trigger: { kind: "session_booked", days: 0 },
      clientTypes: ["family", "portrait"],
      steps: [
        step("a2s1", "send_email", 0, { emailTemplateId: "et-booking" }),
        step("a2s2", "send_questionnaire", 1, { questionnaireTemplateId: "qt-family" }),
      ],
      active: true,
      createdAt: "2024-12-10",
      updatedAt: "2025-03-02",
    },
    {
      id: "a3",
      name: "Session reminder",
      description: "A friendly reminder with tips two days before every session.",
      trigger: { kind: "session_upcoming", days: 2 },
      clientTypes: [],
      steps: [step("a3s1", "send_email", 0, { emailTemplateId: "et-reminder" })],
      active: true,
      createdAt: "2024-10-20",
      updatedAt: "2025-04-01",
    },
    {
      id: "a4",
      name: "Gallery delivered follow-up",
      description: "Deliver the gallery link, then ask for a review a week later.",
      trigger: { kind: "gallery_published", days: 0 },
      clientTypes: [],
      steps: [
        step("a4s1", "send_email", 0, { emailTemplateId: "et-gallery" }),
        step("a4s2", "send_email", 7, { emailTemplateId: "et-thanks" }),
      ],
      active: true,
      createdAt: "2024-09-01",
      updatedAt: "2025-02-18",
    },
    {
      id: "a5",
      name: "Overdue invoice nudge",
      description: "Email a gentle payment reminder three days after an invoice is due.",
      trigger: { kind: "invoice_overdue", days: 3 },
      clientTypes: [],
      steps: [
        step("a5s1", "send_email", 0, { emailTemplateId: "et-payment" }),
        step("a5s2", "notify_me", 0, { text: "Payment reminder sent to {{client.name}}" }),
      ],
      active: false,
      createdAt: "2025-01-10",
      updatedAt: "2025-04-17",
    },
    {
      id: "a6",
      name: "Wedding questionnaire",
      description: "Six weeks after the contract is signed, send the wedding-day questionnaire.",
      trigger: { kind: "contract_signed", days: 0 },
      clientTypes: ["wedding"],
      steps: [step("a6s1", "send_questionnaire", 42, { questionnaireTemplateId: "qt-wedding" })],
      active: true,
      createdAt: "2025-01-05",
      updatedAt: "2025-01-05",
    },
  ];
}

export function seedAutomationRuns(): AutomationRun[] {
  const run = (
    id: string,
    automationId: string,
    at: string,
    event: string,
    clientId: string | undefined,
    steps: AutomationRun["steps"],
  ): AutomationRun => ({
    id,
    automationId,
    at,
    event,
    clientId,
    status: steps.some((s) => s.result === "failed") ? "failed" : "success",
    steps,
  });
  return [
    run("r1", "a1", "2025-04-20T09:57:00", "Inquiry received · Emma Wilson (wedding)", "c3", [
      { label: "Notify me", result: "done", detail: "New inquiry from Emma Wilson" },
      { label: "Create task", result: "done", detail: "Reply to Emma Wilson within 24 hours" },
    ]),
    run(
      "r2",
      "a1",
      "2025-04-19T21:14:00",
      "Inquiry received · Thandiwe Mthembu (wedding)",
      undefined,
      [
        { label: "Notify me", result: "done", detail: "New inquiry from Thandiwe Mthembu" },
        {
          label: "Create task",
          result: "done",
          detail: "Reply to Thandiwe Mthembu within 24 hours",
        },
      ],
    ),
    run(
      "r3",
      "a3",
      "2025-04-19T07:00:00",
      "Session in 2 days · Sarah Mitchell — Wedding Shoot",
      "c1",
      [
        {
          label: "Send email: Session reminder",
          result: "done",
          detail: "“See you Monday, April 21, 2025 — a few quick tips”",
        },
      ],
    ),
    run("r4", "a5", "2025-04-17T09:00:00", "Invoice 3 days overdue · David Kim — INV-1044", "c4", [
      {
        label: "Send email: Payment reminder",
        result: "failed",
        detail: "Delivery failed — mailbox unavailable (550). Workflow paused.",
      },
      { label: "Notify me", result: "skipped", detail: "Skipped because the previous step failed" },
    ]),
    run("r5", "a5", "2025-04-15T09:00:00", "Invoice 1 day overdue · David Kim — INV-1044", "c4", [
      {
        label: "Send email: Payment reminder",
        result: "done",
        detail: "“Friendly reminder: INV-1044 ($560.00)”",
      },
      { label: "Notify me", result: "done", detail: "Payment reminder sent to David Kim" },
    ]),
    run(
      "r6",
      "a2",
      "2025-04-14T19:25:00",
      "Session booked · Olivia Brown — Portrait Session",
      "c5",
      [
        {
          label: "Send email: Booking confirmation",
          result: "done",
          detail: "“You're booked, Olivia! 🎉”",
        },
        {
          label: "Send questionnaire: Family Session Prep",
          result: "skipped",
          detail: "Skipped — the session is still pending confirmation",
        },
      ],
    ),
    run("r7", "a4", "2025-04-12T18:30:00", "Gallery published · Sarah & James Wedding", "c1", [
      {
        label: "Send email: Gallery delivery",
        result: "done",
        detail: "“Your photos are ready: Sarah & James Wedding”",
      },
      {
        label: "Send email: Thank you & review request",
        result: "done",
        detail: "Sent Apr 19 (after 7 days)",
      },
    ]),
    run("r8", "a2", "2025-04-10T16:40:00", "Session booked · Emma Wilson — Family Session", "c3", [
      {
        label: "Send email: Booking confirmation",
        result: "done",
        detail: "“You're booked, Emma! 🎉”",
      },
      {
        label: "Send questionnaire: Family Session Prep",
        result: "done",
        detail: "Sent Apr 11 (after 1 day)",
      },
    ]),
    run("r9", "a4", "2025-04-05T15:00:00", "Gallery published · Family Portraits", "c6", [
      {
        label: "Send email: Gallery delivery",
        result: "done",
        detail: "“Your photos are ready: Family Portraits”",
      },
      {
        label: "Send email: Thank you & review request",
        result: "done",
        detail: "Sent Apr 12 (after 7 days)",
      },
    ]),
    run(
      "r10",
      "a6",
      "2025-03-04T18:45:00",
      "Contract signed · Liam O'Connor — Wedding Photography Agreement",
      "c10",
      [
        {
          label: "Send questionnaire: Wedding Day Questionnaire",
          result: "done",
          detail: "Sent Apr 15 (after 42 days)",
        },
      ],
    ),
  ];
}
