import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Heart, X } from "lucide-react";
import { ClientGalleryShell, fakeDownload } from "@/components/client-gallery";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDemo } from "@/lib/store";
import { formatDate, img, type Gallery } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/g/$id/")({
  head: () => ({
    meta: [
      { title: "Client Gallery — Pixora" },
      { name: "description", content: "View, favorite and download your photos." },
    ],
  }),
  component: ClientGallery,
});

function ClientGallery() {
  const { id } = Route.useParams();
  return <ClientGalleryShell id={id}>{(g) => <GalleryView g={g} />}</ClientGalleryShell>;
}

function GalleryView({ g }: { g: Gallery }) {
  const { toggleFavorite } = useDemo();
  const [open, setOpen] = useState<number | null>(null);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const photos = onlyFavs ? g.photos.filter((p) => g.favorites.includes(p)) : g.photos;

  const Fav = ({ photo, className }: { photo: string; className?: string }) =>
    g.allowFavorites ? (
      <button
        type="button"
        aria-label={g.favorites.includes(photo) ? "Remove favorite" : "Add favorite"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(g.id, photo);
        }}
        className={cn(
          "rounded-full bg-black/25 p-1.5 text-white backdrop-blur transition hover:bg-black/40",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", g.favorites.includes(photo) && "fill-white")} />
      </button>
    ) : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl">{g.shortTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(g.date)}</p>
        </div>
        <div className="flex gap-2">
          {g.allowDownloads ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-card"
              onClick={() => fakeDownload(`${g.shortTitle} – All Photos.zip`)}
            >
              <Download /> Download
            </Button>
          ) : null}
          {g.allowFavorites ? (
            <Button
              variant="outline"
              size="sm"
              className={cn("bg-card", onlyFavs && "border-rose/40 text-rose")}
              aria-pressed={onlyFavs}
              aria-label="Show favorites only"
              onClick={() => setOnlyFavs((v) => !v)}
            >
              <Heart className={cn(onlyFavs && "fill-current")} />
              <span className="text-xs">{g.favorites.length}</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
        {photos.map((p, i) => (
          <div key={p} className="group relative break-inside-avoid overflow-hidden rounded-md">
            <button type="button" onClick={() => setOpen(i)} className="block w-full">
              <img
                src={img(p, 600)}
                alt=""
                className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </button>
            <Fav
              photo={p}
              className={cn(
                "absolute right-2 top-2",
                !g.favorites.includes(p) &&
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
              )}
            />
          </div>
        ))}
      </div>
      {photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No favorites yet — tap the heart on any photo.
        </p>
      ) : null}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black/90 p-3 text-white [&>button]:hidden">
          <DialogTitle className="sr-only">Photo viewer</DialogTitle>
          {open !== null && photos[open] ? (
            <div className="relative">
              <img
                src={img(photos[open], 1600)}
                alt=""
                className="mx-auto max-h-[80vh] rounded object-contain"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <Fav photo={photos[open]} />
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(null)}
                  className="rounded-full bg-black/25 p-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setOpen((open - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => setOpen((open + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
