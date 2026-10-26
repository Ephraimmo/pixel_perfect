import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button, PageHeader, Panel, pageHead } from "@/components/kit";
import { Segmented, WebsiteTabs } from "@/components/website";
import { LivePreview } from "@/components/website-preview";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebsite } from "@/lib/website-store";
import {
  BODY_FONTS,
  FONTS,
  HEADING_FONTS,
  PALETTES,
  contrastRatio,
  isHex,
  readableOn,
  resolveDesign,
  type FontId,
  type SiteColors,
  type SiteDesign,
} from "@/lib/website-design";
import { templateById } from "@/lib/website-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/design")({
  head: () => pageHead("Website Design", "Colors, fonts, spacing and layout for your website."),
  component: DesignSettings,
});

type Key = keyof SiteDesign;
const GROUPS: Record<string, Key[]> = {
  colors: ["colors"],
  fonts: ["headingFont", "headingStyle", "bodyFont"],
  spacing: ["textSize", "spacing", "width", "corners"],
  layout: ["header", "hero", "align"],
};

/** Every font's stylesheet, so the font pickers can show each option in its own face. */
const ALL_FONTS_HREF = `https://fonts.googleapis.com/css2?${Object.values(FONTS)
  .map((f) => f.google)
  .filter(Boolean)
  .map((g) => `family=${g}`)
  .join("&")}&display=swap`;

