// Pixora store data — commerce types, seed catalog and order history, plus
// pure sales helpers. Kept apart from the studio demo state (lib/store.tsx);
// there is no backend or payment provider, so all of this is local demo data.

import { DEMO_TODAY, PHOTOS, img } from "./demo-data";

// ---------- types ----------

export type ProductCategory = "print" | "digital" | "package";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  /** What the studio pays the lab per item, when known; used for margins. */
  cost: number | null;
  sku: string;
  available: boolean;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  popular: boolean;
  /** Base price; when the product has variants each variant carries its own price. */
  price: number;
  /** Unsplash photo id, or a data: URL for an image uploaded in the editor. */
  image: string;
  /** Listed in the storefront (false = hidden). */
  active: boolean;
  /** What the variants vary by, e.g. "Size" or "Cover". */
  optionName: string;
  variants: ProductVariant[];
  /** null = unlimited stock. */
  inventory: number | null;
  /** Last ISO date the product can be bought, or null for no end date. */
  availableUntil: string | null;
  /** Download & delivery settings; set for digital products, null otherwise. */
  digital: DigitalSettings | null;
  /** Options & fulfillment for print products (sizes are the variants); null otherwise. */
  print: PrintSettings | null;
}

export interface PrintOptionChoice {
  id: string;
  label: string;
  /** Added to the size price. */
  price: number;
}

/** A choice the client makes on top of the size, e.g. Paper or Mounting. */
export interface PrintOption {
  id: string;
  name: string;
  choices: PrintOptionChoice[];
}

export type LabId = "whcc" | "bay-photo" | "millers" | "loxley";

export interface PrintFulfillment {
  /** lab = sent to a print lab; self = printed or packed by the studio. */
  method: "lab" | "self";
  lab: LabId;
  /** Working days to produce before shipping. */
  productionDays: number;
  /** client = lab drop-ships; studio = ship to the studio to inspect first. */
  shipTo: "client" | "studio";
}

export interface PrintSettings {
  options: PrintOption[];
  fulfillment: PrintFulfillment;
}

export interface ShippingSettings {
  /** Flat shipping per order for physical products. */
  flatRate: number;
  /** Order subtotal that ships free, or null for never. */
  freeOver: number | null;
  localPickup: boolean;
  pickupNote: string;
}

/** single = one photo the client picks; gallery = every photo; files = uploaded files. */
export type DigitalScope = "single" | "gallery" | "files";
export type DigitalResolution = "original" | "high" | "web";

export interface DigitalFile {
  id: string;
  name: string;
  /** Bytes. Only file metadata is kept — there is no file storage in the demo. */
  size: number;
}

export interface DigitalSettings {
  scope: DigitalScope;
  resolution: DigitalResolution;
  /** Downloads allowed per purchase, or null for unlimited. */
  downloadLimit: number | null;
  /** Days the download link stays valid, or null for no expiry. */
  expiryDays: number | null;
  /** instant = link emailed on payment; manual = studio delivers after editing. */
  delivery: "instant" | "manual";
  /** Promised turnaround for manual delivery. */
  manualDays: number;
  printRelease: boolean;
  files: DigitalFile[];
}

export interface DeliveryEmail {
  senderName: string;
  replyTo: string;
  subject: string;
  body: string;
}

export interface StoreSettings {
  /** Applied to new digital products. */
  digitalDefaults: Omit<DigitalSettings, "files">;
  deliveryEmail: DeliveryEmail;
  /** Applied to new print products. */
  printDefaults: PrintFulfillment;
  /** Default markup used by "price from lab cost". */
  markupPercent: number;
  shipping: ShippingSettings;
  payments: PaymentSettings;
}

export interface PaymentSettings {
  /** Bank transfer / EFT, confirmed by the studio by hand. */
  manualEnabled: boolean;
  manualInstructions: string;
}

