<<<<<<< HEAD
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteProvider, useWebsite } from "@/lib/website-store";

export const Route = createFileRoute("/_app/website")({
  component: WebsiteLayout,
});

function WebsiteLayout() {
  return (
    <WebsiteProvider>
      <WebsiteOutlet />
    </WebsiteProvider>
  );
}

// Website pages show dates and saved drafts from localStorage, so render them
// only once that state has loaded (avoids a server/client mismatch flash).
function WebsiteOutlet() {
  const { ready } = useWebsite();
  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-busy="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  // inline-size containment: long unwrapped text (truncated titles, scaled
  // previews) can't widen the app shell past the viewport.
  return (
    <div className="[contain:inline-size]">
      <Outlet />
=======
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button, PageHeader, TabBar, pageHead } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/lib/store";
import { PHOTOS, img, type WebsiteTemplate } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website")({
  head: () =>
    pageHead("Website Templates", "Pick a template and customize your photography website."),
  component: Website,
});

type Tab = "all" | "popular" | WebsiteTemplate["category"];

type Style = { font: string; align: string; dark: boolean };
const MODERN: Style = { font: "font-display", align: "items-start text-left", dark: true };
const styles: Record<string, Style> = {
  modern: MODERN,
  classic: { font: "font-display italic", align: "items-center text-center", dark: true },
  minimal: {
    font: "font-sans uppercase tracking-[0.2em]",
    align: "items-center text-center",
    dark: false,
  },
};

function SitePreview({ t, title, large }: { t: WebsiteTemplate; title: string; large?: boolean }) {
  const s = styles[t.id] ?? MODERN;
  return (
    <div
      className={cn("overflow-hidden rounded-md border bg-card", large ? "text-sm" : "text-[8px]")}
    >
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className={cn("font-medium", s.font)}>{title}</span>
        <span className="flex gap-2 text-muted-foreground">
          <span>Home</span>
          <span>Work</span>
          <span>Contact</span>
        </span>
      </div>
      <div className="relative">
        <img
          src={img(t.image, large ? 1200 : 400, large ? 600 : 240)}
          alt=""
          className={cn("w-full object-cover", large ? "aspect-[2/1]" : "aspect-[5/3]")}
          loading="lazy"
        />
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-3",
            s.align,
            s.dark
              ? "bg-gradient-to-t from-black/50 to-transparent text-white"
              : "bg-white/10 text-foreground",
          )}
        >
          <p className={cn(s.font, large ? "text-3xl" : "text-[11px]")}>{t.headline}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {[PHOTOS.wedding[4], PHOTOS.wedding[6], PHOTOS.wedding[5]].map((p) => (
          <img
            key={p}
            src={img(p, large ? 400 : 120, large ? 300 : 90)}
            alt=""
            className="aspect-[4/3] w-full rounded-sm object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function Website() {
  const { state: demo, publishTemplate } = useDemo();
  const [tab, setTab] = useState<Tab>("all");
  const [editing, setEditing] = useState<WebsiteTemplate | null>(null);
  const [previewing, setPreviewing] = useState<WebsiteTemplate | null>(null);
  const [siteTitle, setSiteTitle] = useState(demo.profile.studio);
  const live = demo.templates.find((t) => t.id === demo.publishedTemplate) ?? demo.templates[0];

  const rows = demo.templates.filter((t) =>
    tab === "all" ? true : tab === "popular" ? t.popular : t.category === tab,
  );
  if (!live) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Website Templates"
        description={`Live template: ${live.name}`}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              onClick={() => setPreviewing(live)}
            >
              <Eye /> Preview
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("Website published", {
                  description: "karabo.pixora.site is up to date (demo)",
                })
              }
            >
              Publish
            </Button>
          </>
        }
      />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All" },
          { value: "popular", label: "Popular" },
          { value: "wedding", label: "Wedding" },
          { value: "portrait", label: "Portrait" },
          { value: "business", label: "Business" },
        ]}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <div key={t.id} className="rounded-lg border bg-card p-3 shadow-soft">
            <button
              type="button"
              onClick={() => setPreviewing(t)}
              className="block w-full text-left transition-opacity hover:opacity-90"
            >
              <SitePreview t={t} title={siteTitle} />
            </button>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-medium">{t.name}</p>
              {t.id === live.id ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                  <Check className="h-3 w-3" /> Live
                </span>
              ) : (
                <span className="text-[11px] capitalize text-muted-foreground">{t.category}</span>
              )}
            </div>
            <Button size="sm" className="mt-3 w-full" onClick={() => setEditing(t)}>
              Customize
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle className="display-title text-xl">
                  Customize {editing.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="site-title">Site title</Label>
                <Input
                  id="site-title"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                />
              </div>
              <SitePreview t={editing} title={siteTitle || "Your studio"} large />
              <DialogFooter>
                <Button
                  onClick={() => {
                    publishTemplate(editing.id);
                    toast.success(`${editing.name} is now your live template`);
                    setEditing(null);
                  }}
                >
                  Use & publish
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Template preview</DialogTitle>
          {previewing ? <SitePreview t={previewing} title={siteTitle} large /> : null}
        </DialogContent>
      </Dialog>
>>>>>>> origin/main
    </div>
  );
}
