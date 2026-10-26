// Pixora demo data layer — types, helpers and seed data.
// No backend is configured: everything below is local demo state.

export type ClientStatus = "active" | "past" | "prospect";

export interface ClientNote {
  id: string;
  body: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  status: ClientStatus;
  notes: ClientNote[];
  createdAt: string;
  avatarSeed: string;
}

export interface GalleryPhoto {
  id: string;
  seed: string;
  caption: string;
  tags: string[];
  favorite: boolean; // photographer's pick
}

export interface GalleryComment {
  id: string;
  photoId: string;
  author: string;
  body: string;
  createdAt: string;
}

export type GalleryStatus = "draft" | "published" | "archived";

export interface Gallery {
  id: string;
  title: string;
  clientId: string | null;
  eventName: string;
  eventDate: string;
  status: GalleryStatus;
  shareSlug: string;
  coverSeed: string;
  photos: GalleryPhoto[];
  collections: { id: string; title: string }[];
  password: string;
  expiresAt: string | null;
  allowDownloads: boolean;
  allowFavorites: boolean;
  allowProofing: boolean;
  showWatermark: boolean;
  downloadPin: string;
  createdAt: string;
  clientFavorites: string[]; // photo ids favorited by the client
  clientSelections: string[]; // photo ids selected for print
  comments: GalleryComment[];
  views: number;
}

export type LeadStage = "new" | "contacted" | "quoted" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guests: number;
  budget: string;
  message: string;
  stage: LeadStage;
  source: string;
  createdAt: string;
}

export interface Session {
  id: string;
  clientId: string;
  title: string;
  date: string; // ISO date
  time: string; // HH:mm
  durationMins: number;
  location: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
}

export interface LineItem {
  name: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  items: LineItem[];
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  title: string;
  items: LineItem[];
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  validUntil: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  title: string;
  clientId: string;
  value: number;
  status: "awaiting-signature" | "signed" | "draft";
  updatedAt: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  audience: string;
  questions: string[];
  responses: number;
  updatedAt: string;
}

export type ProductType = "digital" | "print" | "package";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  description: string;
  seed: string;
  active: boolean;
}

export interface Order {
  id: string;
  number: string;
  clientId: string;
  items: LineItem[];
  total: number;
  status: "pending" | "paid" | "fulfilled" | "refunded";
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  percentOff: number;
  active: boolean;
  uses: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "assistant" | "viewer";
  status: "active" | "invited";
}

export interface ActivityItem {
  id: string;
  kind: "gallery" | "client" | "order" | "invoice" | "lead" | "session" | "system";
  message: string;
  time: string;
}

export interface WebsitePage {
  id: string;
  title: string;
  path: string;
  published: boolean;
  headline: string;
  subtext: string;
}

