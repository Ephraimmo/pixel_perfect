import { describe, expect, it } from "vitest";

import {
  DEFAULT_PORTFOLIO,
  blankSection,
  createPage,
  duplicatePage,
  moveItem,
  navPages,
  seedPages,
  slugError,
  slugify,
  starterSections,
  uniqueSlug,
} from "@/lib/website-pages";

const titles = (list: { title: string }[]) => list.map((p) => p.title);

describe("seed pages", () => {
  it("starts with home, about, portfolio, pricing and contact, all with content", () => {
    const pages = seedPages();
    expect(titles(pages)).toEqual(["Home", "About", "Portfolio", "Pricing", "Contact"]);
    expect(pages[0]?.slug).toBe("");
    expect(pages.every((p) => p.sections.length > 0)).toBe(true);
  });

  it("gives every starter section a unique id", () => {
    const ids = seedPages().flatMap((p) => p.sections.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("moveItem", () => {
  const pages = seedPages();

  it("moves a page up, down and clamps out-of-range targets", () => {
    expect(titles(moveItem(pages, "contact", 1)).slice(0, 3)).toEqual(["Home", "Contact", "About"]);
    expect(titles(moveItem(pages, "home", 99)).at(-1)).toBe("Home");
    expect(titles(moveItem(pages, "about", -5))[0]).toBe("About");
  });

  it("returns the same list for unknown ids or no-op moves, without mutating", () => {
    expect(moveItem(pages, "nope", 0)).toBe(pages);
    expect(moveItem(pages, "about", 1)).toBe(pages);
    expect(titles(pages)[0]).toBe("Home");
  });
});

describe("slugs", () => {
  it("slugifies titles", () => {
    expect(slugify("  Café Weddings & Events! ")).toBe("cafe-weddings-events");
  });

  it("makes slugs unique and validates typed ones", () => {
    const pages = seedPages();
    expect(uniqueSlug(pages, "About")).toBe("about-2");
    expect(uniqueSlug(pages, "About", "about")).toBe("about");
    expect(slugError(pages, "")).toMatch(/Enter/);
    expect(slugError(pages, "Bad Slug")).toMatch(/lowercase/);
    expect(slugError(pages, "pricing")).toMatch(/already/);
    expect(slugError(pages, "pricing", "pricing")).toBeNull();
    expect(slugError(pages, "faq")).toBeNull();
  });
});

describe("create and duplicate", () => {
  it("creates a page with starter sections and a unique slug", () => {
    const pages = seedPages();
    const page = createPage(pages, { kind: "pricing", title: "Pricing" });
    expect(page.slug).toBe("pricing-2");
    expect(page.sections.map((s) => s.kind)).toEqual(
      starterSections("pricing", "x").map((s) => s.kind),
    );
  });

  it("duplicates a page with fresh section ids; a copied homepage becomes a normal page", () => {
    const pages = seedPages();
    const home = pages[0]!;
    const copy = duplicatePage(pages, home);
    expect(copy.kind).toBe("custom");
    expect(copy.slug).toBe("home-copy");
    expect(copy.sections[0]?.id).not.toBe(home.sections[0]?.id);
  });

  it("lists only menu pages in order", () => {
    const pages = seedPages().map((p) => (p.id === "pricing" ? { ...p, inNav: false } : p));
    expect(titles(navPages(pages))).toEqual(["Home", "About", "Portfolio", "Contact"]);
  });
});

describe("portfolio sections", () => {
  it("starts the portfolio page with galleries that exist in the demo store", async () => {
    const { seedState } = await import("@/lib/demo-data");
    const galleryIds = new Set(seedState().galleries.map((g) => g.id));
    const section = starterSections("portfolio", "p").find((s) => s.kind === "portfolio");
    expect(section?.portfolio?.galleryIds.every((id) => galleryIds.has(id))).toBe(true);
  });

  it("gives each new portfolio section its own config", () => {
    const a = blankSection("portfolio");
    const b = blankSection("portfolio");
    a.portfolio?.galleryIds.push("x");
    expect(b.portfolio?.galleryIds).not.toContain("x");
    expect(DEFAULT_PORTFOLIO.galleryIds).not.toContain("x");
  });
});
