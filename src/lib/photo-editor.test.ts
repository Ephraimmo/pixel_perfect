import { describe, expect, it } from "vitest";

import { seedState } from "@/lib/demo-data";
import {
  NEUTRAL,
  SAMPLE_SOURCE_ID,
  editorSources,
  fitScale,
  isNeutral,
  sameAdjustments,
  stepZoom,
  workingSize,
} from "@/lib/photo-editor";

describe("editorSources", () => {
  const sources = editorSources(seedState().galleries);

  it("starts with the editor samples, then every gallery that has photos", () => {
    expect(sources[0]?.id).toBe(SAMPLE_SOURCE_ID);
    expect(sources[0]?.photos).toHaveLength(5);
    expect(sources.slice(1).every((s) => s.photos.length > 0)).toBe(true);
  });

  it("skips empty galleries", () => {
    const [first] = seedState().galleries;
    const withEmpty = editorSources([{ ...first!, id: "empty", photos: [] }]);
    expect(withEmpty.map((s) => s.id)).toEqual([SAMPLE_SOURCE_ID]);
  });

  it("gives photos unique keys within a source", () => {
    for (const s of sources) {
      expect(new Set(s.photos.map((p) => p.key)).size).toBe(s.photos.length);
    }
  });
});

describe("adjustment helpers", () => {
  it("detects neutral and equal adjustments", () => {
    expect(isNeutral(NEUTRAL)).toBe(true);
    expect(isNeutral({ ...NEUTRAL, flipped: true })).toBe(false);
    expect(sameAdjustments({ ...NEUTRAL, contrast: 10 }, { ...NEUTRAL, contrast: 10 })).toBe(true);
    expect(sameAdjustments({ ...NEUTRAL, contrast: 10 }, NEUTRAL)).toBe(false);
  });
});

describe("zoom", () => {
  it("steps through zoom levels and clamps at the ends", () => {
    expect(stepZoom(1, 1)).toBe(1.5);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(3, 1)).toBe(3);
    expect(stepZoom(0.25, -1)).toBe(0.25);
  });

  it("steps from an in-between fitted scale to the neighbouring level", () => {
    expect(stepZoom(0.43, 1)).toBe(0.5);
    expect(stepZoom(0.43, -1)).toBe(0.25);
  });

  it("fits inside the box without enlarging", () => {
    expect(fitScale(2000, 1000, 1000, 1000)).toBe(0.5);
    expect(fitScale(1000, 2000, 1000, 500)).toBe(0.25);
    expect(fitScale(400, 300, 1000, 1000)).toBe(1);
    expect(fitScale(0, 0, 1000, 1000)).toBe(1);
  });

  it("caps the working size at the longest edge", () => {
    expect(workingSize(6000, 4000)).toEqual({ width: 2400, height: 1600 });
    expect(workingSize(1200, 1600)).toEqual({ width: 1200, height: 1600 });
  });
});