export interface DemoState {
  version: number;
  signedIn: boolean;
  onboarded: boolean;
  studioName: string;
  galleries: Gallery[];
  clients: Client[];
  leads: Lead[];
  sessions: Session[];
  invoices: Invoice[];
  quotes: Quote[];
  contracts: Contract[];
  questionnaires: Questionnaire[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  team: TeamMember[];
  activity: ActivityItem[];
  websitePages: WebsitePage[];
  domain: { configured: boolean; hostname: string };
}

// ---------- helpers ----------

export function photo(seed: string, w = 800, h = 1000): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export function photoWide(seed: string, w = 1600, h = 1000): string {
  return photo(seed, w, h);
}

export function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export function dateOnly(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function lineTotal(items: LineItem[]): number {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

// ---------- seed ----------

const captions = [
  "Golden hour, first look",
  "Confetti on the steps",
  "Quiet moment before the ceremony",
  "The vows",
  "Confetti toss, wide",
  "Bridal party on the bridge",
  "Cake table details",
  "First dance",
  "Portraits by the water",
  "Reception lights",
  "Candid laughter at dinner",
  "Last dance of the night",
  "Getting ready, morning light",
  "The bouquet",
  "Rings macro",
  "Guest book signing",
  "Sparkler exit",
  "Sunset portraits",
  "Family formals",
  "Flower girl in the aisle",
  "Groom waiting at the arch",
  "Table setting, linen detail",
  "Veil in the wind",
  "Walking to the ceremony",
];

const tagsFor = (i: number): string[] => {
  const pool = [
    ["ceremony", "portrait"],
    ["reception", "candid"],
    ["detail", "macro"],
    ["portrait", "golden hour"],
    ["candid", "family"],
  ];
  return pool[i % pool.length] ?? pool[0] ?? [];
};

function makePhotos(gid: string, count: number, offset = 0): GalleryPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${gid}-p${i + 1}`,
    seed: `pixora-${gid}-${i + 1 + offset}`,
    caption: captions[(i + offset) % captions.length] ?? "Untitled frame",
    tags: tagsFor(i + offset),
    favorite: i % 7 === 3,
  }));
}

const now = iso(0);

function seedState(): DemoState {
  const clients: Client[] = [
    {
      id: "c1",
      name: "Amara & Thabo Mokoena",
      email: "amara.mokoena@example.com",
      phone: "+27 82 441 9027",
      tags: ["wedding", "vip"],
      status: "active",
      notes: [
        { id: "n1", body: "Prefers warm, editorial tones. No flash during the ceremony.", createdAt: iso(-42) },
        { id: "n2", body: "Second shooter confirmed for reception. Album upgrade discussed.", createdAt: iso(-9) },
      ],
      createdAt: iso(-64),
      avatarSeed: "amara",
    },
    {
      id: "c2",
      name: "The Naidoo Family",
      email: "hello@naidoofamily.example.com",
      phone: "+27 71 208 5540",
      tags: ["family"],
      status: "active",
      notes: [{ id: "n3", body: "Three kids — keep sessions under 90 minutes. Grandparents want prints.", createdAt: iso(-30) }],
      createdAt: iso(-51),
      avatarSeed: "naidoo",
    },
    {
      id: "c3",
      name: "Lerato Dlamini",
      email: "lerato.d@example.com",
      phone: "+27 83 774 1201",
      tags: ["maternity"],
      status: "active",
      notes: [{ id: "n4", body: "Due in 8 weeks — deliver gallery within 10 days of the session.", createdAt: iso(-12) }],
      createdAt: iso(-21),
      avatarSeed: "lerato",
    },
    {
      id: "c4",
      name: "Sipho Ndlovu",
      email: "sipho@ndlovustudio.example.com",
      phone: "+27 76 330 8891",
      tags: ["headshots", "corporate"],
      status: "active",
      notes: [{ id: "n5", body: "Needs LinkedIn crops and a neutral backdrop set.", createdAt: iso(-6) }],
      createdAt: iso(-40),
      avatarSeed: "sipho",
    },
    {
      id: "c5",
      name: "Cape Unity Choir",
      email: "events@capeunity.example.org",
      phone: "+27 21 555 0142",
      tags: ["event"],
      status: "past",
      notes: [{ id: "n6", body: "Annual concert — likely to rebook for next season.", createdAt: iso(-95) }],
      createdAt: iso(-120),
      avatarSeed: "choir",
    },
  ];

  const galleries: Gallery[] = [
    {
      id: "g1",
      title: "Mokoena Wedding — Getting Ready",
      clientId: "c1",
      eventName: "Wedding",
      eventDate: dateOnly(-14),
      status: "published",
      shareSlug: "mokoena-getting-ready",
      coverSeed: "pixora-g1-1",
      photos: makePhotos("g1", 18),
      collections: [
        { id: "col1", title: "Morning prep" },
        { id: "col2", title: "Details" },
      ],
      password: "",
      expiresAt: dateOnly(76),
      allowDownloads: true,
      allowFavorites: true,
      allowProofing: true,
      showWatermark: false,
      downloadPin: "4821",
      createdAt: iso(-12),
      clientFavorites: ["g1-p2", "g1-p5", "g1-p9"],
      clientSelections: ["g1-p1", "g1-p7"],
      comments: [
        { id: "cm1", photoId: "g1-p5", author: "Amara", body: "This one is the album cover — agreed?", createdAt: iso(-3) },
      ],
      views: 214,
    },
    {
      id: "g2",
      title: "Mokoena Wedding — Reception",
      clientId: "c1",
      eventName: "Wedding",
      eventDate: dateOnly(-13),
      status: "published",
      shareSlug: "mokoena-reception",
      coverSeed: "pixora-g2-2",
      photos: makePhotos("g2", 14, 8),
      collections: [{ id: "col3", title: "Dinner" }],
      password: "mokoena2026",
      expiresAt: dateOnly(77),
      allowDownloads: true,
      allowFavorites: true,
      allowProofing: false,
      showWatermark: true,
      downloadPin: "7300",
      createdAt: iso(-10),
      clientFavorites: ["g2-p3"],
      clientSelections: [],
      comments: [],
      views: 96,
    },
    {
      id: "g3",
      title: "Naidoo Family — Autumn Session",
      clientId: "c2",
      eventName: "Family",
      eventDate: dateOnly(-27),
      status: "published",
      shareSlug: "naidoo-autumn",
      coverSeed: "pixora-g3-1",
      photos: makePhotos("g3", 12, 4),
      collections: [],
      password: "",
      expiresAt: null,
      allowDownloads: true,
      allowFavorites: true,
      allowProofing: false,
      showWatermark: false,
      downloadPin: "",
      createdAt: iso(-25),
      clientFavorites: ["g3-p4", "g3-p8", "g3-p11"],
      clientSelections: ["g3-p4"],
      comments: [],
      views: 143,
    },
    {
      id: "g4",
      title: "Lerato — Maternity Preview",
      clientId: "c3",
      eventName: "Maternity",
      eventDate: dateOnly(-2),
      status: "draft",
      shareSlug: "lerato-maternity",
      coverSeed: "pixora-g4-1",
      photos: makePhotos("g4", 8, 11),
      collections: [],
      password: "",
      expiresAt: null,
      allowDownloads: false,
      allowFavorites: true,
      allowProofing: false,
      showWatermark: true,
      downloadPin: "",
      createdAt: iso(-1),
      clientFavorites: [],
      clientSelections: [],
      comments: [],
      views: 0,
    },
    {
      id: "g5",
      title: "Ndlovu Headshots — Round 1",
      clientId: "c4",
      eventName: "Headshots",
      eventDate: dateOnly(-5),
      status: "published",
      shareSlug: "ndlovu-headshots",
      coverSeed: "pixora-g5-1",
      photos: makePhotos("g5", 10, 16),
      collections: [],
      password: "",
      expiresAt: dateOnly(25),
      allowDownloads: true,
      allowFavorites: true,
      allowProofing: true,
      showWatermark: false,
      downloadPin: "9042",
      createdAt: iso(-4),
      clientFavorites: ["g5-p2", "g5-p6"],
      clientSelections: ["g5-p2", "g5-p6", "g5-p9"],
      comments: [],
      views: 58,
    },
    {
      id: "g6",
      title: "Coastal Editorial — Test Shoot",
      clientId: null,
      eventName: "Editorial",
      eventDate: dateOnly(-60),
      status: "archived",
      shareSlug: "coastal-editorial",
      coverSeed: "pixora-g6-1",
      photos: makePhotos("g6", 9, 2),
      collections: [],
      password: "",
      expiresAt: null,
      allowDownloads: false,
      allowFavorites: false,
      allowProofing: false,
      showWatermark: true,
      downloadPin: "",
      createdAt: iso(-58),
      clientFavorites: [],
      clientSelections: [],
      comments: [],
      views: 31,
    },
  ];

  const leads: Lead[] = [
    { id: "l1", name: "Fatima & Yusuf Patel", email: "fatima.patel@example.com", phone: "+27 82 665 3311", eventType: "Wedding", eventDate: dateOnly(126), guests: 140, budget: "$4,500", message: "Getting married at Boschendal. We love warm, natural light and candid storytelling.", stage: "new", source: "Website form", createdAt: iso(-1) },
    { id: "l2", name: "Grace Adeyemi", email: "grace.a@example.com", phone: "+27 73 221 8890", eventType: "Maternity", eventDate: dateOnly(38), guests: 2, budget: "$700", message: "Looking for a studio maternity session with a neutral backdrop.", stage: "contacted", source: "Instagram", createdAt: iso(-4) },
    { id: "l3", name: "Nomvula Khumalo", email: "nomvula.k@example.com", phone: "+27 84 900 7712", eventType: "Family", eventDate: dateOnly(21), guests: 6, budget: "$450", message: "Extended family shoot — three generations, outdoors if possible.", stage: "quoted", source: "Referral", createdAt: iso(-9) },
    { id: "l4", name: "Daniel Okafor", email: "d.okafor@example.com", phone: "+27 79 442 6620", eventType: "Corporate headshots", eventDate: dateOnly(30), guests: 18, budget: "$1,800", message: "Team of 18, on-site at our office. Need consistent retouching.", stage: "won", source: "Google", createdAt: iso(-16) },
    { id: "l5", name: "The Rearitz Bakery", email: "hello@rearitz.example.com", phone: "+27 21 300 4477", eventType: "Brand content", eventDate: dateOnly(45), guests: 0, budget: "$900", message: "Product and lifestyle photography for our autumn menu.", stage: "quoted", source: "Website form", createdAt: iso(-11) },
    { id: "l6", name: "Kabelo Sithole", email: "kabelo.s@example.com", phone: "+27 82 118 4455", eventType: "Engagement", eventDate: dateOnly(60), guests: 2, budget: "$500", message: "Golden-hour engagement shoot in the city.", stage: "lost", source: "Instagram", createdAt: iso(-22) },
  ];

  const sessions: Session[] = [
    { id: "s1", clientId: "c3", title: "Maternity session — studio", date: dateOnly(2), time: "10:00", durationMins: 90, location: "Studio B", type: "Maternity", status: "scheduled", notes: "Bring the wrap set and the cream backdrop." },
    { id: "s2", clientId: "c4", title: "Headshots — pickup selects", date: dateOnly(3), time: "14:30", durationMins: 30, location: "Online call", type: "Headshots", status: "scheduled", notes: "Walk through retouched picks." },
    { id: "s3", clientId: "c1", title: "Album design review", date: dateOnly(6), time: "11:00", durationMins: 60, location: "Studio A", type: "Wedding", status: "scheduled", notes: "First 20 spreads ready to review." },
    { id: "s4", clientId: "c2", title: "Family mini session", date: dateOnly(9), time: "16:00", durationMins: 60, location: "Kenilworth gardens", type: "Family", status: "scheduled", notes: "Late afternoon light, meet at the rose garden gate." },
    { id: "s5", clientId: "c1", title: "Mokoena wedding — day one", date: dateOnly(-14), time: "09:00", durationMins: 600, location: "Vergelegen Estate", type: "Wedding", status: "completed", notes: "Two shooters, 1,240 frames." },
    { id: "s6", clientId: "c5", title: "Choir annual concert", date: dateOnly(-38), time: "19:00", durationMins: 240, location: "City Hall", type: "Event", status: "completed", notes: "Stage lighting only — high ISO set." },
  ];

  const invoices: Invoice[] = [
    { id: "i1", number: "INV-1041", clientId: "c1", items: [{ name: "Full-day wedding coverage", qty: 1, price: 3200 }, { name: "Second shooter", qty: 1, price: 450 }], total: 3650, status: "paid", dueDate: dateOnly(-20), createdAt: iso(-40) },
    { id: "i2", number: "INV-1042", clientId: "c2", items: [{ name: "Family session", qty: 1, price: 380 }, { name: "Fine-art print set", qty: 3, price: 85 }], total: 635, status: "overdue", dueDate: dateOnly(-6), createdAt: iso(-30) },
    { id: "i3", number: "INV-1043", clientId: "c4", items: [{ name: "Corporate headshot package", qty: 1, price: 1200 }], total: 1200, status: "sent", dueDate: dateOnly(9), createdAt: iso(-4) },
    { id: "i4", number: "INV-1044", clientId: "c3", items: [{ name: "Maternity session deposit", qty: 1, price: 200 }], total: 200, status: "paid", dueDate: dateOnly(-3), createdAt: iso(-12) },
    { id: "i5", number: "INV-1045", clientId: "c1", items: [{ name: "Album upgrade — 40 spreads", qty: 1, price: 780 }], total: 780, status: "draft", dueDate: dateOnly(20), createdAt: iso(-2) },
  ];

  const quotes: Quote[] = [
    { id: "q1", number: "QUO-031", clientId: "c1", title: "Mokoena wedding collection", items: [{ name: "Full-day coverage, 2 shooters", qty: 1, price: 3200 }, { name: "Engagement mini-session", qty: 1, price: 250 }, { name: "40-spread album", qty: 1, price: 780 }], total: 4230, status: "accepted", validUntil: dateOnly(30), createdAt: iso(-55) },
    { id: "q2", number: "QUO-032", clientId: "c2", title: "Family autumn collection", items: [{ name: "90-minute session", qty: 1, price: 380 }, { name: "Print credit", qty: 150, price: 1 }], total: 530, status: "sent", validUntil: dateOnly(12), createdAt: iso(-10) },
    { id: "q3", number: "QUO-033", clientId: "c3", title: "Maternity & newborn bundle", items: [{ name: "Maternity session", qty: 1, price: 420 }, { name: "Newborn session", qty: 1, price: 480 }], total: 900, status: "sent", validUntil: dateOnly(18), createdAt: iso(-5) },
    { id: "q4", number: "QUO-034", clientId: "c4", title: "Team headshots — 18 people", items: [{ name: "On-site headshot day", qty: 1, price: 1400 }, { name: "Retouching per person", qty: 18, price: 22 }], total: 1796, status: "draft", validUntil: dateOnly(25), createdAt: iso(-1) },
  ];

  const contracts: Contract[] = [
    { id: "ct1", title: "Wedding services agreement — Mokoena", clientId: "c1", value: 4230, status: "signed", updatedAt: iso(-50) },
    { id: "ct2", title: "Corporate headshots — Okafor", clientId: "c4", value: 1796, status: "awaiting-signature", updatedAt: iso(-2) },
    { id: "ct3", title: "Family session terms — Naidoo", clientId: "c2", value: 530, status: "signed", updatedAt: iso(-26) },
  ];

  const questionnaires: Questionnaire[] = [
    { id: "qn1", title: "Wedding day questionnaire", audience: "Wedding clients", questions: ["Tell us about how you met.", "Which moments matter most to you?", "Any family sensitivities on the day?", "Shot list must-haves?", "Venue coordinator contact?"], responses: 3, updatedAt: iso(-30) },
    { id: "qn2", title: "Family session preferences", audience: "Family clients", questions: ["Children's ages?", "Favourite colours for styling?", "Anyone camera-shy?", "Preferred location?"], responses: 5, updatedAt: iso(-44) },
    { id: "qn3", title: "Headshot intake", audience: "Corporate clients", questions: ["How will you use the photos?", "Preferred retouching level?", "Company brand guidelines?"], responses: 2, updatedAt: iso(-8) },
  ];

  const products: Product[] = [
    { id: "p1", name: "High-resolution digital collection", type: "digital", price: 290, description: "Full-resolution, print-ready files delivered by gallery download.", seed: "pixora-p1", active: true },
    { id: "p2", name: "Web-size social pack", type: "digital", price: 60, description: "20 web-optimised images sized for social sharing.", seed: "pixora-p2", active: true },
    { id: "p3", name: "Fine-art print — A2", type: "print", price: 120, description: "Giclée print on 310gsm cotton rag, unmounted.", seed: "pixora-p3", active: true },
    { id: "p4", name: "Fine-art print — A3", type: "print", price: 70, description: "Giclée print on 310gsm cotton rag, unmounted.", seed: "pixora-p4", active: true },
    { id: "p5", name: "Linen album — 30 spreads", type: "package", price: 690, description: "Hand-bound linen album with lay-flat pages.", seed: "pixora-p5", active: true },
    { id: "p6", name: "Linen album — 40 spreads", type: "package", price: 780, description: "Hand-bound linen album with lay-flat pages and presentation box.", seed: "pixora-p6", active: true },
    { id: "p7", name: "Desk folio box", type: "print", price: 180, description: "Ten 5×7 prints in a keepsake folio box.", seed: "pixora-p7", active: true },
    { id: "p8", name: "Parent duplicate album", type: "package", price: 340, description: "Smaller duplicate of the main album for parents.", seed: "pixora-p8", active: false },
  ];

  const orders: Order[] = [
    { id: "o1", number: "ORD-2201", clientId: "c1", items: [{ name: "Linen album — 40 spreads", qty: 1, price: 780 }, { name: "Parent duplicate album", qty: 2, price: 340 }], total: 1460, status: "fulfilled", createdAt: iso(-8) },
    { id: "o2", number: "ORD-2202", clientId: "c2", items: [{ name: "Fine-art print — A2", qty: 2, price: 120 }, { name: "Desk folio box", qty: 1, price: 180 }], total: 420, status: "paid", createdAt: iso(-5) },
    { id: "o3", number: "ORD-2203", clientId: "c4", items: [{ name: "High-resolution digital collection", qty: 1, price: 290 }], total: 290, status: "paid", createdAt: iso(-3) },
    { id: "o4", number: "ORD-2204", clientId: "c1", items: [{ name: "Fine-art print — A3", qty: 4, price: 70 }], total: 280, status: "pending", createdAt: iso(-1) },
    { id: "o5", number: "ORD-2205", clientId: "c2", items: [{ name: "Web-size social pack", qty: 1, price: 60 }], total: 60, status: "fulfilled", createdAt: iso(-12) },
    { id: "o6", number: "ORD-2206", clientId: "c5", items: [{ name: "Fine-art print — A2", qty: 1, price: 120 }], total: 120, status: "refunded", createdAt: iso(-20) },
  ];

  const coupons: Coupon[] = [
    { id: "cp1", code: "WINTER15", percentOff: 15, active: true, uses: 9 },
    { id: "cp2", code: "ALBUM10", percentOff: 10, active: true, uses: 22 },
    { id: "cp3", code: "FAMILY20", percentOff: 20, active: false, uses: 4 },
    { id: "cp4", code: "WELCOME5", percentOff: 5, active: true, uses: 41 },
  ];

  const team: TeamMember[] = [
    { id: "t1", name: "Naledi Petersen", email: "naledi@pixora.studio", role: "owner", status: "active" },
    { id: "t2", name: "Marcus Feldt", email: "marcus@pixora.studio", role: "editor", status: "active" },
    { id: "t3", name: "Ayanda Mbeki", email: "ayanda@pixora.studio", role: "assistant", status: "active" },
    { id: "t4", name: "jules@freelance.example.com", email: "jules@freelance.example.com", role: "viewer", status: "invited" },
  ];

  const activity: ActivityItem[] = [
    { id: "a1", kind: "gallery", message: "Amara favorited 3 photos in “Mokoena Wedding — Getting Ready”", time: iso(-0.04) },
    { id: "a2", kind: "order", message: "Order ORD-2204 placed — $280", time: iso(-0.2) },
    { id: "a3", kind: "lead", message: "New inquiry from Fatima & Yusuf Patel via the website form", time: iso(-1) },
    { id: "a4", kind: "invoice", message: "Invoice INV-1042 is overdue by 6 days", time: iso(-1.2) },
    { id: "a5", kind: "gallery", message: "“Ndlovu Headshots — Round 1” published and shared", time: iso(-4) },
    { id: "a6", kind: "session", message: "Maternity session confirmed for Lerato Dlamini", time: iso(-5) },
    { id: "a7", kind: "client", message: "Note added to The Naidoo Family profile", time: iso(-6) },
    { id: "a8", kind: "system", message: "Weekly gallery report sent to 4 clients", time: iso(-7) },
  ];

  const websitePages: WebsitePage[] = [
    { id: "w1", title: "Home", path: "/", published: true, headline: "Honest, light-filled photography for life's real moments", subtext: "Weddings, families and editorial portraits across the Cape and beyond." },
    { id: "w2", title: "About", path: "/about", published: true, headline: "A small studio with a documentary heart", subtext: "Led by Naledi Petersen, shooting on film and digital since 2016." },
    { id: "w3", title: "Portfolio", path: "/portfolio", published: true, headline: "Selected work", subtext: "A rotating edit of recent weddings, portraits and editorial commissions." },
    { id: "w4", title: "Pricing", path: "/pricing", published: false, headline: "Collections & pricing", subtext: "Transparent collections with room to tailor." },
    { id: "w5", title: "Contact", path: "/contact", published: true, headline: "Let's talk about your day", subtext: "Tell us your date and we'll reply within two working days." },
  ];

  return {
    version: 1,
    signedIn: false,
    onboarded: false,
    studioName: "Naledi Petersen Photography",
    galleries,
    clients,
    leads,
    sessions,
    invoices,
    quotes,
    contracts,
    questionnaires,
    products,
    orders,
    coupons,
    team,
    activity,
    websitePages,
    domain: { configured: false, hostname: "pixora.studio" },
  };
}

export { seedState };
