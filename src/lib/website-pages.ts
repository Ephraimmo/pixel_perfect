// Website pages and their content sections — types, starter content per page
// type, and pure list helpers (create, reorder, slugs) shared by the page
// manager, section editor and site preview.

import { PHOTOS } from "./demo-data";

export type PageKind = "home" | "about" | "portfolio" | "pricing" | "contact" | "blog" | "custom";

export const PAGE_KIND_LABEL: Record<PageKind, string> = {
  home: "Home",
  about: "About",
  portfolio: "Portfolio",
  pricing: "Pricing",
  contact: "Contact",
  blog: "Blog",
  custom: "Blank page",
};

export type SectionKind =
  | "hero"
  | "text"
  | "gallery"
  | "portfolio"
  | "blog"
  | "pricing"
  | "testimonial"
  | "contact"
  | "cta";

export const SECTION_KIND_LABEL: Record<SectionKind, string> = {
  hero: "Hero",
  text: "Text",
  gallery: "Image gallery",
  portfolio: "Portfolio",
  blog: "Blog posts",
  pricing: "Pricing",
  testimonial: "Testimonial",
  contact: "Contact form",
  cta: "Call to action",
};

export interface SectionButton {
  label: string;
  href: string;
}

/** How a portfolio section shows the photographer's galleries. */
export interface PortfolioConfig {
  /** Gallery ids from the main demo store, in display order. */
  galleryIds: string[];
  /** Gallery cover tiles that open each gallery, or every photo grouped by gallery. */
  display: "covers" | "photos";
  layout: "grid" | "masonry" | "editorial" | "slideshow";
  columns: 2 | 3 | 4;
  gap: "none" | "small" | "large";
  showTitles: boolean;
  /** Photos shown per gallery; 0 shows them all. */
  limit: number;
}

export const DEFAULT_PORTFOLIO: PortfolioConfig = {
  galleryIds: ["sarah-james-wedding", "family-portraits", "travel-collection"],
  display: "covers",
  layout: "grid",
  columns: 3,
  gap: "small",
  showTitles: true,
  limit: 12,
};

export interface PriceItem {
  name: string;
  price: string;
  description: string;
}

/** One block on a page. Every kind uses the same flat shape; unused fields stay empty. */
export interface SiteSection {
  id: string;
  kind: SectionKind;
  heading: string;
  body: string;
  /** Unsplash photo id, or "" for none. */
  image: string;
  images: string[];
  buttons: SectionButton[];
  items: PriceItem[];
  /** Only on portfolio sections. */
  portfolio?: PortfolioConfig;
}

export interface SitePage {
  id: string;
  kind: PageKind;
  title: string;
  /** "" for the homepage, otherwise a lowercase-hyphenated path segment. */
  slug: string;
  /** Shown in the site's navigation menu. */
  inNav: boolean;
  sections: SiteSection[];
}

const W = PHOTOS.wedding;
const F = PHOTOS.family;

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function blankSection(kind: SectionKind, id = uid("sec")): SiteSection {
  const base: SiteSection = {
    id,
    kind,
    heading: "",
    body: "",
    image: "",
    images: [],
    buttons: [],
    items: [],
  };
  switch (kind) {
    case "hero":
      return {
        ...base,
        heading: "A new headline",
        body: "Add a short introduction.",
        image: W[7],
        buttons: [{ label: "Learn more", href: "/contact" }],
      };
    case "text":
      return { ...base, heading: "New section", body: "Write something about your work." };
    case "gallery":
      return { ...base, heading: "Gallery", images: [W[0], W[1], W[2]] };
    case "portfolio":
      return {
        ...base,
        heading: "Selected work",
        portfolio: { ...DEFAULT_PORTFOLIO, galleryIds: [...DEFAULT_PORTFOLIO.galleryIds] },
      };
    case "blog":
      return { ...base, heading: "Journal", body: "Stories, tips and recent sessions." };
    case "pricing":
      return {
        ...base,
        heading: "Pricing",
        items: [{ name: "Session", price: "$350", description: "One hour, 30 edited images" }],
      };
    case "testimonial":
      return { ...base, heading: "“A wonderful experience.”", body: "— Happy client" };
    case "contact":
      return {
        ...base,
        heading: "Get in touch",
        body: "Tell me about your plans.",
        buttons: [{ label: "Send message", href: "" }],
      };
    case "cta":
      return {
        ...base,
        heading: "Ready to book?",
        buttons: [{ label: "Contact me", href: "/contact" }],
      };
  }
}

