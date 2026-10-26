import { describe, expect, it } from "vitest";

import { seedState } from "@/lib/demo-data";
import { countByStatus, filterGalleries, validateGalleryListSearch } from "@/lib/galleries";

const galleries = seedState().galleries;
const titles = (list: { title: string }[]) => list.map((g) => g.title);

describe("filterGalleries", () => {
  it("lists every gallery newest first by default", () => {
    expect(titles(filterGalleries(galleries, {}))).toEqual([
      "Sarah & James Wedding",
      "Family Portraits",
      "Product Shoot",
      "Travel Collection",
    ]);
  });

  it("filters by status", () => {
    expect(titles(filterGalleries(galleries, { status: "draft" }))).toEqual(["Product Shoot"]);
    expect(filterGalleries(galleries, { status: "archived" })).toEqual([]);
  });

  it("searches title and description, ignoring case and surrounding spaces", () => {
    expect(titles(filterGalleries(galleries, { q: "  WEDDING " }))).toEqual(["Sarah & James Wedding"]);
    expect(titles(filterGalleries(galleries, { q: "skincare" }))).toEqual(["Product Shoot"]);
    expect(filterGalleries(galleries, { q: "no such gallery" })).toEqual([]);
  });

  it("combines status and search", () => {
    expect(filterGalleries(galleries, { status: "draft", q: "wedding" })).toEqual([]);
  });

  it("sorts oldest first, by name, and by photo count", () => {
    expect(titles(filterGalleries(galleries, { sort: "oldest" }))[0]).toBe("Travel Collection");
    expect(titles(filterGalleries(galleries, { sort: "name" }))).toEqual([
      "Family Portraits",
      "Product Shoot",
      "Sarah & James Wedding",
      "Travel Collection",
    ]);
    expect(filterGalleries(galleries, { sort: "photos" }).map((g) => g.photoCount)).toEqual([62, 48, 35, 12]);
  });

  it("does not reorder the input array", () => {
    const before = titles(galleries);
    filterGalleries(galleries, { sort: "name" });
    expect(titles(galleries)).toEqual(before);
  });
});

describe("countByStatus", () => {
  it("counts each status and the total", () => {
    expect(countByStatus(galleries)).toEqual({ all: 4, published: 3, draft: 1, archived: 0 });
  });
});

describe("validateGalleryListSearch", () => {
  it("keeps valid values and drops defaults", () => {
    expect(validateGalleryListSearch({ status: "draft", q: "sarah", sort: "name" })).toEqual({
      status: "draft",
      q: "sarah",
      sort: "name",
    });
    expect(validateGalleryListSearch({ status: "all", q: "  ", sort: "newest" })).toEqual({});
  });

  it("ignores unknown or malformed values", () => {
    expect(validateGalleryListSearch({ status: "deleted", q: 42, sort: "random" })).toEqual({});
  });
});
