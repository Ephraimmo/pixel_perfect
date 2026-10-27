// Pixora demo store — React context over local state, persisted to
// localStorage. There is no backend: every action below operates on demo
// state and is honest about it in the UI.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ClientEventKind, ClientNote, Invoice, Payment } from "./crm-data";
import { PAYMENT_METHOD_LABELS, applyPayment, invoiceBalance, invoiceTotal } from "./invoices";
import type { Lead, LeadStage } from "./leads-data";
import { matchingClient } from "./leads";
import { slotLabel } from "./sessions";
import type { Project, ProjectStatus } from "./projects-data";
import { PROJECT_STATUS_LABELS } from "./projects";
import type { Quote, QuoteStatus } from "./quotes-data";
import type { Contract, ContractTemplate } from "./contracts-data";
import type { Answer, Question, Questionnaire, QuestionnaireTemplate } from "./questionnaires-data";
import type { EmailTemplate, SentEmail } from "./emails-data";
import type { Automation, AutomationRun } from "./automations-data";
import {
  DEMO_TODAY,
  PHOTOS,
  formatDate,
  migrateState,
  money,
  nowStamp,
  seedState,
  type Client,
  type DemoState,
  type Gallery,
  type Order,
  type Product,
  type Profile,
  type Session,
  type SessionChange,
  type TeamMember,
} from "./demo-data";

const STORAGE_KEY = "pixora-demo-v2";

function loadState(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export type SessionSlot = Pick<Session, "date" | "start" | "end">;
export type SessionEdit = Partial<
  Pick<Session, "title" | "clientId" | "kind" | "location" | "notes" | "date" | "start" | "end">
>;

const kindColor = (kind: Session["kind"]): Session["color"] =>
  kind === "consultation" ? "success" : kind === "editing" ? "violet" : "info";

/** Apply a change to one session and append it to that session's history. */
function changeSession(
  s: DemoState,
  id: string,
  patch: Partial<Session>,
  change: SessionChange["kind"],
  detail = "",
): DemoState {
  return {
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === id
        ? {
            ...x,
            ...patch,
            history: [...(x.history ?? []), { at: nowStamp(), kind: change, detail }],
          }
        : x,
    ),
  };
}

export type NewProjectInput = Pick<
  Project,
  "name" | "clientId" | "type" | "startDate" | "dueDate" | "value" | "sessionIds" | "galleryIds"
> & { tasks: string[] };
export type ProjectEdit = Partial<
  Pick<Project, "name" | "startDate" | "dueDate" | "value" | "notes" | "type">
>;

/** Give sessions/galleries to one project, removing them from any other. */
function claimForProject(
  s: DemoState,
  projectId: string,
  sessionIds: string[],
  galleryIds: string[],
): DemoState {
  const project = s.projects.find((p) => p.id === projectId);
  return {
    ...s,
    projects: s.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            sessionIds: [...new Set([...p.sessionIds, ...sessionIds])],
            galleryIds: [...new Set([...p.galleryIds, ...galleryIds])],
          }
        : {
            ...p,
            sessionIds: p.sessionIds.filter((x) => !sessionIds.includes(x)),
            galleryIds: p.galleryIds.filter((x) => !galleryIds.includes(x)),
          },
    ),
    // A gallery in a project is delivered to that project's client.
    galleries: s.galleries.map((g) =>
      galleryIds.includes(g.id) && project ? { ...g, clientId: project.clientId } : g,
    ),
  };
}

const patchProject = (s: DemoState, id: string, fn: (p: Project) => Partial<Project>) => ({
  ...s,
  projects: s.projects.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)),
});

export type NewContractInput = Pick<Contract, "title" | "clientId" | "projectId" | "templateId">;
export type ContractEdit = Partial<Pick<Contract, "title" | "body" | "projectId">>;

const patchContract = (s: DemoState, id: string, fn: (c: Contract) => Partial<Contract>) => ({
  ...s,
  contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)),
});

/** Update a contract and log the step on its client's activity. */
function contractStep(
  s: DemoState,
  id: string,
  fn: (c: Contract) => Partial<Contract>,
  kind: ClientEventKind,
  title: string,
): DemoState {
  const c = s.contracts.find((x) => x.id === id);
  if (!c) return s;
  return withEvent(patchContract(s, id, fn), c.clientId, kind, title, c.title);
}

export type SendQuestionnaireInput = {
  templateId: string;
  clientId: string;
  projectId?: string | undefined;
  dueDate: string;
};

/** Replace-or-append by id, keeping list order. */
function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

const patchQuestionnaire = (
  s: DemoState,
  id: string,
  fn: (q: Questionnaire) => Partial<Questionnaire>,
) => ({
  ...s,
  questionnaires: s.questionnaires.map((q) => (q.id === id ? { ...q, ...fn(q) } : q)),
});

export type SendEmailInput = {
  clientId: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string | undefined;
  scheduleAt?: string | undefined;
};

export type BookingRequestInput = NewLeadInput & { requested: NonNullable<Lead["requested"]> };

