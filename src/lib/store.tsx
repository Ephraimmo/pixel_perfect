// Pixora demo store — React context over local state, persisted to
// localStorage. There is no backend: every action below operates on demo
// state and is honest about it in the UI.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ClientEventKind, ClientNote } from "./crm-data";
import { invoiceBalance } from "./invoices";
import type { Lead, LeadStage } from "./leads-data";
import { matchingClient } from "./leads";
import { slotLabel } from "./sessions";
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

export type BookingRequestInput = NewLeadInput & { requested: NonNullable<Lead["requested"]> };

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
  addLead: (input: NewLeadInput) => Lead;
  moveLead: (id: string, stage: LeadStage, lostReason?: string) => void;
  /** Turn a lead into a client (or link the existing one); returns the client id. */
  convertLead: (id: string) => string | null;
  deleteLead: (id: string) => void;
  /** Public booking page: a request lands in Leads as a new inquiry. */
  requestBooking: (input: BookingRequestInput) => Lead;
  /** Link the session created for a lead's requested slot. */
  setLeadSession: (leadId: string, sessionId: string) => void;
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
          if (!inv) return s;
          const due = invoiceBalance(inv);
          const next: DemoState = {
            ...s,
            invoices: s.invoices.map((i) =>
              i.id === id
                ? { ...i, status: "paid", amountPaid: i.amountPaid + due, paidDate: DEMO_TODAY }
                : i,
            ),
            clients: s.clients.map((c) =>
              c.id === inv.clientId ? { ...c, totalSpent: c.totalSpent + due } : c,
            ),
          };
          return withEvent(
            next,
            inv.clientId,
            "payment",
            `Invoice ${inv.number} paid`,
            `${money(due)} · recorded manually`,
          );
        }),
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
