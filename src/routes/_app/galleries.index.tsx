import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronRight, ImageOff, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader, StatusBadge, TabBar, pageHead } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { formatDate, img, type Gallery } from "@/lib/demo-data";
import {
  GALLERY_SORT_LABELS,
  GALLERY_STATUS_TABS,
  GALLERY_TITLE_MAX,
  countByStatus,
  filterGalleries,
  validateGalleryListSearch,
  type GalleryListSearch,
  type GallerySort,
} from "@/lib/galleries";

export const Route = createFileRoute("/_app/galleries/")({
  head: () => pageHead("Galleries", "All your client galleries in one place."),
  // Filters live in the URL so they survive opening a gallery and coming back.
  validateSearch: validateGalleryListSearch,
  component: Galleries,
});

function Galleries() {
  const { state: demo, ready } = useDemo();
  const { status = "all", q = "", sort = "newest" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const update = (patch: GalleryListSearch) =>
    void navigate({ search: (prev) => validateGalleryListSearch({ ...prev, ...patch }), replace: true });

  const counts = countByStatus(demo.galleries);
  const rows = filterGalleries(demo.galleries, { status, q, sort });
  const filtered = status !== "all" || q.trim() !== "";
  const statusLabel = GALLERY_STATUS_TABS.find((t) => t.value === status)?.label.toLowerCase() ?? "";

  let body: ReactNode;
  if (!ready) {
    body = <LoadingRows />;
  } else if (demo.galleries.length === 0) {
    body = (
      <EmptyState
        title="No galleries yet"
        description="Create your first gallery to start delivering photos to clients."
        action={<NewGalleryDialog triggerLabel="Create your first gallery" />}
      />
    );
  } else if (rows.length === 0) {
    body = q.trim() ? (
      <EmptyState
        title={`No galleries match “${q.trim()}”`}
        description={
          status === "all" ? "Try a different name or keyword." : `Nothing matches in ${statusLabel}. Try all galleries.`
        }
        action={
          <Button variant="outline" size="sm" onClick={() => update({ q: "", status: "all" })}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={`No ${statusLabel} galleries`}
        description={
          status === "archived"
            ? "Galleries you archive will appear here."
            : status === "draft"
              ? "New galleries start as drafts until you publish them."
              : "Publish a gallery to share it with your client."
        }
        action={
          <Button variant="outline" size="sm" onClick={() => update({ status: "all" })}>
            View all galleries
          </Button>
        }
      />
    );
  } else {
    body = (
      <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
        {rows.map((g) => (
          <GalleryRow key={g.id} g={g} />
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Galleries" actions={<NewGalleryDialog />} />

      <TabBar
        value={status}
        onChange={(s) => update({ status: s })}
        tabs={GALLERY_STATUS_TABS.map((t) => ({
          value: t.value,
          label: ready ? `${t.label} (${counts[t.value]})` : t.label,
        }))}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
            placeholder="Search galleries..."
            aria-label="Search galleries by name or description"
            className="h-9 bg-card pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => update({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <Select value={sort} onValueChange={(v) => update({ sort: v as GallerySort })}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-48" aria-label="Sort galleries">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {/* Explicit label so the trigger renders server-side too. */}
            <SelectValue>{GALLERY_SORT_LABELS[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GALLERY_SORT_LABELS) as GallerySort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {GALLERY_SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-3 h-4 text-xs text-muted-foreground" aria-live="polite">
        {ready && filtered && rows.length > 0 ? `Showing ${rows.length} of ${demo.galleries.length} galleries` : null}
      </p>

      <div className="mt-2">{body}</div>
    </div>
  );
}

function GalleryRow({ g }: { g: Gallery }) {
  const hasPhotos = g.photos.length > 0;
  return (
    <li>
      <Link
        to="/galleries/$id"
        params={{ id: g.id }}
        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
      >
        {hasPhotos ? (
          <img
            src={img(g.cover, 160, 120)}
            alt=""
            className="h-14 w-20 shrink-0 rounded bg-muted object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-14 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded bg-muted text-muted-foreground">
            <ImageOff className="h-4 w-4" />
            <span className="text-[9px]">No photos</span>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{g.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <StatusBadge status={g.status} />
            <span>
              {g.photoCount} {g.photoCount === 1 ? "photo" : "photos"}
            </span>
            ·<span>{formatDate(g.date)}</span>
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y rounded-lg border bg-card" aria-busy="true" aria-label="Loading galleries">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-14 w-20 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewGalleryDialog({ triggerLabel = "Create a new gallery" }: { triggerLabel?: string }) {
  const { state: demo, createGallery } = useDemo();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const name = title.trim();
  const duplicate = name !== "" && demo.galleries.some((g) => g.title.toLowerCase() === name.toLowerCase());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const g = createGallery(name);
    toast.success(`“${name}” created as a draft`);
    setOpen(false);
    setTitle("");
    void navigate({ to: "/galleries/$id/upload", params: { id: g.id } });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTitle("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">New gallery</DialogTitle>
            <DialogDescription>
              It starts as a draft only you can see. Next you'll add photos — in this demo, uploads are simulated:
              your files aren't sent anywhere and sample photos are added instead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-gallery-title">Gallery name</Label>
            <Input
              id="new-gallery-title"
              autoFocus
              required
              maxLength={GALLERY_TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Naledi & Sipho Engagement"
              aria-describedby="new-gallery-hint"
            />
            <p id="new-gallery-hint" className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span className={duplicate ? "text-warning" : undefined}>
                {duplicate ? "You already have a gallery with this name." : null}
              </span>
              <span>
                {title.length}/{GALLERY_TITLE_MAX}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name}>
              Create & add photos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