function DesignSettings() {
  const { site, update } = useWebsite();
  const design = resolveDesign(site.templateId, site.design);
  const template = templateById(site.templateId);
  const overridden = (keys: Key[]) => keys.some((k) => k in site.design);

  useEffect(() => {
    if (document.querySelector("link[data-all-site-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = ALL_FONTS_HREF;
    link.dataset["allSiteFonts"] = "";
    document.head.appendChild(link);
  }, []);

  const set = <K extends Key>(key: K, value: SiteDesign[K]) =>
    update((s) => ({ design: { ...s.design, [key]: value } }));
  const setColor = (key: keyof SiteColors, value: string) =>
    update((s) => {
      const current = resolveDesign(s.templateId, s.design).colors;
      return { design: { ...s.design, colors: { ...current, [key]: value } } };
    });
  const resetKeys = (keys: Key[]) =>
    update((s) => {
      const next = { ...s.design };
      for (const k of keys) delete next[k];
      return { design: next };
    });

  const resetAll = () => {
    const previous = site.design;
    update(() => ({ design: {} }));
    toast.success(`Design reset to ${template.name} defaults`, {
      action: { label: "Undo", onClick: () => update(() => ({ design: previous })) },
    });
  };

  const textContrast = contrastRatio(design.colors.text, design.colors.background);
  const accentContrast = contrastRatio(design.colors.accent, readableOn(design.colors.accent));
  const accentOnBg = contrastRatio(design.colors.accent, design.colors.background);

  return (
    <div className="mx-auto max-w-7xl">
      <WebsiteTabs />
      <PageHeader
        title="Design"
        description={`Colors, fonts, spacing and layout. Starting point: the ${template.name} template.`}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            disabled={Object.keys(site.design).length === 0}
            onClick={resetAll}
          >
            <RotateCcw /> Reset to template defaults
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Group
            title="Colors"
            customized={overridden(GROUPS["colors"]!)}
            onReset={() => resetKeys(GROUPS["colors"]!)}
          >
            <div role="radiogroup" aria-label="Color palette" className="grid grid-cols-2 gap-2">
              {PALETTES.map((p) => {
                const on =
                  p.colors.background === design.colors.background &&
                  p.colors.text === design.colors.text &&
                  p.colors.accent === design.colors.accent;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("colors", p.colors)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                      on ? "border-primary ring-1 ring-primary" : "hover:bg-accent",
                    )}
                  >
                    <span className="flex shrink-0 -space-x-1" aria-hidden>
                      {[p.colors.background, p.colors.text, p.colors.accent].map((c, i) => (
                        <span
                          key={i}
                          className="h-4 w-4 rounded-full border border-black/15"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="truncate">{p.label}</span>
                    {on ? <Check className="ml-auto h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-3">
              <ColorField
                label="Background"
                value={design.colors.background}
                onChange={(v) => setColor("background", v)}
              />
              <ColorField
                label="Text"
                value={design.colors.text}
                onChange={(v) => setColor("text", v)}
              />
              <ColorField
                label="Accent"
                value={design.colors.accent}
                onChange={(v) => setColor("accent", v)}
              />
            </div>
            <ul className="mt-3 space-y-1 text-[11px]" aria-label="Contrast checks">
              <ContrastRow label="Text on background" ratio={textContrast} min={4.5} />
              <ContrastRow label="Button text on accent" ratio={accentContrast} min={4.5} />
              <ContrastRow label="Accent on background" ratio={accentOnBg} min={3} />
            </ul>
          </Group>

          <Group
            title="Fonts"
            customized={overridden(GROUPS["fonts"]!)}
            onReset={() => resetKeys(GROUPS["fonts"]!)}
          >
            <FontSelect
              label="Headings"
              value={design.headingFont}
              options={HEADING_FONTS}
              onChange={(v) => set("headingFont", v)}
            />
            <Segmented
              label="Heading style"
              value={design.headingStyle}
              onChange={(v) => set("headingStyle", v)}
              options={[
                ["normal", "Normal"],
                ["italic", "Italic"],
                ["caps", "Capitals"],
              ]}
            />
            <FontSelect
              label="Body text"
              value={design.bodyFont}
              options={BODY_FONTS}
              onChange={(v) => set("bodyFont", v)}
            />
          </Group>

          <Group
            title="Size & spacing"
            customized={overridden(GROUPS["spacing"]!)}
            onReset={() => resetKeys(GROUPS["spacing"]!)}
          >
            <Segmented
              label="Text size"
              value={design.textSize}
              onChange={(v) => set("textSize", v)}
              options={[
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
              ]}
            />
            <Segmented
              label="Section spacing"
              value={design.spacing}
              onChange={(v) => set("spacing", v)}
              options={[
                ["compact", "Compact"],
                ["comfortable", "Comfortable"],
                ["spacious", "Spacious"],
              ]}
            />
            <Segmented
              label="Content width"
              value={design.width}
              onChange={(v) => set("width", v)}
              options={[
                ["narrow", "Narrow"],
                ["standard", "Standard"],
                ["wide", "Wide"],
              ]}
            />
            <Segmented
              label="Corners"
              value={design.corners}
              onChange={(v) => set("corners", v)}
              options={[
                ["square", "Square"],
                ["soft", "Soft"],
                ["round", "Round"],
              ]}
            />
          </Group>

          <Group
            title="Layout"
            customized={overridden(GROUPS["layout"]!)}
            onReset={() => resetKeys(GROUPS["layout"]!)}
          >
            <Segmented
              label="Header"
              value={design.header}
              onChange={(v) => set("header", v)}
              options={[
                ["split", "Logo left"],
                ["centered", "Centered"],
              ]}
            />
            <Segmented
              label="Hero"
              value={design.hero}
              onChange={(v) => set("hero", v)}
              options={[
                ["overlay-dark", "Dark overlay"],
                ["overlay-light", "Light overlay"],
                ["split", "Split"],
                ["framed", "Framed"],
              ]}
            />
            <Segmented
              label="Text alignment"
              value={design.align}
              onChange={(v) => set("align", v)}
              options={[
                ["left", "Left"],
                ["center", "Center"],
              ]}
            />
          </Group>
        </div>

        <LivePreview className="h-fit lg:sticky lg:top-4" />
      </div>
    </div>
  );
}

function Group({
  title,
  customized,
  onReset,
  children,
}: {
  title: string;
  customized: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {customized ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            aria-label={`Reset ${title.toLowerCase()} to template defaults`}
          >
            Customized · Reset
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">Template default</span>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </Panel>
  );
}

function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: FontId;
  options: FontId[];
  onChange: (value: FontId) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium">{label}</p>
      <Select value={value} onValueChange={(v) => onChange(v as FontId)}>
        <SelectTrigger aria-label={`${label} font`} className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((f) => (
            <SelectItem key={f} value={f}>
              <span style={{ fontFamily: FONTS[f].stack }}>{FONTS[f].label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Local text so a half-typed hex code doesn't get saved.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const id = `color-${label.toLowerCase()}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-24 shrink-0 text-xs">
        {label}
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color picker`}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border bg-card p-0.5"
      />
      <Input
        id={id}
        value={text}
        maxLength={7}
        aria-invalid={!isHex(text)}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          if (isHex(v)) onChange(v.toLowerCase());
        }}
        onBlur={() => setText(value)}
        className="h-8 font-mono text-xs"
      />
    </div>
  );
}

function ContrastRow({ label, ratio, min }: { label: string; ratio: number; min: number }) {
  const ok = ratio >= min;
  return (
    <li className={cn("flex items-center gap-1.5", ok ? "text-muted-foreground" : "text-warning")}>
      {ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}: {ratio.toFixed(1)}:1{ok ? "" : ` — below ${min}:1, may be hard to read`}
    </li>
  );
}
