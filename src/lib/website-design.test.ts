import { describe, expect, it } from "vitest";

import {
  PALETTES,
  buildTheme,
  contrastRatio,
  fontsHref,
  isHex,
  readableOn,
  resolveDesign,
  templateDesign,
} from "@/lib/website-design";
import { SITE_TEMPLATES, templateById } from "@/lib/website-templates";

describe("resolveDesign", () => {
  it("uses the template's defaults when nothing is customized", () => {
    expect(resolveDesign("classic", {})).toEqual(templateDesign(templateById("classic")));
    expect(resolveDesign("classic", {}).headingStyle).toBe("italic");
    expect(resolveDesign("minimal", {}).headingStyle).toBe("caps");
  });

  it("keeps overrides when the template changes", () => {
    const overrides = {
      spacing: "spacious" as const,
      colors: { background: "#000000", text: "#ffffff", accent: "#ff0000" },
    };
    for (const t of ["modern", "atelier"]) {
      const d = resolveDesign(t, overrides);
      expect(d.spacing).toBe("spacious");
      expect(d.colors.background).toBe("#000000");
    }
    // Settings that weren't overridden follow the template.
    expect(resolveDesign("atelier", overrides).hero).toBe("split");
    expect(resolveDesign("modern", overrides).hero).toBe("overlay-dark");
  });

  it("gives every template a valid default palette", () => {
    for (const t of SITE_TEMPLATES) {
      const { colors } = templateDesign(t);
      expect([colors.background, colors.text, colors.accent].every(isHex)).toBe(true);
    }
  });
});

describe("contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("nope", "#ffffff")).toBe(1);
  });

  it("picks readable button text", () => {
    expect(readableOn("#111111")).toBe("#ffffff");
    expect(readableOn("#f5f5f5")).toBe("#111111");
  });

  it("ships palettes whose body text passes AA", () => {
    for (const p of PALETTES) {
      expect(contrastRatio(p.colors.text, p.colors.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("theme", () => {
  it("maps settings to CSS variables and classes", () => {
    const design = {
      ...resolveDesign("modern", {}),
      corners: "round" as const,
      spacing: "compact" as const,
    };
    const theme = buildTheme(design);
    expect(theme.style).toMatchObject({
      "--site-radius": "18px",
      "--site-bg": design.colors.background,
    });
    expect(theme.pad).toContain("py-8");
  });

  it("only requests fonts the app doesn't already load", () => {
    expect(fontsHref(resolveDesign("modern", {}))).toBeNull();
    const href = fontsHref({
      ...resolveDesign("modern", {}),
      headingFont: "playfair",
      bodyFont: "lora",
    });
    expect(href).toContain("family=Playfair+Display");
    expect(href).toContain("family=Lora");
  });
});
