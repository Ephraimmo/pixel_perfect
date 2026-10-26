import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Heart, Plus, Settings, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, StatusBadge, TabBar, pageHead } from "@/components/kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDemo } from "@/lib/store";
import { formatDate, img } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/galleries/$id/")({
  head: () => pageHead("Gallery", "Manage photos, favorites and downloads for this gallery."),
  component: GalleryDetail,
});

type Tab = "photos" | "favorites" | "downloads" | "settings";

function GalleryDetail() {
  const { id } = Route.useParams();
  const { state: demo } = useDemo();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("photos");
  const [preview, setPreview] = useState<string | null>(null);
  const g = demo.galleries.find((x) => x.id === id);

  if (!g) return <EmptyState title="Gallery not found" description="It may have been removed." />;

  const share = async () => {
    const url = `${window.location.origin}/g/${g.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: url });
    } catch {
      toast.info(url);
    }
  };

  const photos = tab === "favorites" ? g.photos.filter((p) => g.favorites.includes(p)) : g.photos;

  return (
    <div className="mx-auto max-w-5xl">
      <img
        src={img(g.banner, 1600, 500)}
        alt=""
        className="h-40 w-full rounded-lg object-cover sm:h-52"
      />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="display-title text-2xl">{g.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={g.status} /> {g.photoCount} photos · Created {formatDate(g.date)}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{g.updated}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/g/$id" params={{ id: g.id }}>
            View Gallery
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="bg-card" onClick={share}>
          <Share2 /> Share
        </Button>
        <Button asChild size="sm" variant="outline" className="bg-card">
          <Link to="/galleries/$id/settings" params={{ id: g.id }}>
            <Settings /> Settings
          </Link>
        </Button>
      </div>

      <TabBar
        className="mt-6"
        value={tab}
        onChange={(t) =>
          t === "settings"
            ? navigate({ to: "/galleries/$id/settings", params: { id: g.id } })
            : setTab(t)
        }
        tabs={[
          { value: "photos", label: "Photos" },
          { value: "favorites", label: `Favorites (${g.favorites.length})` },
          { value: "downloads", label: "Downloads" },
          { value: "settings", label: "Settings" },
        ]}
      />

      {tab === "downloads" ? (
        <ul className="mt-4 divide-y rounded-lg border bg-card">
          {[
            {
              name: `${g.shortTitle} – Favorites.zip`,
              meta: `${g.favorites.length * 3} photos · 124 MB`,
              count: 6,
            },
            {
              name: "High Resolution (All Photos).zip",
              meta: `${g.photoCount} photos · 324 MB`,
              count: 3,
            },
            {
              name: "Web Size (All Photos).zip",
              meta: `${g.photoCount} photos · 86 MB`,
              count: 11,
            },
          ].map((d) => (
            <li key={d.name} className="flex items-center gap-3 px-4 py-3">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.meta}</p>
              </div>
              <span className="text-xs text-muted-foreground">{d.count} downloads</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {photos.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreview(p)}
              className="group relative overflow-hidden rounded"
            >
              <img
                src={img(p, 300, 300)}
                alt=""
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {g.favorites.includes(p) ? (
                <Heart className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-white text-white drop-shadow" />
              ) : null}
            </button>
          ))}
          {tab === "photos" ? (
            <Link
              to="/galleries/$id/upload"
              params={{ id: g.id }}
              aria-label="Upload photos"
              className="flex aspect-square items-center justify-center rounded border border-dashed bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
            </Link>
          ) : null}
          {tab === "favorites" && photos.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No favorites from your client yet.
            </p>
          ) : null}
        </div>
      )}

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {preview ? (
            <img
              src={img(preview, 1400)}
              alt=""
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
