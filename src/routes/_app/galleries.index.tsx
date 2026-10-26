import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  Button,
  PageHeader,
  Panel,
  StatusBadge,
  TabBar,
  EmptyState,
  pageHead,
} from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { formatDate, img, type GalleryStatus } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/galleries/")({
  head: () => pageHead("Galleries", "All your client galleries in one place."),
  component: Galleries,
});

type Tab = "all" | GalleryStatus;
type Sort = "newest" | "oldest" | "name";

// Explicit labels so the trigger renders server-side too.
const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
};

function Galleries() {
  const { state: demo } = useDemo();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const rows = demo.galleries
    .filter((g) => tab === "all" || g.status === tab)
    .filter((g) => g.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Galleries" actions={<NewGalleryDialog />} />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All" },
          { value: "published", label: "Published" },
          { value: "draft", label: "Drafts" },
          { value: "archived", label: "Archived" },
        ]}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search galleries..."
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-48">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue>{SORT_LABELS[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No galleries here"
              description="Try a different tab or search term."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((g) => (
              <li key={g.id}>
                <Link
                  to="/galleries/$id"
                  params={{ id: g.id }}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <img
                    src={img(g.cover, 160, 120)}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <StatusBadge status={g.status} />
                      <span>{g.photoCount} photos</span>·<span>{formatDate(g.date)}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function NewGalleryDialog() {
  const { createGallery } = useDemo();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = createGallery(title.trim());
    setOpen(false);
    setTitle("");
    void navigate({ to: "/galleries/$id/upload", params: { id: g.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Create a new gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="display-title text-xl">New gallery</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Naledi & Sipho Engagement"
            className="mt-4"
          />
          <DialogFooter className="mt-5">
            <Button type="submit" disabled={!title.trim()}>
              Create & upload photos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
