// Automation helpers — trigger and action metadata, plain-English summaries,
// validation and a dry-run simulator. Pure so pages and tests share them.

import type { ClientType, DemoState } from "./demo-data";
import type {
  ActionKind,
  Automation,
  AutomationRun,
  AutomationStep,
  StepResult,
  Trigger,
  TriggerKind,
} from "./automations-data";
import { emailValues, fieldLabel, missingReason, renderEmail } from "./emails";
import { fillFields } from "./contracts";
import { LEAD_STAGE_LABELS } from "./leads";

export const TRIGGERS: Record<TriggerKind, { label: string; days?: string }> = {
  lead_received: { label: "A new inquiry arrives" },
  session_booked: { label: "A session is booked" },
  session_upcoming: { label: "A session is coming up", days: "days before the session" },
  session_completed: { label: "A session is marked completed" },
  gallery_published: { label: "A gallery is published" },
  invoice_overdue: { label: "An invoice is overdue", days: "days after the due date" },
  contract_signed: { label: "A contract is signed" },
};

export const ACTIONS: Record<ActionKind, string> = {
  send_email: "Send an email",
  send_questionnaire: "Send a questionnaire",
  create_task: "Create a task",
  move_lead: "Move the lead to a stage",
  notify_me: "Notify me",
};

export function describeTrigger(t: Trigger): string {
  const meta = TRIGGERS[t.kind];
  if (t.kind === "session_upcoming")
    return `${t.days} ${t.days === 1 ? "day" : "days"} before a session`;
  if (t.kind === "invoice_overdue")
    return `When an invoice is ${t.days} ${t.days === 1 ? "day" : "days"} overdue`;
  return `When ${meta.label.charAt(0).toLowerCase()}${meta.label.slice(1)}`;
}

type Lookups = Pick<DemoState, "emailTemplates" | "questionnaireTemplates">;

export function describeStep(s: AutomationStep, data: Lookups): string {
  switch (s.kind) {
    case "send_email":
      return `Send email: ${data.emailTemplates.find((t) => t.id === s.emailTemplateId)?.name ?? "missing template"}`;
    case "send_questionnaire":
      return `Send questionnaire: ${data.questionnaireTemplates.find((t) => t.id === s.questionnaireTemplateId)?.name ?? "missing template"}`;
    case "create_task":
      return `Create task: ${s.text || "untitled"}`;
    case "move_lead":
      return `Move lead to ${s.stage ? LEAD_STAGE_LABELS[s.stage] : "a stage"}`;
    case "notify_me":
      return `Notify me: ${s.text || "untitled"}`;
  }
}

export const delayLabel = (days: number) =>
  days === 0 ? "Immediately" : `After ${days} ${days === 1 ? "day" : "days"}`;

export interface AutomationErrors {
  name?: string;
  trigger?: string;
  steps?: string;
  byStep: Record<string, string>;
}

/** Problems that would stop a workflow from running; an invalid workflow can't be activated. */
export function validateAutomation(
  a: Pick<Automation, "name" | "trigger" | "steps">,
  data: Lookups,
): AutomationErrors {
  const errors: AutomationErrors = { byStep: {} };
  if (!a.name.trim()) errors.name = "Name the workflow.";
  if (
    TRIGGERS[a.trigger.kind].days &&
    !(Number.isInteger(a.trigger.days) && a.trigger.days >= 1 && a.trigger.days <= 60)
  )
    errors.trigger = "Choose between 1 and 60 days.";
  if (a.steps.length === 0) errors.steps = "Add at least one step.";
  for (const s of a.steps) {
    if (!(Number.isInteger(s.delayDays) && s.delayDays >= 0 && s.delayDays <= 365))
      errors.byStep[s.id] = "Delay must be 0–365 days.";
    else if (
      s.kind === "send_email" &&
      !data.emailTemplates.some((t) => t.id === s.emailTemplateId)
    )
      errors.byStep[s.id] = "Choose an email template.";
    else if (
      s.kind === "send_questionnaire" &&
      !data.questionnaireTemplates.some((t) => t.id === s.questionnaireTemplateId)
    )
      errors.byStep[s.id] = "Choose a questionnaire.";
    else if ((s.kind === "create_task" || s.kind === "notify_me") && !s.text?.trim())
      errors.byStep[s.id] = "Write what it should say.";
    else if (s.kind === "move_lead" && !s.stage) errors.byStep[s.id] = "Choose a stage.";
  }
  return errors;
}

export const automationHasErrors = (e: AutomationErrors) =>
  !!e.name || !!e.trigger || !!e.steps || Object.keys(e.byStep).length > 0;

