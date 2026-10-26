// Pixora CRM demo data — client notes, the per-client activity log and
// invoices. Types and seed only; demo-data.ts assembles them into DemoState.

export interface ClientNote {
  id: string;
  clientId: string;
  body: string;
  createdAt: string; // ISO date-time
  pinned: boolean;
}

export type ClientEventKind =
  "email" | "call" | "session" | "gallery" | "invoice" | "payment" | "note" | "contract" | "update";

export interface ClientEvent {
  id: string;
  clientId: string;
  kind: ClientEventKind;
  title: string;
  detail: string;
  at: string; // ISO date-time
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

/** Stored status. "Overdue" is derived from the due date, never stored. */
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void";

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId?: string | undefined;
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  items: LineItem[];
  /** Percent, applied after the discount. */
  taxRate: number;
  discount: { kind: "percent" | "amount"; value: number };
  amountPaid: number;
  status: InvoiceStatus;
  paidDate?: string | undefined;
  notes: string;
}

export function seedClientNotes(): ClientNote[] {
  return [
    {
      id: "n1",
      clientId: "c1",
      body: "Prefers candid moments over posed shots. Wants the boathouse at golden hour (around 17:40 in April).",
      createdAt: "2025-03-22T14:10:00",
      pinned: true,
    },
    {
      id: "n2",
      clientId: "c1",
      body: "Album: 30-page lay-flat, linen cover. Deciding on the cover colour after the sneak peeks.",
      createdAt: "2025-04-13T09:30:00",
      pinned: false,
    },
    {
      id: "n3",
      clientId: "c2",
      body: "Retainer — two travel shoots per quarter. Deposit of 50% invoiced upfront.",
      createdAt: "2024-11-04T11:00:00",
      pinned: true,
    },
    {
      id: "n4",
      clientId: "c3",
      body: "Two kids (6 and 9). Bring bubbles — the youngest warms up with games before posing.",
      createdAt: "2025-04-10T16:45:00",
      pinned: false,
    },
    {
      id: "n5",
      clientId: "c4",
      body: "Product shots on white plus a lifestyle set. Brand colours: amber and oak brown — avoid cool-toned props.",
      createdAt: "2025-02-12T10:15:00",
      pinned: true,
    },
    {
      id: "n6",
      clientId: "c6",
      body: "Annual autumn session — always books in April. Grandmother joins next year; plan for 9 people.",
      createdAt: "2025-04-06T08:20:00",
      pinned: false,
    },
    {
      id: "n7",
      clientId: "c9",
      body: "Needs 10–15 same-day highlight images for socials at every event.",
      createdAt: "2024-01-25T13:00:00",
      pinned: true,
    },
  ];
}

export function seedClientEvents(): ClientEvent[] {
  const e = (
    id: string,
    clientId: string,
    kind: ClientEventKind,
    at: string,
    title: string,
    detail = "",
  ): ClientEvent => ({ id, clientId, kind, at, title, detail });
  return [
    e(
      "e1",
      "c1",
      "gallery",
      "2025-04-19T16:20:00",
      "Gallery viewed",
      "Sarah & James Wedding · 8 favorites",
    ),
    e("e2", "c1", "payment", "2025-04-18T09:05:00", "Invoice INV-1042 paid", "$1,200.00 by card"),
    e(
      "e3",
      "c1",
      "gallery",
      "2025-04-12T18:30:00",
      "Gallery delivered",
      "Sarah & James Wedding · 48 photos",
    ),
    e(
      "e4",
      "c1",
      "invoice",
      "2025-04-01T10:00:00",
      "Invoice INV-1042 sent",
      "Wedding balance · due Apr 15",
    ),
    e("e5", "c1", "email", "2025-03-22T14:00:00", "Email sent", "Wedding timeline questionnaire"),
    e(
      "e6",
      "c1",
      "contract",
      "2024-10-02T11:12:00",
      "Contract signed",
      "Wedding photography agreement",
    ),
    e(
      "e7",
      "c1",
      "invoice",
      "2024-10-01T09:40:00",
      "Invoice INV-1040 sent",
      "Wedding deposit · 30%",
    ),
    e(
      "e8",
      "c2",
      "call",
      "2025-04-17T15:40:00",
      "Phone call · 12 min",
      "Shot list for the coastal road shoot",
    ),
    e(
      "e9",
      "c2",
      "invoice",
      "2025-04-14T10:30:00",
      "Invoice INV-1043 sent",
      "Travel shoot deposit · due Apr 28",
    ),
    e("e10", "c2", "session", "2025-04-02T12:00:00", "Session booked", "Consultation · Apr 22"),
    e("e11", "c3", "email", "2025-04-18T08:15:00", "Email sent", "Family session prep guide"),
    e("e12", "c3", "session", "2025-04-10T16:40:00", "Session booked", "Family Session · Apr 23"),
    e("e13", "c3", "payment", "2025-01-20T12:00:00", "Invoice INV-1036 paid", "$575.00 by EFT"),
    e(
      "e14",
      "c4",
      "email",
      "2025-04-15T09:00:00",
      "Payment reminder sent",
      "INV-1044 · was due Apr 14",
    ),
    e(
      "e15",
      "c4",
      "gallery",
      "2025-04-12T17:10:00",
      "Draft gallery created",
      "Product Shoot · 12 photos",
    ),
    e(
      "e16",
      "c4",
      "invoice",
      "2025-03-31T11:00:00",
      "Invoice INV-1044 sent",
      "Product photography · 14 images",
    ),
    e(
      "e17",
      "c5",
      "invoice",
      "2025-04-15T10:00:00",
      "Invoice INV-1045 sent",
      "Headshot session · due Apr 29",
    ),
    e(
      "e18",
      "c5",
      "session",
      "2025-04-14T19:25:00",
      "Session requested",
      "Portrait Session · Apr 25",
    ),
    e(
      "e19",
      "c6",
      "gallery",
      "2025-04-05T15:00:00",
      "Gallery delivered",
      "Family Portraits · 62 photos",
    ),
    e("e20", "c6", "email", "2025-03-28T10:00:00", "Email sent", "Autumn session wardrobe ideas"),
    e(
      "e21",
      "c9",
      "email",
      "2025-04-16T13:20:00",
      "Email received",
      "Asked about coverage for a May conference",
    ),
    e("e22", "c9", "payment", "2025-02-10T09:00:00", "Invoice INV-1039 paid", "$1,725.00 by EFT"),
    e("e23", "c10", "payment", "2025-03-08T14:00:00", "Invoice INV-1046 paid", "$1,500.00 by card"),
    e(
      "e24",
      "c10",
      "contract",
      "2025-03-04T18:45:00",
      "Contract signed",
      "Wedding photography agreement",
    ),
  ];
}

