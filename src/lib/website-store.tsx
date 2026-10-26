// Website builder demo store — React context over local state, persisted to
// its own localStorage key so it never collides with the main demo store.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDemo } from "./store";
import {
  WEBSITE_VERSION,
  discardChanges,
  editSite,
  publishSite,
  seedWebsite,
  snapshotOf,
  unpublishSite,
  type WebsiteState,
} from "./website";
import { navPages } from "./website-pages";

const STORAGE_KEY = "pixora-website-v1";

function loadWebsite(seed: WebsiteState): WebsiteState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WebsiteState>;
    if (parsed.version !== WEBSITE_VERSION) return null;
    // Fill keys added after the state was saved.
    const merged: WebsiteState = { ...seed, ...parsed };
    if (!parsed.live) {
      // Saved before publish snapshots existed: if it was fully published, its
      // content is what's live; otherwise the best guess is the original site.
      merged.live = parsed.revision === parsed.publishedRevision ? snapshotOf(merged) : seed.live;
    }
    return merged;
  } catch {
    return null;
  }
}

export interface WebsiteStore {
  site: WebsiteState;
  /** False until saved website state has been read from localStorage. */
  ready: boolean;
  /** Edit draft content; marks the site as having unpublished changes. */
  edit: (patch: Partial<WebsiteState>) => void;
  /** Like edit, but computes the patch from the latest state (safe for list operations). */
  update: (fn: (s: WebsiteState) => Partial<WebsiteState>) => void;
  /** Copy the draft to the live site and record it in the publish history. */
  publish: () => void;
  unpublish: () => void;
  /** Throw away unpublished edits. */
  discard: () => void;
  resetWebsite: () => void;
}

const WebsiteContext = createContext<WebsiteStore | null>(null);

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const { state: demo, ready: demoReady, publishTemplate } = useDemo();
  const seed = () =>
    seedWebsite({ studio: demo.profile.studio, templateId: demo.publishedTemplate });
  const [site, setSite] = useState<WebsiteState>(seed);
  const [ready, setReady] = useState(false);

  // Wait for the demo store so a fresh seed picks up the saved studio name and template.
  useEffect(() => {
    if (!demoReady || ready) return;
    const fresh = seed();
    setSite(loadWebsite(fresh) ?? fresh);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoReady, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
    } catch {
      // storage full or unavailable — website state simply won't persist
    }
  }, [site, ready]);

  // Follow edits made in other tabs (e.g. a preview tab open beside the editor).
  // Writing back an identical value fires no new storage event, so tabs don't loop.
  useEffect(() => {
    if (!ready) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const next = loadWebsite(seed());
      if (next) setSite(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keep the main demo store's "live template" in step with the published site.
  useEffect(() => {
    const known = demo.templates.some((t) => t.id === site.publishedTemplateId);
    if (ready && known && site.publishedTemplateId !== demo.publishedTemplate) {
      publishTemplate(site.publishedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, site.publishedTemplateId]);

  const value = useMemo<WebsiteStore>(
    () => ({
      site,
      ready,
      edit: (patch) => setSite((s) => editSite(s, patch)),
      update: (fn) => setSite((s) => editSite(s, fn(s))),
      publish: () => setSite((s) => publishSite(s, new Date(), demo.profile.name)),
      unpublish: () => setSite((s) => unpublishSite(s, new Date(), demo.profile.name)),
      discard: () => setSite(discardChanges),
      resetWebsite: () => setSite(seed()),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [site, ready, demo.profile.name],
  );

  return <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>;
}

export function useWebsite(): WebsiteStore {
  const ctx = useContext(WebsiteContext);
  if (!ctx) throw new Error("useWebsite must be used inside <WebsiteProvider>");
  return ctx;
}

/** Navigation menu labels for the current draft site. */
export function useSiteNav(): string[] {
  const { site } = useWebsite();
  return useMemo(() => navPages(site.pages).map((p) => p.title), [site.pages]);
}
