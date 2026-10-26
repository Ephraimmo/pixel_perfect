import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PencilLine, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader, Panel, pageHead } from "@/components/kit";
import { WebsiteTabs } from "@/components/website";
import { PortfolioForm } from "@/components/website-editor";
import { LivePreview } from "@/components/website-preview";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWebsite } from "@/lib/website-store";
import { DEFAULT_PORTFOLIO, createPage, pagePath, type SiteSection } from "@/lib/website-pages";

export const Route = createFileRoute("/_app/website/portfolio")({
  head: () =>
    pageHead("Website Portfolio", "Choose the galleries and layout for your portfolio pages."),
  component: PortfolioManager,
});

function PortfolioManager() {
  const { site, update } = useWebsite();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Every portfolio section on the site, wherever it lives.
  const targets = site.pages.flatMap((page) =>
    page.sections.filter((s) => s.kind === "portfolio").map((section) => ({ page, section })),
  );
  const current = targets.find((t) => t.section.id === selectedId) ?? targets[0];

  const patch = (patch: Partial<SiteSection>) => {
    if (!current) return;
    update((s) => ({
      pages: s.pages.map((p) =>
        p.id !== current.page.id
          ? p
          : {
              ...p,
              sections: p.sections.map((x) =>
                x.id === current.section.id ? { ...x, ...patch } : x,
              ),
            },
      ),
    }));
  };

  const select = (sectionId: string) => {
    setSelectedId(sectionId);
    setPreviewPageId(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <WebsiteTabs />
      <PageHeader
        title="Portfolio"
        description="Pick the galleries to show on your portfolio pages and choose how they're laid out."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus /> New portfolio page
          </Button>
        }
      />

      {!current ? (
        <EmptyState
          title="No portfolio on your site yet"
          description="Create a portfolio page to show your best galleries."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> New portfolio page
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Panel className="space-y-4 p-4">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label className="text-xs">Portfolio</Label>
                  <Select value={current.section.id} onValueChange={select}>
                    <SelectTrigger aria-label="Portfolio to edit" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((t) => (
                        <SelectItem key={t.section.id} value={t.section.id}>
                          {t.page.title} · {t.section.heading || "Portfolio"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button asChild size="sm" variant="outline" className="bg-card">
                  <Link to="/website/pages/$pageId" params={{ pageId: current.page.id }}>
                    <PencilLine /> Edit page
                  </Link>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                On {pagePath(current.page)} ·{" "}
                {current.page.inNav ? "in the site menu" : "hidden from the menu"}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pf-heading" className="text-xs">
                  Heading
                </Label>
                <Input
                  id="pf-heading"
                  value={current.section.heading}
                  maxLength={120}
                  placeholder="Optional"
                  onChange={(e) => patch({ heading: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-body" className="text-xs">
                  Introduction
                </Label>
                <Textarea
                  id="pf-body"
                  rows={2}
                  value={current.section.body}
                  placeholder="Optional"
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </div>
            </Panel>
            <Panel className="p-4">
              <PortfolioForm
                key={current.section.id}
                config={current.section.portfolio ?? DEFAULT_PORTFOLIO}
                onChange={(portfolio) => patch({ portfolio })}
              />
            </Panel>
          </div>

          <LivePreview
            className="h-fit lg:sticky lg:top-4"
            pageId={previewPageId ?? current.page.id}
            onPageChange={setPreviewPageId}
          />
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          {creating ? (
            <NewPortfolioPage
              onCreated={(sectionId) => {
                select(sectionId);
                setCreating(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewPortfolioPage({ onCreated }: { onCreated: (sectionId: string) => void }) {
  const { site, update } = useWebsite();
  const [title, setTitle] = useState("Weddings");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give the page a title.");
      return;
    }
    const page = createPage(site.pages, { kind: "portfolio", title });
    update((s) => ({ pages: [...s.pages, page] }));
    const section = page.sections.find((s) => s.kind === "portfolio");
    toast.success(`${page.title} page added`, {
      description: `Live at ${pagePath(page)} once published.`,
    });
    if (section) onCreated(section.id);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="display-title text-xl">New portfolio page</DialogTitle>
        <DialogDescription>
          For example a page just for weddings or families. You can pick its galleries next.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="npp-title">Page title</Label>
        <Input
          id="npp-title"
          value={title}
          maxLength={40}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create page</Button>
      </DialogFooter>
    </form>
  );
}
