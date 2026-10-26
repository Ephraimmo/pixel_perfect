import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Maximize2, RotateCcw, ScanSearch } from "lucide-react";
import { Button, pageHead } from "@/components/kit";
import { Segmented, SiteStatusBadge, WebsiteTabs } from "@/components/website";
import {
  DEVICES,
  DeviceFrame,
  DeviceToggle,
  deviceSize,
  type Device,
} from "@/components/website-preview";
import { ComingSoon, SiteRenderer } from "@/components/website-renderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebsite } from "@/lib/website-store";
import { liveSite, siteStatus, siteUrl } from "@/lib/website";
import { pagePath } from "@/lib/website-pages";

interface PreviewSearch {
  page?: string;
  device?: Device;
  landscape?: boolean;
  version?: "live";
}

export const Route = createFileRoute("/_app/website/preview")({
  head: () => pageHead("Website Preview", "Preview your website on desktop, tablet and mobile."),
  validateSearch: (raw: Record<string, unknown>): PreviewSearch => {
    const out: PreviewSearch = {};
    if (typeof raw["page"] === "string" && raw["page"]) out.page = raw["page"];
    if (raw["device"] === "tablet" || raw["device"] === "mobile") out.device = raw["device"];
    if (raw["landscape"] === true || raw["landscape"] === "true") out.landscape = true;
    if (raw["version"] === "live") out.version = "live";
    return out;
  },
  component: WebsitePreview,
});

function WebsitePreview() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { site: draft } = useWebsite();
  const showLive = search.version === "live";
  const site = showLive ? liveSite(draft) : draft;
  const [zoom, setZoom] = useState<"fit" | "actual">("fit");
  const device = search.device ?? "desktop";
  const landscape = device !== "desktop" && !!search.landscape;
  const page = site.pages.find((p) => p.id === search.page) ?? site.pages[0];
  const { width, height } = deviceSize(device, landscape);

  // undefined in the patch clears that parameter.
  const setSearch = (patch: { [K in keyof PreviewSearch]?: PreviewSearch[K] | undefined }) =>
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch } as PreviewSearch;
        if (next.device === "desktop") delete next.device;
        if (!next.landscape || (next.device ?? "desktop") === "desktop") delete next.landscape;
        if (next.version !== "live") delete next.version;
        return next;
      },
      replace: true,
    });

  // Keyboard shortcuts: 1/2/3 switch device, R rotates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (e.metaKey || e.ctrlKey || e.altKey || target?.closest("input, textarea, [role=combobox]"))
        return;
      const map: Record<string, Device> = { "1": "desktop", "2": "tablet", "3": "mobile" };
      const next = map[e.key];
      if (next) setSearch({ device: next });
      if (e.key.toLowerCase() === "r" && device !== "desktop") setSearch({ landscape: !landscape });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!page) return null;
  const url = `${siteUrl(site)}${pagePath(page) === "/" ? "" : pagePath(page)}`;

  return (
    <div className="mx-auto max-w-7xl">
      <WebsiteTabs />
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="display-title flex items-center gap-2 text-2xl">
            Preview <SiteStatusBadge status={siteStatus(site)} />
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {showLive ? "Showing what visitors see now." : "Showing your draft."} {width} × {height}
            px · Shortcuts: 1 desktop, 2 tablet, 3 mobile
            {device !== "desktop" ? ", R rotate" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Version"
            hideLabel
            value={showLive ? "live" : "draft"}
            onChange={(v) => setSearch({ version: v === "live" ? "live" : undefined })}
            options={[
              ["draft", "Draft"],
              ["live", "Live"],
            ]}
          />
          <Select value={page.id} onValueChange={(id) => setSearch({ page: id })}>
            <SelectTrigger aria-label="Preview page" className="h-8 w-36 bg-card text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {site.pages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DeviceToggle value={device} onChange={(d) => setSearch({ device: d })} showLabels />
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            disabled={device === "desktop"}
            aria-pressed={landscape}
            onClick={() => setSearch({ landscape: !landscape })}
            title="Rotate"
          >
            <RotateCcw /> {landscape ? "Landscape" : "Portrait"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            aria-pressed={zoom === "actual"}
            onClick={() => setZoom((z) => (z === "fit" ? "actual" : "fit"))}
            title={zoom === "fit" ? "Show at 100%" : "Fit to screen"}
          >
            {zoom === "fit" ? <ScanSearch /> : <Maximize2 />}
            {zoom === "fit" ? "Fit" : "100%"}
          </Button>
          <Button asChild size="sm" variant="outline" className="bg-card">
            <Link
              to="/website-preview"
              search={showLive ? { page: page.id, version: "live" } : { page: page.id }}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink /> Open in new tab
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 sm:p-6">
        <DeviceFrame device={device} landscape={landscape} zoom={zoom} url={url}>
          {showLive && !site.online ? (
            <ComingSoon site={site} />
          ) : (
            <SiteRenderer site={site} page={page} onNavigate={(id) => setSearch({ page: id })} />
          )}
        </DeviceFrame>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {DEVICES[device].label} {device !== "desktop" ? (landscape ? "landscape" : "portrait") : ""}{" "}
        · scroll inside the screen to see the whole page
      </p>
    </div>
  );
}
