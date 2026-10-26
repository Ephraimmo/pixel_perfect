// Pixora public booking demo data — the session types clients can request.

import type { ClientType, SessionKind } from "./demo-data";

export interface BookingType {
  id: string;
  name: string;
  description: string;
  durationMins: number;
  /** Full price in USD; 0 means free. */
  price: number;
  /** Deposit due to secure the date, in USD. */
  deposit: number;
  kind: SessionKind;
  clientType: ClientType;
  /** Unsplash photo id. */
  image: string;
  location: string;
  includes: string[];
  active: boolean;
}

export function seedBookingTypes(photos: {
  portrait: string;
  family: string;
  engagement: string;
  brand: string;
  wedding: string;
}): BookingType[] {
  return [
    {
      id: "portrait",
      name: "Portrait Session",
      description: "Relaxed one-on-one portraits for you, your graduation or your profile.",
      durationMins: 60,
      price: 250,
      deposit: 50,
      kind: "shoot",
      clientType: "portrait",
      image: photos.portrait,
      location: "Studio, or an outdoor spot in Cape Town",
      includes: [
        "1-hour session",
        "Up to 2 outfits",
        "15 retouched images",
        "Private online gallery",
      ],
      active: true,
    },
    {
      id: "family",
      name: "Family Session",
      description:
        "Natural, playful photos of the people you love — little ones and grandparents welcome.",
      durationMins: 90,
      price: 350,
      deposit: 75,
      kind: "shoot",
      clientType: "family",
      image: photos.family,
      location: "A park, beach or your home",
      includes: ["90-minute session", "Up to 8 people", "30 retouched images", "$50 print credit"],
      active: true,
    },
    {
      id: "engagement",
      name: "Engagement Session",
      description: "Golden-hour photos for your save-the-dates — and a warm-up before the big day.",
      durationMins: 120,
      price: 450,
      deposit: 100,
      kind: "shoot",
      clientType: "wedding",
      image: photos.engagement,
      location: "Your favourite place together",
      includes: ["2-hour session", "Two locations", "40 retouched images", "Save-the-date design"],
      active: true,
    },
    {
      id: "brand",
      name: "Brand & Headshots",
      description: "Consistent headshots and lifestyle images for your website and socials.",
      durationMins: 90,
      price: 400,
      deposit: 100,
      kind: "shoot",
      clientType: "commercial",
      image: photos.brand,
      location: "Studio or your workplace",
      includes: [
        "90-minute session",
        "Up to 3 people",
        "20 retouched images",
        "Commercial licence",
      ],
      active: true,
    },
    {
      id: "consult",
      name: "Wedding Consultation",
      description:
        "A no-pressure video call to talk through your day, collections and availability.",
      durationMins: 30,
      price: 0,
      deposit: 0,
      kind: "consultation",
      clientType: "wedding",
      image: photos.wedding,
      location: "Video call",
      includes: [
        "30-minute video call",
        "Collections & pricing",
        "Date availability",
        "No obligation",
      ],
      active: true,
    },
  ];
}
