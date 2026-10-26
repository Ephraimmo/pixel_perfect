import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  MoreHorizontal,
  Plus,
  PencilLine,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, PageHeader, Panel, pageHead } from "@/components/kit";
import { PAGE_ICON, WebsiteTabs } from "@/components/website";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWebsite } from "@/lib/website-store";
import { siteUrl } from "@/lib/website";
import {
  PAGE_KIND_LABEL,
  createPage,
  duplicatePage,
  moveItem,
  navPages,
  pagePath,
  slugError,
  slugify,
  uniqueSlug,
  type PageKind,
  type SitePage,
} from "@/lib/website-pages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/pages/")({
  head: () => pageHead("Website Pages", "Create pages and set their order in your site menu."),
  component: PageManager,
});

function PageManager() {
  const { site, update } = useWebsite();
  const navigate = useNavigate();
  const pages = site.pages;
  const [adding, setAdding] = useState(false);
  const [settingsFor, setSettingsFor] = useState<SitePage | null>(null);
  const [deleting, setDeleting] = useState<SitePage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (id: string, to: number) => update((s) => ({ pages: moveItem(s.pages, id, to) }));
  const patchPage = (id: string, patch: Partial<SitePage>) =>
    update((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const endDrag = () => {
    setDragId(null);
    setOverIndex(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <WebsiteTabs />
      <PageHeader
        title="Pages"
        description="Create pages and drag them to set the order of your site menu."
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add page
          </Button>
        }
      />

      <Panel className="mb-4 p-4">
        <p className="eyebrow">Site menu</p>
        <nav
          aria-label="Site menu preview"
          className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
        >
          {navPages(pages).length === 0 ? (
            <span className="text-muted-foreground">No pages in the menu.</span>
          ) : (
            navPages(pages).map((p) => (
              <span key={p.id} className={cn(p.kind === "home" && "font-medium")}>
                {p.title}
              </span>
            ))
          )}
        </nav>
      </Panel>

      <Panel>
        <ul aria-label="Pages" onDragLeave={() => setOverIndex(null)}>
          {pages.map((p, i) => {
            const Icon = PAGE_ICON[p.kind];
            return (
              <li
                key={p.id}
                draggable
                onDragStart={(e) => {
                  setDragId(p.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", p.id);
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) move(dragId, i);
                  endDrag();
                }}
                onDragEnd={endDrag}
                className={cn(
                  "flex items-center gap-2 border-b px-3 py-3 last:border-b-0 sm:gap-3 sm:px-4",
                  dragId === p.id && "opacity-50",
                  overIndex === i && dragId !== p.id && "bg-accent/60",
                )}
              >
                <GripVertical
                  className="hidden h-4 w-4 shrink-0 cursor-grab text-muted-foreground sm:block"
                  aria-hidden
                />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <Link
                      to="/website/pages/$pageId"
                      params={{ pageId: p.id }}
                      className="truncate hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.kind === "home" ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Homepage
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {pagePath(p)} · {p.sections.length} section
                    {p.sections.length === 1 ? "" : "s"}
                  </p>
                </div>
                <label className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                  In menu
                  <Switch
                    checked={p.inNav}
                    onCheckedChange={(v) => patchPage(p.id, { inNav: v })}
                    aria-label={`Show ${p.title} in menu`}
                  />
                </label>
                <div className="flex shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={i === 0}
                    onClick={() => move(p.id, i - 1)}
                    aria-label={`Move ${p.title} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={i === pages.length - 1}
                    onClick={() => move(p.id, i + 1)}
                    aria-label={`Move ${p.title} down`}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Actions for ${p.title}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        void navigate({ to: "/website/pages/$pageId", params: { pageId: p.id } })
                      }
                    >
                      <PencilLine /> Edit sections
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSettingsFor(p)}>
                      <Settings2 /> Page settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="md:hidden"
                      onSelect={() => patchPage(p.id, { inNav: !p.inNav })}
                    >
                      {p.inNav ? "Hide from menu" : "Show in menu"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        update((s) => {
                          const copy = duplicatePage(s.pages, p);
                          const at = s.pages.findIndex((x) => x.id === p.id) + 1;
                          return { pages: [...s.pages.slice(0, at), copy, ...s.pages.slice(at)] };
                        });
                        toast.success(`${p.title} duplicated`);
                      }}
                    >
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={p.kind === "home"}
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleting(p)}
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="mt-4">
        <DemoNotice>
          Pages are saved in this browser as a draft. Publish from the Overview to make menu and
          page changes live (simulated — nothing is hosted yet).
        </DemoNotice>
      </div>

      <AddPageDialog open={adding} onOpenChange={setAdding} />

      <Dialog open={!!settingsFor} onOpenChange={(o) => !o && setSettingsFor(null)}>
        <DialogContent className="max-w-md">
          {settingsFor ? (
            <PageSettingsForm
              key={settingsFor.id}
              page={settingsFor}
              onDone={() => setSettingsFor(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The page and its {deleting?.sections.length ?? 0} sections will be removed from your
              draft site. Links to {deleting ? pagePath(deleting) : ""} will stop working once you
              publish.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                update((s) => ({ pages: s.pages.filter((p) => p.id !== deleting.id) }));
                toast.success(`${deleting.title} deleted`);
              }}
            >
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const ADDABLE: PageKind[] = ["home", "about", "portfolio", "pricing", "contact", "blog", "custom"];

function AddPageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        {open ? <AddPageForm onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AddPageForm({ onDone }: { onDone: () => void }) {
  const { site, update } = useWebsite();
  const hasHome = site.pages.some((p) => p.kind === "home");
  const firstKind: PageKind = "about";
  const [kind, setKind] = useState<PageKind>(firstKind);
  const [title, setTitle] = useState(PAGE_KIND_LABEL[firstKind]);
  const [slug, setSlug] = useState(uniqueSlug(site.pages, PAGE_KIND_LABEL[firstKind]));
  const [slugTouched, setSlugTouched] = useState(false);
  const isHome = kind === "home";
  const error = isHome ? null : slugError(site.pages, slug);

  const pickKind = (k: PageKind) => {
    setKind(k);
    const label = k === "custom" ? "New page" : PAGE_KIND_LABEL[k];
    setTitle(label);
    if (!slugTouched) setSlug(uniqueSlug(site.pages, label));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give the page a title.");
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    update((s) => {
      const page = createPage(s.pages, { kind, title, slug: isHome ? "" : slug });
      // A homepage always leads the menu.
      return { pages: isHome ? [page, ...s.pages] : [...s.pages, page] };
    });
    toast.success(`${title.trim()} page added`, { description: "It's in your draft site." });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="display-title text-xl">Add a page</DialogTitle>
        <DialogDescription>
          New pages start with ready-made sections you can edit.
        </DialogDescription>
      </DialogHeader>

      <fieldset>
        <legend className="mb-2 text-xs font-medium">Page type</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADDABLE.map((k) => {
            const Icon = PAGE_ICON[k];
            const disabled = k === "home" && hasHome;
            return (
              <button
                key={k}
                type="button"
                disabled={disabled}
                aria-pressed={kind === k}
                onClick={() => pickKind(k)}
                title={disabled ? "Your site already has a homepage" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md border bg-card px-3 py-2.5 text-left text-xs transition-colors",
                  kind === k ? "border-primary ring-1 ring-primary" : "hover:bg-accent",
                  disabled && "cursor-not-allowed opacity-50 hover:bg-card",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {PAGE_KIND_LABEL[k]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="np-title">Title</Label>
        <Input
          id="np-title"
          value={title}
          maxLength={40}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(uniqueSlug(site.pages, e.target.value));
          }}
        />
      </div>

      {isHome ? null : (
        <div className="space-y-1.5">
          <Label htmlFor="np-slug">Page address</Label>
          <div className="flex items-center rounded-md border bg-card pl-3 text-xs text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
            <span className="shrink-0">{siteUrl(site)}/</span>
            <input
              id="np-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              onBlur={() => setSlug((s) => slugify(s))}
              aria-invalid={!!error}
              className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-foreground outline-none"
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      )}

      <DialogFooter>
        <Button type="submit">Add page</Button>
      </DialogFooter>
    </form>
  );
}

function PageSettingsForm({ page, onDone }: { page: SitePage; onDone: () => void }) {
  const { site, update } = useWebsite();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [inNav, setInNav] = useState(page.inNav);
  const isHome = page.kind === "home";
  const error = isHome ? null : slugError(site.pages, slug, page.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give the page a title.");
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    update((s) => ({
      pages: s.pages.map((p) =>
        p.id === page.id ? { ...p, title: title.trim(), slug, inNav } : p,
      ),
    }));
    toast.success("Page settings saved");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="display-title text-xl">Page settings</DialogTitle>
        <DialogDescription>{PAGE_KIND_LABEL[page.kind]} page</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="ps-title">Title</Label>
        <Input
          id="ps-title"
          value={title}
          maxLength={40}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ps-slug">Page address</Label>
        <div className="flex items-center rounded-md border bg-card pl-3 text-xs text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
          <span className="shrink-0">{siteUrl(site)}/</span>
          <input
            id="ps-slug"
            value={slug}
            disabled={isHome}
            placeholder={isHome ? "(homepage)" : undefined}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            onBlur={() => !isHome && setSlug((s) => slugify(s))}
            aria-invalid={!!error}
            className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-foreground outline-none disabled:cursor-not-allowed"
          />
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm">Show in site menu</span>
        <Switch checked={inNav} onCheckedChange={setInNav} />
      </label>
      <DialogFooter>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}