/** Apply a payment, add it to the client's lifetime spend and log it. */
function withPayment(s: DemoState, inv: Invoice, payment: Payment): DemoState {
  const next = applyPayment(inv, payment);
  const paid = next.amountPaid - inv.amountPaid;
  return withEvent(
    {
      ...s,
      invoices: s.invoices.map((i) => (i.id === inv.id ? next : i)),
      clients: s.clients.map((c) =>
        c.id === inv.clientId ? { ...c, totalSpent: c.totalSpent + paid } : c,
      ),
    },
    inv.clientId,
    "payment",
    next.status === "paid" ? `Invoice ${inv.number} paid` : `Payment on ${inv.number}`,
    `${money(paid)} · ${PAYMENT_METHOD_LABELS[payment.method]}${payment.note ? ` · ${payment.note}` : ""}`,
  );
}

/** Fields the studio fills in when logging an inquiry by hand. */
export type NewLeadInput = Pick<
  Lead,
  "name" | "email" | "phone" | "type" | "source" | "eventDate" | "location" | "budget" | "message"
>;

/** Fields the studio fills in when adding a client by hand. */
export type NewClientInput = Pick<
  Client,
  "name" | "email" | "phone" | "company" | "city" | "type" | "source" | "tags"
>;

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Record something that happened with a client and mark them as recently active. */
function withEvent(
  s: DemoState,
  clientId: string,
  kind: ClientEventKind,
  title: string,
  detail = "",
): DemoState {
  return {
    ...s,
    clientEvents: [
      { id: uid("e"), clientId, kind, title, detail, at: nowStamp() },
      ...s.clientEvents,
    ],
    clients: s.clients.map((c) => (c.id === clientId ? { ...c, lastActivity: DEMO_TODAY } : c)),
  };
}

const excerpt = (text: string, max = 80) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export interface DemoStore {
  state: DemoState;
  /** False until saved demo state has been read from localStorage. */
  ready: boolean;
  resetDemo: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  createGallery: (title: string) => Gallery;
  updateGallery: (id: string, patch: Partial<Gallery>) => void;
  addPhotos: (id: string, count: number) => void;
  toggleFavorite: (galleryId: string, photoId: string) => void;
  addClient: (input: NewClientInput) => Client;
  toggleClientStar: (id: string) => void;
  updateClient: (id: string, patch: NewClientInput) => void;
  setClientStatus: (id: string, status: Client["status"]) => void;
  addClientNote: (clientId: string, body: string) => ClientNote;
  toggleNotePin: (id: string) => void;
  deleteClientNote: (id: string) => void;
  restoreClientNote: (note: ClientNote) => void;
  linkGallery: (galleryId: string, clientId: string | undefined) => void;
  markInvoicePaid: (id: string) => void;
  recordPayment: (id: string, payment: Omit<Payment, "id">) => void;
  saveInvoice: (invoice: Invoice) => void;
  sendInvoice: (id: string) => void;
  remindInvoice: (id: string) => void;
  voidInvoice: (id: string) => void;
  /** Only while nothing has been paid. */
  revertInvoiceToDraft: (id: string) => void;
  deleteInvoice: (id: string) => void;
  restoreInvoice: (invoice: Invoice) => void;
  addLead: (input: NewLeadInput) => Lead;
  moveLead: (id: string, stage: LeadStage, lostReason?: string) => void;
  /** Turn a lead into a client (or link the existing one); returns the client id. */
  convertLead: (id: string) => string | null;
  deleteLead: (id: string) => void;
  /** Public booking page: a request lands in Leads as a new inquiry. */
  requestBooking: (input: BookingRequestInput) => Lead;
  /** Link the session created for a lead's requested slot. */
  setLeadSession: (leadId: string, sessionId: string) => void;
  /** Create or update a quote (matched by id). */
  saveQuote: (quote: Quote) => void;
  /** Send, revise (back to draft) or record the client's answer. */
  setQuoteStatus: (id: string, status: QuoteStatus) => void;
  deleteQuote: (id: string) => void;
  restoreQuote: (quote: Quote) => void;
  createContract: (input: NewContractInput) => Contract;
  updateContract: (id: string, patch: ContractEdit) => void;
  /** Freeze the resolved text, countersign as the studio and send. */
  sendContract: (id: string, resolvedBody: string) => void;
  /** Demo stand-ins for what the client does on their side. */
  markContractViewed: (id: string) => void;
  signContract: (id: string, name: string) => void;
  declineContract: (id: string, reason: string) => void;
  voidContract: (id: string) => void;
  remindContract: (id: string) => void;
  /** Back to an editable draft; clears the send and any signatures. */
  reviseContract: (id: string) => void;
  deleteContract: (id: string) => void;
  restoreContract: (contract: Contract) => void;
  saveContractTemplate: (template: ContractTemplate) => void;
  deleteContractTemplate: (id: string) => void;
  restoreContractTemplate: (template: ContractTemplate) => void;
  saveQuestionnaireTemplate: (template: QuestionnaireTemplate) => void;
  deleteQuestionnaireTemplate: (id: string) => void;
  restoreQuestionnaireTemplate: (template: QuestionnaireTemplate) => void;
  saveLibraryQuestion: (question: Question) => void;
  deleteLibraryQuestion: (id: string) => void;
  restoreLibraryQuestion: (question: Question) => void;
  sendQuestionnaire: (input: SendQuestionnaireInput) => Questionnaire;
  /** Client side: save without submitting. */
  saveQuestionnaireAnswers: (id: string, answers: Record<string, Answer>) => void;
  submitQuestionnaire: (id: string, answers: Record<string, Answer>) => void;
  remindQuestionnaire: (id: string) => void;
  /** Let the client edit a submitted questionnaire again. */
  reopenQuestionnaire: (id: string) => void;
  deleteQuestionnaire: (id: string) => void;
  restoreQuestionnaire: (q: Questionnaire) => void;
  saveEmailTemplate: (template: EmailTemplate) => void;
  deleteEmailTemplate: (id: string) => void;
  restoreEmailTemplate: (template: EmailTemplate) => void;
  /** Send now, or schedule when `scheduleAt` is set. `clientId` "" is a test to yourself. */
  sendEmail: (input: SendEmailInput) => SentEmail;
  cancelScheduledEmail: (id: string) => void;
  saveAutomation: (automation: Automation) => void;
  setAutomationActive: (id: string, active: boolean) => void;
  /** Pause or resume several workflows at once (for "Pause all" and its undo). */
  setAutomationsActive: (ids: string[], active: boolean) => void;
  deleteAutomation: (id: string) => void;
  restoreAutomation: (automation: Automation) => void;
  recordAutomationRun: (run: AutomationRun) => void;
  addProject: (input: NewProjectInput) => Project;
  updateProject: (id: string, patch: ProjectEdit) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  archiveProject: (id: string, archived: boolean) => void;
  deleteProject: (id: string) => void;
  restoreProject: (project: Project) => void;
  addProjectTask: (projectId: string, title: string) => void;
  toggleProjectTask: (projectId: string, taskId: string) => void;
  removeProjectTask: (projectId: string, taskId: string) => void;
  /** Link (or unlink) a session or gallery; an item belongs to one project at most. */
  linkToProject: (
    projectId: string,
    item: { sessionId: string } | { galleryId: string },
    linked: boolean,
  ) => void;
  restoreLead: (lead: Lead) => void;
  addSession: (input: Omit<Session, "id" | "color" | "status">) => Session;
  /** Edit details; a changed date or time is recorded as a reschedule. */
  updateSession: (id: string, patch: SessionEdit) => void;
  rescheduleSession: (id: string, slot: SessionSlot, notifyClient: boolean) => void;
  updateSessionStatus: (id: string, status: "pending" | "confirmed" | "completed") => void;
  cancelSession: (id: string, reason: string, notifyClient: boolean) => void;
  reinstateSession: (id: string) => void;
  addProduct: (input: Pick<Product, "name" | "category" | "price">) => void;
  toggleProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  inviteMember: (input: { name: string; email: string; role: TeamMember["role"] }) => void;
  toggleIntegration: (id: string) => void;
  publishTemplate: (id: string) => void;
}

