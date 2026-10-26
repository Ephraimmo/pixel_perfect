// Pixora demo data layer — types, image helpers and seed data.
// No backend is configured: everything below is local demo state.

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
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  sessions: number;
  starred: boolean;
}

export type SessionStatus = "confirmed" | "pending";

export interface Session {
  id: string;
  title: string;
  clientId: string;
  date: string; // ISO date
  start: string; // HH:mm
  end: string; // HH:mm
  location: string;
  status: SessionStatus;
  color: "info" | "violet" | "success";
  note?: string;
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

export const STATE_VERSION = 2;

const W = PHOTOS.wedding;
const A = PHOTOS.avatars;

export function seedState(): DemoState {
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
      },
      {
        id: "c2",
        name: "James Carter",
        email: "james@jamescarter.com",
        avatar: A.james,
        sessions: 1,
        starred: true,
      },
      {
        id: "c3",
        name: "Emma Wilson",
        email: "emma@emmawilson.com",
        avatar: A.emma,
        sessions: 3,
        starred: false,
      },
      {
        id: "c4",
        name: "David Kim",
        email: "david@davidkim.com",
        avatar: A.david,
        sessions: 1,
        starred: false,
      },
      {
        id: "c5",
        name: "Olivia Brown",
        email: "olivia@oliviabrown.com",
        avatar: A.olivia,
        sessions: 0,
        starred: false,
      },
    ],
    sessions: [
      {
        id: "s1",
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
        title: "Product Shoot",
        clientId: "c4",
        date: "2025-04-24",
        start: "14:00",
        end: "15:00",
        location: "Studio",
        status: "confirmed",
        color: "info",
        note: "Photos",
      },
      {
        id: "s5",
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
        title: "Travel Shoot",
        clientId: "c2",
        date: "2025-04-28",
        start: "07:00",
        end: "10:00",
        location: "Coastal Road",
        status: "confirmed",
        color: "success",
      },
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
  };
}