/** Starter sections for a new page of the given type. */
export function starterSections(kind: PageKind, pageId: string): SiteSection[] {
  const s = (n: number, kind: SectionKind, patch: Partial<SiteSection>): SiteSection => ({
    ...blankSection(kind, `${pageId}-s${n}`),
    ...patch,
  });
  switch (kind) {
    case "home":
      return [
        s(1, "hero", {
          heading: "Stories told in natural light",
          body: "Wedding, portrait and family photography based in Johannesburg.",
          image: W[3],
          buttons: [
            { label: "View portfolio", href: "/portfolio" },
            { label: "Book a session", href: "/contact" },
          ],
        }),
        s(2, "gallery", { heading: "Recent work", images: [W[4], W[6], W[5], W[8], W[9], W[10]] }),
        s(3, "testimonial", {
          heading: "“Karabo captured every feeling of our day — we relive it every time we look.”",
          body: "— Sarah & James",
        }),
        s(4, "cta", {
          heading: "Let's create something beautiful",
          body: "Now booking 2025 and 2026 dates.",
          buttons: [{ label: "Get in touch", href: "/contact" }],
        }),
      ];
    case "about":
      return [
        s(1, "hero", {
          heading: "Hi, I'm Karabo",
          body: "Photographer, storyteller and lover of golden hour.",
          image: PHOTOS.editorPortrait,
          buttons: [],
        }),
        s(2, "text", {
          heading: "My approach",
          body: "I work quietly and documentary-style, so you can be present while I capture the moments that matter. Every session ends with a hand-edited gallery made to be printed and kept.",
        }),
        s(3, "cta", {
          heading: "Let's talk about your story",
          buttons: [{ label: "Contact me", href: "/contact" }],
        }),
      ];
    case "portfolio":
      return [
        s(1, "text", {
          heading: "Portfolio",
          body: "A selection of recent weddings, portraits and family sessions.",
        }),
        s(2, "portfolio", { heading: "" }),
      ];
    case "pricing":
      return [
        s(1, "text", {
          heading: "Pricing",
          body: "Every collection includes an online gallery and print release.",
        }),
        s(2, "pricing", {
          heading: "Collections",
          items: [
            { name: "Portrait", price: "$350", description: "1 hour · 30 edited images" },
            { name: "Family", price: "$450", description: "90 minutes · 50 edited images" },
            { name: "Wedding", price: "$2,400", description: "8 hours · second shooter · album" },
          ],
        }),
        s(3, "cta", {
          heading: "Need something custom?",
          buttons: [{ label: "Request a quote", href: "/contact" }],
        }),
      ];
    case "contact":
      return [
        s(1, "contact", {
          heading: "Get in touch",
          body: "Tell me about your date, location and ideas. I reply within two working days.",
          buttons: [{ label: "Send message", href: "" }],
        }),
      ];
    case "blog":
      return [s(1, "blog", {})];
    case "custom":
      return [s(1, "text", { heading: "New page", body: "Start writing here." })];
  }
}

export function seedPages(): SitePage[] {
  const page = (kind: PageKind, title: string, slug: string): SitePage => ({
    id: kind,
    kind,
    title,
    slug,
    inNav: true,
    sections: starterSections(kind, kind),
  });
  return [
    page("home", "Home", ""),
    page("about", "About", "about"),
    page("portfolio", "Portfolio", "portfolio"),
    page("pricing", "Pricing", "pricing"),
    page("contact", "Contact", "contact"),
  ];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** `base`, or `base-2`, `base-3`… if another page already uses it. */
export function uniqueSlug(pages: SitePage[], base: string, exceptId?: string): string {
  const root = slugify(base) || "page";
  const taken = new Set(pages.filter((p) => p.id !== exceptId).map((p) => p.slug));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

/** Problem with a hand-typed slug, or null when it's fine. */
export function slugError(pages: SitePage[], slug: string, exceptId?: string): string | null {
  if (!slug) return "Enter a page address.";
  if (slug !== slugify(slug)) return "Use lowercase letters, numbers and hyphens only.";
  if (pages.some((p) => p.id !== exceptId && p.slug === slug)) {
    return "Another page already uses this address.";
  }
  return null;
}

export function pagePath(page: Pick<SitePage, "slug">): string {
  return `/${page.slug}`;
}

export function createPage(
  pages: SitePage[],
  input: { kind: PageKind; title: string; slug?: string },
): SitePage {
  const id = uid("page");
  return {
    id,
    kind: input.kind,
    title: input.title.trim() || PAGE_KIND_LABEL[input.kind],
    slug: input.slug || uniqueSlug(pages, input.title || input.kind),
    inNav: true,
    sections: starterSections(input.kind, id),
  };
}

export function duplicatePage(pages: SitePage[], page: SitePage): SitePage {
  const id = uid("page");
  const title = `${page.title} copy`;
  return {
    ...page,
    id,
    kind: page.kind === "home" ? "custom" : page.kind,
    title,
    slug: uniqueSlug(pages, title),
    sections: page.sections.map((s) => ({ ...s, id: uid("sec") })),
  };
}

/** Move an item (page or section) to a new index, returning a new array. */
export function moveItem<T extends { id: string }>(list: T[], id: string, toIndex: number): T[] {
  const from = list.findIndex((x) => x.id === id);
  if (from < 0) return list;
  const to = Math.max(0, Math.min(list.length - 1, toIndex));
  if (from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Pages that appear in the site's navigation menu, in order. */
export function navPages(pages: SitePage[]): SitePage[] {
  return pages.filter((p) => p.inNav);
}
