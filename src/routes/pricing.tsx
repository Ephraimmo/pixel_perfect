import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/kit";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Pixora" },
      { name: "description", content: "Simple plans for photographers — Starter, Studio and Business. Demo billing, no card required." },
      { property: "og:title", content: "Pricing — Pixora" },
      { property: "og:description", content: "Simple plans for photographers — Starter, Studio and Business." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    blurb: "For finding your feet — one gallery at a time.",
    features: ["1 active client gallery", "Up to 200 photos", "Favorites & comments", "Basic booking form"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Studio",
    price: "$24",
    cadence: "per month",
    blurb: "The full workflow for a working studio.",
    features: [
      "Unlimited galleries & storage",
      "Full studio CRM — leads to invoices",
      "Store: digital, prints & packages",
      "Website builder with custom domain",
      "Built-in editor & proofing",
    ],
    cta: "Try Studio free",
    highlight: true,
  },
  {
    name: "Business",
    price: "$59",
    cadence: "per month",
    blurb: "For multi-shooter teams and second studios.",
    features: [
      "Everything in Studio",
      "5 team seats with roles",
      "Client portal & proofing workflows",
      "Automations & email sequences",
      "Priority support",
    ],
    cta: "Try Business free",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-svh">
      <MarketingNav />

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 text-center sm:px-6">
        <p className="eyebrow">Pricing</p>
        <h1 className="display-title mx-auto mt-3 max-w-2xl text-4xl text-foreground sm:text-5xl">
          Pay for what your studio actually uses.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every plan includes unlimited clients and the mobile app. Upgrade when the work demands it — not before.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative rounded-lg border-2 border-clay bg-card p-6 shadow-lift"
                  : "rounded-lg border bg-card p-6 shadow-soft"
              }
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-clay px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Most popular
                </span>
              ) : null}
              <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{plan.blurb}</p>
              <p className="display-title mt-5 text-4xl">
                {plan.price}
                <span className="ml-1 font-body text-xs font-normal text-muted-foreground">{plan.cadence}</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlight ? "default" : "outline"} className="mt-7 w-full">
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-2xl mx-auto">
          <DemoNotice>
            This is a demo — no card is needed and no billing ever happens. Signing in opens the Studio plan's full
            workspace so you can try everything.
          </DemoNotice>
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            { q: "Do I need a card for the demo?", a: "No. The demo is free and instant — you get the full Studio workspace with sample data." },
            { q: "Can I change plans later?", a: "Yes — upgrade or downgrade any time. In the real product your galleries and clients move with you." },
            { q: "What counts as a gallery?", a: "A delivered set of photos for one client. Drafts and archived galleries don't count toward your active limit." },
          ].map((f) => (
            <div key={f.q}>
              <h3 className="text-sm font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
