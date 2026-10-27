// Pixora demo data layer — types, image helpers and seed data.
// No backend is configured: everything below is local demo state.

import {
  seedClientEvents,
  seedClientNotes,
  seedInvoices,
  type ClientEvent,
  type ClientNote,
  type Invoice,
} from "./crm-data";
import { seedLeads, type Lead } from "./leads-data";
import { seedBookingTypes, type BookingType } from "./booking-data";
import { seedProjects, type Project } from "./projects-data";
import { seedQuotes, type Quote } from "./quotes-data";
import {
  seedContractTemplates,
  seedContracts,
  type Contract,
  type ContractTemplate,
} from "./contracts-data";
import {
  seedQuestionLibrary,
  seedQuestionnaireTemplates,
  seedQuestionnaires,
  type Question,
  type Questionnaire,
  type QuestionnaireTemplate,
} from "./questionnaires-data";
import {
  seedEmailTemplates,
  seedSentEmails,
  type EmailTemplate,
  type SentEmail,
} from "./emails-data";
import {
  seedAutomationRuns,
  seedAutomations,
  type Automation,
  type AutomationRun,
} from "./automations-data";

/** Unsplash image URL, cropped to the requested size. */
export function img(id: string, w = 800, h?: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=75`;
}

/** Curated Unsplash photo ids used across the demo. */
export const PHOTOS = {
  heroPhotographer: "1554080353-a576cf803bda",
  signupMountains: "1464822759023-fed622ff2c3b",
  loginCoast: "1469474968028-56623f02e42e",
  lakeBanner: "1501785888041-af3ef285b470",
  portalHeader: "1506905925346-21bda4d32df4",
  editorPortrait: "1508214751196-bcfd4ca60f91",
  productBottle: "1608571423902-eed4a5ad8108",
  wedding: [
    "1606216794074-735e91aa2c92",
    "1591604466107-ec97de577aff",
    "1583939003579-730e3918a45a",
    "1537633552985-df8429e8048b",
    "1532712938310-34cb3982ef74",
    "1460364157752-926555421a7e",
    "1544078751-58fee2d8a03b",
    "1550005809-91ad75fb315f",
    "1519741497674-611481863552",
    "1529634597503-139d3726fed5",
    "1511285560929-80b456fea0bc",
    "1465495976277-4387d4b0b4c6",
    "1525258946800-98cfd641d0de",
    "1460978812857-470ed1c77af0",
    "1520854221256-17451cc331bf",
    "1515934751635-c81c6bc9a2d8",
    "1529636798458-92182e662485",
    "1522673607200-164d1b6ce486",
    "1469371670807-013ccf25f16a",
    "1519225421980-715cb0215aed",
  ],
  family: [
    "1609220136736-443140cffec6",
    "1484665754804-74b091211472",
    "1475503572774-15a45e5d60b9",
    "1511895426328-dc8714191300",
  ],
  travel: [
    "1476514525535-07fb3b4ae5f1",
    "1464822759023-fed622ff2c3b",
    "1470770841072-f978cf4d019e",
    "1504208434309-cb69f4fe52b0",
    "1501785888041-af3ef285b470",
    "1488646953014-85cb44e25828",
  ],
  avatars: {
    karabo: "1508002366005-75a695ee2d17",
    sarah: "1494790108377-be9c29b29330",
    james: "1507003211169-0a1dd7228f2d",
    emma: "1438761681033-6461ffad8d80",
    david: "1500648767791-00dcc994a43e",
    olivia: "1534528741775-53994a69daeb",
    lerato: "1517365830460-955ce3ccd263",
    thabo: "1472099645785-5658abf4ff4e",
  },
} as const;

export function avatar(id: string, size = 96): string {
  return img(id, size, size);
}

// ---------- types ----------

export type GalleryStatus = "published" | "draft" | "archived";

export interface Gallery {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  status: GalleryStatus;
  date: string; // ISO date the gallery was created
  updated: string;
  photoCount: number;
  cover: string;
  banner: string;
  photos: string[];
  favorites: string[]; // photo ids the client has favorited
  privacy: "public" | "password";
  password: string;
  allowDownloads: boolean;
  allowFavorites: boolean;
  /** The client this gallery was delivered to, if linked. */
  clientId?: string | undefined;
}

export type ClientType = "wedding" | "portrait" | "family" | "commercial" | "event";
export type ClientStatus = "active" | "past";
export type ClientSource = "website" | "referral" | "instagram" | "google" | "repeat";

export interface Client {
  id: string;
  name: string;
  email: string;
  /** Unsplash photo id, or "" to show initials. */
  avatar: string;
  sessions: number;
  starred: boolean;
  phone: string;
  company: string;
  city: string;
  type: ClientType;
  status: ClientStatus;
  source: ClientSource;
  tags: string[];
  createdAt: string; // ISO date
  lastActivity: string; // ISO date
  totalSpent: number;
}

export type SessionStatus = "confirmed" | "pending" | "completed" | "cancelled";

export interface SessionChange {
  at: string; // ISO date-time
  kind:
    "created" | "edited" | "rescheduled" | "confirmed" | "completed" | "cancelled" | "reinstated";
  detail: string;
}
export type SessionKind = "shoot" | "consultation" | "editing" | "delivery";

export interface Session {
  id: string;
  title: string;
  clientId: string;
  date: string; // ISO date
  start: string; // HH:mm
  end: string; // HH:mm
  location: string;
  status: SessionStatus;
  /** What kind of appointment this is; drives calendar colour and filters. */
  kind: SessionKind;
  /** Legacy colour from v4 and earlier; the calendar now styles by `kind`. */
  color: "info" | "violet" | "success";
  note?: string;
  /** Private prep notes for the studio. */
  notes?: string | undefined;
  cancelReason?: string | undefined;
  history?: SessionChange[] | undefined;
}

export interface Product {
  id: string;
  name: string;
  category: "print" | "digital" | "package";
  popular: boolean;
  price: number;
  image: string;
  active: boolean;
}

export type OrderStatus = "paid" | "pending" | "processing" | "shipped";

export interface Order {
  id: string;
  number: string;
  customer: string;
  date: string;
  status: OrderStatus;
  total: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Assistant" | "Viewer";
  status: "active" | "pending";
  avatar: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

export interface Activity {
  id: string;
  title: string;
  detail: string;
  time: string;
  avatar: string;
}

export interface WebsiteTemplate {
  id: string;
  name: string;
  category: "wedding" | "portrait" | "business";
  popular: boolean;
  image: string;
  headline: string;
}

export interface Profile {
  name: string;
  email: string;
  studio: string;
  plan: string;
  renews: string;
  avatar: string;
}

export interface DemoState {
  version: number;
  profile: Profile;
  galleries: Gallery[];
  clients: Client[];
  sessions: Session[];
  products: Product[];
  orders: Order[];
  team: TeamMember[];
  integrations: Integration[];
  activity: Activity[];
  templates: WebsiteTemplate[];
  publishedTemplate: string;
  clientNotes: ClientNote[];
  clientEvents: ClientEvent[];
  invoices: Invoice[];
  leads: Lead[];
  bookingTypes: BookingType[];
  projects: Project[];
  quotes: Quote[];
  contracts: Contract[];
  contractTemplates: ContractTemplate[];
  questionLibrary: Question[];
  questionnaireTemplates: QuestionnaireTemplate[];
  questionnaires: Questionnaire[];
  emailTemplates: EmailTemplate[];
  sentEmails: SentEmail[];
  automations: Automation[];
  automationRuns: AutomationRun[];
}

// ---------- formatting ----------

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function moneyShort(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ---------- seed ----------

export const STATE_VERSION = 7;

/** The demo's "today" — seed sessions and activity sit in the week of Apr 20, 2025. */
export const DEMO_TODAY = "2025-04-20";

/** A timestamp for something that happens now: the demo's date with the real clock time. */
export function nowStamp(): string {
  return `${DEMO_TODAY}T${new Date().toTimeString().slice(0, 8)}`;
}

/** Defaults for client fields added after v2, used when migrating saved demo state. */
const CLIENT_DEFAULTS: Omit<Client, "id" | "name" | "email" | "avatar" | "sessions" | "starred"> = {
  phone: "",
  company: "",
  city: "",
  type: "portrait",
  status: "active",
  source: "website",
  tags: [],
  createdAt: DEMO_TODAY,
  lastActivity: DEMO_TODAY,
  totalSpent: 0,
};

/**
 * Upgrade demo state saved by an earlier version instead of discarding it.
 * Collections added since are filled from the seed; returns null if unusable.
 */
export function migrateState(saved: unknown): DemoState | null {
  if (!saved || typeof saved !== "object") return null;
  const s = saved as Partial<DemoState>;
  if (typeof s.version !== "number" || s.version < 2 || s.version > STATE_VERSION) return null;
  if (!Array.isArray(s.galleries) || !Array.isArray(s.clients)) return null;
  const seed = seedState();
  const merged: DemoState = { ...seed, ...s, version: STATE_VERSION };
  if (s.version < 3) {
    const seedById = new Map(seed.clients.map((c) => [c.id, c]));
    merged.clients = [
      ...s.clients.map((c) => ({ ...CLIENT_DEFAULTS, ...seedById.get(c.id), ...c })),
      ...seed.clients.filter((c) => !s.clients!.some((x) => x.id === c.id)),
    ];
  }
  if (s.version < 6 && Array.isArray(s.invoices)) {
    const project = new Map(seed.invoices.map((i) => [i.id, i.projectId]));
    merged.invoices = s.invoices.map((i) =>
      i.projectId || !project.get(i.id) ? i : { ...i, projectId: project.get(i.id) },
    );
  }
  if (s.version < 5 && Array.isArray(s.sessions)) {
    const seedById = new Map(seed.sessions.map((x) => [x.id, x]));
    merged.sessions = [
      ...s.sessions.map((x) => ({ ...x, kind: x.kind ?? seedById.get(x.id)?.kind ?? "shoot" })),
      ...seed.sessions.filter((x) => !s.sessions!.some((y) => y.id === x.id)),
    ];
  }
  if (s.version < 4) {
    const owner = new Map(seed.galleries.map((g) => [g.id, g.clientId]));
    merged.galleries = merged.galleries.map((g) =>
      g.clientId || !owner.get(g.id) ? g : { ...g, clientId: owner.get(g.id) },
    );
  }
  if (s.version < 7 && Array.isArray(merged.invoices)) {
    // Payment history arrived in v7: backfill seeded payments and add the new seed invoices.
    const seedById = new Map(seed.invoices.map((i) => [i.id, i]));
    merged.invoices = [
      ...merged.invoices.map((i) =>
        i.payments ? i : { ...i, payments: seedById.get(i.id)?.payments ?? [] },
      ),
      ...seed.invoices.filter((x) => !merged.invoices.some((i) => i.id === x.id)),
    ];
  }
  return merged;
}

const W = PHOTOS.wedding;
const A = PHOTOS.avatars;

export function seedState(): DemoState {
  const questionLibrary = seedQuestionLibrary();
  const questionnaireTemplates = seedQuestionnaireTemplates(questionLibrary);
  return {
    version: STATE_VERSION,
    profile: {
      name: "Karabo",
      email: "karabo@pixora.com",
      studio: "Karabo Photography",
      plan: "Pro",
      renews: "2025-05-12",
      avatar: A.karabo,
    },
    galleries: [
      {
        id: "sarah-james-wedding",
        clientId: "c1",
        title: "Sarah & James Wedding",
        shortTitle: "Sarah & James",
        description: "A beautiful day filled with love and joy.",
        status: "published",
        date: "2025-04-12",
        updated: "3 hours ago",
        photoCount: 48,
        cover: W[0],
        banner: PHOTOS.lakeBanner,
        photos: [...W],
        favorites: [W[0], W[1], W[2], W[4], W[6], W[7], W[10], W[13]],
        privacy: "public",
        password: "",
        allowDownloads: true,
        allowFavorites: true,
      },
      {
        id: "family-portraits",
        clientId: "c6",
        title: "Family Portraits",
        shortTitle: "Family Portraits",
        description: "An autumn afternoon with the Mokoena family.",
        status: "published",
        date: "2025-04-05",
        updated: "6 days ago",
        photoCount: 62,
        cover: PHOTOS.family[0],
        banner: PHOTOS.family[2],
        photos: [...PHOTOS.family],
        favorites: [PHOTOS.family[0]],
        privacy: "password",
        password: "family2025",
        allowDownloads: true,
        allowFavorites: true,
      },
      {
        id: "product-shoot",
        clientId: "c4",
        title: "Product Shoot",
        shortTitle: "Product Shoot",
        description: "Studio product photography for Amber & Oak skincare.",
        status: "draft",
        date: "2025-03-28",
        updated: "1 week ago",
        photoCount: 12,
        cover: PHOTOS.productBottle,
        banner: PHOTOS.productBottle,
        photos: [PHOTOS.productBottle],
        favorites: [],
        privacy: "password",
        password: "amber",
        allowDownloads: false,
        allowFavorites: false,
      },
      {
        id: "travel-collection",
        clientId: "c2",
        title: "Travel Collection",
        shortTitle: "Travel Collection",
        description: "Lakes, peaks and coastlines from a season on the road.",
        status: "published",
        date: "2025-03-20",
        updated: "2 weeks ago",
        photoCount: 35,
        cover: PHOTOS.travel[0],
        banner: PHOTOS.travel[2],
        photos: [...PHOTOS.travel],
        favorites: [],
        privacy: "public",
        password: "",
        allowDownloads: true,
        allowFavorites: true,
      },
    ],
    clients: [
      {
        id: "c1",
        name: "Sarah Mitchell",
        email: "sarah@sarahmitchell.com",
        avatar: A.sarah,
        sessions: 2,
        starred: false,
        phone: "(555) 010-2481",
        company: "",
        city: "Cape Town",
        type: "wedding",
        status: "active",
        source: "referral",
        tags: ["Wedding 2025", "Album"],
        createdAt: "2024-09-14",
        lastActivity: "2025-04-19",
        totalSpent: 4850,
      },
      {
        id: "c2",
        name: "James Carter",
        email: "james@jamescarter.com",
        avatar: A.james,
        sessions: 1,
        starred: true,
        phone: "(555) 010-7720",
        company: "Carter Travel Co.",
        city: "Johannesburg",
        type: "commercial",
        status: "active",
        source: "instagram",
        tags: ["Travel", "Retainer"],
        createdAt: "2024-11-02",
        lastActivity: "2025-04-17",
        totalSpent: 2180,
      },
      {
        id: "c3",
        name: "Emma Wilson",
        email: "emma@emmawilson.com",
        avatar: A.emma,
        sessions: 3,
        starred: false,
        phone: "(555) 010-3349",
        company: "",
        city: "Stellenbosch",
        type: "family",
        status: "active",
        source: "website",
        tags: ["Annual family"],
        createdAt: "2023-05-21",
        lastActivity: "2025-04-18",
        totalSpent: 1960,
      },
      {
        id: "c4",
        name: "David Kim",
        email: "david@davidkim.com",
        avatar: A.david,
        sessions: 1,
        starred: false,
        phone: "(555) 010-5186",
        company: "Amber & Oak Skincare",
        city: "Cape Town",
        type: "commercial",
        status: "active",
        source: "google",
        tags: ["Product", "E-commerce"],
        createdAt: "2025-02-11",
        lastActivity: "2025-04-12",
        totalSpent: 950,
      },
      {
        id: "c5",
        name: "Olivia Brown",
        email: "olivia@oliviabrown.com",
        avatar: A.olivia,
        sessions: 0,
        starred: false,
        phone: "(555) 010-9034",
        company: "",
        city: "Durban",
        type: "portrait",
        status: "active",
        source: "website",
        tags: ["Headshots"],
        createdAt: "2025-04-09",
        lastActivity: "2025-04-14",
        totalSpent: 480,
      },
      {
        id: "c6",
        name: "Naledi Mokoena",
        email: "naledi.mokoena@mokoenafamily.co.za",
        avatar: "",
        sessions: 4,
        starred: true,
        phone: "(555) 010-4410",
        company: "",
        city: "Pretoria",
        type: "family",
        status: "active",
        source: "repeat",
        tags: ["Annual family", "Prints"],
        createdAt: "2022-10-03",
        lastActivity: "2025-04-05",
        totalSpent: 3240,
      },
      {
        id: "c7",
        name: "Sipho Dlamini",
        email: "sipho@dlaminiarchitects.co.za",
        avatar: "",
        sessions: 2,
        starred: false,
        phone: "(555) 010-6627",
        company: "Dlamini Architects",
        city: "Johannesburg",
        type: "commercial",
        status: "past",
        source: "referral",
        tags: ["Architecture"],
        createdAt: "2024-03-18",
        lastActivity: "2024-12-02",
        totalSpent: 3600,
      },
      {
        id: "c8",
        name: "Hannah Lee",
        email: "hannah.lee@leestudio.com",
        avatar: "",
        sessions: 1,
        starred: false,
        phone: "(555) 010-2255",
        company: "",
        city: "Cape Town",
        type: "portrait",
        status: "past",
        source: "instagram",
        tags: ["Branding"],
        createdAt: "2024-06-30",
        lastActivity: "2024-08-15",
        totalSpent: 650,
      },
      {
        id: "c9",
        name: "Zanele Khumalo",
        email: "zanele@khumaloevents.co.za",
        avatar: "",
        sessions: 3,
        starred: false,
        phone: "(555) 010-8813",
        company: "Khumalo Events",
        city: "Durban",
        type: "event",
        status: "active",
        source: "referral",
        tags: ["Corporate events", "Retainer"],
        createdAt: "2024-01-22",
        lastActivity: "2025-04-16",
        totalSpent: 5420,
      },
      {
        id: "c10",
        name: "Liam O'Connor",
        email: "liam.oconnor@oconnorweds.com",
        avatar: "",
        sessions: 1,
        starred: false,
        phone: "(555) 010-1902",
        company: "",
        city: "Franschhoek",
        type: "wedding",
        status: "active",
        source: "google",
        tags: ["Wedding 2025"],
        createdAt: "2025-03-03",
        lastActivity: "2025-04-11",
        totalSpent: 1500,
      },
      {
        id: "c11",
        name: "Marcus Johnson",
        email: "marcus@johnsonfit.com",
        avatar: "",
        sessions: 2,
        starred: false,
        phone: "(555) 010-4768",
        company: "Johnson Fitness",
        city: "Cape Town",
        type: "commercial",
        status: "past",
        source: "website",
        tags: ["Brand shoot"],
        createdAt: "2023-11-12",
        lastActivity: "2024-10-21",
        totalSpent: 2100,
      },
      {
        id: "c12",
        name: "Priya Naidoo",
        email: "priya.naidoo@naidoomail.com",
        avatar: "",
        sessions: 1,
        starred: false,
        phone: "(555) 010-3097",
        company: "",
        city: "Durban",
        type: "event",
        status: "past",
        source: "instagram",
        tags: ["Birthday"],
        createdAt: "2024-07-08",
        lastActivity: "2024-09-28",
        totalSpent: 720,
      },
    ],
    sessions: [
      {
        id: "s1",
        kind: "shoot",
        title: "Wedding Shoot",
        clientId: "c1",
        date: "2025-04-21",
        start: "09:00",
        end: "11:00",
        location: "Lakeside Estate",
        status: "confirmed",
        color: "info",
        note: "Sarah & James",
      },
      {
        id: "s2",
        kind: "shoot",
        title: "Family Session",
        clientId: "c3",
        date: "2025-04-23",
        start: "10:00",
        end: "11:00",
        location: "Botanical Gardens",
        status: "confirmed",
        color: "violet",
      },
      {
        id: "s3",
        kind: "consultation",
        title: "Consultation",
        clientId: "c2",
        date: "2025-04-22",
        start: "13:00",
        end: "14:00",
        location: "Studio",
        status: "confirmed",
        color: "success",
        note: "Client Meeting",
      },
      {
        id: "s4",
        kind: "shoot",
        title: "Product Shoot",
        clientId: "c4",
        date: "2025-04-24",
        start: "14:00",
        end: "15:00",
        location: "Studio",
        status: "confirmed",
        color: "info",
        note: "Photos",
        notes:
          "Bring the white sweep and two softboxes. Client wants 3 hero shots for the homepage.",
        history: [
          { at: "2025-04-01T09:00:00", kind: "created", detail: "Booked after planning call" },
          { at: "2025-04-01T09:05:00", kind: "confirmed", detail: "" },
          {
            at: "2025-04-10T16:20:00",
            kind: "rescheduled",
            detail: "Moved from Tue, Apr 22 · 2:00 PM to Thu, Apr 24 · 2:00 PM",
          },
        ],
      },
      {
        id: "s5",
        kind: "shoot",
        title: "Portrait Session",
        clientId: "c5",
        date: "2025-04-25",
        start: "15:00",
        end: "16:00",
        location: "City Park",
        status: "pending",
        color: "violet",
      },
      {
        id: "s6",
        kind: "shoot",
        title: "Travel Shoot",
        clientId: "c2",
        date: "2025-04-28",
        start: "07:00",
        end: "10:00",
        location: "Coastal Road",
        status: "confirmed",
        color: "success",
      },
      ...demoAppointments(),
    ],
    products: [
      {
        id: "p1",
        name: "8x10 Print",
        category: "print",
        popular: true,
        price: 25,
        image: W[1],
        active: true,
      },
      {
        id: "p2",
        name: "Digital Download",
        category: "digital",
        popular: true,
        price: 10,
        image: W[0],
        active: true,
      },
      {
        id: "p3",
        name: "Wedding Package",
        category: "package",
        popular: false,
        price: 1200,
        image: W[2],
        active: true,
      },
      {
        id: "p4",
        name: "Canvas Print",
        category: "print",
        popular: false,
        price: 160,
        image: PHOTOS.family[0],
        active: true,
      },
    ],
    orders: [
      {
        id: "o5",
        number: "#1005",
        customer: "Emma Wilson",
        date: "2025-04-18",
        status: "paid",
        total: 120,
      },
      {
        id: "o4",
        number: "#1004",
        customer: "James Carter",
        date: "2025-04-17",
        status: "pending",
        total: 680,
      },
      {
        id: "o3",
        number: "#1003",
        customer: "Olivia Brown",
        date: "2025-04-14",
        status: "processing",
        total: 480,
      },
      {
        id: "o2",
        number: "#1002",
        customer: "Sarah Mitchell",
        date: "2025-04-13",
        status: "paid",
        total: 345,
      },
      {
        id: "o1",
        number: "#1001",
        customer: "David Kim",
        date: "2025-04-12",
        status: "shipped",
        total: 300,
      },
    ],
    team: [
      {
        id: "t1",
        name: "Karabo",
        email: "karabo@pixora.com",
        role: "Owner",
        status: "active",
        avatar: A.karabo,
      },
      {
        id: "t2",
        name: "Lerato M.",
        email: "lerato@pixora.com",
        role: "Editor",
        status: "active",
        avatar: A.lerato,
      },
      {
        id: "t3",
        name: "Thabo D.",
        email: "thabo@pixora.com",
        role: "Assistant",
        status: "active",
        avatar: A.thabo,
      },
    ],
    integrations: [
      {
        id: "google",
        name: "Google Workspace",
        description: "Calendar & email sync",
        connected: true,
      },
      { id: "dropbox", name: "Dropbox", description: "Back up originals", connected: false },
      {
        id: "dropbox-replay",
        name: "Dropbox Replay",
        description: "Share video proofs",
        connected: false,
      },
    ],
    activity: [
      {
        id: "a1",
        title: "New lead: Emma Wilson",
        detail: "Wedding inquiry via website",
        time: "3 minutes ago",
        avatar: A.emma,
      },
      {
        id: "a2",
        title: "Invoice #1042 paid",
        detail: "Sarah Mitchell · $1,200.00",
        time: "5 hours ago",
        avatar: A.sarah,
      },
      {
        id: "a3",
        title: "Gallery viewed",
        detail: "Family Portraits · 14 views",
        time: "Yesterday",
        avatar: A.david,
      },
    ],
    templates: [
      {
        id: "modern",
        name: "Modern",
        category: "wedding",
        popular: true,
        image: W[3],
        headline: "Karabo Photography",
      },
      {
        id: "classic",
        name: "Classic",
        category: "portrait",
        popular: true,
        image: W[2],
        headline: "Timeless Stories",
      },
      {
        id: "minimal",
        name: "Minimal",
        category: "business",
        popular: false,
        image: PHOTOS.travel[2],
        headline: "Wanderlust",
      },
    ],
    publishedTemplate: "modern",
    clientNotes: seedClientNotes(),
    clientEvents: seedClientEvents(),
    invoices: seedInvoices(),
    leads: seedLeads(),
    projects: seedProjects(),
    quotes: seedQuotes(),
    contracts: seedContracts(),
    contractTemplates: seedContractTemplates(),
    questionLibrary,
    questionnaireTemplates,
    questionnaires: seedQuestionnaires(questionnaireTemplates),
    emailTemplates: seedEmailTemplates(),
    sentEmails: seedSentEmails(),
    automations: seedAutomations(),
    automationRuns: seedAutomationRuns(),
    bookingTypes: seedBookingTypes({
      portrait: PHOTOS.editorPortrait,
      family: PHOTOS.family[1],
      engagement: W[9],
      brand: PHOTOS.productBottle,
      wedding: W[0],
    }),
  };
}

/** Extra calendar appointments around the demo week (Mar–May 2025). */
function demoAppointments(): Session[] {
  const a = (
    id: string,
    clientId: string,
    kind: SessionKind,
    date: string,
    start: string,
    end: string,
    title: string,
    location: string,
    status?: SessionStatus,
  ): Session => ({
    id,
    clientId,
    kind,
    date,
    start,
    end,
    title,
    location,
    // Anything before the demo's "today" has already happened.
    status: status ?? (date < DEMO_TODAY ? "completed" : "confirmed"),
    color: kind === "consultation" ? "success" : kind === "editing" ? "violet" : "info",
  });
  return [
    a(
      "s23",
      "c9",
      "shoot",
      "2025-03-15",
      "18:00",
      "22:00",
      "Gala Dinner Coverage",
      "The Westin, Cape Town",
    ),
    a(
      "s24",
      "c4",
      "consultation",
      "2025-03-28",
      "10:00",
      "11:00",
      "Product Shoot Planning",
      "Video call",
    ),
    a("s11", "c4", "shoot", "2025-04-11", "10:00", "13:00", "Amber & Oak Product Shoot", "Studio"),
    a(
      "s7",
      "c5",
      "consultation",
      "2025-04-14",
      "10:00",
      "10:30",
      "Headshot Discovery Call",
      "Phone",
    ),
    a(
      "s8",
      "c1",
      "editing",
      "2025-04-15",
      "09:00",
      "12:00",
      "Edit: Sarah & James selects",
      "Studio",
    ),
    a(
      "s9",
      "c9",
      "consultation",
      "2025-04-16",
      "14:00",
      "15:00",
      "Conference Coverage Call",
      "Video call",
    ),
    a("s10", "c1", "consultation", "2025-04-17", "15:00", "16:00", "Album Design Review", "Studio"),
    a(
      "s12",
      "c6",
      "editing",
      "2025-04-21",
      "13:00",
      "17:00",
      "Edit: Family Portraits retouch",
      "Studio",
    ),
    a(
      "s15",
      "c4",
      "editing",
      "2025-04-23",
      "10:30",
      "12:00",
      "Edit: Product hero images",
      "Studio",
    ),
    a(
      "s13",
      "c9",
      "shoot",
      "2025-04-23",
      "18:00",
      "21:00",
      "Corporate Awards Evening",
      "Durban ICC",
    ),
    a(
      "s14",
      "c10",
      "consultation",
      "2025-04-24",
      "09:30",
      "10:30",
      "Wedding Timeline Consult",
      "Video call",
    ),
    a("s16", "c2", "editing", "2025-04-25", "09:00", "12:00", "Edit: Travel Collection", "Studio"),
    a(
      "s17",
      "c10",
      "shoot",
      "2025-04-26",
      "07:30",
      "10:00",
      "Engagement Session",
      "Franschhoek Pass",
    ),
    a(
      "s18",
      "c6",
      "consultation",
      "2025-04-29",
      "11:00",
      "12:00",
      "Print & Album Consult",
      "Studio",
    ),
    a(
      "s19",
      "c4",
      "delivery",
      "2025-05-01",
      "16:00",
      "16:30",
      "Gallery Delivery: Product Shoot",
      "Online",
    ),
    a("s20", "c3", "shoot", "2025-05-03", "16:30", "18:30", "Engagement Session", "Babylonstoren"),
    a(
      "s21",
      "c11",
      "shoot",
      "2025-05-08",
      "09:00",
      "12:00",
      "Brand Refresh Shoot",
      "Johnson Fitness, Cape Town",
      "pending",
    ),
    a(
      "s22",
      "c12",
      "consultation",
      "2025-05-14",
      "10:00",
      "11:00",
      "Party Planning Call",
      "Phone",
      "pending",
    ),
    {
      ...a(
        "s25",
        "c8",
        "shoot",
        "2025-04-22",
        "11:00",
        "12:00",
        "Headshot Refresh",
        "Studio",
        "cancelled",
      ),
      cancelReason: "Client is travelling — will rebook in June",
      history: [
        { at: "2025-04-02T10:00:00", kind: "created", detail: "Booked by phone" },
        {
          at: "2025-04-18T08:45:00",
          kind: "cancelled",
          detail: "Client is travelling — will rebook in June",
        },
      ],
    },
  ];
}
