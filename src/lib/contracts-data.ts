// Pixora contracts demo data — reusable templates with {{merge.fields}} and
// contracts sent to clients for signature.

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  /** Markdown-lite: "## " headings, "1. " numbered clauses, blank-line paragraphs. */
  body: string;
  updatedAt: string; // ISO date
}

/** Stored status. Sent → viewed → signed is the happy path. */
export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "void";

export interface ContractSignature {
  name: string;
  signedAt: string; // ISO date-time
}

export interface Contract {
  id: string;
  title: string;
  clientId: string;
  projectId?: string | undefined;
  templateId?: string | undefined;
  /** Editable body with merge fields; resolved when sent. */
  body: string;
  /** The exact text the client received — frozen once sent. */
  sentBody?: string | undefined;
  status: ContractStatus;
  createdAt: string; // ISO date
  sentAt?: string | undefined; // ISO date-time
  viewedAt?: string | undefined;
  remindedAt?: string | undefined;
  studioSignature?: ContractSignature | undefined;
  clientSignature?: ContractSignature | undefined;
  declineReason?: string | undefined;
}

const WEDDING = `## Wedding Photography Agreement

This agreement is between {{studio.name}} ("the Photographer") and {{client.name}} ("the Client") for {{project.name}}.

## Coverage

1. The Photographer will provide wedding photography coverage as described in the accepted quote, starting on {{session.date}}.
2. The total fee is {{project.value}}. A non-refundable deposit of {{deposit}} secures the date; the balance is due 14 days before the wedding.

## Delivery

1. Sneak peeks are delivered within 7 days and the full online gallery by {{project.dueDate}}.
2. Images are delivered as high-resolution, edited JPEG files. RAW files are not supplied.

## Usage

1. The Client receives a personal-use licence to print and share the images.
2. The Photographer may use selected images for portfolio and marketing unless the Client opts out in writing.

## Cancellation

1. If the Client cancels, the deposit is retained. Cancellations within 30 days of the date are charged 50% of the total fee.
2. If the Photographer cannot attend due to illness or emergency, a qualified associate will be arranged or all payments refunded.

Signed on {{today}}.`;

const PORTRAIT = `## Portrait Session Agreement

This agreement is between {{studio.name}} and {{client.name}} for {{project.name}} on {{session.date}}.

## Session & fees

1. The session fee of {{project.value}} is payable in full when booking.
2. Sessions may be rescheduled once, free of charge, with 48 hours' notice.

## Images

1. A private online gallery is delivered by {{project.dueDate}}.
2. Additional retouched images and prints can be ordered from the gallery.

## Consent

1. The Client consents to being photographed, including any minors in their care.
2. Images will only be used for marketing with the Client's written consent.`;

const COMMERCIAL = `## Commercial Photography & Licensing Agreement

This agreement is between {{studio.name}} and {{client.name}} for {{project.name}}.

## Services

1. The Photographer will deliver the shot list agreed in writing, beginning {{session.date}}.
2. Final images will be delivered by {{project.dueDate}} as web- and print-ready files.

## Fees & payment

1. The project fee is {{project.value}}, with {{deposit}} due on signing and the balance within 14 days of delivery.

## Licence

1. On full payment, the Client receives a non-exclusive licence to use the images for web, social and print marketing for 2 years.
2. Resale, sublicensing, or use in paid broadcast advertising requires a separate licence.

## Credit

1. Where practical, the Client will credit "{{studio.name}}" on editorial use.`;

export function seedContractTemplates(): ContractTemplate[] {
  return [
    {
      id: "tpl-wedding",
      name: "Wedding Photography Agreement",
      description: "Coverage, deposit, delivery, usage and cancellation for weddings.",
      body: WEDDING,
      updatedAt: "2025-01-12",
    },
    {
      id: "tpl-portrait",
      name: "Portrait Session Agreement",
      description: "Short agreement for portrait, family and headshot sessions.",
      body: PORTRAIT,
      updatedAt: "2024-11-03",
    },
    {
      id: "tpl-commercial",
      name: "Commercial & Licensing Agreement",
      description: "Brand, product and event work with a 2-year usage licence.",
      body: COMMERCIAL,
      updatedAt: "2025-02-20",
    },
  ];
}

const studio = (at: string): ContractSignature => ({ name: "Karabo", signedAt: at });

export function seedContracts(): Contract[] {
  return [
    {
      id: "k1",
      title: "Wedding Photography Agreement",
      clientId: "c1",
      projectId: "pr1",
      templateId: "tpl-wedding",
      body: WEDDING,
      status: "signed",
      createdAt: "2024-09-30",
      sentAt: "2024-10-01T09:30:00",
      viewedAt: "2024-10-01T19:02:00",
      studioSignature: studio("2024-10-01T09:30:00"),
      clientSignature: { name: "Sarah Mitchell", signedAt: "2024-10-02T11:12:00" },
    },
    {
      id: "k2",
      title: "Wedding Photography Agreement",
      clientId: "c10",
      projectId: "pr5",
      templateId: "tpl-wedding",
      body: WEDDING,
      status: "signed",
      createdAt: "2025-03-03",
      sentAt: "2025-03-03T10:00:00",
      viewedAt: "2025-03-04T08:15:00",
      studioSignature: studio("2025-03-03T10:00:00"),
      clientSignature: { name: "Liam O'Connor", signedAt: "2025-03-04T18:45:00" },
    },
    {
      id: "k3",
      title: "Brand Refresh — Licensing Agreement",
      clientId: "c11",
      projectId: "pr8",
      templateId: "tpl-commercial",
      body: COMMERCIAL,
      status: "viewed",
      createdAt: "2025-04-16",
      sentAt: "2025-04-16T09:00:00",
      viewedAt: "2025-04-18T14:20:00",
      studioSignature: studio("2025-04-16T09:00:00"),
    },
    {
      id: "k4",
      title: "2025 Event Coverage Retainer",
      clientId: "c9",
      projectId: "pr6",
      templateId: "tpl-commercial",
      body: COMMERCIAL,
      status: "signed",
      createdAt: "2025-01-20",
      sentAt: "2025-01-20T12:00:00",
      viewedAt: "2025-01-20T15:30:00",
      studioSignature: studio("2025-01-20T12:00:00"),
      clientSignature: { name: "Zanele Khumalo", signedAt: "2025-01-21T09:10:00" },
    },
    {
      id: "k5",
      title: "Product Launch — Licensing Agreement",
      clientId: "c4",
      projectId: "pr2",
      templateId: "tpl-commercial",
      body: COMMERCIAL,
      status: "sent",
      createdAt: "2025-04-14",
      sentAt: "2025-04-14T11:00:00",
      studioSignature: studio("2025-04-14T11:00:00"),
    },
    {
      id: "k6",
      title: "Family Session Agreement",
      clientId: "c3",
      projectId: "pr7",
      templateId: "tpl-portrait",
      body: PORTRAIT,
      status: "draft",
      createdAt: "2025-04-19",
    },
  ];
}
