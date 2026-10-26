// Pixora lead pipeline demo data — inquiry type and seed.

import type { ClientSource, ClientType } from "./demo-data";

export type LeadStage = "new" | "contacted" | "consultation" | "proposal" | "booked" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ClientType;
  source: ClientSource;
  stage: LeadStage;
  /** Requested shoot or event date, or "" if they didn't give one. */
  eventDate: string;
  location: string;
  /** Estimated booking value in USD. */
  budget: number;
  message: string;
  receivedAt: string; // ISO date-time
  history: { stage: LeadStage; at: string }[];
  lostReason: string;
  /** Set once the lead has been converted into (or matched to) a client. */
  clientId?: string | undefined;
  /** A slot requested through the public booking page. */
  requested?: { typeId: string; date: string; start: string; end: string } | undefined;
  /** Set once a requested slot has been confirmed as a session. */
  sessionId?: string | undefined;
}

const path = (stages: [LeadStage, string][]) => stages.map(([stage, at]) => ({ stage, at }));

export function seedLeads(): Lead[] {
  return [
    {
      id: "l1",
      name: "Emma Wilson",
      email: "emma@emmawilson.com",
      phone: "(555) 010-3349",
      type: "wedding",
      source: "website",
      stage: "new",
      eventDate: "2026-02-14",
      location: "Babylonstoren, Franschhoek",
      budget: 3800,
      message:
        "Hi Karabo! You photographed our family last year and we still love those photos. Daniel and I just got engaged and we're planning a small vineyard wedding for about 80 guests next Valentine's Day. Are you available, and could you send your wedding collections?",
      receivedAt: "2025-04-20T09:57:00",
      history: path([["new", "2025-04-20T09:57:00"]]),
      lostReason: "",
    },
    {
      id: "l2",
      name: "Thandiwe Mthembu",
      email: "thandiwe.m@mthembu.co.za",
      phone: "(555) 010-6651",
      type: "wedding",
      source: "instagram",
      stage: "new",
      eventDate: "2025-11-22",
      location: "Durban North",
      budget: 4500,
      message:
        "Saw your reel from the lakeside wedding — stunning. We're having a traditional ceremony in the morning and a white wedding in the afternoon, so we need full-day coverage. Do you travel to Durban?",
      receivedAt: "2025-04-19T21:14:00",
      history: path([["new", "2025-04-19T21:14:00"]]),
      lostReason: "",
    },
    {
      id: "l3",
      name: "Ruan Botha",
      email: "ruan@thecopperpot.co.za",
      phone: "(555) 010-2290",
      type: "commercial",
      source: "google",
      stage: "new",
      eventDate: "",
      location: "The Copper Pot, Woodstock",
      budget: 1200,
      message:
        "We're relaunching our menu in June and need about 25 dish photos plus a few interior shots for the website and delivery apps. What would a half-day cost?",
      receivedAt: "2025-04-18T11:02:00",
      history: path([["new", "2025-04-18T11:02:00"]]),
      lostReason: "",
    },
    {
      id: "l14",
      name: "Bongani Zwane",
      email: "bongani@zwanedesign.co.za",
      phone: "(555) 010-7713",
      type: "event",
      source: "referral",
      stage: "new",
      eventDate: "2025-05-29",
      location: "Rosebank, Johannesburg",
      budget: 1600,
      message:
        "Zanele Khumalo recommended you. We're launching a furniture collection with an evening event for about 120 guests and need event coverage plus product shots of the pieces on the night.",
      receivedAt: "2025-04-16T14:30:00",
      history: path([["new", "2025-04-16T14:30:00"]]),
      lostReason: "",
    },
    {
      id: "l4",
      name: "Aisha Patel",
      email: "aisha.patel@uct-alumni.org",
      phone: "(555) 010-4108",
      type: "portrait",
      source: "website",
      stage: "contacted",
      eventDate: "2025-06-14",
      location: "UCT Upper Campus",
      budget: 350,
      message:
        "Looking for a graduation portrait session on campus, ideally with my parents for a few frames too. One hour is probably enough.",
      receivedAt: "2025-04-15T08:40:00",
      history: path([
        ["new", "2025-04-15T08:40:00"],
        ["contacted", "2025-04-15T13:05:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l5",
      name: "Kagiso Molefe",
      email: "kagiso.molefe@molefeholdings.com",
      phone: "(555) 010-5532",
      type: "event",
      source: "referral",
      stage: "contacted",
      eventDate: "2025-07-05",
      location: "Private residence, Midrand",
      budget: 900,
      message:
        "Surprise 50th birthday for my wife. Around 60 guests, 4 hours of coverage — candid shots and some family groups. Discretion is key!",
      receivedAt: "2025-04-12T19:20:00",
      history: path([
        ["new", "2025-04-12T19:20:00"],
        ["contacted", "2025-04-14T09:10:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l6",
      name: "Megan Fourie",
      email: "megan.fourie@fouriefam.com",
      phone: "(555) 010-8846",
      type: "family",
      source: "instagram",
      stage: "consultation",
      eventDate: "2025-05-10",
      location: "Kirstenbosch Gardens",
      budget: 650,
      message:
        "I'm 30 weeks along and would love a maternity session outdoors, then a newborn session after baby arrives in June. Do you offer a bundle?",
      receivedAt: "2025-04-08T10:15:00",
      history: path([
        ["new", "2025-04-08T10:15:00"],
        ["contacted", "2025-04-08T15:40:00"],
        ["consultation", "2025-04-11T11:00:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l7",
      name: "Lindiwe Ndlovu",
      email: "lindiwe@ndlovu-dubois.com",
      phone: "(555) 010-1187",
      type: "wedding",
      source: "referral",
      stage: "consultation",
      eventDate: "2026-03-07",
      location: "Kleine Zalze, Stellenbosch",
      budget: 5200,
      message:
        "Jacques and I are getting married next March. Sarah Mitchell showed us her wedding gallery and we were sold. We'd like engagement photos too, plus an album.",
      receivedAt: "2025-04-02T16:45:00",
      history: path([
        ["new", "2025-04-02T16:45:00"],
        ["contacted", "2025-04-03T09:00:00"],
        ["consultation", "2025-04-09T18:30:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l8",
      name: "Pieter van Wyk",
      email: "pieter@vanwykattorneys.co.za",
      phone: "(555) 010-3371",
      type: "commercial",
      source: "google",
      stage: "proposal",
      eventDate: "2025-05-06",
      location: "Van Wyk Attorneys, Cape Town CBD",
      budget: 2400,
      message:
        "We need consistent headshots for 12 attorneys plus a few office and team shots for our new website. Ideally done on-site in one morning.",
      receivedAt: "2025-03-18T09:30:00",
      history: path([
        ["new", "2025-03-18T09:30:00"],
        ["contacted", "2025-03-18T12:00:00"],
        ["consultation", "2025-03-24T10:00:00"],
        ["proposal", "2025-03-26T15:20:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l9",
      name: "Nomvula Sithole",
      email: "nomvula.sithole@sithole.me",
      phone: "(555) 010-9920",
      type: "wedding",
      source: "website",
      stage: "proposal",
      eventDate: "2025-12-13",
      location: "Valley of 1000 Hills",
      budget: 3900,
      message:
        "December wedding, about 150 guests. We'd love a second shooter and drone coverage if you offer it. Can you share pricing for 10 hours?",
      receivedAt: "2025-03-12T20:05:00",
      history: path([
        ["new", "2025-03-12T20:05:00"],
        ["contacted", "2025-03-13T08:30:00"],
        ["consultation", "2025-03-20T17:00:00"],
        ["proposal", "2025-03-21T10:45:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l10",
      name: "Chloe Adams",
      email: "chloe@chloeadamsyoga.com",
      phone: "(555) 010-6604",
      type: "portrait",
      source: "instagram",
      stage: "booked",
      eventDate: "2025-05-03",
      location: "Clifton 4th Beach",
      budget: 600,
      message:
        "Personal branding shoot for my yoga studio — sunrise on the beach plus a few studio shots. I need images for a new website and Instagram.",
      receivedAt: "2025-03-10T07:50:00",
      history: path([
        ["new", "2025-03-10T07:50:00"],
        ["contacted", "2025-03-10T11:30:00"],
        ["proposal", "2025-03-14T09:00:00"],
        ["booked", "2025-04-17T16:10:00"],
      ]),
      lostReason: "",
    },
    {
      id: "l11",
      name: "Liam O'Connor",
      email: "liam.oconnor@oconnorweds.com",
      phone: "(555) 010-1902",
      type: "wedding",
      source: "google",
      stage: "booked",
      eventDate: "2025-10-18",
      location: "Franschhoek",
      budget: 1500,
      message:
        "Small wedding in Franschhoek, about 40 guests. Looking for 6 hours of coverage and an online gallery for family overseas.",
      receivedAt: "2025-02-26T13:00:00",
      history: path([
        ["new", "2025-02-26T13:00:00"],
        ["contacted", "2025-02-26T17:20:00"],
        ["consultation", "2025-02-28T10:00:00"],
        ["proposal", "2025-03-01T12:00:00"],
        ["booked", "2025-03-03T09:15:00"],
      ]),
      lostReason: "",
      clientId: "c10",
    },
    {
      id: "l12",
      name: "Jason Naidoo",
      email: "jason.naidoo@brightpath.io",
      phone: "(555) 010-4425",
      type: "event",
      source: "google",
      stage: "lost",
      eventDate: "2025-04-10",
      location: "CTICC, Cape Town",
      budget: 2000,
      message: "Two-day tech conference — we need speaker shots and a sponsor-wall photo booth.",
      receivedAt: "2025-03-14T10:10:00",
      history: path([
        ["new", "2025-03-14T10:10:00"],
        ["contacted", "2025-03-14T14:00:00"],
        ["proposal", "2025-03-17T09:00:00"],
        ["lost", "2025-03-25T11:00:00"],
      ]),
      lostReason: "Over budget",
    },
    {
      id: "l13",
      name: "Fatima Ebrahim",
      email: "fatima.ebrahim@ebrahimfamily.net",
      phone: "(555) 010-7790",
      type: "family",
      source: "website",
      stage: "lost",
      eventDate: "2025-03-29",
      location: "Bo-Kaap, Cape Town",
      budget: 450,
      message: "Eid family portraits for three generations, around 14 people.",
      receivedAt: "2025-02-20T18:00:00",
      history: path([
        ["new", "2025-02-20T18:00:00"],
        ["contacted", "2025-02-21T09:00:00"],
        ["lost", "2025-03-02T10:00:00"],
      ]),
      lostReason: "Date unavailable",
    },
  ];
}
