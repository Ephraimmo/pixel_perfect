import { createFileRoute } from "@tanstack/react-router";
<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Eye,
  FlipHorizontal,
  Maximize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { DemoNotice, pageHead } from "@/components/kit";
import {
  AdjustmentPanel,
  EDITOR_BG,
  EditorCanvas,
  EditorToolbar,
  ThumbnailStrip,
  type EditorTool,
} from "@/components/photo-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FRESH_EDIT,
  NEUTRAL,
  SAMPLE_SOURCE_ID,
  ZOOM_STEPS,
  editorSources,
  formatZoom,
  sameAdjustments,
  stepZoom,
  type Adjustments,
  type EditorPhoto,
  type PhotoEdit,
  type Zoom,
} from "@/lib/photo-editor";
import { useDemo } from "@/lib/store";
=======
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
>>>>>>> origin/main

export const Route = createFileRoute("/_app/editor")({
  head: () =>
    pageHead("Photo Editor", "Quick exposure, color and crop adjustments before delivery."),
  component: PhotoEditor,
});

<<<<<<< HEAD
const DEVICE_SOURCE_ID = "device";

function PhotoEditor() {
  const { state: demo } = useDemo();
  const [devicePhotos, setDevicePhotos] = useState<EditorPhoto[]>([]);
  const sources = useMemo(() => {
    const list = editorSources(demo.galleries);
    return devicePhotos.length
      ? [...list, { id: DEVICE_SOURCE_ID, label: "This device", photos: devicePhotos }]
      : list;
  }, [demo.galleries, devicePhotos]);

  const [sourceId, setSourceId] = useState(SAMPLE_SOURCE_ID);
  const source = sources.find((s) => s.id === sourceId) ?? sources[0]!;
  const [activeKey, setActiveKey] = useState(source.photos[0]?.key ?? "");
  const photo = source.photos.find((p) => p.key === activeKey) ?? source.photos[0];

  const [edits, setEdits] = useState<Record<string, PhotoEdit>>({});
  const edit = (photo && edits[photo.key]) || FRESH_EDIT;
  const adj = edit.current;
  const dirty = !sameAdjustments(edit.current, edit.applied);

  const [zoom, setZoom] = useState<Zoom>("fit");
  const [fit, setFit] = useState(1);
  const [comparing, setComparing] = useState(false);
  const scale = zoom === "fit" ? fit : zoom;

  const updateEdit = (fn: (e: PhotoEdit) => PhotoEdit) => {
    if (!photo) return;
    setEdits((all) => ({ ...all, [photo.key]: fn(all[photo.key] ?? FRESH_EDIT) }));
  };
  const set = (patch: Partial<Adjustments>) =>
    updateEdit((e) => ({ ...e, current: { ...e.current, ...patch } }));

  const selectPhoto = (key: string) => {
    setActiveKey(key);
    setZoom("fit");
    setComparing(false);
  };

  const selectSource = (id: string) => {
    const next = sources.find((s) => s.id === id);
    setSourceId(id);
    if (next?.photos[0]) selectPhoto(next.photos[0].key);
  };

  // Files opened from the device stay in this tab as object URLs; release them on leave.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length < files.length) toast.error("Only image files can be opened.");
    if (!images.length) return;
    const added = images.map((f) => {
      const url = URL.createObjectURL(f);
      objectUrls.current.push(url);
      return {
        key: `local-${url.slice(-12)}`,
        label: f.name,
        src: url,
        thumb: url,
        local: true,
      } satisfies EditorPhoto;
    });
    setDevicePhotos((list) => [...list, ...added]);
    setSourceId(DEVICE_SOURCE_ID);
    selectPhoto(added[0]!.key);
  };

  const onFitScale = useCallback((s: number) => setFit(s), []);

  const tools: EditorTool[] = [
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
    {
      label: "Reset",
      icon: RotateCcw,
      run: () => set(NEUTRAL),
      disabled: sameAdjustments(adj, NEUTRAL),
    },
  ];

  const viewBtn =
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40";
  const holdCompare = {
    onPointerDown: () => setComparing(true),
    onPointerUp: () => setComparing(false),
    onPointerLeave: () => setComparing(false),
    onPointerCancel: () => setComparing(false),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setComparing(true);
      }
    },
    onKeyUp: () => setComparing(false),
    onBlur: () => setComparing(false),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <DemoNotice>
        Photos are drawn into a real canvas in your browser. Files you open from this device stay on
        it — nothing is uploaded. The sliders, crop, rotate and flip are a CSS preview: they change
        how the photo looks on screen, not its pixels. Edits are kept per photo until you leave this
        page.
      </DemoNotice>

      <div
        className="flex flex-col overflow-hidden rounded-xl text-[oklch(0.92_0.005_84)] shadow-lift lg:grid lg:h-[calc(100svh-12rem)] lg:min-h-[36rem] lg:grid-cols-[5rem_minmax(0,1fr)_17rem] lg:grid-rows-[auto_minmax(0,1fr)_auto]"
        style={{ backgroundColor: EDITOR_BG }}
      >
        {/* Header: photo + source on the left, view controls on the right. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 px-4 py-2.5 lg:col-span-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-medium">Photo Editor</h1>
            <p className="truncate text-[11px] text-white/50">
              {photo ? photo.label : "No photo"} · {source.label}
            </p>
          </div>
          <Select value={source.id} onValueChange={selectSource}>
            <SelectTrigger
              aria-label="Photo source"
              className="h-8 w-44 border-white/15 bg-white/5 text-xs text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark">
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.label} ({s.photos.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5" role="group" aria-label="View">
            <button
              type="button"
              className={viewBtn}
              aria-label="Zoom out"
              disabled={scale <= ZOOM_STEPS[0] + 1e-6}
              onClick={() => setZoom(stepZoom(scale, -1))}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span
              className="w-11 text-center text-[11px] tabular-nums text-white/70"
              aria-live="polite"
            >
              {formatZoom(scale)}
            </span>
            <button
              type="button"
              className={viewBtn}
              aria-label="Zoom in"
              disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]! - 1e-6}
              onClick={() => setZoom(stepZoom(scale, 1))}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={viewBtn}
              aria-pressed={zoom === "fit"}
              onClick={() => setZoom("fit")}
            >
              <Maximize className="h-3.5 w-3.5" /> Fit
            </button>
            <button
              type="button"
              className={`${viewBtn} ${comparing ? "bg-white/10 text-white" : ""} touch-none select-none`}
              aria-pressed={comparing}
              title="Hold to see the original"
              {...holdCompare}
            >
              <Eye className="h-3.5 w-3.5" /> Compare
            </button>
          </div>
        </div>

        <div className="order-3 border-y border-white/10 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:border-y-0 lg:border-r">
          <EditorToolbar tools={tools} />
        </div>

        <div className="relative order-1 h-[46svh] min-h-60 lg:order-none lg:col-start-2 lg:row-start-2 lg:h-auto lg:min-h-0">
          {photo ? (
            <EditorCanvas
              key={photo.key}
              photo={photo}
              adjustments={adj}
              zoom={zoom}
              comparing={comparing}
              onFitScale={onFitScale}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/60">
              This source has no photos yet.
            </div>
          )}
        </div>

        <div className="order-2 border-t border-white/10 lg:order-none lg:col-start-2 lg:row-start-3">
          <ThumbnailStrip
            photos={source.photos}
            activeKey={photo?.key ?? ""}
            edits={edits}
            onSelect={selectPhoto}
            onAddFiles={addFiles}
          />
        </div>

        <div className="order-4 lg:order-none lg:col-start-3 lg:row-span-2 lg:row-start-2 lg:overflow-y-auto lg:border-l lg:border-white/10">
          <AdjustmentPanel
            adjustments={adj}
            dirty={dirty}
            disabled={!photo}
            onChange={set}
            onCancel={() => updateEdit((e) => ({ ...e, current: e.applied }))}
            onApply={() => {
              updateEdit((e) => ({ ...e, applied: e.current }));
              toast.success("Edits applied");
            }}
          />
=======
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
>>>>>>> origin/main
        </div>
      </div>
    </div>
  );
}
