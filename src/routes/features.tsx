import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  ClipboardList,
  Globe,
  Images,
  Lock,
  MessageSquare,
  PenTool,
  Plug,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { photoWide } from "@/lib/demo-data";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Pixora" },
      { name: "description", content: "Galleries, proofing, studio CRM, store, website builder and an editor — everything Pixora does, explained." },
      { property: "og:title", content: "Features — Pixora" },
      { property: "og:description", content: "Galleries, proofing, studio CRM, store, website builder and an editor — everything Pixora does." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: photoWide("pixora-features", 1600, 1000) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: photoWide("pixora-features", 1600, 1000) },
    ],
  }),
  component: Features,
});

const sections = [
  {
    eyebrow: "Deliver",
    title: "Client galleries that feel like a gift",
    items: [
      { icon: Images, title: "Fast, beautiful galleries", body: "Masonry browsing, collections, captions and cover photos — clients see a polished delivery, not a folder of files." },
      { icon: Lock, title: "Privacy built in", body: "Passwords, expiry dates, watermarks and download PINs. Draft galleries stay invisible until you publish." },
      { icon: MessageSquare, title: "Favorites & comments", body: "Clients favorite images, leave notes on single photos, and select print picks — you see it all in your workspace." },
      { icon: ShieldCheck, title: "Proofing & selections", body: "Turn client selections into a print order in two clicks, with the gallery kept as the source of truth." },
    ],
  },
  {
    eyebrow: "Run the studio",
    title: "The CRM photographers actually keep using",
    items: [
      { icon: Sparkles, title: "Lead pipeline", body: "Inquiries land in a simple pipeline — new, contacted, quoted, won, lost — straight from your booking page." },
      { icon: Receipt, title: "Quotes, contracts & invoices", body: "Send quotes, get e-signatures on agreements, and invoice with deposit and balance lines. Statuses stay honest." },
      { icon: CalendarRange, title: "Sessions & calendar", body: "Every shoot on one calendar with locations, durations and prep notes attached." },
      { icon: ClipboardList, title: "Questionnaires", body: "Collect shot lists and family sensitivities before the day, and keep answers on the client profile." },
    ],
  },
  {
    eyebrow: "Sell & publish",
    title: "A store and a website, under the same roof",
    items: [
      { icon: ShoppingBag, title: "Digital, print & packages", body: "Sell high-res collections, fine-art prints, linen albums and bundles — with coupons and order tracking." },
      { icon: Globe, title: "Website builder", body: "Pages, templates, brand colors and a custom domain. Publish when it feels right." },
      { icon: PenTool, title: "Built-in editor", body: "Quick exposure and color passes before delivery — no round-trip to another app for small fixes." },
      { icon: Smartphone, title: "Mobile apps", body: "Your clients' photos, your calendar and your inquiries in their pocket." },
      { icon: Plug, title: "Integrations", body: "Connect the tools around your studio — email, editing, storage and more." },
      { icon: Users, title: "Team access", body: "Invite editors and assistants with the right level of access." },
    ],
  },
];

function Features() {
  return (
    <div className="min-h-svh">
      <MarketingNav />

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 text-center sm:px-6">
        <p className="eyebrow">Everything inside</p>
        <h1 className="display-title mx-auto mt-3 max-w-3xl text-4xl text-foreground sm:text-5xl">
          One workspace, every job your studio runs on.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          From the first inquiry to the delivered album and the print order that follows — Pixora keeps the whole
          workflow in one calm place.
        </p>
      </section>

      {sections.map((section, si) => (
        <section key={section.title} className={si % 2 === 1 ? "border-y bg-card" : undefined}>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="eyebrow">{section.eyebrow}</p>
            <h2 className="display-title mt-2 max-w-2xl text-3xl">{section.title}</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <div key={item.title} className="border-t-2 border-clay/30 pt-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
        <h2 className="display-title text-3xl">See it with real data</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The demo workspace is fully populated — six galleries, a live pipeline, orders and invoices you can click through.
        </p>
        <Button asChild size="lg" className="h-11 px-6">
          <Link to="/signup">Open the demo <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </section>

      <MarketingFooter />
    </div>
  );
}
