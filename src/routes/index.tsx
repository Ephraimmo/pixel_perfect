import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PHOTOS, img } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixora — Everything you need to grow your photography business" },
      {
        name: "description",
        content:
          "Client galleries, websites, bookings, store, and more — all in one beautiful platform.",
      },
      {
        property: "og:title",
        content: "Pixora — Everything you need to grow your photography business",
      },
      {
        property: "og:description",
        content:
          "Client galleries, websites, bookings, store, and more — all in one beautiful platform.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: img(PHOTOS.heroPhotographer, 1600, 1000) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const strip = [
  PHOTOS.wedding[0],
  PHOTOS.wedding[4],
  PHOTOS.travel[2],
  PHOTOS.wedding[5],
  PHOTOS.family[0],
  PHOTOS.wedding[1],
];

function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <section className="relative flex flex-1 flex-col overflow-hidden">
        <img
          src={img(PHOTOS.heroPhotographer, 1800)}
          alt="Photographer taking a picture at golden hour"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_center] lg:w-[68%] lg:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/10 lg:via-background/70 lg:to-transparent" />

        <MarketingNav />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:py-24">
          <h1 className="display-title max-w-xl text-4xl leading-[1.1] text-foreground sm:text-5xl lg:text-[3.6rem]">
<<<<<<< HEAD
            Everything11111 you need to grow your photography business
=======
            Everything you need to grow your photography business
>>>>>>> origin/main
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/70 sm:text-base">
            Client galleries, websites, bookings, store, and more — all in one beautiful platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild className="h-10 px-5">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Dialog>
              <DialogTrigger className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/70">
                <PlayCircle className="h-5 w-5" /> Watch Video
              </DialogTrigger>
              <DialogContent className="max-w-3xl overflow-hidden p-0">
                <div className="relative aspect-video">
                  <img
                    src={img(PHOTOS.lakeBanner, 1280, 720)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center text-white">
                    <PlayCircle className="h-14 w-14" strokeWidth={1.25} />
                    <DialogTitle className="display-title mt-3 text-2xl">
                      A two-minute tour of Pixora
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-white/80">
                      Demo mode — the tour video isn't included, but every screen is live to
                      explore.
                    </DialogDescription>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-card/95 p-2.5 shadow-lift backdrop-blur sm:grid-cols-6 sm:gap-3 sm:p-3 lg:max-w-4xl">
            {strip.map((id, i) => (
              <Link
                key={i}
                to="/g/$id"
                params={{ id: "sarah-james-wedding" }}
                className="overflow-hidden rounded"
              >
                <img
                  src={img(id, 320, 240)}
                  alt="Gallery preview"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
