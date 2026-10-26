import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PHOTOS, img } from "@/lib/demo-data";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Gallery templates — Pixora" },
      {
        name: "description",
        content:
          "Designer gallery layouts for weddings, families, maternity and editorial work. Browse the collection.",
      },
      { property: "og:title", content: "Gallery templates — Pixora" },
      {
        property: "og:description",
        content: "Designer gallery layouts for weddings, families, maternity and editorial work.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: img(PHOTOS.lakeBanner, 1600, 1000) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: img(PHOTOS.lakeBanner, 1600, 1000) },
    ],
  }),
  component: Templates,
});

const templates = [
  {
    name: "Editorial Vow",
    category: "Wedding",
    blurb:
      "Full-bleed covers, generous whitespace and a serif voice — for weddings that read like a magazine story.",
    layout: "Masonry with wide lead",
  },
  {
    name: "Quiet Morning",
    category: "Family",
    blurb:
      "Soft grid, warm captions and a favorites-first landing. Built for parents who scroll on the sofa.",
    layout: "Even grid, captioned",
  },
  {
    name: "Bloom",
    category: "Maternity",
    blurb: "Single-column with centered type and gentle fades — quiet, unhurried, personal.",
    layout: "Single column",
  },
  {
    name: "Monochrome Set",
    category: "Headshots",
    blurb:
      "Strict rows, neutral background, crop-to-face thumbnails. Corporate delivery without the clutter.",
    layout: "Row grid, no captions",
  },
  {
    name: "Night Reception",
    category: "Wedding",
    blurb:
      "Dark cover, gold accents and a filmstrip footer for the last dance. For evening celebrations.",
    layout: "Filmstrip + masonry",
  },
  {
    name: "Field Notes",
    category: "Editorial",
    blurb:
      "Diagonal crops, oversized numbers and a credits page. Portfolio commissions and personal work.",
    layout: "Broken grid",
  },
];

function Templates() {
  return (
    <div className="min-h-svh">
      <MarketingNav />

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 text-center sm:px-6">
        <p className="eyebrow">Templates</p>
        <h1 className="display-title mx-auto mt-3 max-w-2xl text-4xl text-foreground sm:text-5xl">
          Start every gallery from a designed place.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Six layouts tuned to how photographers actually deliver — apply one when you create a
          gallery, then make it yours.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <div
              key={t.name}
              className="group overflow-hidden rounded-lg border bg-card shadow-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={img(
                    PHOTOS.wedding[i % PHOTOS.wedding.length] ?? PHOTOS.lakeBanner,
                    720,
                    540,
                  )}
                  alt={`${t.name} gallery template`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{t.name}</h2>
                  <Badge variant="outline">{t.category}</Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.blurb}</p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t.layout}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <h2 className="display-title text-2xl">Try one on a real gallery</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            The demo workspace has six galleries you can open, duplicate and restyle — nothing you
            break is real.
          </p>
          <Button asChild>
            <Link to="/signup">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
