// Project helpers — statuses, list filtering, progress, money and the task
// templates new projects start from. Pure so pages and tests share them.

import type { ClientType } from "./demo-data";
import type { Invoice } from "./crm-data";
import type { Project, ProjectStatus, ProjectTask } from "./projects-data";
import { invoiceBalance, invoiceTotal } from "./invoices";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "shooting", label: "Shooting" },
  { value: "editing", label: "Editing" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
];

export const PROJECT_STATUS_LABELS = Object.fromEntries(
  PROJECT_STATUSES.map((s) => [s.value, s.label]),
) as Record<ProjectStatus, string>;

export type ProjectTab = "active" | "completed" | "archived" | "all";
export type ProjectSort = "due" | "recent" | "value" | "name";

export const PROJECT_TABS: { value: ProjectTab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export const PROJECT_SORT_LABELS: Record<ProjectSort, string> = {
  due: "Due soonest",
  recent: "Newest",
  value: "Highest value",
  name: "Name A–Z",
};

export interface ProjectSearch {
  tab?: ProjectTab;
  q?: string;
  sort?: ProjectSort;
}

export function validateProjectSearch(raw: Record<string, unknown>): ProjectSearch {
  const out: ProjectSearch = {};
  const { tab, q, sort } = raw;
  if (tab === "completed" || tab === "archived" || tab === "all") out.tab = tab;
  if (typeof q === "string" && q.trim()) out.q = q;
  if (typeof sort === "string" && sort in PROJECT_SORT_LABELS && sort !== "due")
    out.sort = sort as ProjectSort;
  return out;
}

export function projectTab(p: Project): Exclude<ProjectTab, "all"> {
  if (p.archived) return "archived";
  return p.status === "completed" ? "completed" : "active";
}

export function countProjects(projects: Project[]): Record<ProjectTab, number> {
  const out = { active: 0, completed: 0, archived: 0, all: projects.length };
  for (const p of projects) out[projectTab(p)] += 1;
  return out;
}

export function filterProjects(
  projects: Project[],
  clientName: (id: string) => string,
  { tab = "active", q = "", sort = "due" }: ProjectSearch,
): Project[] {
  const needle = q.trim().toLowerCase();
  const byName = (a: Project, b: Project) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  const compare: Record<ProjectSort, (a: Project, b: Project) => number> = {
    due: (a, b) => a.dueDate.localeCompare(b.dueDate) || byName(a, b),
    recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b),
    value: (a, b) => b.value - a.value || byName(a, b),
    name: byName,
  };
  return projects
    .filter((p) => tab === "all" || projectTab(p) === tab)
    .filter(
      (p) =>
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        clientName(p.clientId).toLowerCase().includes(needle),
    )
    .sort(compare[sort]);
}

/** Share of checklist tasks done, 0–100. */
export function projectProgress(tasks: ProjectTask[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

/** Past its delivery date and not yet delivered or completed. */
export function isOverdue(p: Project, today: string): boolean {
  return (
    p.dueDate < today &&
    (p.status === "planning" || p.status === "shooting" || p.status === "editing")
  );
}

export function daysUntil(date: string, today: string): number {
  return Math.round(
    (Date.parse(`${date}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86_400_000,
  );
}

/** Money for a project from the invoices linked to it. */
export function projectMoney(p: Project, invoices: Invoice[]) {
  const linked = invoices.filter((i) => i.projectId === p.id && i.status !== "void");
  const invoiced = linked
    .filter((i) => i.status !== "draft")
    .reduce((s, i) => s + invoiceTotal(i), 0);
  const paid = linked.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = linked.reduce((s, i) => s + invoiceBalance(i), 0);
  return {
    invoices: linked,
    invoiced: Math.round(invoiced * 100) / 100,
    paid: Math.round(paid * 100) / 100,
    outstanding: Math.round(outstanding * 100) / 100,
    /** Agreed value not yet invoiced. */
    uninvoiced: Math.max(0, Math.round((p.value - invoiced) * 100) / 100),
  };
}

/** The project a session or gallery belongs to, if any. */
export function projectOf(
  projects: Project[],
  item: { sessionId?: string; galleryId?: string },
): Project | undefined {
  return projects.find(
    (p) =>
      (item.sessionId && p.sessionIds.includes(item.sessionId)) ||
      (item.galleryId && p.galleryIds.includes(item.galleryId)),
  );
}

export const TASK_TEMPLATES: Record<ClientType, string[]> = {
  wedding: [
    "Contract signed",
    "Deposit paid",
    "Engagement session",
    "Timeline questionnaire",
    "Wedding day coverage",
    "Sneak peeks sent",
    "Gallery delivered",
  ],
  portrait: [
    "Session booked",
    "Prep guide sent",
    "Portrait session",
    "Retouch selects",
    "Gallery delivered",
  ],
  family: [
    "Session booked",
    "Wardrobe guide sent",
    "Family session",
    "Gallery delivered",
    "Print order",
  ],
  commercial: [
    "Proposal accepted",
    "Shot list agreed",
    "Shoot",
    "Retouch finals",
    "Deliver images",
  ],
  event: ["Run sheet received", "Event coverage", "Same-day highlights", "Full gallery delivered"],
};

export interface ProjectForm {
  name: string;
  clientId: string;
  startDate: string;
  dueDate: string;
  value: string;
}

export function validateProjectForm(f: ProjectForm): Partial<Record<keyof ProjectForm, string>> {
  const errors: Partial<Record<keyof ProjectForm, string>> = {};
  if (!f.name.trim()) errors.name = "Give the project a name.";
  else if (f.name.trim().length > 80) errors.name = "Keep it under 80 characters.";
  if (!f.clientId) errors.clientId = "Choose a client.";
  if (!f.startDate) errors.startDate = "Pick a start date.";
  if (!f.dueDate) errors.dueDate = "Pick a delivery date.";
  else if (f.startDate && f.dueDate < f.startDate)
    errors.dueDate = "Delivery can't be before the start.";
  if (f.value.trim() && !(Number(f.value) >= 0)) errors.value = "Enter an amount in dollars.";
  return errors;
}
