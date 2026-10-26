import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Globe, Images, Lock, PenTool, ShieldCheck, ShoppingBag } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/store";
import { money, photo, photoWide } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixora — The calm home for your photography business" },
      { name: "description", content: "Client galleries, booking, a print store and a website builder, designed for photographers. Try the full demo." },
      { property: "og:title", content: "Pixora — The calm home for your photography business" },
      { property: "og:description", content: "Client galleries, booking, a print store and a website builder, designed for photographers." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: photoWide("pixora-hero", 1600, 1000) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: photoWide("pixora-hero", 1600, 1000) },
    ],
  }),
  component: Home,
});

const pillars = [
  { icon: Images, title: "Client galleries", body: "Beautifully fast delivery, favorites, downloads and comments — with expiry and passwords when you need them." },
  { icon: CalendarRange, title: "Studio & booking", body: "Leads, quotes, contracts, invoices and a calendar that actually reflects your shoots." },
  { icon: ShoppingBag, title: "Store", body: "Sell digital files, prints and packages. Orders, coupons and fulfillment in one place." },
  { icon: Globe, title: "Website builder", body: "A photographer-grade site with your brand, your images and a domain that feels like you." },
];

const steps = [
  { n: "01", title: "Inquire & book", body: "A booking page collects the brief, pipes it into your lead pipeline, and a quote follows in minutes." },
  { n: "02", title: "Shoot & cull", body: "Upload to a draft gallery as you work — clients only ever see what you publish." },
  { n: "03", title: "Deliver & sell", body: "Publish the gallery, let favorites and proofing run, and watch print orders land in the store." },
];

function Home() {
  const { state: demo } = useDemo();
  const featured = demo.galleries.find((g) => g.status === "published") ?? demo.galleries[0];

  return (
    <div className="min-h-svh">
      <MarketingNav />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow">For photographers who mean it</p>
          <h1 className="display-title mt-3 text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            One quiet place to run your photography business.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Pixora brings client galleries, bookings, billing, a print store and your website together — so you can
            spend the day behind the camera, not in ten browser tabs.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-sm">
              <Link to="/signup">Try the full demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm">
              <Link to="/features">
                See what's inside <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> No card, no real emails — everything here is a live demo.
          </p>
        </div>
        <div className="relative">
          <img
            src={photoWide("pixora-hero", 1200, 900)}
            alt="A photographer reviewing images at golden hour"
            className="photo-card aspect-[4/3] w-full object-cover shadow-lift"
          />
          <div className="absolute -bottom-5 left-5 hidden rounded-lg border bg-card px-4 py-3 shadow-lift sm:block">
            <p className="text-xs text-muted-foreground">Gallery delivered in</p>
            <p className="display-title text-lg">under 48 hours</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <p.icon className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">See a real delivery</p>
              <h2 className="display-title mt-2 text-3xl">A gallery your clients will remember</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/g/$shareSlug" params={{ shareSlug: featured.shareSlug }}>
                Open the client view <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featured.photos.slice(0, 4).map((p) => (
              <img key={p.id} src={photo(p.seed, 600, 750)} alt={p.caption} className="photo-card aspect-[4/5] w-full object-cover" loading="lazy" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="eyebrow">How it flows</p>
          <h2 className="display-title mt-2 text-3xl">From inquiry to delivered gallery</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="border-l-2 border-clay/40 pl-5">
                <p className="font-display text-sm text-clay">{s.n}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <img src={photo("pixora-editor-1", 600, 750)} alt="Culling photos" className="photo-card aspect-[4/5] w-full object-cover" loading="lazy" />
            <img src={photo("pixora-editor-2", 600, 450)} alt="Editing a session" className="photo-card mt-8 aspect-[4/3] w-full object-cover" loading="lazy" />
          </div>
          <div>
            <p className="eyebrow">Built for the whole workflow</p>
            <h2 className="display-title mt-2 text-3xl">Details photographers actually ask for</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                { icon: PenTool, text: "A built-in editor for quick exposure and color passes before delivery." },
                { icon: ShieldCheck, text: "Password-protected galleries with expiry dates and download PINs." },
                { icon: ShoppingBag, text: `Proofing that turns selections into an order — like this ${money(48)} print set.` },
              ].map((f, i) => (
                <li key={i} className="flex gap-3">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
                  <span className="leading-relaxed text-foreground/90">{f.text}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7">
              <Link to="/templates">Browse gallery templates <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <h2 className="display-title text-3xl sm:text-4xl">Run your next shoot on Pixora</h2>
          <p className="max-w-xl text-sm text-primary-foreground/80">
            The full workspace is open in demo mode — every button works, nothing is real. That's the honest way to try software.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-11 px-6">
            <Link to="/signup">Start free</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
