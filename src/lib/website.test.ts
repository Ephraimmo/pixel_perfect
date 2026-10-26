import { describe, expect, it } from "vitest";

import {
  changeSummary,
  discardChanges,
  editSite,
  liveSite,
  publishChecks,
  hasUnpublishedChanges,
  publishSite,
  publishedLabel,
  seedWebsite,
  siteStatus,
  siteUrl,
  unpublishSite,
} from "@/lib/website";

const seed = () => seedWebsite({ studio: "Karabo Photography", templateId: "modern" });

describe("website status", () => {
  it("starts live with nothing to publish", () => {
    const s = seed();
    expect(siteStatus(s)).toBe("live");
    expect(hasUnpublishedChanges(s)).toBe(false);
    expect(siteUrl(s)).toBe("karabo.pixora.site");
  });

  it("flags unpublished changes after an edit, and clears them on publish", () => {
    const edited = editSite(seed(), { siteTitle: "Karabo Studio", templateId: "classic" });
    expect(siteStatus(edited)).toBe("changes");
    expect(edited.publishedTemplateId).toBe("modern");

    const now = new Date("2025-05-01T10:00:00Z");
    const published = publishSite(edited, now);
    expect(siteStatus(published)).toBe("live");
    expect(published.lastPublishedAt).toBe(now.toISOString());
    expect(published.publishedTemplateId).toBe("classic");
  });

  it("goes offline when unpublished and back online on publish", () => {
    const offline = unpublishSite(seed());
    expect(siteStatus(offline)).toBe("offline");
    expect(siteStatus(publishSite(offline, new Date()))).toBe("live");
  });
});

describe("publishedLabel", () => {
  const now = new Date("2025-05-01T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it("describes recent publishes relatively", () => {
    expect(publishedLabel(null, now)).toBe("Never published");
    expect(publishedLabel(ago(20_000), now)).toBe("Just now");
    expect(publishedLabel(ago(60_000), now)).toBe("1 minute ago");
    expect(publishedLabel(ago(5 * 60_000), now)).toBe("5 minutes ago");
    expect(publishedLabel(ago(3 * 3_600_000), now)).toBe("3 hours ago");
  });

  it("shows a date for older publishes", () => {
    expect(publishedLabel(ago(3 * 86_400_000), now)).toMatch(/Apr 2\d, 2025/);
  });
});

describe("publishing snapshots", () => {
  it("compares content, so an edit undone by hand isn't a change", () => {
    const s = seed();
    const edited = editSite(s, { siteTitle: "Other" });
    expect(hasUnpublishedChanges(edited)).toBe(true);
    expect(hasUnpublishedChanges(editSite(edited, { siteTitle: s.siteTitle }))).toBe(false);
  });

  it("summarises changes in plain language", () => {
    const s = seed();
    const pages = [...s.pages].reverse().filter((p) => p.id !== "pricing");
    pages[0] = { ...pages[0]!, title: "Get in touch" };
    const draft = editSite(s, {
      templateId: "atelier",
      design: { spacing: "spacious" },
      pages,
      posts: s.posts.map((p) =>
        p.status === "draft" ? { ...p, status: "published" as const } : p,
      ),
    });
    expect(changeSummary(draft, draft.live)).toEqual([
      "Template changed to Atelier",
      "Design settings updated",
      "Page updated: Get in touch",
      "Page removed: Pricing",
      "Page order changed",
      "Post published: Behind the lens: golden hour on the coast",
    ]);
  });

  it("records each publish in the history and copies the draft live", () => {
    const draft = editSite(seed(), { siteTitle: "New name" });
    const now = new Date("2025-05-02T08:00:00Z");
    const published = publishSite(draft, now, "Karabo");
    expect(published.history[0]).toMatchObject({
      kind: "published",
      by: "Karabo",
      changes: ["Site title changed to “New name”"],
    });
    expect(published.live?.siteTitle).toBe("New name");
    expect(unpublishSite(published, now).history[0]?.kind).toBe("offline");
  });

  it("discards draft edits back to the live version", () => {
    const draft = editSite(seed(), { siteTitle: "Oops", design: { corners: "round" } });
    const back = discardChanges(draft);
    expect(hasUnpublishedChanges(back)).toBe(false);
    expect(back.siteTitle).toBe("Karabo Photography");
  });

  it("shows visitors the live content, not the draft", () => {
    const draft = editSite(seed(), { siteTitle: "Draft title" });
    expect(liveSite(draft).siteTitle).toBe("Karabo Photography");
  });
});

describe("publishChecks", () => {
  const galleries = [{ id: "sarah-james-wedding", status: "published" }];

  it("passes for the starter site", () => {
    expect(publishChecks(seed(), galleries)).toEqual([]);
  });

  it("flags empty pages, broken links and empty portfolios", () => {
    const s = seed();
    const pages = s.pages.map((p) => {
      if (p.id === "about") return { ...p, sections: [] };
      if (p.id === "home") {
        const [hero, ...rest] = p.sections;
        return {
          ...p,
          sections: [
            {
              ...hero!,
              buttons: [
                { label: "Shop", href: "/shop" },
                { label: "IG", href: "https://" },
              ],
            },
            ...rest,
          ],
        };
      }
      return p;
    });
    const messages = publishChecks({ ...s, pages }, []).map((c) => c.message);
    expect(messages).toEqual([
      "Button “Shop” on Home links to a page that doesn't exist (/shop).",
      "Button “IG” on Home has no web address.",
      "The About page is empty.",
      "The portfolio on Portfolio has no published galleries.",
    ]);
  });

  it("flags low text contrast", () => {
    const s = seed();
    const design = { colors: { background: "#ffffff", text: "#cccccc", accent: "#000000" } };
    expect(publishChecks({ ...s, design }, galleries)[0]?.message).toMatch(/contrast is low/);
  });
});
