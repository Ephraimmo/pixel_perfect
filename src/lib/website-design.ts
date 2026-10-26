// Website design settings: colors, fonts, spacing and layout. A template
// supplies defaults; the site stores only the settings the photographer
// changed, so switching templates keeps their customizations.

import type { CSSProperties } from "react";
import { templateById, type SiteTemplate, type TemplateLook } from "./website-templates";

export type FontId =
  "fraunces" | "playfair" | "cormorant" | "dm-serif" | "manrope" | "inter" | "montserrat" | "lora";

export const FONTS: Record<FontId, { label: string; stack: string; google: string | null }> = {
  // Fraunces and Manrope are already loaded by the app shell.
  fraunces: { label: "Fraunces", stack: '"Fraunces", Georgia, serif', google: null },
  playfair: {
    label: "Playfair Display",
    stack: '"Playfair Display", Georgia, serif',
    google: "Playfair+Display:ital,wght@0,400;0,600;1,400",
  },
  cormorant: {
    label: "Cormorant Garamond",
    stack: '"Cormorant Garamond", Georgia, serif',
    google: "Cormorant+Garamond:ital,wght@0,500;0,600;1,500",
  },
  "dm-serif": {
    label: "DM Serif Display",
    stack: '"DM Serif Display", Georgia, serif',
    google: "DM+Serif+Display:ital@0;1",
  },
  manrope: { label: "Manrope", stack: '"Manrope", system-ui, sans-serif', google: null },
  inter: {
    label: "Inter",
    stack: '"Inter", system-ui, sans-serif',
    google: "Inter:wght@400;500;600",
  },
  montserrat: {
    label: "Montserrat",
    stack: '"Montserrat", system-ui, sans-serif',
    google: "Montserrat:wght@400;500;600",
  },
  lora: {
    label: "Lora",
    stack: '"Lora", Georgia, serif',
    google: "Lora:ital,wght@0,400;0,500;1,400",
  },
};

export const HEADING_FONTS: FontId[] = [
  "fraunces",
  "playfair",
  "cormorant",
  "dm-serif",
  "manrope",
  "montserrat",
  "inter",
];
export const BODY_FONTS: FontId[] = ["manrope", "inter", "montserrat", "lora"];

export interface SiteColors {
  background: string;
  text: string;
  accent: string;
}

export interface SiteDesign {
  colors: SiteColors;
  headingFont: FontId;
  headingStyle: "normal" | "italic" | "caps";
  bodyFont: FontId;
  textSize: "sm" | "md" | "lg";
  spacing: "compact" | "comfortable" | "spacious";
  width: "narrow" | "standard" | "wide";
  corners: "square" | "soft" | "round";
  header: "split" | "centered";
  hero: TemplateLook["hero"];
  align: TemplateLook["align"];
}

export const PALETTES: { id: string; label: string; colors: SiteColors }[] = [
  {
    id: "linen",
    label: "Linen",
    colors: { background: "#fbf9f6", text: "#26221f", accent: "#2f4a3f" },
  },
  {
    id: "paper",
    label: "Paper",
    colors: { background: "#ffffff", text: "#151515", accent: "#151515" },
  },
  {
    id: "terracotta",
    label: "Terracotta",
    colors: { background: "#fdf6ec", text: "#2e231d", accent: "#a65a32" },
  },
  {
    id: "sage",
    label: "Sage",
    colors: { background: "#f6f7f2", text: "#232a24", accent: "#56705c" },
  },
  {
    id: "blush",
    label: "Blush",
    colors: { background: "#fbf3f1", text: "#33262a", accent: "#9b4f61" },
  },
  {
    id: "harbour",
    label: "Harbour",
    colors: { background: "#f4f6f8", text: "#1b2730", accent: "#23465c" },
  },
  {
    id: "midnight",
    label: "Midnight",
    colors: { background: "#16181d", text: "#ecebe8", accent: "#d9b77e" },
  },
];

