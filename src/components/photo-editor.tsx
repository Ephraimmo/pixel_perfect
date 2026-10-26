// Photo editor workspace pieces — canvas, thumbnail strip, toolbar and
// adjustment panel. The route in routes/_app/editor.tsx owns the state.

import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  fitScale,
  isNeutral,
  previewFilter,
  previewTransform,
  workingSize,
  type Adjustments,
  type EditorPhoto,
  type PhotoEdit,
  type Zoom,
} from "@/lib/photo-editor";
import { cn } from "@/lib/utils";

export const EDITOR_BG = "oklch(0.2 0.006 70)";

// ---------- image loading ----------

export type ImageStatus = "loading" | "ready" | "error";

/** Load `src` as a CORS-clean image so the canvas can read its pixels later. */
export function useLoadedImage(src: string) {
  const [state, setState] = useState<{ status: ImageStatus; image: HTMLImageElement | null }>({
    status: "loading",
    image: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", image: null });
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => !cancelled && setState({ status: "ready", image });
    image.onerror = () => !cancelled && setState({ status: "error", image: null });
    image.src = src;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [src, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

// ---------- canvas ----------

export function EditorCanvas({
  photo,
  adjustments,
  zoom,
  comparing,
  onFitScale,
}: {
  photo: EditorPhoto;
  adjustments: Adjustments;
  zoom: Zoom;
  comparing: boolean;
  /** Reports the scale "fit" resolves to, so the toolbar can show and step from it. */
  onFitScale: (scale: number) => void;
}) {
  const { status, image, retry } = useLoadedImage(photo.src);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Draw the source pixels into the canvas at working resolution.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (status !== "ready" || !image || !canvas) return;
    const next = workingSize(image.naturalWidth, image.naturalHeight);
    canvas.width = next.width;
    canvas.height = next.height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, next.width, next.height);
    setSize(next);
  }, [status, image]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setBox({ width: el.clientWidth - 32, height: el.clientHeight - 32 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The CSS rotation preview doesn't change the layout box, so fit against the turned size.
  const quarterTurn = adjustments.rotation % 180 !== 0 && !comparing;
  const fit = fitScale(
    quarterTurn ? size.height : size.width,
    quarterTurn ? size.width : size.height,
    box.width,
    box.height,
  );
  useEffect(() => onFitScale(fit), [fit, onFitScale]);

  const scale = zoom === "fit" ? fit : zoom;
  const ready = status === "ready" && size.width > 0;

  return (
    <div
      ref={viewportRef}
      className={cn(
        // Out of flow so a zoomed-in canvas can't widen the page; the parent sets the size.
        "absolute inset-0 flex p-4",
        zoom === "fit" ? "overflow-hidden" : "overflow-auto",
      )}
      style={{
        backgroundColor: "oklch(0.16 0.005 70)",
        backgroundImage:
          "linear-gradient(45deg, oklch(1 0 0 / 0.03) 25%, transparent 25%, transparent 75%, oklch(1 0 0 / 0.03) 75%), linear-gradient(45deg, oklch(1 0 0 / 0.03) 25%, transparent 25%, transparent 75%, oklch(1 0 0 / 0.03) 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <div
        className={cn(
          "relative m-auto shrink-0 shadow-lift transition-transform duration-200",
          !ready && "invisible",
        )}
        style={{
          width: size.width * scale || undefined,
          height: size.height * scale || undefined,
          transform: comparing ? undefined : previewTransform(adjustments),
          // Square crop preview: clip to the centred square (CSS only, pixels untouched).
          clipPath:
            adjustments.cropped && !comparing
              ? size.width > size.height
                ? `inset(0 ${((size.width - size.height) / 2 / size.width) * 100}%)`
                : `inset(${((size.height - size.width) / 2 / size.height) * 100}% 0)`
              : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${photo.label}${comparing ? " (original)" : ""}`}
          className="block h-full w-full transition-[filter] duration-200"
          style={{ filter: comparing ? undefined : previewFilter(adjustments) }}
        />
        {comparing ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{
              backgroundColor: adjustments.temperature > 0 ? "#ff9a3c" : "#3c8dff",
              opacity: Math.abs(adjustments.temperature) / 160,
            }}
          />
        )}
      </div>

      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading photo…
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-xs text-white/70">
          <TriangleAlert className="h-5 w-5" />
          <p>
            {photo.local
              ? "This browser can't open that file. Try a JPEG, PNG or WebP."
              : "The photo couldn't be loaded. Check your connection and try again."}
          </p>
          {photo.local ? null : (
            <button
              type="button"
              onClick={retry}
              className="rounded-md bg-white/10 px-3 py-1.5 text-white hover:bg-white/15"
            >
              Retry
            </button>
          )}
        </div>
      ) : null}
      {comparing && ready ? (
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
          Original
        </span>
      ) : null}
    </div>
  );
}

// ---------- thumbnail strip ----------

export function ThumbnailStrip({
  photos,
  activeKey,
  edits,
  onSelect,
  onAddFiles,
}: {
  photos: EditorPhoto[];
  activeKey: string;
  edits: Record<string, PhotoEdit>;
  onSelect: (key: string) => void;
  onAddFiles: (files: File[]) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const index = photos.findIndex((p) => p.key === activeKey);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-key="${CSS.escape(activeKey)}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeKey]);

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta || photos.length === 0) return;
    e.preventDefault();
    const next = photos[(index + delta + photos.length) % photos.length];
    if (!next) return;
    onSelect(next.key);
    listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(next.key)}"]`)?.focus();
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="hidden shrink-0 text-[11px] tabular-nums text-white/50 sm:block">
        {index + 1} / {photos.length}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Photos"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto p-1"
      >
        {photos.map((p) => {
          const edit = edits[p.key];
          const edited = edit ? !isNeutral(edit.current) || !isNeutral(edit.applied) : false;
          const active = p.key === activeKey;
          return (
            <button
              key={p.key}
              type="button"
              role="option"
              aria-selected={active}
              aria-label={`${p.label}${edited ? " (edited)" : ""}`}
              tabIndex={active ? 0 : -1}
              data-key={p.key}
              onClick={() => onSelect(p.key)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded ring-offset-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                active ? "ring-2 ring-white" : "opacity-60 hover:opacity-100",
              )}
              style={{ "--tw-ring-offset-color": EDITOR_BG } as React.CSSProperties}
            >
              <img
                src={p.thumb}
                alt=""
                loading="lazy"
                className="h-12 w-12 object-cover sm:h-14 sm:w-14"
              />
              {edited ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay ring-1 ring-black/40"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <label className="flex h-12 w-12 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-dashed border-white/25 text-[10px] text-white/70 transition-colors focus-within:ring-2 focus-within:ring-white/70 hover:bg-white/10 hover:text-white sm:h-14 sm:w-14">
        <ImagePlus className="h-4 w-4" />
        Open
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Open photos from this device"
          onChange={(e) => {
            onAddFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

// ---------- toolbar ----------

export interface EditorTool {
  label: string;
  icon: ComponentType<{ className?: string }>;
  run: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function EditorToolbar({ tools }: { tools: EditorTool[] }) {
  return (
    <div
      role="toolbar"
      aria-label="Editing tools"
      className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible"
    >
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={t.run}
          disabled={t.disabled}
          aria-pressed={t.active ?? undefined}
          className={cn(
            "flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40",
            t.active ? "bg-white/10 text-white" : "text-white/70",
          )}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- adjustment panel ----------

export const SLIDERS: {
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

export function AdjustmentPanel({
  adjustments,
  dirty,
  disabled,
  onChange,
  onCancel,
  onApply,
}: {
  adjustments: Adjustments;
  /** Current edits differ from the last applied version. */
  dirty: boolean;
  disabled: boolean;
  onChange: (patch: Partial<Adjustments>) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    // Re-point theme tokens so the shared Slider renders light-on-dark.
    <div
      className="flex h-full flex-col p-4 lg:p-5"
      style={
        {
          "--primary": "oklch(0.95 0 0)",
          "--background": "oklch(0.95 0 0)",
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">Adjust</h2>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
          CSS preview
        </span>
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-1">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between text-xs">
              <span>{s.label}</span>
              <span className="tabular-nums text-white/70">{s.fmt(adjustments[s.key])}</span>
            </div>
            <Slider
              className="mt-3 py-1"
              min={s.min}
              max={s.max}
              step={s.step}
              disabled={disabled}
              value={[adjustments[s.key]]}
              onValueChange={([v]) => v !== undefined && onChange({ [s.key]: v })}
              aria-label={s.label}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-end gap-2 lg:mt-auto lg:pt-6">
        {dirty ? (
          <span className="mr-auto text-[11px] text-white/50">Unapplied changes</span>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          disabled={!dirty}
          className="rounded-md px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!dirty}
          className="rounded-md bg-white px-4 py-1.5 text-xs font-medium hover:bg-white/90 disabled:opacity-40"
          style={{ color: EDITOR_BG }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
