// Photo editor workspace model — photo sources, per-photo edit state and zoom
// helpers. Kept pure so the editor route and its tests share one implementation.

import { PHOTOS, img, type Gallery } from "./demo-data";

export interface EditorPhoto {
  /** Stable key: the Unsplash id, or a generated id for files opened from the device. */
  key: string;
  label: string;
  /** Full-size source drawn into the canvas. */
  src: string;
  thumb: string;
  /** Opened from this device via an object URL — never uploaded anywhere. */
  local?: boolean;
}

export interface EditorSource {
  id: string;
  label: string;
  photos: EditorPhoto[];
}

/** Longest edge, in pixels, the canvas works at. Bigger files are scaled down on load. */
export const WORKING_EDGE = 2400;

const fromUnsplash = (id: string, label: string): EditorPhoto => ({
  key: id,
  label,
  src: img(id, 1600),
  thumb: img(id, 160, 160),
});

const frame = (i: number) => `Frame ${String(i + 1).padStart(2, "0")}`;

export const SAMPLE_SOURCE_ID = "samples";

export function editorSources(galleries: Gallery[]): EditorSource[] {
  const samples = [
    PHOTOS.editorPortrait,
    PHOTOS.wedding[1],
    PHOTOS.wedding[4],
    PHOTOS.family[0],
    PHOTOS.travel[0],
  ];
  return [
    {
      id: SAMPLE_SOURCE_ID,
      label: "Editor samples",
      photos: samples.map((id, i) => fromUnsplash(id, `Sample ${i + 1}`)),
    },
    ...galleries
      .filter((g) => g.photos.length > 0)
      .map((g) => ({
        id: g.id,
        label: g.title,
        photos: g.photos.map((id, i) => fromUnsplash(id, frame(i))),
      })),
  ];
}

// ---------- adjustments ----------

export interface Adjustments {
  exposure: number; // -1..1 stops (approx.)
  contrast: number; // -100..100
  saturation: number; // -100..100
  temperature: number; // -100..100
  rotation: number;
  flipped: boolean;
  cropped: boolean;
}

export const NEUTRAL: Adjustments = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  rotation: 0,
  flipped: false,
  cropped: false,
};

export function isNeutral(a: Adjustments): boolean {
  return (Object.keys(NEUTRAL) as (keyof Adjustments)[]).every((k) => a[k] === NEUTRAL[k]);
}

export function sameAdjustments(a: Adjustments, b: Adjustments): boolean {
  return (Object.keys(NEUTRAL) as (keyof Adjustments)[]).every((k) => a[k] === b[k]);
}

/** Edits for one photo: what's on screen, and what was last applied. */
export interface PhotoEdit {
  current: Adjustments;
  applied: Adjustments;
}

export const FRESH_EDIT: PhotoEdit = { current: NEUTRAL, applied: NEUTRAL };

/** CSS preview of the adjustments — this styles the element, it does not change pixels. */
export function previewFilter(a: Adjustments): string {
  return `brightness(${1 + a.exposure * 0.6}) contrast(${1 + a.contrast / 100}) saturate(${1 + a.saturation / 100})`;
}

export function previewTransform(a: Adjustments): string {
  return `rotate(${a.rotation}deg) scaleX(${a.flipped ? -1 : 1})`;
}

// ---------- zoom ----------

/** "fit" scales the canvas into the viewport; a number is CSS px per image px. */
export type Zoom = "fit" | number;

export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3] as const;

/** Next zoom step in `dir`, starting from the current (or fitted) scale. */
export function stepZoom(current: number, dir: 1 | -1): number {
  const steps: readonly number[] = ZOOM_STEPS;
  const next =
    dir > 0
      ? steps.find((s) => s > current + 1e-6)
      : [...steps].reverse().find((s) => s < current - 1e-6);
  return next ?? (dir > 0 ? steps[steps.length - 1]! : steps[0]!);
}

/** Scale that fits a w×h image inside a box, never enlarging past 100%. */
export function fitScale(w: number, h: number, boxW: number, boxH: number): number {
  if (w <= 0 || h <= 0 || boxW <= 0 || boxH <= 0) return 1;
  return Math.min(1, boxW / w, boxH / h);
}

/** Size to draw a w×h source at so its longest edge stays within `maxEdge`. */
export function workingSize(w: number, h: number, maxEdge = WORKING_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export const formatZoom = (z: number) => `${Math.round(z * 100)}%`;
