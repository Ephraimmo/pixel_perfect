// Pixora quotes demo data — proposals sent to clients or open leads, plus the
// studio's price list used to add common line items quickly.

import type { LineItem } from "./crm-data";

/** Stored status. "Expired" is derived from the valid-until date, never stored. */
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface Quote {
  id: string;
  number: string;
  /** Exactly one of clientId / leadId is set. */
  clientId?: string | undefined;
  leadId?: string | undefined;
  projectId?: string | undefined;
  title: string;
  issueDate: string; // ISO date
  validUntil: string; // ISO date
  items: LineItem[];
  /** Percent, applied after the discount. */
  taxRate: number;
  discount: { kind: "percent" | "amount"; value: number };
  /** Message shown to the client above the line items. */
  message: string;
  terms: string;
  status: QuoteStatus;
  /** When the client accepted or declined. */
  respondedAt?: string | undefined;
}

export interface PriceListItem {
  id: string;
  name: string;
  unit: string;
  price: number;
}

export const PRICE_LIST: PriceListItem[] = [
  { id: "wed-hour", name: "Wedding coverage", unit: "per hour", price: 250 },
  { id: "second", name: "Second shooter", unit: "per hour", price: 90 },
  { id: "engage", name: "Engagement session", unit: "session", price: 450 },
  { id: "album", name: "Fine art album (30 pages)", unit: "album", price: 650 },
  { id: "drone", name: "Drone coverage", unit: "event", price: 350 },
  { id: "portrait", name: "Portrait session (1 hour)", unit: "session", price: 250 },
  { id: "family", name: "Family session (90 min)", unit: "session", price: 350 },
  { id: "headshot", name: "Headshot", unit: "per person", price: 120 },
  { id: "halfday", name: "Commercial shoot — half day", unit: "half day", price: 1200 },
  { id: "retouch", name: "Additional retouched image", unit: "per image", price: 25 },
  { id: "licence", name: "Commercial usage licence", unit: "licence", price: 150 },
  { id: "travel", name: "Travel (beyond 50 km)", unit: "trip", price: 180 },
];

export const DEFAULT_QUOTE_TERMS =
  "This quote is valid until the date shown. A 30% deposit secures your date; the balance is due 14 days before the session. Images are delivered in a private online gallery within 4 weeks.";

const li = (id: string, description: string, quantity: number, unitPrice: number) => ({
  id,
  description,
  quantity,
  unitPrice,
});
const none = { kind: "amount", value: 0 } as const;

export function seedQuotes(): Quote[] {
  return [
    {
      id: "q1023",
      number: "Q-1023",
      leadId: "l6",
      title: "Maternity & newborn bundle",
      issueDate: "2025-04-19",
      validUntil: "2025-05-19",
      items: [
        li("a", "Maternity session — Kirstenbosch Gardens", 1, 350),
        li("b", "Newborn session at home", 1, 450),
      ],
      taxRate: 0,
      discount: { kind: "percent", value: 10 },
      message:
        "Hi Megan — as promised, here's a bundle for both sessions with 10% off. The newborn session is best within the first two weeks.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "draft",
    },
    {
      id: "q1022",
      number: "Q-1022",
      clientId: "c11",
      projectId: "pr8",
      title: "Johnson Fitness brand refresh",
      issueDate: "2025-04-15",
      validUntil: "2025-05-15",
      items: [
        li("a", "Commercial shoot — half day on location", 1, 1200),
        li("b", "Additional retouched images", 30, 25),
        li("c", "Commercial usage licence (web & social)", 1, 150),
      ],
      taxRate: 0,
      discount: none,
      message:
        "Thanks for the call, Marcus. This covers the gym, the coaching team and product flat-lays.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "sent",
    },
    {
      id: "q1021",
      number: "Q-1021",
      leadId: "l9",
      title: "Wedding collection — full day with second shooter",
      issueDate: "2025-03-21",
      validUntil: "2025-04-21",
      items: [
        li("a", "Wedding coverage", 10, 250),
        li("b", "Second shooter", 8, 90),
        li("c", "Drone coverage", 1, 350),
        li("d", "Fine art album (30 pages)", 1, 650),
      ],
      taxRate: 0,
      discount: { kind: "amount", value: 300 },
      message:
        "Congratulations again, Nomvula! This is the full-day collection we discussed, with drone coverage of the valley.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "sent",
    },
    {
      id: "q1020",
      number: "Q-1020",
      leadId: "l8",
      title: "Team headshots & office photography",
      issueDate: "2025-03-26",
      validUntil: "2025-04-25",
      items: [
        li("a", "Headshot", 12, 120),
        li("b", "Office & team photography — half day", 1, 850),
        li("c", "Travel (beyond 50 km)", 1, 60),
      ],
      taxRate: 0,
      discount: none,
      message: "Consistent lighting for all 12 attorneys, shot on-site in one morning.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "sent",
    },
    {
      id: "q1019",
      number: "Q-1019",
      clientId: "c10",
      projectId: "pr5",
      title: "Wedding collection — Silver",
      issueDate: "2025-03-01",
      validUntil: "2025-03-31",
      items: [
        li("a", "Wedding coverage", 6, 250),
        li("b", "Engagement session", 1, 450),
        li("c", "Fine art album (30 pages)", 1, 650),
        li("d", "Travel (beyond 50 km)", 1, 400),
      ],
      taxRate: 0,
      discount: none,
      message: "Here's the Silver collection for your Franschhoek wedding.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "accepted",
      respondedAt: "2025-03-03",
    },
    {
      id: "q1017",
      number: "Q-1017",
      leadId: "l12",
      title: "BrightPath conference coverage",
      issueDate: "2025-03-17",
      validUntil: "2025-04-01",
      items: [
        li("a", "Conference coverage (per day)", 2, 1100),
        li("b", "Sponsor-wall photo booth", 1, 600),
      ],
      taxRate: 15,
      discount: none,
      message: "Two full days of speaker and networking coverage, plus a branded booth.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "declined",
      respondedAt: "2025-03-25",
    },
    {
      id: "q1015",
      number: "Q-1015",
      clientId: "c8",
      title: "Personal branding session",
      issueDate: "2024-11-01",
      validUntil: "2024-12-01",
      items: [
        li("a", "Portrait session (1 hour)", 1, 250),
        li("b", "Additional retouched images", 10, 25),
      ],
      taxRate: 0,
      discount: none,
      message: "A refresh of your branding images for the new year.",
      terms: DEFAULT_QUOTE_TERMS,
      status: "sent",
    },
  ];
}
