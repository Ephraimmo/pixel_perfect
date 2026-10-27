// Contract helpers — merge fields, the markdown-lite renderer, signature
// status and list filtering. Pure so the editor, preview and tests share them.

import type { Client, DemoState, Session } from "./demo-data";
import type { Project } from "./projects-data";
import type { Contract, ContractStatus } from "./contracts-data";

export const MERGE_FIELDS: { key: string; label: string }[] = [
  { key: "client.name", label: "Client name" },
  { key: "client.email", label: "Client email" },
  { key: "studio.name", label: "Studio name" },
  { key: "studio.email", label: "Studio email" },
  { key: "project.name", label: "Project name" },
  { key: "project.value", label: "Project value" },
  { key: "project.dueDate", label: "Delivery date" },
  { key: "deposit", label: "Deposit (30%)" },
  { key: "session.date", label: "First session date" },
  { key: "today", label: "Today's date" },
];

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export interface MergeContext {
  client?: Pick<Client, "name" | "email"> | undefined;
  studio: { name: string; email: string };
  project?: Pick<Project, "name" | "value" | "dueDate"> | undefined;
  firstSession?: Pick<Session, "date"> | undefined;
  today: string;
}

export function mergeValues(ctx: MergeContext): Record<string, string | undefined> {
  return {
    "client.name": ctx.client?.name,
    "client.email": ctx.client?.email,
    "studio.name": ctx.studio.name,
    "studio.email": ctx.studio.email,
    "project.name": ctx.project?.name,
    "project.value": ctx.project ? usd(ctx.project.value) : undefined,
    "project.dueDate": ctx.project ? longDate(ctx.project.dueDate) : undefined,
    deposit: ctx.project ? usd(Math.round(ctx.project.value * 0.3 * 100) / 100) : undefined,
    "session.date": ctx.firstSession ? longDate(ctx.firstSession.date) : undefined,
    today: longDate(ctx.today),
  };
}

const FIELD_RE = /\{\{\s*([\w.]+)\s*\}\}/g;

/** Every {{field}} used in a body, in order, without duplicates. */
export function fieldsIn(body: string): string[] {
  return [...new Set([...body.matchAll(FIELD_RE)].map((m) => m[1]!))];
}

/**
 * Replace merge fields. Unknown or unavailable fields are left as {{field}}
 * and reported in `missing`, so the editor can flag them before sending.
 */
export function renderMerge(body: string, ctx: MergeContext): { text: string; missing: string[] } {
  return fillFields(body, mergeValues(ctx));
}

/** Replace {{field}} tokens from `values`; anything without a value stays and is reported. */
export function fillFields(
  body: string,
  values: Record<string, string | undefined>,
): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const text = body.replace(FIELD_RE, (whole, key: string) => {
    const v = values[key];
    if (v === undefined) {
      missing.add(key);
      return whole;
    }
    return v;
  });
  return { text, missing: [...missing] };
}

/** Context for a contract from demo state: its client, project and first session. */
export function contractContext(
  c: Pick<Contract, "clientId" | "projectId">,
  demo: Pick<DemoState, "clients" | "projects" | "sessions" | "profile">,
  today: string,
): MergeContext {
  const project = demo.projects.find((p) => p.id === c.projectId);
  const sessions = demo.sessions
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        (project ? project.sessionIds.includes(s.id) : s.clientId === c.clientId),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    client: demo.clients.find((x) => x.id === c.clientId),
    studio: { name: demo.profile.studio, email: demo.profile.email },
    project,
    firstSession: sessions.find((s) => s.date >= today) ?? sessions[0],
    today,
  };
}

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

/** Parse the markdown-lite body: "## " headings, "1. " numbered items, paragraphs. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    if (lines[0]!.startsWith("## ")) {
      blocks.push({ kind: "heading", text: lines[0]!.slice(3).trim() });
      const rest = lines.slice(1);
      if (rest.length) blocks.push({ kind: "para", text: rest.join(" ") });
    } else if (lines.every((l) => /^\d+\.\s/.test(l))) {
      blocks.push({ kind: "list", items: lines.map((l) => l.replace(/^\d+\.\s+/, "")) });
    } else {
      blocks.push({ kind: "para", text: lines.join(" ") });
    }
  }
  return blocks;
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  sent: "Awaiting signature",
  viewed: "Viewed",
  signed: "Signed",
  declined: "Declined",
  void: "Void",
};

export type ContractTab = "all" | "draft" | "awaiting" | "signed" | "closed";

export const CONTRACT_TABS: { value: ContractTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "awaiting", label: "Awaiting signature" },
  { value: "signed", label: "Signed" },
  { value: "closed", label: "Declined & void" },
];

export function contractTab(c: Pick<Contract, "status">): Exclude<ContractTab, "all"> {
  if (c.status === "draft") return "draft";
  if (c.status === "sent" || c.status === "viewed") return "awaiting";
  if (c.status === "signed") return "signed";
  return "closed";
}

export function countContracts(contracts: Contract[]): Record<ContractTab, number> {
  const out: Record<ContractTab, number> = {
    all: contracts.length,
    draft: 0,
    awaiting: 0,
    signed: 0,
    closed: 0,
  };
  for (const c of contracts) out[contractTab(c)] += 1;
  return out;
}

export interface ContractSearch {
  tab?: ContractTab;
  q?: string;
  view?: "templates";
}

export function validateContractSearch(raw: Record<string, unknown>): ContractSearch {
  const out: ContractSearch = {};
  const { tab, q, view } = raw;
  if (CONTRACT_TABS.some((t) => t.value === tab) && tab !== "all") out.tab = tab as ContractTab;
  if (typeof q === "string" && q.trim()) out.q = q;
  if (view === "templates") out.view = "templates";
  return out;
}

/** Awaiting first (oldest sent first, so chasers rise), then newest created. */
export function filterContracts(
  contracts: Contract[],
  clientName: (id: string) => string,
  { tab = "all", q = "" }: ContractSearch,
): Contract[] {
  const needle = q.trim().toLowerCase();
  const rank = (c: Contract) => ({ awaiting: 0, draft: 1, signed: 2, closed: 3 })[contractTab(c)];
  return contracts
    .filter((c) => tab === "all" || contractTab(c) === tab)
    .filter(
      (c) =>
        !needle ||
        c.title.toLowerCase().includes(needle) ||
        clientName(c.clientId).toLowerCase().includes(needle),
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (contractTab(a) === "awaiting"
          ? (a.sentAt ?? "").localeCompare(b.sentAt ?? "")
          : b.createdAt.localeCompare(a.createdAt)),
    );
}

/** Whole days a sent contract has been waiting for the client. */
export function daysWaiting(c: Pick<Contract, "status" | "sentAt">, today: string): number | null {
  if ((c.status !== "sent" && c.status !== "viewed") || !c.sentAt) return null;
  return Math.max(
    0,
    Math.round(
      (Date.parse(`${today}T12:00:00`) - Date.parse(`${c.sentAt.slice(0, 10)}T12:00:00`)) /
        86_400_000,
    ),
  );
}

/** A typed signature must match the client's name, ignoring case and spacing. */
export function signatureMatches(typed: string, clientName: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return norm(typed) !== "" && norm(typed) === norm(clientName);
}

export const isContractEditable = (c: Pick<Contract, "status">) => c.status === "draft";
