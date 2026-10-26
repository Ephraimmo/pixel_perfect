import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Menu } from "lucide-react";
import { toast } from "sonner";
import { Panel, pageHead } from "@/components/kit";
import { AppleIcon, GooglePlayIcon } from "@/components/brand-icons";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/lib/store";
import { img } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/mobile-apps")({
  head: () =>
    pageHead("Mobile Galleries", "Beautiful, mobile-friendly galleries for your clients."),
  component: MobileApps,
});

function StoreBadge({ store }: { store: "apple" | "google" }) {
  return (
    <button
      type="button"
      onClick={() =>
        toast.info(
          `The ${store === "apple" ? "App Store" : "Google Play"} listing opens here in the live product (demo).`,
        )
      }
      className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-left text-background transition-opacity hover:opacity-90"
    >
      {store === "apple" ? (
        <AppleIcon className="h-6 w-6" />
      ) : (
        <GooglePlayIcon className="h-6 w-6" />
      )}
      <span className="leading-tight">
        <span className="block text-[9px] opacity-80">
          {store === "apple" ? "Download on the" : "GET IT ON"}
        </span>
        <span className="block text-sm font-semibold">
          {store === "apple" ? "App Store" : "Google Play"}
        </span>
      </span>
    </button>
  );
}

function MobileApps() {
  const { state: demo } = useDemo();
  const [galleryId, setGalleryId] = useState(demo.galleries[0]?.id);
  const [settings, setSettings] = useState({ appIcon: true, push: true, offline: false });
  const g = demo.galleries.find((x) => x.id === galleryId) ?? demo.galleries[0];

  return (
    <div className="mx-auto max-w-5xl">
      <Panel className="overflow-hidden">
        <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-2">
          <div>
            <h1 className="display-title text-4xl leading-tight">
              Your galleries,
              <br />
              anywhere.
            </h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Beautiful, mobile-friendly galleries for your clients.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <StoreBadge store="apple" />
              <StoreBadge store="google" />
            </div>
          </div>

          {g ? (
            <div className="mx-auto w-56 rounded-[2.2rem] border-[7px] border-foreground bg-card p-2 shadow-lift">
              <div className="mx-auto mb-2 h-4 w-20 rounded-full bg-foreground" />
              <div className="flex items-center justify-between px-1 text-[10px]">
                <Menu className="h-3 w-3" />
                <span className="font-display font-medium">{g.shortTitle}</span>
                <Heart className="h-3 w-3" />
              </div>
              <div className="mt-1.5 flex gap-2 px-1 text-[8px] text-muted-foreground">
                <span className="font-medium text-foreground">Ceremony</span>
                <span>Portraits</span>
                <span>Reception</span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {g.photos.slice(0, 6).map((p, i) => (
                  <img
                    key={p}
                    src={img(p, 200, i % 3 === 0 ? 260 : 200)}
                    alt=""
                    className="w-full rounded-sm object-cover"
                  />
                ))}
              </div>
              <div className="mt-2 rounded-md bg-primary py-1.5 text-center text-[9px] font-medium text-primary-foreground">
                View Gallery
              </div>
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-semibold">Preview gallery</h2>
          <p className="text-xs text-muted-foreground">Choose which gallery the phone shows.</p>
          <div className="mt-3 space-y-1">
            {demo.galleries.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setGalleryId(x.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent ${x.id === g?.id ? "bg-accent font-medium" : ""}`}
              >
                <img src={img(x.cover, 80, 80)} alt="" className="h-7 w-7 rounded object-cover" />
                {x.title}
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-semibold">App settings</h2>
          <div className="mt-4 space-y-4 text-sm">
            {(
              [
                ["appIcon", "Branded app icon", "Clients can add galleries to their home screen."],
                ["push", "Push notifications", "Notify clients when new photos are ready."],
                ["offline", "Offline viewing", "Cache favorites for viewing without signal."],
              ] as const
            ).map(([key, label, hint]) => (
              <label key={key} className="flex items-center justify-between gap-4">
                <span>
                  <span className="block">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
                />
              </label>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