/**
 * Dry-run a workflow for one client against today's demo data. Emails are
 * rendered for real so missing data (no upcoming session, no invoice) fails
 * the step exactly as it would live; later steps are skipped after a failure.
 */
export function simulateRun(
  a: Automation,
  clientId: string,
  demo: Pick<
    DemoState,
    | "clients"
    | "sessions"
    | "galleries"
    | "invoices"
    | "profile"
    | "emailTemplates"
    | "questionnaireTemplates"
    | "leads"
  >,
  today: string,
  at: string,
  id: string,
): AutomationRun {
  const client = demo.clients.find((c) => c.id === clientId);
  const values = emailValues(clientId, demo, today);
  const steps: AutomationRun["steps"] = [];
  let failed = false;
  const notForType =
    client && a.clientTypes.length > 0 && !a.clientTypes.includes(client.type as ClientType);

  for (const s of a.steps) {
    const label = describeStep(s, demo);
    let result: StepResult = s.delayDays > 0 ? "scheduled" : "done";
    let detail = s.delayDays > 0 ? `Would run ${delayLabel(s.delayDays).toLowerCase()}` : "";
    if (failed) {
      result = "skipped";
      detail = "Skipped because the previous step failed";
    } else if (notForType) {
      result = "skipped";
      detail = `Skipped — only runs for ${a.clientTypes.join(" and ")} clients`;
    } else if (s.kind === "send_email") {
      const t = demo.emailTemplates.find((x) => x.id === s.emailTemplateId);
      if (!t) {
        result = "failed";
        detail = "The email template no longer exists.";
      } else {
        const r = renderEmail(t, values);
        if (r.missing.length) {
          result = "failed";
          detail = `Couldn't fill ${r.missing.map((m) => `${fieldLabel(m)} (${missingReason(m)})`).join(", ")}.`;
        } else if (!detail) detail = `“${r.subject}”`;
      }
    } else if (s.kind === "send_questionnaire") {
      const t = demo.questionnaireTemplates.find((x) => x.id === s.questionnaireTemplateId);
      if (!t) {
        result = "failed";
        detail = "The questionnaire no longer exists.";
      } else if (!detail) detail = `${t.name} (${t.questions.length} questions)`;
    } else if (s.kind === "move_lead") {
      const lead = demo.leads.find(
        (l) => l.clientId === clientId || l.email.toLowerCase() === client?.email.toLowerCase(),
      );
      if (!lead) {
        result = "skipped";
        detail = "Skipped — no lead for this client";
      } else if (!detail) detail = `${lead.name} → ${s.stage ? LEAD_STAGE_LABELS[s.stage] : ""}`;
    } else if (!detail) {
      detail = fillFields(s.text ?? "", values).text;
    }
    if (result === "failed") failed = true;
    steps.push({ label, result, detail });
  }

  return {
    id,
    automationId: a.id,
    at,
    event: `Test run · ${client?.name ?? "Unknown client"}`,
    clientId,
    status: failed ? "failed" : "success",
    test: true,
    steps,
  };
}

/** Runs in the 30 days up to `today`, and the share that succeeded. */
export function runStats(runs: AutomationRun[], today: string, automationId?: string) {
  const from = new Date(`${today}T12:00:00`);
  from.setDate(from.getDate() - 30);
  const start = from.toISOString().slice(0, 10);
  const recent = runs.filter(
    (r) =>
      !r.test &&
      (!automationId || r.automationId === automationId) &&
      r.at.slice(0, 10) > start &&
      r.at.slice(0, 10) <= today,
  );
  const failed = recent.filter((r) => r.status === "failed").length;
  return {
    runs: recent.length,
    failed,
    successRate: recent.length
      ? Math.round(((recent.length - failed) / recent.length) * 100)
      : null,
  };
}

export interface AutomationSearch {
  view?: "history";
  status?: "success" | "failed";
  automation?: string;
}

export function validateAutomationSearch(raw: Record<string, unknown>): AutomationSearch {
  const out: AutomationSearch = {};
  const { view, status, automation } = raw;
  if (view === "history") out.view = "history";
  if (status === "success" || status === "failed") out.status = status;
  if (typeof automation === "string" && /^[\w-]{1,40}$/.test(automation))
    out.automation = automation;
  return out;
}

/** Newest first, filtered by status and workflow. */
export function filterRuns(runs: AutomationRun[], s: AutomationSearch): AutomationRun[] {
  return runs
    .filter(
      (r) =>
        (!s.status || r.status === s.status) && (!s.automation || r.automationId === s.automation),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}