export function seedInvoices(): Invoice[] {
  const none = { kind: "amount", value: 0 } as const;
  return [
    {
      id: "inv-1036",
      number: "INV-1036",
      clientId: "c3",
      issueDate: "2025-01-10",
      dueDate: "2025-01-24",
      items: [
        { id: "li1", description: "Family session — winter mini", quantity: 1, unitPrice: 350 },
        { id: "li2", description: "Additional retouched images", quantity: 6, unitPrice: 25 },
      ],
      taxRate: 15,
      discount: none,
      amountPaid: 575,
      status: "paid",
      paidDate: "2025-01-20",
      notes: "",
    },
    {
      id: "inv-1039",
      projectId: "pr6",
      number: "INV-1039",
      clientId: "c9",
      issueDate: "2025-01-28",
      dueDate: "2025-02-11",
      items: [
        { id: "li1", description: "Corporate event coverage (hours)", quantity: 6, unitPrice: 220 },
        { id: "li2", description: "Same-day highlights", quantity: 1, unitPrice: 180 },
      ],
      taxRate: 15,
      discount: none,
      amountPaid: 1725,
      status: "paid",
      paidDate: "2025-02-10",
      notes: "",
    },
    {
      id: "inv-1040",
      projectId: "pr1",
      number: "INV-1040",
      clientId: "c1",
      issueDate: "2024-10-01",
      dueDate: "2024-10-15",
      items: [
        {
          id: "li1",
          description: "Wedding collection — Gold (30% deposit)",
          quantity: 1,
          unitPrice: 1200,
        },
      ],
      taxRate: 0,
      discount: none,
      amountPaid: 1200,
      status: "paid",
      paidDate: "2024-10-03",
      notes: "Deposit secures the date.",
    },
    {
      id: "inv-1042",
      projectId: "pr1",
      number: "INV-1042",
      clientId: "c1",
      issueDate: "2025-04-01",
      dueDate: "2025-04-15",
      items: [
        {
          id: "li1",
          description: "Wedding collection — Gold (balance)",
          quantity: 1,
          unitPrice: 1200,
        },
      ],
      taxRate: 0,
      discount: none,
      amountPaid: 1200,
      status: "paid",
      paidDate: "2025-04-18",
      notes: "",
    },
    {
      id: "inv-1043",
      projectId: "pr4",
      number: "INV-1043",
      clientId: "c2",
      issueDate: "2025-04-14",
      dueDate: "2025-04-28",
      items: [
        { id: "li1", description: "Travel shoot — 50% deposit", quantity: 1, unitPrice: 450 },
      ],
      taxRate: 0,
      discount: none,
      amountPaid: 0,
      status: "sent",
      notes: "",
    },
    {
      id: "inv-1044",
      projectId: "pr2",
      number: "INV-1044",
      clientId: "c4",
      issueDate: "2025-03-31",
      dueDate: "2025-04-14",
      items: [
        {
          id: "li1",
          description: "Product photography — per final image",
          quantity: 14,
          unitPrice: 40,
        },
      ],
      taxRate: 0,
      discount: none,
      amountPaid: 0,
      status: "sent",
      notes: "",
    },
    {
      id: "inv-1045",
      number: "INV-1045",
      clientId: "c5",
      issueDate: "2025-04-15",
      dueDate: "2025-04-29",
      items: [{ id: "li1", description: "Headshot session", quantity: 1, unitPrice: 250 }],
      taxRate: 0,
      discount: { kind: "amount", value: 20 },
      amountPaid: 0,
      status: "sent",
      notes: "Returning-client discount applied.",
    },
    {
      id: "inv-1046",
      projectId: "pr5",
      number: "INV-1046",
      clientId: "c10",
      issueDate: "2025-03-05",
      dueDate: "2025-03-19",
      items: [
        {
          id: "li1",
          description: "Wedding collection — Silver (deposit)",
          quantity: 1,
          unitPrice: 1500,
        },
      ],
      taxRate: 0,
      discount: none,
      amountPaid: 1500,
      status: "paid",
      paidDate: "2025-03-08",
      notes: "",
    },
    {
      id: "inv-1047",
      projectId: "pr3",
      number: "INV-1047",
      clientId: "c6",
      issueDate: "2025-04-19",
      dueDate: "2025-05-03",
      items: [
        { id: "li1", description: "Canvas print 24×36", quantity: 1, unitPrice: 160 },
        { id: "li2", description: "Framed 8×10 prints", quantity: 3, unitPrice: 45 },
      ],
      taxRate: 15,
      discount: { kind: "percent", value: 10 },
      amountPaid: 0,
      status: "draft",
      notes: "",
    },
  ];
}
