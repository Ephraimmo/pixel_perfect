// Pixora demo store — React context over local state, persisted to
// localStorage. There is no backend: every action below operates on demo
// state and is honest about it in the UI.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  lineTotal,
  seedState,
  iso,
  dateOnly,
  type ActivityItem,
  type Client,
  type Coupon,
  type DemoState,
  type Gallery,
  type GalleryPhoto,
  type GalleryStatus,
  type Lead,
  type LeadStage,
  type LineItem,
  type Order,
  type Product,
  type Session,
  type TeamMember,
} from "./demo-data";

const STORAGE_KEY = "pixora-demo-v1";
const STATE_VERSION = 1;

function loadState(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.galleries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface DemoStore {
  state: DemoState;
  ready: boolean;
  resetDemo: () => void;
  signInDemo: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
  // galleries
  createGallery: (input: {
    title: string;
    clientId: string | null;
    eventName: string;
    eventDate: string;
    photos: GalleryPhoto[];
    status: GalleryStatus;
    password?: string;
    expiresAt?: string | null;
    allowDownloads?: boolean;
    allowFavorites?: boolean;
    allowProofing?: boolean;
    showWatermark?: boolean;
  }) => Gallery;
  updateGallery: (id: string, patch: Partial<Gallery>) => void;
  deleteGallery: (id: string) => void;
  duplicateGallery: (id: string) => string | null;
  toggleClientFavorite: (galleryId: string, photoId: string) => void;
  toggleClientSelection: (galleryId: string, photoId: string) => void;
  addGalleryComment: (galleryId: string, photoId: string, author: string, body: string) => void;
  registerGalleryView: (shareSlug: string) => void;
  // clients
  addClient: (input: { name: string; email: string; phone: string; tags?: string[]; status?: Client["status"] }) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientNote: (id: string, body: string) => void;
  // leads
  addLead: (input: Omit<Lead, "id" | "stage" | "createdAt">) => Lead;
  updateLeadStage: (id: string, stage: LeadStage) => void;
  deleteLead: (id: string) => void;
  convertLead: (id: string) => string | null;
  // sessions
  addSession: (input: Omit<Session, "id" | "status">) => Session;
  updateSession: (id: string, patch: Partial<Session>) => void;
  // billing
  addInvoice: (input: { clientId: string; items: LineItem[]; dueDate: string }) => void;
  updateInvoiceStatus: (id: string, status: "draft" | "sent" | "paid" | "overdue") => void;
  addQuote: (input: { clientId: string; title: string; items: LineItem[]; validUntil: string }) => void;
  updateQuoteStatus: (id: string, status: "draft" | "sent" | "accepted" | "declined") => void;
  updateContractStatus: (id: string, status: "draft" | "awaiting-signature" | "signed") => void;
  // store
  addProduct: (input: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  placeOrder: (input: { clientId: string; items: LineItem[] }) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  addCoupon: (code: string, percentOff: number) => void;
  toggleCoupon: (id: string) => void;
  deleteCoupon: (id: string) => void;
  // team & website
  inviteTeamMember: (name: string, email: string, role: TeamMember["role"]) => void;
  removeTeamMember: (id: string) => void;
  updateWebsitePage: (id: string, patch: Partial<DemoState["websitePages"][number]>) => void;
  setDomain: (hostname: string, configured: boolean) => void;
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
    const logActivity = (kind: ActivityItem["kind"], message: string) => {
      setState((s) => ({
        ...s,
        activity: [
          { id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, message, time: iso(0) },
          ...s.activity,
        ].slice(0, 40),
      }));
    };

    const addToList = <K extends keyof DemoState>(key: K, item: unknown) =>
      setState((s) => ({ ...s, [key]: [...(s[key] as unknown[]), item] }) as DemoState);

    const patchItem = <K extends keyof DemoState>(
      key: K,
      id: string,
      patch: Record<string, unknown>,
      match?: (item: { id: string }) => boolean,
    ) =>
      setState((s) => ({
        ...s,
        [key]: (s[key] as { id: string }[]).map((item) =>
          (match ? match(item) : item.id === id) ? { ...item, ...patch } : item,
        ),
      }) as DemoState);

    const removeItem = <K extends keyof DemoState>(key: K, id: string) =>
      setState((s) => ({
        ...s,
        [key]: (s[key] as { id: string }[]).filter((item) => item.id !== id),
      }) as DemoState);

    return {
      state,
      ready,
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(seedState());
      },
      signInDemo: () => setState((s) => ({ ...s, signedIn: true })),
      signOut: () => setState((s) => ({ ...s, signedIn: false })),
      completeOnboarding: () => setState((s) => ({ ...s, onboarded: true })),

      createGallery: (input) => {
        const gid = `g-${Date.now().toString(36)}`;
        const gallery: Gallery = {
          id: gid,
          title: input.title,
          clientId: input.clientId,
          eventName: input.eventName,
          eventDate: input.eventDate,
          status: input.status,
          shareSlug: input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || gid,
          coverSeed: input.photos[0]?.seed ?? "pixora-cover",
          photos: input.photos,
          collections: [],
          password: input.password ?? "",
          expiresAt: input.expiresAt ?? null,
          allowDownloads: input.allowDownloads ?? true,
          allowFavorites: input.allowFavorites ?? true,
          allowProofing: input.allowProofing ?? false,
          showWatermark: input.showWatermark ?? false,
          downloadPin: "",
          createdAt: iso(0),
          clientFavorites: [],
          clientSelections: [],
          comments: [],
          views: 0,
        };
        addToList("galleries", gallery);
        logActivity("gallery", `Gallery “${gallery.title}” created with ${gallery.photos.length} photos`);
        return gallery;
      },
      updateGallery: (id, patch) => {
        patchItem("galleries", id, patch);
        if (patch.status) logActivity("gallery", `Gallery status set to ${patch.status}`);
      },
      deleteGallery: (id) => {
        setState((s) => {
          const g = s.galleries.find((x) => x.id === id);
          if (g) logActivity("gallery", `Gallery “${g.title}” deleted`);
          return { ...s, galleries: s.galleries.filter((x) => x.id !== id) };
        });
      },
      duplicateGallery: (id) => {
        let newId: string | null = null;
        setState((s) => {
          const src = s.galleries.find((x) => x.id === id);
          if (!src) return s;
          newId = `g-${Date.now().toString(36)}`;
          const copy: Gallery = {
            ...src,
            id: newId,
            title: `${src.title} (copy)`,
            shareSlug: `${src.shareSlug}-copy`,
            status: "draft",
            views: 0,
            clientFavorites: [],
            clientSelections: [],
            comments: [],
            createdAt: iso(0),
          };
          return { ...s, galleries: [copy, ...s.galleries] };
        });
        return newId;
      },
      toggleClientFavorite: (galleryId, photoId) =>
        setState((s) => ({
          ...s,
          galleries: s.galleries.map((g) =>
            g.id !== galleryId
              ? g
              : {
                  ...g,
                  clientFavorites: g.clientFavorites.includes(photoId)
                    ? g.clientFavorites.filter((p) => p !== photoId)
                    : [...g.clientFavorites, photoId],
                },
          ),
        })),
      toggleClientSelection: (galleryId, photoId) =>
        setState((s) => ({
          ...s,
          galleries: s.galleries.map((g) =>
            g.id !== galleryId
              ? g
              : {
                  ...g,
                  clientSelections: g.clientSelections.includes(photoId)
                    ? g.clientSelections.filter((p) => p !== photoId)
                    : [...g.clientSelections, photoId],
                },
          ),
        })),
      addGalleryComment: (galleryId, photoId, author, body) => {
        setState((s) => ({
          ...s,
          galleries: s.galleries.map((g) =>
            g.id !== galleryId
              ? g
              : {
                  ...g,
                  comments: [
                    ...g.comments,
                    { id: `cm-${Date.now().toString(36)}`, photoId, author, body, createdAt: iso(0) },
                  ],
                },
          ),
        }));
        logActivity("gallery", `New client comment on a gallery photo`);
      },
      registerGalleryView: (shareSlug) =>
        setState((s) => ({
          ...s,
          galleries: s.galleries.map((g) => (g.shareSlug === shareSlug ? { ...g, views: g.views + 1 } : g)),
        })),

      addClient: (input) => {
        const client: Client = {
          id: `c-${Date.now().toString(36)}`,
          name: input.name,
          email: input.email,
          phone: input.phone,
          tags: input.tags ?? [],
          status: input.status ?? "active",
          notes: [],
          createdAt: iso(0),
          avatarSeed: `pixora-c-${Date.now().toString(36)}`,
        };
        addToList("clients", client);
        logActivity("client", `Client “${client.name}” added`);
        return client;
      },
      updateClient: (id, patch) => patchItem("clients", id, patch as Record<string, unknown>),
      deleteClient: (id) => removeItem("clients", id),
      addClientNote: (id, body) =>
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) =>
            c.id === id
              ? { ...c, notes: [{ id: `n-${Date.now().toString(36)}`, body, createdAt: iso(0) }, ...c.notes] }
              : c,
          ),
        })),

      addLead: (input) => {
        const lead: Lead = { ...input, id: `l-${Date.now().toString(36)}`, stage: "new", createdAt: iso(0) };
        addToList("leads", lead);
        logActivity("lead", `New inquiry from ${lead.name}`);
        return lead;
      },
      updateLeadStage: (id, stage) => patchItem("leads", id, { stage }),
      deleteLead: (id) => removeItem("leads", id),
      convertLead: (id) => {
        let clientId: string | null = null;
        setState((s) => {
          const lead = s.leads.find((l) => l.id === id);
          if (!lead) return s;
          const existing = s.clients.find((c) => c.email === lead.email);
          if (existing) {
            clientId = existing.id;
            return {
              ...s,
              leads: s.leads.map((l) => (l.id === id ? { ...l, stage: "won" } : l)),
            };
          }
          const client: Client = {
            id: `c-${Date.now().toString(36)}`,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            tags: [lead.eventType.toLowerCase()],
            status: "active",
            notes: [{ id: `n-${Date.now().toString(36)}`, body: `Inquiry: ${lead.message}`, createdAt: iso(0) }],
            createdAt: iso(0),
            avatarSeed: `pixora-c-${Date.now().toString(36)}`,
          };
          clientId = client.id;
          return {
            ...s,
            clients: [...s.clients, client],
            leads: s.leads.map((l) => (l.id === id ? { ...l, stage: "won" } : l)),
          };
        });
        return clientId;
      },

      addSession: (input) => {
        const session: Session = { ...input, id: `s-${Date.now().toString(36)}`, status: "scheduled" };
        addToList("sessions", session);
        logActivity("session", `Session “${session.title}” scheduled`);
        return session;
      },
      updateSession: (id, patch) => patchItem("sessions", id, patch as Record<string, unknown>),

      addInvoice: (input) => {
        const total = lineTotal(input.items);
        const invoice = {
          id: `i-${Date.now().toString(36)}`,
          number: `INV-${1046 + Math.floor(Math.random() * 100)}`,
          clientId: input.clientId,
          items: input.items,
          total,
          status: "draft" as const,
          dueDate: input.dueDate,
          createdAt: iso(0),
        };
        addToList("invoices", invoice);
        logActivity("invoice", `Invoice ${invoice.number} drafted — total ${total}`);
      },
      updateInvoiceStatus: (id, status) => {
        patchItem("invoices", id, { status });
        if (status === "paid") logActivity("invoice", `Invoice marked paid`);
      },
      addQuote: (input) => {
        const quote = {
          id: `q-${Date.now().toString(36)}`,
          number: `QUO-${35 + Math.floor(Math.random() * 20)}`,
          clientId: input.clientId,
          title: input.title,
          items: input.items,
          total: lineTotal(input.items),
          status: "draft" as const,
          validUntil: input.validUntil,
          createdAt: iso(0),
        };
        addToList("quotes", quote);
        logActivity("client", `Quote ${quote.number} created`);
      },
      updateQuoteStatus: (id, status) => patchItem("quotes", id, { status }),
      updateContractStatus: (id, status) => patchItem("contracts", id, { status }),

      addProduct: (input) => {
        const product: Product = { ...input, id: `p-${Date.now().toString(36)}` };
        addToList("products", product);
      },
      updateProduct: (id, patch) => patchItem("products", id, patch as Record<string, unknown>),
      deleteProduct: (id) => removeItem("products", id),
      placeOrder: (input) => {
        const order: Order = {
          id: `o-${Date.now().toString(36)}`,
          number: `ORD-${2207 + Math.floor(Math.random() * 500)}`,
          clientId: input.clientId,
          items: input.items,
          total: lineTotal(input.items),
          status: "paid",
          createdAt: iso(0),
        };
        addToList("orders", order);
        logActivity("order", `Order ${order.number} placed — demo checkout`);
        return order;
      },
      updateOrderStatus: (id, status) => patchItem("orders", id, { status }),
      addCoupon: (code, percentOff) => {
        const coupon: Coupon = {
          id: `cp-${Date.now().toString(36)}`,
          code: code.toUpperCase(),
          percentOff,
          active: true,
          uses: 0,
        };
        addToList("coupons", coupon);
      },
      toggleCoupon: (id) =>
        setState((s) => ({
          ...s,
          coupons: s.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),
      deleteCoupon: (id) => removeItem("coupons", id),

      inviteTeamMember: (name, email, role) => {
        const member: TeamMember = {
          id: `t-${Date.now().toString(36)}`,
          name: name || email,
          email,
          role,
          status: "invited",
        };
        addToList("team", member);
        logActivity("system", `Invitation sent to ${email} (demo — no email is actually sent)`);
      },
      removeTeamMember: (id) => removeItem("team", id),
      updateWebsitePage: (id, patch) => patchItem("websitePages", id, patch as Record<string, unknown>),
      setDomain: (hostname, configured) => setState((s) => ({ ...s, domain: { hostname, configured } })),
    };
  }, [state, ready]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoStore {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

export { dateOnly };