/** pending = awaiting payment; paid/processing/shipped have been paid. */
/** pending = awaiting payment; cancelled orders were never paid. */
export type ShopOrderStatus =
  "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  /** Variant name, e.g. "16x20", when the product has variants. */
  variant?: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export type DeliveryMethod = "ship" | "pickup" | "digital";
export type PaymentMethodId = "stripe" | "paypal" | "manual";

export interface ShopOrder {
  id: string;
  number: string;
  customer: string;
  email: string;
  phone: string;
  date: string; // ISO date
  status: ShopOrderStatus;
  items: OrderItem[];
  /** Item total before discount. */
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  delivery: DeliveryMethod;
  /** Set when delivery is "ship". */
  shippingAddress: Address | null;
  paymentMethod: PaymentMethodId;
  note: string;
}

export type CouponType = "percent" | "fixed" | "free-shipping";

export interface Coupon {
  id: string;
  /** Upper-case code clients type at checkout. */
  code: string;
  description: string;
  type: CouponType;
  /** Percent (1–100) or dollars off; unused for free shipping. */
  value: number;
  /** "all", or only items of one product type. */
  appliesTo: "all" | ProductCategory;
  /** Minimum qualifying subtotal, or null. */
  minSubtotal: number | null;
  /** Inclusive ISO dates; null = no limit. */
  startsOn: string | null;
  endsOn: string | null;
  /** Total redemptions allowed, or null for unlimited. */
  usageLimit: number | null;
  oncePerCustomer: boolean;
  /** Redemptions on paid orders so far. */
  uses: number;
  active: boolean;
  createdAt: string;
}

export interface ShopState {
  version: number;
  products: ShopProduct[];
  orders: ShopOrder[];
  settings: StoreSettings;
  coupons: Coupon[];
}

export const SHOP_STATE_VERSION = 6;

export const ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const isPaid = (o: Pick<ShopOrder, "status">) =>
  o.status !== "pending" && o.status !== "cancelled";

/** Image URL for a product, whether it is a stock photo id or an uploaded data URL. */
export function productImage(image: string, w = 800, h?: number): string {
  return image.startsWith("data:") ? image : img(image, w, h);
}

/** Lowest price a client can pay, considering available variants. */
export function fromPrice(p: Pick<ShopProduct, "price" | "variants">): number {
  const prices = p.variants.filter((v) => v.available).map((v) => v.price);
  return prices.length ? Math.min(...prices) : p.price;
}

export type Availability = "hidden" | "sold-out" | "ended" | "available";

/** Whether clients can buy the product today. */
export function availability(
  p: Pick<ShopProduct, "active" | "inventory" | "availableUntil" | "variants">,
  today = DEMO_TODAY,
): Availability {
  if (!p.active) return "hidden";
  if (p.availableUntil && p.availableUntil < today) return "ended";
  if (p.inventory === 0) return "sold-out";
  if (p.variants.length > 0 && !p.variants.some((v) => v.available)) return "sold-out";
  return "available";
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  hidden: "Hidden",
  "sold-out": "Sold out",
  ended: "Sale ended",
  available: "Listed",
};

export const itemCount = (o: Pick<ShopOrder, "items">) =>
  o.items.reduce((s, i) => s + i.quantity, 0);

// ---------- dates ----------

/** Shift an ISO date by whole days (UTC, so DST never skips a day). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface DateRange {
  from: string; // inclusive ISO date
  to: string; // inclusive ISO date
}

/** The last `days` days ending on `today`, and the equal-length period before it. */
export function periodRanges(days: number, today = DEMO_TODAY) {
  const current: DateRange = { from: addDays(today, -(days - 1)), to: today };
  const previous: DateRange = { from: addDays(current.from, -days), to: addDays(current.from, -1) };
  return { current, previous };
}

export const inRange = (date: string, r: DateRange) => date >= r.from && date <= r.to;

// ---------- sales summaries ----------

