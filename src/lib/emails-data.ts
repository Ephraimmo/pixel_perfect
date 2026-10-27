// Pixora email demo data — editable templates with {{merge.fields}} and an
// outbox of emails sent (or scheduled) to clients.

export type EmailCategory = "booking" | "session" | "gallery" | "payment" | "follow-up";

export interface EmailTemplate {
  id: string;
  name: string;
  category: EmailCategory;
  subject: string;
  body: string;
  updatedAt: string; // ISO date
}

export interface SentEmail {
  id: string;
  templateId?: string | undefined;
  /** Empty for a test email sent to the studio. */
  clientId: string;
  to: string;
  subject: string;
  body: string;
  status: "sent" | "scheduled";
  /** When it went out, or will go out if scheduled. */
  at: string; // ISO date-time
  openedAt?: string | undefined;
}

export function seedEmailTemplates(): EmailTemplate[] {
  return [
    {
      id: "et-booking",
      name: "Booking confirmation",
      category: "booking",
      subject: "You're booked, {{client.firstName}}! 🎉",
      body: `Hi {{client.firstName}},

Thank you for booking with {{studio.name}} — I'm so excited to work with you.

Your session is confirmed for {{session.date}} at {{session.time}} at {{session.location}}.

I'll send a short prep guide closer to the day. If anything changes, just reply to this email.

Warmly,
{{photographer.name}}`,
      updatedAt: "2025-03-02",
    },
    {
      id: "et-reminder",
      name: "Session reminder",
      category: "session",
      subject: "See you {{session.date}} — a few quick tips",
      body: `Hi {{client.firstName}},

Just a friendly reminder that we're shooting on {{session.date}} at {{session.time}} ({{session.location}}).

A few tips:
• Wear colours you feel great in — avoid big logos.
• Arrive 10 minutes early so we can settle in.
• Bring anything meaningful you'd like in the photos.

Can't wait!
{{photographer.name}}`,
      updatedAt: "2025-04-01",
    },
    {
      id: "et-gallery",
      name: "Gallery delivery",
      category: "gallery",
      subject: "Your photos are ready: {{gallery.title}}",
      body: `Hi {{client.firstName}},

Your gallery is ready! You can view, favourite and download your photos here:

{{gallery.link}}

Take your time choosing favourites — prints and albums can be ordered right from the gallery.

With love,
{{photographer.name}}`,
      updatedAt: "2025-02-18",
    },
    {
      id: "et-payment",
      name: "Payment reminder",
      category: "payment",
      subject: "Friendly reminder: {{invoice.number}} ({{invoice.balance}})",
      body: `Hi {{client.firstName}},

Just a gentle reminder that invoice {{invoice.number}} for {{invoice.balance}} was due on {{invoice.dueDate}}.

You can pay by card from the link in your invoice email, or by EFT using {{invoice.number}} as the reference. If you've already paid, thank you — please ignore this!

Kind regards,
{{photographer.name}}
{{studio.name}}`,
      updatedAt: "2025-01-10",
    },
    {
      id: "et-thanks",
      name: "Thank you & review request",
      category: "follow-up",
      subject: "Thank you, {{client.firstName}} 💛",
      body: `Hi {{client.firstName}},

It was a joy photographing you. If you have a minute, a short review would mean the world to a small studio like mine — it helps other clients find me.

Thank you for trusting {{studio.name}}.

{{photographer.name}}`,
      updatedAt: "2024-12-05",
    },
  ];
}

export function seedSentEmails(): SentEmail[] {
  return [
    {
      id: "em1",
      templateId: "et-reminder",
      clientId: "c5",
      to: "olivia@oliviabrown.com",
      subject: "See you Friday, April 25, 2025 — a few quick tips",
      body: "Hi Olivia,\n\nJust a friendly reminder that we're shooting on Friday, April 25, 2025 at 3:00 PM (City Park).\n\n…",
      status: "scheduled",
      at: "2025-04-23T09:00:00",
    },
    {
      id: "em2",
      templateId: "et-reminder",
      clientId: "c3",
      to: "emma@emmawilson.com",
      subject: "See you Wednesday, April 23, 2025 — a few quick tips",
      body: "Hi Emma,\n\nJust a friendly reminder that we're shooting on Wednesday, April 23, 2025 at 10:00 AM (Botanical Gardens).\n\n…",
      status: "sent",
      at: "2025-04-18T08:15:00",
      openedAt: "2025-04-18T12:40:00",
    },
    {
      id: "em3",
      templateId: "et-payment",
      clientId: "c4",
      to: "david@davidkim.com",
      subject: "Friendly reminder: INV-1044 ($560.00)",
      body: "Hi David,\n\nJust a gentle reminder that invoice INV-1044 for $560.00 was due on April 14, 2025.\n\n…",
      status: "sent",
      at: "2025-04-15T09:00:00",
    },
    {
      id: "em4",
      templateId: "et-gallery",
      clientId: "c1",
      to: "sarah@sarahmitchell.com",
      subject: "Your photos are ready: Sarah & James Wedding",
      body: "Hi Sarah,\n\nYour gallery is ready! You can view, favourite and download your photos here:\n\n…",
      status: "sent",
      at: "2025-04-12T18:30:00",
      openedAt: "2025-04-12T18:52:00",
    },
    {
      id: "em5",
      templateId: "et-gallery",
      clientId: "c6",
      to: "naledi.mokoena@mokoenafamily.co.za",
      subject: "Your photos are ready: Family Portraits",
      body: "Hi Naledi,\n\nYour gallery is ready! …",
      status: "sent",
      at: "2025-04-05T15:00:00",
      openedAt: "2025-04-05T16:10:00",
    },
  ];
}
