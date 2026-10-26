import { describe, expect, it } from "vitest";

import { seedState } from "@/lib/demo-data";
import { SITE_TEMPLATES, filterTemplates, templateById } from "@/lib/website-templates";

const ids = (list: { id: string }[]) => list.map((t) => t.id);

describe("template catalog", () => {
  it("keeps the demo store's original template ids", () => {
    for (const t of seedState().templates) {
      expect(templateById(t.id).name).toBe(t.name);
    }
  });

  it("has unique ids and falls back to the first template for unknown ids", () => {
    expect(new Set(ids(SITE_TEMPLATES)).size).toBe(SITE_TEMPLATES.length);
    expect(templateById("nope").id).toBe("modern");
  });
});

describe("filterTemplates", () => {
  it("filters by category, popular and new", () => {
    expect(ids(filterTemplates(SITE_TEMPLATES, "family", ""))).toEqual([
      "little-moments",
      "heirloom",
    ]);
    expect(filterTemplates(SITE_TEMPLATES, "popular", "").every((t) => t.popular)).toBe(true);
    expect(filterTemplates(SITE_TEMPLATES, "new", "").every((t) => t.isNew)).toBe(true);
  });

  it("searches name, category and description ignoring case", () => {
    expect(ids(filterTemplates(SITE_TEMPLATES, "all", "  HORIZON "))).toEqual(["horizon"]);
    expect(ids(filterTemplates(SITE_TEMPLATES, "all", "editorial"))).toEqual(["atelier"]);
    expect(filterTemplates(SITE_TEMPLATES, "wedding", "headshots")).toEqual([]);
  });
});