export interface SalesSummary {
  /** Paid revenue. Orders awaiting payment are never counted as sales. */
  revenue: number;
  /** Every order placed, paid or not. */
  orders: number;
  paidOrders: number;
  averageOrder: number;
  itemsSold: number;
}

export function summarize(orders: ShopOrder[], range: DateRange): SalesSummary {
  const placed = orders.filter((o) => o.status !== "cancelled" && inRange(o.date, range));
  const paid = placed.filter(isPaid);
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  return {
    revenue,
    orders: placed.length,
    paidOrders: paid.length,
    averageOrder: paid.length ? revenue / paid.length : 0,
    itemsSold: paid.reduce((s, o) => s + itemCount(o), 0),
  };
}

/** Percent change, or null when there is no previous value to compare against. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface RevenuePoint {
  /** First ISO date in the bucket. */
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

/** Paid revenue per day, or per week when the range is longer than 31 days. */
export function revenueSeries(orders: ShopOrder[], range: DateRange): RevenuePoint[] {
  const span = daysBetween(range.from, range.to) + 1;
  const step = span > 31 ? 7 : 1;
  const points: RevenuePoint[] = [];
  for (let start = range.from; start <= range.to; start = addDays(start, step)) {
    const end = addDays(start, step - 1);
    const bucket: DateRange = { from: start, to: end < range.to ? end : range.to };
    const paid = orders.filter((o) => isPaid(o) && inRange(o.date, bucket));
    points.push({
      date: start,
      label: shortDate(start),
      revenue: paid.reduce((s, o) => s + o.total, 0),
      orders: paid.length,
    });
  }
  return points;
}

export interface ProductSales {
  product: ShopProduct;
  units: number;
  revenue: number;
}

