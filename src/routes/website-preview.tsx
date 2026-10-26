import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Globe } from "lucide-react";
import { ComingSoon, SiteRenderer } from "@/components/website-renderer";
import { WebsiteProvider, useWebsite } from "@/lib/website-store";
import { liveSite } from "@/lib/website";

// Full-window preview of the website, outside the studio app shell, so the
// site lays out at the browser's real width. `version=live` shows what was
// last published (what visitors see); otherwise the current draft. It stays
// in sync with edits made in other tabs.

interface FullPreviewSearch {
  page?: string;
  version?: "live";
}

export const Route = createFileRoute("/website-preview")({
  head: () => ({
    meta: [{ title: "Website preview — Pixora" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (raw: Record<string, unknown>): FullPreviewSearch => {
    const out: FullPreviewSearch = {};
    if (typeof raw["page"] === "string" && raw["page"]) out.page = raw["page"];
    if (raw["version"] === "live") out.version = "live";
    return out;
  },
  component: () => (
    <WebsiteProvider>
      <FullPreview />
    </WebsiteProvider>
  ),
});

function FullPreview() {
  const { site: draft, ready } = useWebsite();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  if (!ready) return <div className="min-h-svh bg-background" aria-busy="true" />;
  const live = search.version === "live";
  const site = live ? liveSite(draft) : draft;
  const page = site.pages.find((p) => p.id === search.page) ?? site.pages[0];
  if (!page) return null;

  return (
    <div className="min-h-svh">
      {live && !site.online ? (
        <ComingSoon site={site} />
      ) : (
        <SiteRenderer
          site={site}
          page={page}
          onNavigate={(id) => {
            void navigate({ search: (prev) => ({ ...prev, page: id }) });
            window.scrollTo({ top: 0 });
          }}
        />
      )}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-popover/95 px-3 py-1.5 text-xs text-popover-foreground shadow-lift backdrop-blur">
        {live ? <Globe className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {live ? "Live site (demo)" : "Draft preview"}
        <span className="text-muted-foreground">·</span>
        <Link
          to="/website/preview"
          search={{ page: page.id }}
          className="font-medium underline-offset-2 hover:underline"
        >
          Back to editor
        </Link>
      </div>
    </div>
  );
}
