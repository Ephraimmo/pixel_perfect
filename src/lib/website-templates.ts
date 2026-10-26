// Website template catalog. The first three ids match the main demo store's
// templates (modern, classic, minimal) so existing selections keep working.

import { PHOTOS } from "./demo-data";

export type TemplateCategory =
  "wedding" | "portrait" | "family" | "business" | "travel" | "editorial";

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "portrait", label: "Portrait" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
  { value: "travel", label: "Travel" },
  { value: "editorial", label: "Editorial" },
];

/** How a template's hero and headings look in previews. */
export interface TemplateLook {
  heading: "serif" | "serif-italic" | "sans" | "sans-caps";
  align: "left" | "center";
  hero: "overlay-dark" | "overlay-light" | "split" | "framed";
}

export interface SiteTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  popular: boolean;
  isNew: boolean;
  image: string;
  /** Three supporting photos shown under the hero. */
  strip: [string, string, string];
  headline: string;
  description: string;
  features: string[];
  look: TemplateLook;
}

const W = PHOTOS.wedding;
const F = PHOTOS.family;
const T = PHOTOS.travel;

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    category: "wedding",
    popular: true,
    isNew: false,
    image: W[3],
    strip: [W[4], W[6], W[5]],
    headline: "Karabo Photography",
    description: "Full-bleed hero, confident serif headings and a clean three-up gallery strip.",
    features: ["Full-screen hero", "Gallery strip", "Inquiry form"],
    look: { heading: "serif", align: "left", hero: "overlay-dark" },
  },
  {
    id: "classic",
    name: "Classic",
    category: "portrait",
    popular: true,
    isNew: false,
    image: W[2],
    strip: [W[0], W[9], W[11]],
    headline: "Timeless Stories",
    description: "Centered italic type over a soft gradient — elegant and unhurried.",
    features: ["Centered hero", "Testimonials", "Pricing table"],
    look: { heading: "serif-italic", align: "center", hero: "overlay-dark" },
  },
  {
    id: "minimal",
    name: "Minimal",
    category: "business",
    popular: false,
    isNew: false,
    image: T[2],
    strip: [T[0], T[3], T[5]],
    headline: "Wanderlust",
    description: "Spaced capitals on a light wash. Lets the photography do all the talking.",
    features: ["Light hero", "Client logos", "Contact block"],
    look: { heading: "sans-caps", align: "center", hero: "overlay-light" },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    category: "wedding",
    popular: true,
    isNew: false,
    image: W[18],
    strip: [W[16], W[19], W[17]],
    headline: "Golden Hour Weddings",
    description: "Warm, romantic and centered — built for couples browsing on their phones.",
    features: ["Romantic hero", "Love stories blog", "Booking calendar"],
    look: { heading: "serif-italic", align: "center", hero: "overlay-dark" },
  },
  {
    id: "atelier",
    name: "Atelier",
    category: "editorial",
    popular: false,
    isNew: true,
    image: W[8],
    strip: [W[12], W[14], W[15]],
    headline: "Atelier Journal",
    description: "Magazine split layout: text column beside a tall image, generous margins.",
    features: ["Split hero", "Journal-style blog", "Case studies"],
    look: { heading: "serif", align: "left", hero: "split" },
  },
  {
    id: "little-moments",
    name: "Little Moments",
    category: "family",
    popular: true,
    isNew: false,
    image: F[1],
    strip: [F[0], F[2], F[3]],
    headline: "Little Moments",
    description: "Friendly rounded type and a framed hero for family and newborn sessions.",
    features: ["Framed hero", "Session guides", "FAQ"],
    look: { heading: "sans", align: "left", hero: "framed" },
  },
  {
    id: "heirloom",
    name: "Heirloom",
    category: "family",
    popular: false,
    isNew: true,
    image: F[3],
    strip: [F[1], F[0], F[2]],
    headline: "Heirloom Portraits",
    description: "Quiet, centered and framed — portraits made to be printed and kept.",
    features: ["Framed hero", "Print shop", "Testimonials"],
    look: { heading: "serif", align: "center", hero: "framed" },
  },
  {
    id: "horizon",
    name: "Horizon",
    category: "travel",
    popular: false,
    isNew: false,
    image: T[0],
    strip: [T[1], T[4], T[3]],
    headline: "Beyond the Horizon",
    description: "Bold capitals over dramatic landscapes, with a story-led blog.",
    features: ["Panoramic hero", "Location stories", "Print sales"],
    look: { heading: "sans-caps", align: "left", hero: "overlay-dark" },
  },
  {
    id: "studio-north",
    name: "Studio North",
    category: "portrait",
    popular: false,
    isNew: true,
    image: PHOTOS.editorPortrait,
    strip: [W[1], F[0], W[10]],
    headline: "Studio North",
    description: "Crisp sans-serif split layout for headshots and personal branding.",
    features: ["Split hero", "Packages", "Online booking"],
    look: { heading: "sans", align: "left", hero: "split" },
  },
];

export function templateById(id: string): SiteTemplate {
  return SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0]!;
}

export type TemplateFilter = "all" | "popular" | "new" | TemplateCategory;

/** Filter by category tab and a case-insensitive search over name, category and description. */
export function filterTemplates(
  templates: SiteTemplate[],
  filter: TemplateFilter,
  query: string,
): SiteTemplate[] {
  const q = query.trim().toLowerCase();
  return templates
    .filter((t) =>
      filter === "all"
        ? true
        : filter === "popular"
          ? t.popular
          : filter === "new"
            ? t.isNew
            : t.category === filter,
    )
    .filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.category.includes(q) ||
        t.description.toLowerCase().includes(q),
    );
}
