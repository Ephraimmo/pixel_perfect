import { createFileRoute } from "@tanstack/react-router";
import { Download, Heart } from "lucide-react";
import { ClientGalleryShell, fakeDownload } from "@/components/client-gallery";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/store";
import { img, type Gallery } from "@/lib/demo-data";

export const Route = createFileRoute("/g/$id/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — Pixora" },
      { name: "description", content: "Your favorite photos and download packages." },
    ],
  }),
  component: ClientDownloads,
});

function ClientDownloads() {
  const { id } = Route.useParams();
  return <ClientGalleryShell id={id}>{(g) => <DownloadsView g={g} />}</ClientGalleryShell>;
}

function DownloadsView({ g }: { g: Gallery }) {
  const { toggleFavorite } = useDemo();
  const favorites = g.photos.filter((p) => g.favorites.includes(p));
  const favoritesZip = `${g.shortTitle} – Favorites.zip`;
  const packages = [
    {
      name: favoritesZip,
      meta: `${favorites.length} photos · ${Math.max(1, favorites.length) * 15.5} MB`,
      thumb: favorites[0] ?? g.cover,
      disabled: favorites.length === 0,
    },
    {
      name: "High Resolution (All Photos).zip",
      meta: `${g.photoCount} photos · 324 MB`,
      thumb: g.photos[1] ?? g.cover,
      disabled: false,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="display-title text-3xl">Favorites ({favorites.length})</h1>
        {g.allowDownloads && favorites.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="bg-card"
            onClick={() => fakeDownload(favoritesZip)}
          >
            Download favorites
          </Button>
        ) : null}
      </div>

      {favorites.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          You haven't favorited any photos yet.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {favorites.map((p) => (
            <div key={p} className="group relative overflow-hidden rounded">
              <img
                src={img(p, 300, 300)}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                aria-label="Remove favorite"
                onClick={() => toggleFavorite(g.id, p)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/25 p-1 text-white opacity-0 transition group-hover:opacity-100 max-sm:opacity-100"
              >
                <Heart className="h-3.5 w-3.5 fill-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="display-title mt-10 text-2xl">Downloads</h2>
      {g.allowDownloads ? (
        <ul className="mt-4 divide-y rounded-lg border bg-card">
          {packages.map((d) => (
            <li key={d.name} className="flex items-center gap-3 px-4 py-3">
              <img
                src={img(d.thumb, 120, 120)}
                alt=""
                className="h-11 w-11 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.meta}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={d.disabled}
                onClick={() => fakeDownload(d.name)}
              >
                <Download /> Download
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Downloads are turned off for this gallery.
        </p>
      )}
    </>
  );
}
