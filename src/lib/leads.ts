// Lead pipeline helpers — stages, search/filter, pipeline value and the rules
// for converting an inquiry into a client. Pure, shared by page and tests.

import type { Client, ClientType } from "./demo-data";
import type { Lead, LeadStage } from "./leads-data";
import { validateClientForm, type ClientFormErrors } from "./clients";

export const LEAD_STAGES: { value: LeadStage; label: string; hint: string }[] = [
  { value: "new", label: "New inquiry", hint: "Reply within a day" },
  { value: "contacted", label: "Contacted", hint: "Waiting on their reply" },
  { value: "consultation", label: "Consultation", hint: "Call or meeting booked" },
  { value: "proposal", label: "Proposal sent", hint: "Quote or collections sent" },
  { value: "booked", label: "Booked", hint: "Contract signed or deposit paid" },
  { value: "lost", label: "Lost", hint: "Not going ahead" },
];

/** Stages a lead moves through in order; "lost" can be reached from any of them. */
export const OPEN_STAGES: LeadStage[] = ["new", "contacted", "consultation", "proposal"];

export const LEAD_STAGE_LABELS = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.value, s.label]),
) as Record<LeadStage, string>;

export const LOST_REASONS = [
  "Over budget",
  "Date unavailable",
  "Went with another photographer",
  "No response",
  "Event cancelled",
  "Other",
] as const;

export type LeadView = "board" | "list";
export type LeadTypeFilter = "all" | ClientType;

export interface LeadListSearch {
  q?: string;
  type?: ClientType;
  view?: LeadView;
  lead?: string;
}

const TYPES: ClientType[] = ["wedding", "portrait", "family", "commercial", "event"];

export function validateLeadSearch(raw: Record<string, unknown>): LeadListSearch {
  const out: LeadListSearch = {};
  const { q, type, view, lead } = raw;
  if (typeof q === "string" && q.trim()) out.q = q;
  if (TYPES.includes(type as ClientType)) out.type = type as ClientType;
  if (view === "list") out.view = "list";
  if (typeof lead === "string" && lead) out.lead = lead;
  return out;
}

export function matchesLeadQuery(l: Lead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [l.name, l.email, l.location, l.message].some((f) => f.toLowerCase().includes(q));
}

/** Newest inquiries first. */
export function filterLeads(leads: Lead[], { q = "", type }: LeadListSearch): Lead[] {
  return leads
    .filter((l) => !type || l.type === type)
    .filter((l) => matchesLeadQuery(l, q))
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function leadsByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const out = Object.fromEntries(LEAD_STAGES.map((s) => [s.value, [] as Lead[]])) as Record<
    LeadStage,
    Lead[]
  >;
  for (const l of leads) out[l.stage].push(l);
  return out;
}

export const isOpen = (l: Lead) => OPEN_STAGES.includes(l.stage);

/** Estimated value of open leads (not booked or lost). */
export function pipelineValue(leads: Lead[]): number {
  return leads.filter(isOpen).reduce((sum, l) => sum + l.budget, 0);
}

const daysBefore = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

/** Inquiries received in the last 30 days versus the 30 days before, with % change. */
export function leadTrend(leads: Lead[], today: string) {
  const start = daysBefore(today, 30);
  const prevStart = daysBefore(today, 60);
  const day = (l: Lead) => l.receivedAt.slice(0, 10);
  const current = leads.filter((l) => day(l) > start && day(l) <= today).length;
  const previous = leads.filter((l) => day(l) > prevStart && day(l) <= start).length;
  const change = previous ? Math.round(((current - previous) / previous) * 100) : null;
  return { current, previous, change };
}

/** Share of decided leads (booked or lost) that were booked, 0–100. */
export function winRate(leads: Lead[]): number | null {
  const booked = leads.filter((l) => l.stage === "booked").length;
  const decided = booked + leads.filter((l) => l.stage === "lost").length;
  return decided ? Math.round((booked / decided) * 100) : null;
}

/** An existing client with the same email, if this inquiry came from one. */
export function matchingClient(lead: Pick<Lead, "email" | "clientId">, clients: Client[]) {
  if (lead.clientId) return clients.find((c) => c.id === lead.clientId);
  const email = lead.email.trim().toLowerCase();
  return clients.find((c) => c.email.toLowerCase() === email);
}

export interface LeadFormErrors extends ClientFormErrors {
  budget?: string;
  message?: string;
}

export function validateLeadForm(
  input: { name: string; email: string; phone: string; budget: string; message: string },
  existingLeads: Lead[],
): LeadFormErrors {
  // Matching an existing *client* is fine (repeat inquiry) — only check the shape.
  const errors: LeadFormErrors = validateClientForm(input, []);
  const email = input.email.trim().toLowerCase();
  if (!errors.email && existingLeads.some((l) => isOpen(l) && l.email.toLowerCase() === email))
    errors.email = "There's already an open lead with this email.";
  if (input.budget.trim() && !(Number(input.budget) >= 0))
    errors.budget = "Enter an amount in dollars, or leave it blank.";
  if (!input.message.trim()) errors.message = "Add what they asked for.";
  return errors;
}

/** Next stage in the usual flow, or null at the end. */
export function nextStage(stage: LeadStage): LeadStage | null {
  if (stage === "booked" || stage === "lost") return null;
  const i = OPEN_STAGES.indexOf(stage);
  return i === OPEN_STAGES.length - 1 ? "booked" : (OPEN_STAGES[i + 1] ?? null);
}
