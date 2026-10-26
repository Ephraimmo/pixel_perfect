import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader, TabBar, pageHead } from "@/components/kit";
import { ScrollRow, Segmented, SitePreview, WebsiteTabs } from "@/components/website";
import { ScaledFrame, SiteRenderer } from "@/components/website-renderer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteNav, useWebsite } from "@/lib/website-store";
import { siteUrl } from "@/lib/website";
import {
  SITE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  filterTemplates,
  templateById,
  type SiteTemplate,
  type TemplateFilter,
} from "@/lib/website-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/templates")({
  head: () =>
    pageHead("Website Templates", "Pick a template and customize your photography website."),
  component: TemplateLibrary,
});

const FILTER_TABS: { value: TemplateFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  ...TEMPLATE_CATEGORIES,
];

function TemplateLibrary() {
  const { site } = useWebsite();
  const nav = useSiteNav();
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<SiteTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<"yours" | "sample">("yours");
  const home = site.pages.find((p) => p.kind === "home") ?? site.pages[0];
  const current = templateById(site.templateId);
  const rows = filterTemplates(SITE_TEMPLATES, filter, query);

  // Browse within the visible list; fall back to the whole catalog if filters hide it.
  const browseList = rows.some((t) => t.id === previewId) ? rows : SITE_TEMPLATES;
  const previewIndex = browseList.findIndex((t) => t.id === previewId);
  const previewing = previewIndex >= 0 ? browseList[previewIndex] : undefined;
  const step = (dir: 1 | -1) => {
    const next = browseList[(previewIndex + dir + browseList.length) % browseList.length];
    if (next) setPreviewId(next.id);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <WebsiteTabs />
      <PageHeader
        title="Template Library"
        description={`Current template: ${current.name}${
          site.publishedTemplateId !== current.id ? " (not published yet)" : ""
        }`}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            onClick={() => setPreviewId(current.id)}
          >
            <Eye /> Preview current
          </Button>
        }
      />

      <div className="relative mb-4 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          aria-label="Search templates"
          className="h-9 bg-card pl-8 text-xs"
        />
      </div>

      <ScrollRow>
        <TabBar value={filter} onChange={setFilter} tabs={FILTER_TABS} />
      </ScrollRow>

      <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
        {rows.length} template{rows.length === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No templates match"
            description="Try another category or search term."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              title={site.siteTitle}
              nav={nav}
              current={t.id === current.id}
              onPreview={() => setPreviewId(t.id)}
              onChoose={() => setChoosing(t)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent
          className="max-h-[90svh] max-w-3xl overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          {previewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="display-title text-xl">{previewing.name}</DialogTitle>
                <DialogDescription>{previewing.description}</DialogDescription>
              </DialogHeader>
              <Segmented
                label="Preview"
                value={previewMode}
                onChange={setPreviewMode}
                options={[
                  ["yours", "With your content"],
                  ["sample", "Template sample"],
                ]}
              />
              {previewMode === "yours" && home ? (
                <div className="max-h-[52svh] overflow-y-auto rounded-md border">
                  <ScaledFrame width={1200}>
                    <SiteRenderer site={{ ...site, templateId: previewing.id }} page={home} />
                  </ScaledFrame>
                </div>
              ) : (
                <SitePreview t={previewing} title={site.siteTitle} nav={nav} large />
              )}
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {previewing.features.map((f) => (
                  <li key={f} className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => step(-1)}
                    aria-label="Previous template"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => step(1)}
                    aria-label="Next template"
                  >
                    <ChevronRight />
                  </Button>
                </div>
                {previewing.id === current.id ? (
                  <Button size="sm" disabled>
                    <Check /> Current template
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setChoosing(previewing);
                      setPreviewId(null);
                    }}
                  >
                    Use {previewing.name}
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ChooseTemplateDialog template={choosing} onClose={() => setChoosing(null)} />
    </div>
  );
}

function TemplateCard({
  t,
  title,
  nav,
  current,
  onPreview,
  onChoose,
}: {
  t: SiteTemplate;
  title: string;
  nav: string[];
  current: boolean;
  onPreview: () => void;
  onChoose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card p-3 shadow-soft",
        current && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${t.name}`}
        className="block w-full text-left transition-opacity hover:opacity-90"
      >
        <SitePreview t={t} title={title} nav={nav} />
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t.name}</p>
        {current ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
            <Check className="h-3 w-3" /> Current
          </span>
        ) : t.isNew ? (
          <span className="rounded bg-info/12 px-1.5 py-0.5 text-[10px] font-semibold text-info">
            New
          </span>
        ) : t.popular ? (
          <span className="rounded bg-clay/12 px-1.5 py-0.5 text-[10px] font-semibold text-clay">
            Popular
          </span>
        ) : null}
      </div>
      <p className="text-[11px] capitalize text-muted-foreground">{t.category}</p>
      <p className="mt-1.5 line-clamp-2 flex-1 text-xs text-muted-foreground">{t.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="bg-card" onClick={onPreview}>
          <Eye /> Preview
        </Button>
        <Button size="sm" onClick={onChoose} disabled={current}>
          {current ? "In use" : "Use template"}
        </Button>
      </div>
    </div>
  );
}

/** Confirm a template switch, with the site title, as a draft or published right away. */
function ChooseTemplateDialog({
  template,
  onClose,
}: {
  template: SiteTemplate | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        {template ? (
          <ChooseTemplateForm key={template.id} template={template} onDone={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ChooseTemplateForm({ template, onDone }: { template: SiteTemplate; onDone: () => void }) {
  const { site, edit, publish } = useWebsite();
  const home = site.pages.find((p) => p.kind === "home") ?? site.pages[0];
  const [siteTitle, setSiteTitle] = useState(site.siteTitle);

  const apply = (andPublish: boolean) => {
    edit({ templateId: template.id, siteTitle: siteTitle.trim() || site.siteTitle });
    if (andPublish) {
      publish();
      toast.success(`${template.name} is now your live template`, {
        description: `${siteUrl(site)} is up to date (demo)`,
      });
    } else {
      toast.success(`Switched to ${template.name}`, {
        description: "Saved as a draft — publish when you're ready.",
      });
    }
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="display-title text-xl">Customize {template.name}</DialogTitle>
        <DialogDescription>
          Your pages and content stay the same; only the look changes. Design settings you've
          customized are kept.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="site-title">Site title</Label>
        <Input
          id="site-title"
          value={siteTitle}
          maxLength={60}
          onChange={(e) => setSiteTitle(e.target.value)}
        />
      </div>
      {home ? (
        <div className="max-h-[45svh] overflow-y-auto rounded-md border">
          <ScaledFrame width={1200}>
            <SiteRenderer
              site={{ ...site, templateId: template.id, siteTitle: siteTitle || "Your studio" }}
              page={home}
            />
          </ScaledFrame>
        </div>
      ) : null}
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => apply(false)}>
          Save as draft
        </Button>
        <Button onClick={() => apply(true)}>Use & publish</Button>
      </DialogFooter>
    </>
  );
}