/** Best sellers by paid revenue in the range; products with no sales are left out. */
export function topProducts(
  orders: ShopOrder[],
  products: ShopProduct[],
  range: DateRange,
  limit = 5,
): ProductSales[] {
  const byId = new Map<string, ProductSales>();
  for (const o of orders) {
    if (!isPaid(o) || !inRange(o.date, range)) continue;
    for (const i of o.items) {
      const product = products.find((p) => p.id === i.productId);
      if (!product) continue;
      const row = byId.get(product.id) ?? { product, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += i.quantity * i.unitPrice;
      byId.set(product.id, row);
    }
  }
  return [...byId.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/** Newest first; ties broken by order number. */
export function recentOrders(orders: ShopOrder[], limit = 5): ShopOrder[] {
  return [...orders]
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
    .slice(0, limit);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ---------- seed ----------

const W = PHOTOS.wedding;

type SeedProduct = Pick<
  ShopProduct,
  "id" | "name" | "category" | "popular" | "price" | "image" | "active"
> &
  Partial<ShopProduct>;

/** Defaults for product fields added after store state v1. */
export const PRODUCT_DEFAULTS: Pick<
  ShopProduct,
  "description" | "optionName" | "variants" | "inventory" | "availableUntil" | "digital" | "print"
> = {
  description: "",
  optionName: "",
  variants: [],
  inventory: null,
  availableUntil: null,
  digital: null,
  print: null,
};

export const SEED_SETTINGS: StoreSettings = {
  digitalDefaults: {
    scope: "single",
    resolution: "original",
    downloadLimit: 3,
    expiryDays: 30,
    delivery: "instant",
    manualDays: 7,
    printRelease: true,
  },
  deliveryEmail: {
    senderName: "Karabo Photography",
    replyTo: "karabo@pixora.com",
    subject: "Your {product_name} is ready to download",
    body: [
      "Hi {client_name},",
      "",
      "Thank you for your order! Your {product_name} is ready.",
      "",
      "Download your photos: {download_link}",
      "{expiry}",
      "",
      "With love,",
      "{studio_name}",
    ].join("\n"),
  },
  printDefaults: { method: "lab", lab: "whcc", productionDays: 5, shipTo: "client" },
  markupPercent: 250,
  shipping: {
    flatRate: 12,
    freeOver: 150,
    localPickup: true,
    pickupNote: "Collect from the studio, 14 Bree Street, weekdays 9am–5pm.",
  },
  payments: {
    manualEnabled: true,
    manualInstructions: [
      "Bank: First National Bank",
      "Account name: Karabo Photography",
      "Account number: 6281 044 7395",
      "Branch code: 250655",
      "Use your order number as the payment reference.",
    ].join("\n"),
  },
};

/** New print products start with the store's default fulfillment and no options. */
export function defaultPrintSettings(settings: StoreSettings): PrintSettings {
  return { options: [], fulfillment: { ...settings.printDefaults } };
}

/** New digital products start from the store's delivery defaults. */
export function defaultDigitalSettings(settings: StoreSettings): DigitalSettings {
  return { ...settings.digitalDefaults, files: [] };
}

const v = (
  id: string,
  name: string,
  price: number,
  sku: string,
  cost: number | null = null,
): ProductVariant => ({ id, name, price, cost, sku, available: true });

const choice = (id: string, label: string, price = 0): PrintOptionChoice => ({ id, label, price });
const lab = (l: LabId, productionDays: number): PrintFulfillment => ({
  method: "lab",
  lab: l,
  productionDays,
  shipTo: "client",
});
const PAPER: PrintOption = {
  id: "opt-paper",
  name: "Paper",
  choices: [
    choice("lustre", "Lustre"),
    choice("matte", "Matte"),
    choice("metallic", "Metallic", 4),
  ],
};

const SEED_DIGITAL: DigitalSettings = {
  scope: "single",
  resolution: "original",
  downloadLimit: 3,
  expiryDays: 30,
  delivery: "instant",
  manualDays: 7,
  printRelease: true,
  files: [],
};

const SEED: SeedProduct[] = [
  {
    id: "p1",
    name: "8x10 Print",
    category: "print",
    popular: true,
    price: 25,
    image: W[1],
    active: true,
    description:
      "A classic 8x10 on archival photo paper — the size for desks, shelves and gifting grandparents.",
    optionName: "Size",
    variants: [v("p1-8x10", "8x10", 25, "PRT-0810", 3.2)],
    print: { options: [PAPER], fulfillment: lab("whcc", 5) },
  },
  {
    id: "p2",
    name: "Digital Download",
    category: "digital",
    popular: true,
    price: 10,
    image: W[0],
    active: true,
    description: "One full-resolution, edited image from your gallery, delivered by download link.",
    digital: { ...SEED_DIGITAL, scope: "single" },
  },
  {
    id: "p3",
    name: "Wedding Package",
    category: "package",
    popular: false,
    price: 1200,
    image: W[2],
    active: true,
    description:
      "Every edited image from your day as high-resolution downloads, plus a 20-page heirloom album and two 16x20 canvas prints.",
  },
  {
    id: "p4",
    name: "Canvas Print",
    category: "print",
    popular: false,
    price: 160,
    image: PHOTOS.family[0],
    active: true,
    description: "Gallery-wrapped canvas on a 1.5-inch pine frame, ready to hang.",
    optionName: "Size",
    variants: [
      v("p4-12x16", "12x16", 160, "CAN-1216", 38),
      v("p4-16x20", "16x20", 210, "CAN-1620", 52),
      v("p4-24x36", "24x36", 340, "CAN-2436", 95),
    ],
    print: {
      options: [
        {
          id: "opt-wrap",
          name: "Edge",
          choices: [
            choice("gallery", "Gallery wrap"),
            choice("mirror", "Mirror wrap"),
            choice("float", "Oak float frame", 85),
          ],
        },
      ],
      fulfillment: lab("bay-photo", 7),
    },
  },
  {
    id: "p5",
    name: "11x14 Fine Art Print",
    category: "print",
    popular: true,
    price: 45,
    image: W[8],
    active: true,
    description: "Museum-grade cotton rag paper with a soft matte finish and deep blacks.",
    optionName: "Size",
    variants: [v("p5-11x14", "11x14", 45, "FA-1114", 9.8)],
    print: {
      options: [
        {
          id: "opt-mount",
          name: "Mounting",
          choices: [choice("none", "Unmounted"), choice("board", "Mounted on archival board", 18)],
        },
      ],
      fulfillment: lab("millers", 6),
    },
  },
  {
    id: "p6",
    name: "Full Gallery Download",
    category: "digital",
    popular: true,
    price: 250,
    image: W[3],
    active: true,
    description:
      "Every edited image in your gallery in full resolution, with a personal-use print release.",
    digital: { ...SEED_DIGITAL, scope: "gallery", downloadLimit: 5, expiryDays: 60 },
  },
  {
    id: "p7",
    name: "Heirloom Album",
    category: "package",
    popular: false,
    price: 480,
    image: W[11],
    active: true,
    description: "A lay-flat, 30-page album bound by hand. Limited studio stock each season.",
    optionName: "Cover",
    variants: [
      v("p7-linen", "Natural linen", 480, "ALB-LIN"),
      v("p7-leather", "Italian leather", 560, "ALB-LEA"),
    ],
    inventory: 6,
  },
  {
    id: "p8",
    name: "Metal Print 16x20",
    category: "print",
    popular: false,
    price: 120,
    image: PHOTOS.travel[2],
    active: true,
    description: "Dye-infused aluminium with a float mount — vivid colour that suits landscapes.",
    optionName: "Size",
    variants: [v("p8-16x20", "16x20", 120, "MTL-1620", 58)],
    print: {
      options: [
        {
          id: "opt-finish",
          name: "Finish",
          choices: [choice("gloss", "Gloss"), choice("satin", "Satin")],
        },
      ],
      fulfillment: lab("bay-photo", 8),
    },
  },
  {
    id: "p9",
    name: "Holiday Card Set",
    category: "print",
    popular: false,
    price: 65,
    image: PHOTOS.family[2],
    active: false,
    description: "Folded 5x7 cards with envelopes, printed with your favourite family photo.",
    optionName: "Size",
    variants: [
      v("p9-25", "5x7 · 25 cards", 65, "CRD-25", 22),
      v("p9-50", "5x7 · 50 cards", 110, "CRD-50", 38),
    ],
    print: {
      options: [
        {
          id: "opt-card",
          name: "Card stock",
          choices: [choice("pearl", "Pearl"), choice("linen", "Linen", 10)],
        },
      ],
      fulfillment: { method: "self", lab: "whcc", productionDays: 3, shipTo: "client" },
    },
    availableUntil: "2024-12-10",
  },
];

const SEED_PRODUCTS: ShopProduct[] = SEED.map((p) => ({ ...PRODUCT_DEFAULTS, ...p }));

const addr = (line1: string, city: string, region: string, postalCode: string): Address => ({
  line1,
  line2: "",
  city,
  region,
  postalCode,
  country: "South Africa",
});

/** Phone and address per seeded customer email; null address = collects from the studio. */
const CUSTOMER_DETAILS: Record<string, { phone: string; address: Address | null }> = {
  "sarah@sarahmitchell.com": {
    phone: "+27 82 555 0141",
    address: addr("12 Kloof Nek Road", "Cape Town", "Western Cape", "8001"),
  },
  "james@jamescarter.com": {
    phone: "+27 83 555 0177",
    address: addr("4 Dorp Street", "Stellenbosch", "Western Cape", "7600"),
  },
  "emma@emmawilson.com": { phone: "+27 72 555 0109", address: null },
  "david@davidkim.com": {
    phone: "+27 84 555 0123",
    address: addr("88 Jan Smuts Avenue", "Johannesburg", "Gauteng", "2196"),
  },
  "olivia@oliviabrown.com": {
    phone: "+27 76 555 0190",
    address: addr("23 Florida Road", "Durban", "KwaZulu-Natal", "4001"),
  },
  "thandi.mokoena@gmail.com": { phone: "+27 71 555 0135", address: null },
  "priya.naidoo@outlook.com": {
    phone: "+27 82 555 0168",
    address: addr("9 Musgrave Road", "Durban", "KwaZulu-Natal", "4001"),
  },
  "mchen@chenarchitects.co": {
    phone: "+27 21 555 0102",
    address: addr("Unit 5, 30 Bree Street", "Cape Town", "Western Cape", "8001"),
  },
  "ava.johnson@icloud.com": {
    phone: "+27 79 555 0144",
    address: addr("17 Main Road", "Muizenberg", "Western Cape", "7945"),
  },
  "lerato.nkosi@gmail.com": {
    phone: "+27 73 555 0116",
    address: addr("301 Church Street", "Pretoria", "Gauteng", "0002"),
  },
  "noah.w@fastmail.com": {
    phone: "+27 81 555 0158",
    address: addr("6 Beach Road", "Sea Point", "Western Cape", "8005"),
  },
  "grace.vdm@gmail.com": { phone: "+27 82 555 0187", address: null },
};

const CUSTOMERS: [string, string][] = [
  ["Sarah Mitchell", "sarah@sarahmitchell.com"],
  ["James Carter", "james@jamescarter.com"],
  ["Emma Wilson", "emma@emmawilson.com"],
  ["David Kim", "david@davidkim.com"],
  ["Olivia Brown", "olivia@oliviabrown.com"],
  ["Thandi Mokoena", "thandi.mokoena@gmail.com"],
  ["Priya Naidoo", "priya.naidoo@outlook.com"],
  ["Michael Chen", "mchen@chenarchitects.co"],
  ["Ava Johnson", "ava.johnson@icloud.com"],
  ["Lerato Nkosi", "lerato.nkosi@gmail.com"],
  ["Noah Williams", "noah.w@fastmail.com"],
  ["Grace van der Merwe", "grace.vdm@gmail.com"],
];

// Relative weights for how often each product shows up in an order.
const PRODUCT_WEIGHTS: [string, number][] = [
  ["p1", 30],
  ["p2", 26],
  ["p5", 16],
  ["p4", 9],
  ["p8", 7],
  ["p6", 6],
  ["p7", 3],
  ["p3", 1],
];

/** Small deterministic PRNG so the seeded history is identical on every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rand: () => number): string {
  const total = PRODUCT_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [id, w] of PRODUCT_WEIGHTS) {
    r -= w;
    if (r < 0) return id;
  }
  return "p1";
}

/** ~90 days of order history ending on DEMO_TODAY, gently trending upward. */
const round2 = (n: number) => Math.round(n * 100) / 100;

function seedOrders(products: ShopProduct[]): ShopOrder[] {
  const rand = mulberry32(20250420);
  const days = 90;
  const orders: ShopOrder[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(DEMO_TODAY, d - (days - 1));
    const age = days - 1 - d;
    const expected = 0.45 + 0.6 * (d / days);
    const count = Math.floor(expected + rand());
    for (let n = 0; n < count; n++) {
      const [customer, email] = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)] ?? CUSTOMERS[0]!;
      const lines = new Map<string, OrderItem>();
      const lineCount = 1 + Math.floor(rand() * rand() * 3);
      for (let l = 0; l < lineCount; l++) {
        const id = pickWeighted(rand);
        const p = products.find((x) => x.id === id)!;
        const variant = p.variants.length
          ? p.variants[Math.floor(rand() * rand() * p.variants.length)]
          : undefined;
        const qty = p.category === "print" ? 1 + Math.floor(rand() * rand() * 4) : 1;
        const key = `${p.id}:${variant?.id ?? ""}`;
        const line: OrderItem = lines.get(key) ?? {
          productId: p.id,
          name: p.name,
          ...(variant ? { variant: variant.name } : {}),
          quantity: 0,
          unitPrice: variant?.price ?? p.price,
        };
        line.quantity += qty;
        lines.set(key, line);
      }
      const items = [...lines.values()];
      const digitalOnly = items.every(
        (i) => products.find((p) => p.id === i.productId)?.category === "digital",
      );
      const subtotal = round2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
      const physical = round2(
        items
          .filter((i) => products.find((p) => p.id === i.productId)?.category !== "digital")
          .reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      );
      const details = CUSTOMER_DETAILS[email] ?? { phone: "", address: null };
      const delivery: DeliveryMethod = digitalOnly
        ? "digital"
        : details.address
          ? "ship"
          : "pickup";
      const shipping =
        delivery === "ship" && physical < (SEED_SETTINGS.shipping.freeOver ?? Infinity)
          ? SEED_SETTINGS.shipping.flatRate
          : 0;
      // Some April orders used the spring promo.
      const couponCode = date >= "2025-04-01" && orders.length % 3 === 0 ? "SPRING15" : null;
      const discount = couponCode ? round2(subtotal * 0.15) : 0;
      // Digital orders deliver on payment; physical ones move through production.
      let status: ShopOrderStatus;
      if (age <= 2) status = rand() < 0.45 ? "pending" : digitalOnly ? "paid" : "processing";
      else if (age <= 9)
        status = digitalOnly ? "delivered" : rand() < 0.5 ? "processing" : "shipped";
      else status = digitalOnly || age > 14 ? "delivered" : "shipped";
      // Collected orders skip "shipped".
      if (delivery === "pickup" && status === "shipped")
        status = age > 9 ? "delivered" : "processing";
      // A few old transfers were never paid and were cancelled.
      if (age > 20 && orders.length % 13 === 5) status = "cancelled";
      orders.push({
        id: "",
        number: "",
        customer,
        email,
        date,
        status,
        items,
        phone: details.phone,
        subtotal,
        discount,
        shipping,
        total: round2(subtotal - discount + shipping),
        couponCode,
        delivery,
        shippingAddress: delivery === "ship" ? details.address : null,
        paymentMethod: "manual",
        note: "",
      });
    }
  }
  return orders.map((o, i) => ({ ...o, id: `o${i + 1}`, number: `#${1001 + i}` })).reverse();
}

const coupon = (c: Partial<Coupon> & Pick<Coupon, "id" | "code" | "type">): Coupon => ({
  description: "",
  value: 0,
  appliesTo: "all",
  minSubtotal: null,
  startsOn: null,
  endsOn: null,
  usageLimit: null,
  oncePerCustomer: false,
  uses: 0,
  active: true,
  createdAt: "2025-01-06",
  ...c,
});

const SEED_COUPONS: Coupon[] = [
  coupon({
    id: "cp1",
    code: "SPRING15",
    description: "Spring mini-session promo",
    type: "percent",
    value: 15,
    startsOn: "2025-04-01",
    endsOn: "2025-04-30",
    usageLimit: 100,
    uses: 23,
    createdAt: "2025-03-25",
  }),
  coupon({
    id: "cp2",
    code: "WELCOME10",
    description: "First order from a new client",
    type: "fixed",
    value: 10,
    minSubtotal: 50,
    oncePerCustomer: true,
    uses: 41,
  }),
  coupon({
    id: "cp3",
    code: "FREESHIP",
    description: "Free shipping on print orders",
    type: "free-shipping",
    appliesTo: "print",
    minSubtotal: 75,
    uses: 12,
    createdAt: "2025-02-10",
  }),
  coupon({
    id: "cp4",
    code: "MOTHERSDAY",
    description: "Mother's Day canvas & album offer",
    type: "percent",
    value: 25,
    appliesTo: "package",
    startsOn: "2025-05-01",
    endsOn: "2025-05-11",
    usageLimit: 50,
    createdAt: "2025-04-15",
  }),
  coupon({
    id: "cp5",
    code: "HOLIDAY24",
    description: "Holiday print sale",
    type: "percent",
    value: 20,
    appliesTo: "print",
    startsOn: "2024-11-15",
    endsOn: "2024-12-31",
    usageLimit: 100,
    uses: 58,
    createdAt: "2024-11-10",
  }),
  coupon({
    id: "cp6",
    code: "VIP50",
    description: "Thank-you for repeat wedding clients",
    type: "fixed",
    value: 50,
    minSubtotal: 200,
    usageLimit: 10,
    uses: 10,
    oncePerCustomer: true,
    createdAt: "2024-09-02",
  }),
];

export function seedShopState(): ShopState {
  const products = SEED_PRODUCTS.map((p) => structuredClone(p));
  return {
    version: SHOP_STATE_VERSION,
    products,
    orders: seedOrders(products),
    settings: structuredClone(SEED_SETTINGS),
    coupons: SEED_COUPONS.map((c) => ({ ...c })),
  };
}

/**
 * Upgrade store state saved by an earlier version instead of discarding it:
 * new product fields come from the seed product with the same id, else defaults.
 */
export function migrateShopState(saved: unknown): ShopState | null {
  if (!saved || typeof saved !== "object") return null;
  const s = saved as Partial<ShopState>;
  if (typeof s.version !== "number" || s.version < 1 || s.version > SHOP_STATE_VERSION) return null;
  if (!Array.isArray(s.products) || !Array.isArray(s.orders)) return null;
  const seed = seedShopState();
  const seedById = new Map(seed.products.map((p) => [p.id, p]));
  return {
    ...seed,
    ...s,
    version: SHOP_STATE_VERSION,
    // Orders saved before v6 have only a total: treat it as the subtotal, paid by transfer.
    orders: (s.orders as Partial<ShopOrder>[]).map(
      (o) =>
        ({
          phone: "",
          subtotal: o.total ?? 0,
          discount: 0,
          shipping: 0,
          couponCode: null,
          delivery: "ship",
          shippingAddress: null,
          paymentMethod: "manual",
          note: "",
          ...o,
        }) as ShopOrder,
    ),
    products: s.products.map((p) => {
      const seeded = seedById.get(p.id);
      const merged = { ...PRODUCT_DEFAULTS, ...seeded, ...p };
      merged.variants = merged.variants.map((x) => ({
        ...x,
        // Lab costs arrived in v4; take a seeded variant's cost when the ids match.
        cost: x.cost ?? seeded?.variants.find((sv) => sv.id === x.id)?.cost ?? null,
      }));
      // Products that became digital before v3 get the store's delivery defaults.
      if (merged.category === "digital" && !merged.digital)
        merged.digital = defaultDigitalSettings(seed.settings);
      // Before v4 prints had no sizes: keep saved variants as sizes, else take the seed's sizes,
      // else one "Standard" size at the saved price.
      if (merged.category === "print" && !(p as Partial<ShopProduct>).print) {
        merged.print = seeded?.print ?? defaultPrintSettings(seed.settings);
        if (!merged.variants.length && seeded?.variants.length) merged.variants = seeded.variants;
        else if (!merged.variants.length)
          merged.variants = [
            {
              id: `${merged.id}-std`,
              name: "Standard",
              price: merged.price,
              cost: null,
              sku: "",
              available: true,
            },
          ];
        merged.optionName = "Size";
      }
      return merged;
    }),
    // Settings groups added in later versions come from the seed.
    settings: {
      ...seed.settings,
      ...(Object.fromEntries(
        Object.entries(s.settings ?? {}).filter(([, v]) => v !== undefined && v !== null),
      ) as Partial<StoreSettings>),
    },
  };
}