const DemoContext = createContext<DemoStore | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => seedState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — demo state simply won't persist
    }
  }, [state, ready]);

  const value = useMemo<DemoStore>(() => {
    const patchList = <
      K extends "galleries" | "clients" | "sessions" | "products" | "orders" | "integrations",
    >(
      key: K,
      id: string,
      patch: (item: DemoState[K][number]) => Partial<DemoState[K][number]>,
    ) =>
      setState((s) => ({
        ...s,
        [key]: (s[key] as DemoState[K][number][]).map((item) =>
          item.id === id ? { ...item, ...patch(item) } : item,
        ),
      }));

    return {
      state,
      ready,
      resetDemo: () => setState(seedState()),
      updateProfile: (patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      createGallery: (title) => {
        const gallery: Gallery = {
          id: uid("g"),
          title,
          shortTitle: title,
          description: "",
          status: "draft",
          date: new Date().toISOString().slice(0, 10),
          updated: "Just now",
          photoCount: 0,
          cover: PHOTOS.lakeBanner,
          banner: PHOTOS.lakeBanner,
          photos: [],
          favorites: [],
          privacy: "public",
          password: "",
          allowDownloads: true,
          allowFavorites: true,
        };
        setState((s) => ({ ...s, galleries: [gallery, ...s.galleries] }));
        return gallery;
      },
      updateGallery: (id, patch) =>
        patchList("galleries", id, () => ({ ...patch, updated: "Just now" })),
      addPhotos: (id, count) =>
        patchList("galleries", id, (g) => {
          // Demo upload: borrow wedding frames that aren't in the gallery yet.
          const extra = PHOTOS.wedding.filter((p) => !g.photos.includes(p)).slice(0, count);
          const photos = [...g.photos, ...extra];
          return {
            photos,
            photoCount: g.photoCount + count,
            cover: g.photos.length ? g.cover : (photos[0] ?? g.cover),
            updated: "Just now",
          };
        }),
      toggleFavorite: (galleryId, photoId) =>
        patchList("galleries", galleryId, (g) => ({
          favorites: g.favorites.includes(photoId)
            ? g.favorites.filter((p) => p !== photoId)
            : [...g.favorites, photoId],
        })),
      addClient: (input) => {
        const client: Client = {
          ...input,
          id: uid("c"),
          avatar: "",
          sessions: 0,
          starred: false,
          status: "active",
          createdAt: DEMO_TODAY,
          lastActivity: DEMO_TODAY,
          totalSpent: 0,
        };
        setState((s) => ({ ...s, clients: [client, ...s.clients] }));
        return client;
      },
      toggleClientStar: (id) => patchList("clients", id, (c) => ({ starred: !c.starred })),
      updateClient: (id, patch) =>
        setState((s) =>
          withEvent(
            { ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
            id,
            "update",
            "Contact details updated",
          ),
        ),
      setClientStatus: (id, status) =>
        setState((s) =>
          withEvent(
            { ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, status } : c)) },
            id,
            "update",
            status === "past" ? "Marked as a past client" : "Marked as an active client",
          ),
        ),
      addClientNote: (clientId, body) => {
        const note: ClientNote = {
          id: uid("n"),
          clientId,
          body,
          createdAt: nowStamp(),
          pinned: false,
        };
        setState((s) =>
          withEvent(
            { ...s, clientNotes: [note, ...s.clientNotes] },
            clientId,
            "note",
            "Note added",
            excerpt(body),
          ),
        );
        return note;
      },
      toggleNotePin: (id) =>
        setState((s) => ({
          ...s,
          clientNotes: s.clientNotes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      deleteClientNote: (id) =>
        setState((s) => ({ ...s, clientNotes: s.clientNotes.filter((n) => n.id !== id) })),
      restoreClientNote: (note) =>
        setState((s) =>
          s.clientNotes.some((n) => n.id === note.id)
            ? s
            : { ...s, clientNotes: [note, ...s.clientNotes] },
        ),
      linkGallery: (galleryId, clientId) =>
        setState((s) => {
          const g = s.galleries.find((x) => x.id === galleryId);
          if (!g) return s;
          const next = {
            ...s,
            galleries: s.galleries.map((x) => (x.id === galleryId ? { ...x, clientId } : x)),
          };
          const target = clientId ?? g.clientId;
          if (!target) return next;
          return withEvent(
            next,
            target,
            "gallery",
            clientId ? "Gallery linked" : "Gallery unlinked",
            g.title,
          );
        }),
      markInvoicePaid: (id) =>
        setState((s) => {
          const inv = s.invoices.find((i) => i.id === id);
          if (!inv || invoiceBalance(inv) <= 0) return s;
          return withPayment(s, inv, {
            id: uid("pay"),
            amount: invoiceBalance(inv),
            date: DEMO_TODAY,
            method: "other",
            note: "Marked paid in full",
          });
        }),
      recordPayment: (id, payment) =>
        setState((s) => {
          const inv = s.invoices.find((i) => i.id === id);
          if (!inv || invoiceBalance(inv) <= 0) return s;
          return withPayment(s, inv, { ...payment, id: uid("pay") });
        }),
      saveInvoice: (invoice) =>
        setState((s) => ({
          ...s,
          invoices: s.invoices.some((i) => i.id === invoice.id)
            ? s.invoices.map((i) => (i.id === invoice.id ? invoice : i))
            : [invoice, ...s.invoices],
        })),
      sendInvoice: (id) =>
        setState((s) => {
          const inv = s.invoices.find((i) => i.id === id);
          if (!inv || inv.status !== "draft") return s;
          return withEvent(
            { ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: "sent" } : i)) },
            inv.clientId,
            "invoice",
            `Invoice ${inv.number} sent`,
            `${money(invoiceTotal(inv))} · due ${formatDate(inv.dueDate)}`,
          );
        }),
      remindInvoice: (id) =>
        setState((s) => {
          const inv = s.invoices.find((i) => i.id === id);
          if (!inv) return s;
          return withEvent(
            {
              ...s,
              invoices: s.invoices.map((i) => (i.id === id ? { ...i, remindedAt: nowStamp() } : i)),
            },
            inv.clientId,
            "email",
            "Payment reminder sent",
            `${inv.number} · ${money(invoiceBalance(inv))} due`,
          );
        }),
      voidInvoice: (id) =>
        setState((s) => {
          const inv = s.invoices.find((i) => i.id === id);
          if (!inv) return s;
          return withEvent(
            { ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: "void" } : i)) },
            inv.clientId,
            "invoice",
            `Invoice ${inv.number} voided`,
          );
        }),
      revertInvoiceToDraft: (id) =>
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((i) =>
            i.id === id && !(i.payments?.length || i.amountPaid) ? { ...i, status: "draft" } : i,
          ),
        })),
      deleteInvoice: (id) =>
        setState((s) => ({ ...s, invoices: s.invoices.filter((i) => i.id !== id) })),
      restoreInvoice: (invoice) =>
        setState((s) =>
          s.invoices.some((i) => i.id === invoice.id)
            ? s
            : { ...s, invoices: [invoice, ...s.invoices] },
        ),
      addLead: (input) => {
        const at = nowStamp();
        const lead: Lead = {
          ...input,
          id: uid("l"),
          stage: "new",
          receivedAt: at,
          history: [{ stage: "new", at }],
          lostReason: "",
        };
        setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
        return lead;
      },
      moveLead: (id, stage, lostReason = "") =>
        setState((s) => ({
          ...s,
          leads: s.leads.map((l) =>
            l.id === id && l.stage !== stage
              ? {
                  ...l,
                  stage,
                  lostReason: stage === "lost" ? lostReason : "",
                  history: [...l.history, { stage, at: nowStamp() }],
                }
              : l,
          ),
        })),
      convertLead: (id) => {
        const lead = state.leads.find((l) => l.id === id);
        if (!lead) return null;
        const existing = matchingClient(lead, state.clients);
        const clientId = existing?.id ?? uid("c");
        setState((s) => {
          const at = nowStamp();
          const leads = s.leads.map((l) =>
            l.id === id
              ? {
                  ...l,
                  clientId,
                  stage: "booked" as const,
                  lostReason: "",
                  history:
                    l.stage === "booked"
                      ? l.history
                      : [...l.history, { stage: "booked" as const, at }],
                }
              : l,
          );
          if (existing || s.clients.some((c) => c.id === clientId)) {
            return withEvent(
              { ...s, leads },
              clientId,
              "update",
              "New booking from inquiry",
              excerpt(lead.message),
            );
          }
          const client: Client = {
            id: clientId,
            name: lead.name,
            email: lead.email.toLowerCase(),
            phone: lead.phone,
            company: "",
            city: lead.location.split(",").at(-1)?.trim() ?? "",
            type: lead.type,
            source: lead.source,
            tags: [],
            avatar: "",
            sessions: 0,
            starred: false,
            status: "active",
            createdAt: DEMO_TODAY,
            lastActivity: DEMO_TODAY,
            totalSpent: 0,
          };
          return withEvent(
            { ...s, leads, clients: [client, ...s.clients] },
            clientId,
            "update",
            "Converted from inquiry",
            excerpt(lead.message),
          );
        });
        return clientId;
      },
      requestBooking: (input) => {
        const at = nowStamp();
        const lead: Lead = {
          ...input,
          id: uid("l"),
          stage: "new",
          receivedAt: at,
          history: [{ stage: "new", at }],
          lostReason: "",
        };
        setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
        return lead;
      },
      setLeadSession: (leadId, sessionId) =>
        setState((s) => ({
          ...s,
          leads: s.leads.map((l) => (l.id === leadId ? { ...l, sessionId } : l)),
        })),
      saveQuote: (quote) =>
        setState((s) => ({
          ...s,
          quotes: s.quotes.some((q) => q.id === quote.id)
            ? s.quotes.map((q) => (q.id === quote.id ? quote : q))
            : [quote, ...s.quotes],
        })),
      setQuoteStatus: (id, status) =>
        setState((s) => {
          const q = s.quotes.find((x) => x.id === id);
          if (!q || q.status === status) return s;
          const answered = status === "accepted" || status === "declined";
          let next: DemoState = {
            ...s,
            quotes: s.quotes.map((x) =>
              x.id === id ? { ...x, status, respondedAt: answered ? DEMO_TODAY : undefined } : x,
            ),
          };
          const label = `Quote ${q.number}`;
          const detail = `${q.title} · ${money(invoiceTotal(q))}`;
          if (q.clientId) {
            if (status === "sent")
              next = withEvent(next, q.clientId, "email", `${label} sent`, detail);
            if (answered)
              next = withEvent(next, q.clientId, "update", `${label} ${status}`, detail);
          }
          // Sending a proposal to an open lead moves it along the pipeline.
          if (q.leadId && status === "sent") {
            next = {
              ...next,
              leads: next.leads.map((l) =>
                l.id === q.leadId && ["new", "contacted", "consultation"].includes(l.stage)
                  ? {
                      ...l,
                      stage: "proposal" as const,
                      history: [...l.history, { stage: "proposal" as const, at: nowStamp() }],
                    }
                  : l,
              ),
            };
          }
          return next;
        }),
      deleteQuote: (id) => setState((s) => ({ ...s, quotes: s.quotes.filter((q) => q.id !== id) })),
      restoreQuote: (quote) =>
        setState((s) =>
          s.quotes.some((q) => q.id === quote.id) ? s : { ...s, quotes: [quote, ...s.quotes] },
        ),
      createContract: (input) => {
        const template = state.contractTemplates.find((t) => t.id === input.templateId);
        const contract: Contract = {
          ...input,
          id: uid("k"),
          body: template?.body ?? "",
          status: "draft",
          createdAt: DEMO_TODAY,
        };
        setState((s) => ({ ...s, contracts: [contract, ...s.contracts] }));
        return contract;
      },
      updateContract: (id, patch) => setState((s) => patchContract(s, id, () => patch)),
      sendContract: (id, resolvedBody) =>
        setState((s) =>
          contractStep(
            s,
            id,
            () => {
              const at = nowStamp();
              return {
                status: "sent",
                sentBody: resolvedBody,
                sentAt: at,
                studioSignature: { name: s.profile.name, signedAt: at },
              };
            },
            "email",
            "Contract sent for signature",
          ),
        ),
      markContractViewed: (id) =>
        setState((s) =>
          contractStep(
            s,
            id,
            () => ({ status: "viewed", viewedAt: nowStamp() }),
            "contract",
            "Contract viewed",
          ),
        ),
      signContract: (id, name) =>
        setState((s) => {
          const c = s.contracts.find((x) => x.id === id);
          let next = contractStep(
            s,
            id,
            (x) => {
              const at = nowStamp();
              return {
                status: "signed",
                viewedAt: x.viewedAt ?? at,
                clientSignature: { name, signedAt: at },
              };
            },
            "contract",
            "Contract signed",
          );
          // Tick the project's "Contract signed" task, if it has one.
          if (c?.projectId)
            next = patchProject(next, c.projectId, (p) => ({
              tasks: p.tasks.map((t) =>
                /contract signed/i.test(t.title) ? { ...t, done: true } : t,
              ),
            }));
          return next;
        }),
      declineContract: (id, reason) =>
        setState((s) =>
          contractStep(
            s,
            id,
            () => ({ status: "declined", declineReason: reason }),
            "contract",
            "Contract declined",
          ),
        ),
      voidContract: (id) =>
        setState((s) =>
          contractStep(s, id, () => ({ status: "void" }), "contract", "Contract voided"),
        ),
      remindContract: (id) =>
        setState((s) =>
          contractStep(
            s,
            id,
            () => ({ remindedAt: nowStamp() }),
            "email",
            "Signature reminder sent",
          ),
        ),
      reviseContract: (id) =>
        setState((s) =>
          patchContract(s, id, () => ({
            status: "draft",
            sentBody: undefined,
            sentAt: undefined,
            viewedAt: undefined,
            remindedAt: undefined,
            studioSignature: undefined,
            clientSignature: undefined,
            declineReason: undefined,
          })),
        ),
      deleteContract: (id) =>
        setState((s) => ({ ...s, contracts: s.contracts.filter((c) => c.id !== id) })),
      restoreContract: (contract) =>
        setState((s) =>
          s.contracts.some((c) => c.id === contract.id)
            ? s
            : { ...s, contracts: [contract, ...s.contracts] },
        ),
      saveContractTemplate: (template) =>
        setState((s) => ({
          ...s,
          contractTemplates: s.contractTemplates.some((t) => t.id === template.id)
            ? s.contractTemplates.map((t) => (t.id === template.id ? template : t))
            : [...s.contractTemplates, template],
        })),
      deleteContractTemplate: (id) =>
        setState((s) => ({
          ...s,
          contractTemplates: s.contractTemplates.filter((t) => t.id !== id),
        })),
      restoreContractTemplate: (template) =>
        setState((s) =>
          s.contractTemplates.some((t) => t.id === template.id)
            ? s
            : { ...s, contractTemplates: [...s.contractTemplates, template] },
        ),
      saveQuestionnaireTemplate: (t) =>
        setState((s) => ({ ...s, questionnaireTemplates: upsert(s.questionnaireTemplates, t) })),
      deleteQuestionnaireTemplate: (id) =>
        setState((s) => ({
          ...s,
          questionnaireTemplates: s.questionnaireTemplates.filter((t) => t.id !== id),
        })),
      restoreQuestionnaireTemplate: (t) =>
        setState((s) => ({ ...s, questionnaireTemplates: upsert(s.questionnaireTemplates, t) })),
      saveLibraryQuestion: (q) =>
        setState((s) => ({ ...s, questionLibrary: upsert(s.questionLibrary, q) })),
      deleteLibraryQuestion: (id) =>
        setState((s) => ({ ...s, questionLibrary: s.questionLibrary.filter((q) => q.id !== id) })),
      restoreLibraryQuestion: (q) =>
        setState((s) => ({ ...s, questionLibrary: upsert(s.questionLibrary, q) })),
      sendQuestionnaire: ({ templateId, clientId, projectId, dueDate }) => {
        const t = state.questionnaireTemplates.find((x) => x.id === templateId);
        const sent: Questionnaire = {
          id: uid("qn"),
          title: t?.name ?? "Questionnaire",
          templateId,
          clientId,
          projectId,
          questions: (t?.questions ?? []).map((q) => ({ ...q, options: [...q.options] })),
          answers: {},
          status: "sent",
          sentAt: nowStamp(),
          dueDate,
        };
        setState((s) =>
          withEvent(
            { ...s, questionnaires: [sent, ...s.questionnaires] },
            clientId,
            "email",
            "Questionnaire sent",
            `${sent.title} · due ${formatDate(dueDate)}`,
          ),
        );
        return sent;
      },
      saveQuestionnaireAnswers: (id, answers) =>
        setState((s) =>
          patchQuestionnaire(s, id, (q) =>
            q.status === "submitted"
              ? {}
              : { answers, status: "in_progress", lastSavedAt: nowStamp() },
          ),
        ),
      submitQuestionnaire: (id, answers) =>
        setState((s) => {
          const q = s.questionnaires.find((x) => x.id === id);
          if (!q || q.status === "submitted") return s;
          const at = nowStamp();
          return withEvent(
            patchQuestionnaire(s, id, () => ({
              answers,
              status: "submitted",
              submittedAt: at,
              lastSavedAt: at,
            })),
            q.clientId,
            "update",
            "Questionnaire submitted",
            q.title,
          );
        }),
      remindQuestionnaire: (id) =>
        setState((s) => {
          const q = s.questionnaires.find((x) => x.id === id);
          if (!q) return s;
          return withEvent(
            patchQuestionnaire(s, id, () => ({ remindedAt: nowStamp() })),
            q.clientId,
            "email",
            "Questionnaire reminder sent",
            q.title,
          );
        }),
      reopenQuestionnaire: (id) =>
        setState((s) =>
          patchQuestionnaire(s, id, () => ({ status: "in_progress", submittedAt: undefined })),
        ),
      deleteQuestionnaire: (id) =>
        setState((s) => ({ ...s, questionnaires: s.questionnaires.filter((q) => q.id !== id) })),
      restoreQuestionnaire: (q) =>
        setState((s) =>
          s.questionnaires.some((x) => x.id === q.id)
            ? s
            : { ...s, questionnaires: [q, ...s.questionnaires] },
        ),
      saveEmailTemplate: (t) =>
        setState((s) => ({ ...s, emailTemplates: upsert(s.emailTemplates, t) })),
      deleteEmailTemplate: (id) =>
        setState((s) => ({ ...s, emailTemplates: s.emailTemplates.filter((t) => t.id !== id) })),
      restoreEmailTemplate: (t) =>
        setState((s) => ({ ...s, emailTemplates: upsert(s.emailTemplates, t) })),
      sendEmail: ({ scheduleAt, ...input }) => {
        const email: SentEmail = {
          ...input,
          id: uid("em"),
          status: scheduleAt ? "scheduled" : "sent",
          at: scheduleAt ?? nowStamp(),
        };
        setState((s) => {
          const next = { ...s, sentEmails: [email, ...s.sentEmails] };
          if (!input.clientId) return next;
          return withEvent(
            next,
            input.clientId,
            "email",
            scheduleAt
              ? `Email scheduled for ${formatDate(scheduleAt.slice(0, 10))}`
              : "Email sent",
            input.subject,
          );
        });
        return email;
      },
      cancelScheduledEmail: (id) =>
        setState((s) => ({
          ...s,
          sentEmails: s.sentEmails.filter((e) => !(e.id === id && e.status === "scheduled")),
        })),
      saveAutomation: (a) =>
        setState((s) => ({
          ...s,
          automations: upsert(s.automations, { ...a, updatedAt: DEMO_TODAY }),
        })),
      setAutomationActive: (id, active) =>
        setState((s) => ({
          ...s,
          automations: s.automations.map((a) => (a.id === id ? { ...a, active } : a)),
        })),
      setAutomationsActive: (ids, active) =>
        setState((s) => ({
          ...s,
          automations: s.automations.map((a) => (ids.includes(a.id) ? { ...a, active } : a)),
        })),
      deleteAutomation: (id) =>
        setState((s) => ({ ...s, automations: s.automations.filter((a) => a.id !== id) })),
      restoreAutomation: (a) => setState((s) => ({ ...s, automations: upsert(s.automations, a) })),
      recordAutomationRun: (run) =>
        setState((s) => ({ ...s, automationRuns: [run, ...s.automationRuns] })),
      addProject: ({ tasks, sessionIds, galleryIds, ...input }) => {
        const id = uid("pr");
        const project: Project = {
          ...input,
          id,
          status: "planning",
          sessionIds: [],
          galleryIds: [],
          tasks: tasks.map((title, i) => ({ id: `${id}-t${i + 1}`, title, done: false })),
          notes: "",
          archived: false,
          createdAt: DEMO_TODAY,
        };
        setState((s) =>
          withEvent(
            claimForProject(
              { ...s, projects: [project, ...s.projects] },
              id,
              sessionIds,
              galleryIds,
            ),
            input.clientId,
            "update",
            "Project created",
            input.name,
          ),
        );
        return project;
      },
      updateProject: (id, patch) => setState((s) => patchProject(s, id, () => patch)),
      setProjectStatus: (id, status) =>
        setState((s) => {
          const p = s.projects.find((x) => x.id === id);
          if (!p || p.status === status) return s;
          return withEvent(
            patchProject(s, id, () => ({ status })),
            p.clientId,
            "update",
            `Project moved to ${PROJECT_STATUS_LABELS[status]}`,
            p.name,
          );
        }),
      archiveProject: (id, archived) => setState((s) => patchProject(s, id, () => ({ archived }))),
      deleteProject: (id) =>
        setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) })),
      restoreProject: (project) =>
        setState((s) =>
          s.projects.some((p) => p.id === project.id)
            ? s
            : claimForProject(
                { ...s, projects: [project, ...s.projects] },
                project.id,
                project.sessionIds,
                project.galleryIds,
              ),
        ),
      addProjectTask: (projectId, title) =>
        setState((s) =>
          patchProject(s, projectId, (p) => ({
            tasks: [...p.tasks, { id: uid("t"), title, done: false }],
          })),
        ),
      toggleProjectTask: (projectId, taskId) =>
        setState((s) =>
          patchProject(s, projectId, (p) => ({
            tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          })),
        ),
      removeProjectTask: (projectId, taskId) =>
        setState((s) =>
          patchProject(s, projectId, (p) => ({ tasks: p.tasks.filter((t) => t.id !== taskId) })),
        ),
      linkToProject: (projectId, item, linked) =>
        setState((s) => {
          const sessionIds = "sessionId" in item ? [item.sessionId] : [];
          const galleryIds = "galleryId" in item ? [item.galleryId] : [];
          if (linked) return claimForProject(s, projectId, sessionIds, galleryIds);
          return patchProject(s, projectId, (p) => ({
            sessionIds: p.sessionIds.filter((x) => !sessionIds.includes(x)),
            galleryIds: p.galleryIds.filter((x) => !galleryIds.includes(x)),
          }));
        }),
      deleteLead: (id) => setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) })),
      restoreLead: (lead) =>
        setState((s) =>
          s.leads.some((l) => l.id === lead.id) ? s : { ...s, leads: [lead, ...s.leads] },
        ),
      addSession: (input) => {
        const session: Session = {
          ...input,
          id: uid("s"),
          status: "pending",
          color: kindColor(input.kind),
          history: [{ at: nowStamp(), kind: "created", detail: "" }],
        };
        setState((s) =>
          withEvent(
            {
              ...s,
              sessions: [...s.sessions, session],
              clients: s.clients.map((c) =>
                c.id === input.clientId ? { ...c, sessions: c.sessions + 1 } : c,
              ),
            },
            input.clientId,
            "session",
            "Session booked",
            `${input.title} · ${formatDate(input.date)}`,
          ),
        );
        return session;
      },
      updateSession: (id, patch) =>
        setState((s) => {
          const prev = s.sessions.find((x) => x.id === id);
          if (!prev) return s;
          const moved =
            (patch.date ?? prev.date) !== prev.date || (patch.start ?? prev.start) !== prev.start;
          const next = { ...patch, ...(patch.kind ? { color: kindColor(patch.kind) } : {}) };
          return moved
            ? changeSession(
                s,
                id,
                next,
                "rescheduled",
                `Moved from ${slotLabel(prev.date, prev.start)} to ${slotLabel(patch.date ?? prev.date, patch.start ?? prev.start)}`,
              )
            : changeSession(s, id, next, "edited", "Details updated");
        }),
      rescheduleSession: (id, slot, notifyClient) =>
        setState((s) => {
          const prev = s.sessions.find((x) => x.id === id);
          if (!prev) return s;
          const detail = `${prev.title}: ${slotLabel(prev.date, prev.start)} → ${slotLabel(slot.date, slot.start)}`;
          let next = changeSession(
            s,
            id,
            slot,
            "rescheduled",
            `Moved from ${slotLabel(prev.date, prev.start)} to ${slotLabel(slot.date, slot.start)}`,
          );
          next = withEvent(next, prev.clientId, "session", "Session rescheduled", detail);
          if (notifyClient)
            next = withEvent(next, prev.clientId, "email", "Reschedule notice sent", detail);
          return next;
        }),
      updateSessionStatus: (id, status) =>
        setState((s) =>
          changeSession(
            s,
            id,
            { status },
            status === "pending" ? "edited" : status,
            status === "pending" ? "Marked as pending" : "",
          ),
        ),
      cancelSession: (id, reason, notifyClient) =>
        setState((s) => {
          const prev = s.sessions.find((x) => x.id === id);
          if (!prev) return s;
          const detail = `${prev.title} · ${slotLabel(prev.date, prev.start)}`;
          let next = changeSession(
            s,
            id,
            { status: "cancelled", cancelReason: reason },
            "cancelled",
            reason,
          );
          next = withEvent(
            next,
            prev.clientId,
            "session",
            "Session cancelled",
            `${detail} — ${reason}`,
          );
          if (notifyClient)
            next = withEvent(next, prev.clientId, "email", "Cancellation notice sent", detail);
          return next;
        }),
      reinstateSession: (id) =>
        setState((s) =>
          changeSession(
            s,
            id,
            { status: "pending", cancelReason: undefined },
            "reinstated",
            "Back on the calendar as pending",
          ),
        ),
      addProduct: (input) =>
        setState((s) => ({
          ...s,
          products: [
            ...s.products,
            { ...input, id: uid("p"), popular: false, image: PHOTOS.wedding[5], active: true },
          ],
        })),
      toggleProduct: (id) => patchList("products", id, (p) => ({ active: !p.active })),
      updateOrderStatus: (id, status) => patchList("orders", id, () => ({ status })),
      inviteMember: ({ name, email, role }) =>
        setState((s) => ({
          ...s,
          team: [
            ...s.team,
            { id: uid("t"), name, email, role, status: "pending", avatar: PHOTOS.avatars.sarah },
          ],
        })),
      toggleIntegration: (id) =>
        patchList("integrations", id, (i) => ({ connected: !i.connected })),
      publishTemplate: (id) => setState((s) => ({ ...s, publishedTemplate: id })),
    };
  }, [state, ready]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoStore {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
