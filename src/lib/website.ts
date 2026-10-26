// Pixora website builder — types, seed and pure state helpers. Kept separate
// from the main demo store so the website builder owns its own demo state.
// There is no hosting backend: "publishing" copies the draft into a local
// "live" snapshot and records it in the publish history.

import { publishedPosts, seedPosts, type BlogPost } from "./website-blog";
import { contrastRatio, resolveDesign, type SiteDesign } from "./website-design";
import { pagePath, seedPages, type SitePage } from "./website-pages";
import { templateById } from "./website-templates";

export const SITE_HOST = "pixora.site";

/** The parts of the site visitors see. Publishing copies these into `live`. */
export interface SiteContent {
  siteTitle: string;
  /** Template id from SITE_TEMPLATES (website-templates.ts). */
  templateId: string;
  /** Site pages in navigation order. */
  pages: SitePage[];
  /** Design settings changed from the template's defaults. */
  design: Partial<SiteDesign>;
  posts: BlogPost[];
}

export interface PublishRecord {
  id: string;
  kind: "published" | "offline";
  at: string; // ISO timestamp
  by: string;
  /** Human-readable list of what changed. */
  changes: string[];
}

export interface WebsiteState extends SiteContent {
  version: number;
  subdomain: string;
  /** Whether the (simulated) public site is online. */
  online: boolean;
  /** Bumped by every content edit. */
  revision: number;
  publishedRevision: number;
  lastPublishedAt: string | null; // ISO timestamp
  /** Template that was live at the last publish. */
  publishedTemplateId: string;
  /** Content as of the last publish — what visitors see. */
  live: SiteContent | null;
  /** Newest first. */
  history: PublishRecord[];
}

export const WEBSITE_VERSION = 1;
const HISTORY_LIMIT = 20;

/** Deep copy of the visitor-facing content. */
export function snapshotOf(s: SiteContent): SiteContent {
  return JSON.parse(
    JSON.stringify({
      siteTitle: s.siteTitle,
      templateId: s.templateId,
      pages: s.pages,
      design: s.design,
      posts: s.posts,
    }),
  ) as SiteContent;
}

export function seedWebsite(input: { studio: string; templateId: string }): WebsiteState {
  const content: SiteContent = {
    siteTitle: input.studio,
    templateId: input.templateId,
    pages: seedPages(),
    design: {},
    posts: seedPosts(),
  };
  const at = "2025-04-18T08:30:00.000Z";
  return {
    version: WEBSITE_VERSION,
    ...content,
    subdomain: "karabo",
    online: true,
    revision: 1,
    publishedRevision: 1,
    lastPublishedAt: at,
    publishedTemplateId: input.templateId,
    live: snapshotOf(content),
    history: [{ id: "pub-seed", kind: "published", at, by: "Karabo", changes: ["First publish"] }],
  };
}

export type SiteStatus = "live" | "changes" | "offline";

export const SITE_STATUS_LABEL: Record<SiteStatus, string> = {
  live: "Live",
  changes: "Unpublished changes",
  offline: "Offline",
};

export function hasUnpublishedChanges(s: WebsiteState): boolean {
  // Compare content, so an edit that's undone by hand doesn't count as a change.
  if (s.live) return JSON.stringify(snapshotOf(s)) !== JSON.stringify(s.live);
  return s.revision !== s.publishedRevision;
}

export function siteStatus(s: WebsiteState): SiteStatus {
  if (!s.online) return "offline";
  return hasUnpublishedChanges(s) ? "changes" : "live";
}

export function siteUrl(s: Pick<WebsiteState, "subdomain">): string {
  return `${s.subdomain}.${SITE_HOST}`;
}

/** Apply a content edit and mark the draft as changed. */
export function editSite(s: WebsiteState, patch: Partial<WebsiteState>): WebsiteState {
  return { ...s, ...patch, revision: s.revision + 1 };
}