const TEMPLATE_PALETTE: Record<string, string> = {
  modern: "linen",
  classic: "terracotta",
  minimal: "paper",
  "golden-hour": "terracotta",
  atelier: "paper",
  "little-moments": "sage",
  heirloom: "blush",
  horizon: "harbour",
  "studio-north": "harbour",
};

/** The design a template ships with. */
export function templateDesign(t: SiteTemplate): SiteDesign {
  const palette = PALETTES.find((p) => p.id === TEMPLATE_PALETTE[t.id]) ?? PALETTES[0]!;
  const serif = t.look.heading === "serif" || t.look.heading === "serif-italic";
  return {
    colors: palette.colors,
    headingFont: serif ? "fraunces" : "manrope",
    headingStyle:
      t.look.heading === "serif-italic"
        ? "italic"
        : t.look.heading === "sans-caps"
          ? "caps"
          : "normal",
    bodyFont: "manrope",
    textSize: "md",
    spacing: "comfortable",
    width: "standard",
    corners: "soft",
    header: t.look.align === "center" ? "centered" : "split",
    hero: t.look.hero,
    align: t.look.align,
  };
}

/** Template defaults with the site's own overrides applied. */
export function resolveDesign(templateId: string, overrides: Partial<SiteDesign>): SiteDesign {
  const base = templateDesign(templateById(templateId));
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...overrides.colors },
  };
}

// ---------- color helpers ----------

export function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  if (!isHex(a) || !isHex(b)) return 1;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on the given color. */
export function readableOn(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#111111") ? "#ffffff" : "#111111";
}

// ---------- theme for the renderer ----------

export interface SiteTheme {
  design: SiteDesign;
  style: CSSProperties;
  headingClass: string;
  /** Vertical padding for regular sections. */
  pad: string;
  /** Max width for section content. */
  container: string;
}

const PAD: Record<SiteDesign["spacing"], string> = {
  compact: "py-8 @2xl:py-12",
  comfortable: "py-14 @2xl:py-20",
  spacious: "py-20 @2xl:py-32",
};
const CONTAINER: Record<SiteDesign["width"], string> = {
  narrow: "max-w-4xl",
  standard: "max-w-6xl",
  wide: "max-w-[96rem]",
};
const TEXT_SIZE: Record<SiteDesign["textSize"], string> = { sm: "15px", md: "16px", lg: "17.5px" };
const RADIUS: Record<SiteDesign["corners"], string> = { square: "0px", soft: "6px", round: "18px" };

export function buildTheme(design: SiteDesign): SiteTheme {
  const { background, text, accent } = design.colors;
  return {
    design,
    headingClass: cn(
      design.headingStyle === "italic" && "italic",
      design.headingStyle === "caps" && "uppercase tracking-[0.16em]",
      design.headingFont === "manrope" ||
        design.headingFont === "inter" ||
        design.headingFont === "montserrat"
        ? "font-semibold"
        : "font-medium",
      "[font-family:var(--site-heading-font)]",
    ),
    pad: PAD[design.spacing],
    container: CONTAINER[design.width],
    style: {
      "--site-bg": background,
      "--site-text": text,
      "--site-accent": accent,
      "--site-accent-fg": readableOn(accent),
      "--site-surface": `color-mix(in oklab, ${text} 6%, ${background})`,
      "--site-muted": `color-mix(in oklab, ${text} 68%, ${background})`,
      "--site-line": `color-mix(in oklab, ${text} 14%, ${background})`,
      "--site-radius": RADIUS[design.corners],
      "--site-heading-font": FONTS[design.headingFont].stack,
      fontFamily: FONTS[design.bodyFont].stack,
      fontSize: TEXT_SIZE[design.textSize],
    } as CSSProperties,
  };
}

function cn(...parts: (string | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Google Fonts stylesheet URL for the fonts a design needs, or null if none. */
export function fontsHref(design: SiteDesign): string | null {
  const families = [...new Set([design.headingFont, design.bodyFont])]
    .map((f) => FONTS[f].google)
    .filter((g): g is string => !!g);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}
