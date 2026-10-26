import { createFileRoute } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import {
  Contrast,
  Crop,
  Droplet,
  FlipHorizontal,
  RotateCcw,
  RotateCw,
  Sun,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/components/kit";
import { Slider } from "@/components/ui/slider";
import { PHOTOS, img } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/editor")({
  head: () =>
    pageHead("Photo Editor", "Quick exposure, color and crop adjustments before delivery."),
  component: PhotoEditor,
});

interface Adjustments {
  exposure: number; // -1..1 stops (approx.)
  contrast: number; // -100..100
  saturation: number; // -100..100
  temperature: number; // -100..100
  rotation: number;
  flipped: boolean;
  cropped: boolean;
}

const NEUTRAL: Adjustments = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  rotation: 0,
  flipped: false,
  cropped: false,
};

const SLIDERS: {
  key: "exposure" | "contrast" | "saturation" | "temperature";
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}[] = [
  { key: "exposure", label: "Exposure", min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1, fmt: String },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1, fmt: String },
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1, fmt: String },
];

const library: string[] = [
  PHOTOS.editorPortrait,
  PHOTOS.wedding[1],
  PHOTOS.wedding[4],
  PHOTOS.family[0],
  PHOTOS.travel[0],
];

function PhotoEditor() {
  const [photo, setPhoto] = useState<string>(PHOTOS.editorPortrait);
  const [adj, setAdj] = useState<Adjustments>(NEUTRAL);
  const [saved, setSaved] = useState<Adjustments>(NEUTRAL);
  const [focus, setFocus] = useState<string>("exposure");
  const set = (patch: Partial<Adjustments>) => setAdj((a) => ({ ...a, ...patch }));

  const tools: {
    label: string;
    icon: ComponentType<{ className?: string }>;
    run: () => void;
    active?: boolean;
  }[] = [
    { label: "Crop", icon: Crop, run: () => set({ cropped: !adj.cropped }), active: adj.cropped },
    {
      label: "Rotate",
      icon: RotateCw,
      run: () => set({ rotation: (adj.rotation + 90) % 360 }),
      active: adj.rotation !== 0,
    },
    {
      label: "Flip",
      icon: FlipHorizontal,
      run: () => set({ flipped: !adj.flipped }),
      active: adj.flipped,
    },
    { label: "Exposure", icon: Sun, run: () => setFocus("exposure"), active: focus === "exposure" },
    {
      label: "Contrast",
      icon: Contrast,
      run: () => setFocus("contrast"),
      active: focus === "contrast",
    },
    {
      label: "Saturation",
      icon: Droplet,
      run: () => setFocus("saturation"),
      active: focus === "saturation",
    },
    {
      label: "Temperature",
      icon: Thermometer,
      run: () => setFocus("temperature"),
      active: focus === "temperature",
    },
    { label: "Reset", icon: RotateCcw, run: () => setAdj(NEUTRAL) },
  ];

  const filter = `brightness(${1 + adj.exposure * 0.6}) contrast(${1 + adj.contrast / 100}) saturate(${1 + adj.saturation / 100})`;
  const transform = `rotate(${adj.rotation}deg) scaleX(${adj.flipped ? -1 : 1})`;
  const warm = adj.temperature > 0;

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-xl bg-[oklch(0.2_0.006_70)] text-[oklch(0.92_0.005_84)] shadow-lift">
      <div className="border-b border-white/10 px-5 py-3 text-sm font-medium">Photo Editor</div>

      <div className="grid md:grid-cols-[10rem_1fr_15rem]">
        <ul className="flex gap-1 overflow-x-auto border-b border-white/10 p-3 md:flex-col md:border-b-0 md:border-r">
          {tools.map((t) => (
            <li key={t.label}>
              <button
                type="button"
                onClick={t.run}
                className={cn(
                  "flex w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-white/10",
                  t.active ? "bg-white/10 text-white" : "text-white/70",
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center justify-center gap-4 p-6">
          <div
            className={cn(
              "relative overflow-hidden rounded-md",
              adj.cropped ? "aspect-square w-full max-w-sm" : "w-full max-w-md",
            )}
          >
            <img
              src={img(photo, 900)}
              alt="Photo being edited"
              style={{ filter, transform }}
              className={cn(
                "w-full transition-[filter,transform] duration-200",
                adj.cropped && "h-full object-cover",
              )}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{
                backgroundColor: warm ? "#ff9a3c" : "#3c8dff",
                opacity: Math.abs(adj.temperature) / 160,
              }}
            />
          </div>
          <div className="flex gap-2">
            {library.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPhoto(p);
                  setAdj(NEUTRAL);
                  setSaved(NEUTRAL);
                }}
                className={cn(
                  "overflow-hidden rounded ring-offset-2 ring-offset-[oklch(0.2_0.006_70)]",
                  p === photo ? "ring-2 ring-white" : "opacity-60 hover:opacity-100",
                )}
              >
                <img src={img(p, 96, 96)} alt="" className="h-10 w-10 object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Re-point theme tokens so the shared Slider renders light-on-dark. */}
        <div
          className="flex flex-col border-t border-white/10 p-5 md:border-l md:border-t-0"
          style={
            {
              "--primary": "oklch(0.95 0 0)",
              "--background": "oklch(0.95 0 0)",
            } as React.CSSProperties
          }
        >
          <div className="space-y-6">
            {SLIDERS.map((s) => (
              <div
                key={s.key}
                className={cn("rounded-md p-1 transition-colors", focus === s.key && "bg-white/5")}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-white/70">{s.fmt(adj[s.key])}</span>
                </div>
                <Slider
                  className="mt-3"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={[adj[s.key]]}
                  onValueChange={([v]) => set({ [s.key]: v })}
                  onFocus={() => setFocus(s.key)}
                  aria-label={s.label}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-2 md:mt-auto md:pt-8">
            <button
              type="button"
              onClick={() => setAdj(saved)}
              className="rounded-md px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(adj);
                toast.success("Edits applied");
              }}
              className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-[oklch(0.2_0.006_70)] hover:bg-white/90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