/** What differs between the draft and what's live, in plain language. */
export function changeSummary(draft: SiteContent, live: SiteContent | null): string[] {
  if (!live) return ["First publish"];
  const out: string[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  if (draft.siteTitle !== live.siteTitle) out.push(`Site title changed to “${draft.siteTitle}”`);
  if (draft.templateId !== live.templateId) {
    out.push(`Template changed to ${templateById(draft.templateId).name}`);
  }
  if (!same(draft.design, live.design)) out.push("Design settings updated");

  const liveById = new Map(live.pages.map((p) => [p.id, p]));
  const draftIds = new Set(draft.pages.map((p) => p.id));
  for (const p of draft.pages) {
    const before = liveById.get(p.id);
    if (!before) out.push(`Page added: ${p.title}`);
    else if (!same({ ...p }, { ...before })) out.push(`Page updated: ${p.title}`);
  }
  for (const p of live.pages) if (!draftIds.has(p.id)) out.push(`Page removed: ${p.title}`);
  const order = (pages: SitePage[]) =>
    pages.filter((p) => liveById.has(p.id) && draftIds.has(p.id)).map((p) => p.id);
  if (!same(order(draft.pages), order(live.pages))) out.push("Page order changed");

  const livePosts = new Map(live.posts.map((p) => [p.id, p]));
  const draftPostIds = new Set(draft.posts.map((p) => p.id));
  for (const p of draft.posts) {
    const before = livePosts.get(p.id);
    if (!before) out.push(`Post added: ${p.title || "Untitled post"}`);
    else if (before.status !== p.status) {
      out.push(`Post ${p.status === "published" ? "published" : "unpublished"}: ${p.title}`);
    } else if (!same(p, before)) out.push(`Post updated: ${p.title}`);
  }
  for (const p of live.posts) if (!draftPostIds.has(p.id)) out.push(`Post removed: ${p.title}`);
  return out;
}

export interface PublishCheck {
  message: string;
  /** Where to fix it. */
  fix: { label: string; to: string; params?: Record<string, string> };
}

/** Problems worth flagging before publishing. None of them block a publish. */
export function publishChecks(
  s: SiteContent,
  galleries: { id: string; status: string }[],
): PublishCheck[] {
  const out: PublishCheck[] = [];
  const paths = new Set(s.pages.map((p) => pagePath(p)));
  const edit = (pageId: string) => ({
    label: "Edit page",
    to: "/website/pages/$pageId",
    params: { pageId },
  });

  if (!s.pages.some((p) => p.inNav)) {
    out.push({
      message: "No pages are shown in your site menu.",
      fix: { label: "Pages", to: "/website/pages" },
    });
  }
  for (const page of s.pages) {
    if (page.sections.length === 0) {
      out.push({ message: `The ${page.title} page is empty.`, fix: edit(page.id) });
    }
    for (const section of page.sections) {
      for (const b of section.buttons) {
        if (!b.href) continue;
        if (b.href.startsWith("/") && !paths.has(b.href)) {
          out.push({
            message: `Button “${b.label}” on ${page.title} links to a page that doesn't exist (${b.href}).`,
            fix: edit(page.id),
          });
        } else if (/^https?:\/\/?$/.test(b.href)) {
          out.push({
            message: `Button “${b.label}” on ${page.title} has no web address.`,
            fix: edit(page.id),
          });
        }
      }
      if (section.kind === "portfolio") {
        const ids = section.portfolio?.galleryIds ?? [];
        if (!galleries.some((g) => ids.includes(g.id) && g.status === "published")) {
          out.push({
            message: `The portfolio on ${page.title} has no published galleries.`,
            fix: { label: "Portfolio", to: "/website/portfolio" },
          });
        }
      }
      if (section.kind === "blog" && publishedPosts(s.posts).length === 0) {
        out.push({
          message: `The blog on ${page.title} has no published posts.`,
          fix: { label: "Blog", to: "/website/blog" },
        });
      }
    }
  }
  const { colors } = resolveDesign(s.templateId, s.design);
  const ratio = contrastRatio(colors.text, colors.background);
  if (ratio < 4.5) {
    out.push({
      message: `Text contrast is low (${ratio.toFixed(1)}:1) and may be hard to read.`,
      fix: { label: "Design", to: "/website/design" },
    });
  }
  return out;
}

const recordId = () => `pub-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function publishSite(s: WebsiteState, now: Date, by = "You"): WebsiteState {
  const changes = s.online
    ? changeSummary(s, s.live)
    : ["Site brought back online", ...changeSummary(s, s.live)];
  return {
    ...s,
    online: true,
    publishedRevision: s.revision,
    lastPublishedAt: now.toISOString(),
    publishedTemplateId: s.templateId,
    live: snapshotOf(s),
    history: [
      {
        id: recordId(),
        kind: "published" as const,
        at: now.toISOString(),
        by,
        changes: changes.length ? changes : ["Republished with no content changes"],
      },
      ...s.history,
    ].slice(0, HISTORY_LIMIT),
  };
}

export function unpublishSite(s: WebsiteState, now = new Date(), by = "You"): WebsiteState {
  return {
    ...s,
    online: false,
    history: [
      {
        id: recordId(),
        kind: "offline" as const,
        at: now.toISOString(),
        by,
        changes: ["Site taken offline"],
      },
      ...s.history,
    ].slice(0, HISTORY_LIMIT),
  };
}

/** Throw away draft edits and go back to what's live. */
export function discardChanges(s: WebsiteState): WebsiteState {
  if (!s.live) return s;
  return { ...s, ...snapshotOf(s.live), revision: s.revision + 1 };
}

/** The site as visitors currently see it (draft content swapped for the live snapshot). */
export function liveSite(s: WebsiteState): WebsiteState {
  return s.live ? { ...s, ...snapshotOf(s.live) } : s;
}

/** "Just now", "5 minutes ago", or an absolute date for older publishes. */
export function publishedLabel(iso: string | null, now: Date): string {
  if (!iso) return "Never published";
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return then.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Copy text to the clipboard; resolves false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
