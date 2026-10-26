import { useEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Panel } from "@/components/kit";
import { ScaledFrame, SiteRenderer } from "@/components/website-renderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebsite } from "@/lib/website-store";
import { cn } from "@/lib/utils";

export type Device = "desktop" | "tablet" | "mobile";

/** Viewport sizes (portrait) used for preview frames. */
export const DEVICES: Record<
  Device,
  { label: string; width: number; height: number; icon: typeof Monitor }
> = {
  desktop: { label: "Desktop", width: 1280, height: 800, icon: Monitor },
  tablet: { label: "Tablet", width: 820, height: 1180, icon: Tablet },
  mobile: { label: "Mobile", width: 390, height: 844, icon: Smartphone },
};

export function deviceSize(device: Device, landscape: boolean) {
  const { width, height } = DEVICES[device];
  // Desktop is always landscape; rotating swaps tablet and phone dimensions.
  return device !== "desktop" && landscape ? { width: height, height: width } : { width, height };
}

/** Segmented device picker. */
export function DeviceToggle({
  value,
  onChange,
  showLabels,
}: {
  value: Device;
  onChange: (device: Device) => void;
  showLabels?: boolean;
}) {
  return (
    <div
      className="inline-flex rounded-md border bg-card p-0.5"
      role="group"
      aria-label="Preview size"
    >
      {(Object.keys(DEVICES) as Device[]).map((d) => {
        const { label, icon: Icon } = DEVICES[d];
        return (
          <button
            key={d}
            type="button"
            aria-pressed={value === d}
            aria-label={showLabels ? undefined : `${label} preview`}
            title={label}
            onClick={() => onChange(d)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs",
              showLabels && "px-3 py-1.5",
              value === d ? "bg-accent font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabels ? <span className="hidden sm:inline">{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A device-shaped viewport: renders children at the device's real width and
 * height (so container breakpoints match the device), scrolls inside the
 * screen, and scales down to fit the available width when zoom is "fit".
 */
export function DeviceFrame({
  device,
  landscape = false,
  zoom = "fit",
  url,
  children,
}: {
  device: Device;
  landscape?: boolean;
  zoom?: "fit" | "actual";
  url?: string;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const { width, height } = deviceSize(device, landscape);
  const bezel = device === "desktop" ? 0 : device === "tablet" ? 14 : 10;

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setAvailable(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = zoom === "fit" && available > 0 ? Math.min(1, (available - bezel * 2) / width) : 1;

  return (
    <div ref={outer} className="w-0 min-w-full overflow-x-auto pb-1">
      <div
        data-device={device}
        className={cn(
          "mx-auto overflow-hidden bg-white shadow-lift",
          device === "desktop" && "rounded-lg border",
          device === "tablet" && "rounded-[28px] bg-neutral-900",
          device === "mobile" && "rounded-[36px] bg-neutral-900",
        )}
        style={{ width: width * scale + bezel * 2, padding: bezel }}
      >
        {device === "desktop" ? (
          <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded bg-card px-2 py-0.5 text-center text-[11px] text-muted-foreground">
              {url}
            </span>
          </div>
        ) : null}
        <div
          className={cn(
            "overflow-hidden bg-white",
            device === "tablet" && "rounded-[16px]",
            device === "mobile" && "rounded-[26px]",
          )}
          style={{ width: width * scale, height: height * scale }}
        >
          <div
            data-preview-scroll
            data-viewport-width={width}
            className="overflow-y-auto overscroll-contain"
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type PanelDevice = "desktop" | "mobile";
const PANEL_WIDTH: Record<PanelDevice, number> = { desktop: 1200, mobile: 390 };

/** Side panel showing the draft site, with page and device pickers. */
export function LivePreview({
  className,
  pageId: controlledId,
  onPageChange,
}: {
  className?: string;
  /** Show this page; the picker and in-site links then call onPageChange. */
  pageId?: string;
  onPageChange?: (pageId: string) => void;
}) {
  const { site } = useWebsite();
  const [ownId, setOwnId] = useState(site.pages[0]?.id ?? "");
  const pageId = controlledId ?? ownId;
  const setPageId = (id: string) => (onPageChange ? onPageChange(id) : setOwnId(id));
  const [device, setDevice] = useState<PanelDevice>("desktop");
  const page = site.pages.find((p) => p.id === pageId) ?? site.pages[0];

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <Select value={page?.id ?? ""} onValueChange={setPageId}>
          <SelectTrigger aria-label="Preview page" className="h-8 w-40 text-xs">
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
        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Preview size">
          {(["desktop", "mobile"] as const).map((value) => {
            const { label, icon: Icon } = DEVICES[value];
            return (
              <button
                key={value}
                type="button"
                aria-pressed={device === value}
                aria-label={`${label} preview`}
                onClick={() => setDevice(value)}
                className={cn(
                  "rounded px-2 py-1",
                  device === value ? "bg-accent text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>
      <div data-preview-scroll className="max-h-[78svh] overflow-y-auto bg-muted/40 p-3">
        {page ? (
          <div className={cn("mx-auto", device === "mobile" && "max-w-[390px]")}>
            <ScaledFrame
              width={PANEL_WIDTH[device]}
              className="rounded border bg-white shadow-soft"
            >
              <SiteRenderer site={site} page={page} onNavigate={setPageId} />
            </ScaledFrame>
          </div>
        ) : (
          <p className="py-10 text-center text-xs text-muted-foreground">No pages yet.</p>
        )}
      </div>
    </Panel>
  );
}
