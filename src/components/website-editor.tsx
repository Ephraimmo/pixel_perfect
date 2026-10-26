// Form controls for editing one website section: text, images, buttons and
// price lists. Images come from the photographer's galleries (no uploads —
// there is no storage backend).

import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ImagePlus,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button, StatusBadge, TabBar } from "@/components/kit";
import { ScrollRow, Segmented } from "@/components/website";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { PHOTOS, img, type Gallery } from "@/lib/demo-data";
import {
  DEFAULT_PORTFOLIO,
  moveItem,
  type PortfolioConfig,
  type SectionButton,
  type SitePage,
  type SiteSection,
} from "@/lib/website-pages";
import { cn } from "@/lib/utils";

/** Photo sets the picker offers: each gallery, plus the studio's stock shots. */
function usePhotoSets(): { id: string; label: string; photos: string[] }[] {
  const { state: demo } = useDemo();
  return [
    ...demo.galleries
      .filter((g) => g.photos.length > 0)
      .map((g) => ({ id: g.id, label: g.shortTitle || g.title, photos: g.photos })),
    {
      id: "studio",
      label: "Studio",
      photos: [PHOTOS.editorPortrait, PHOTOS.heroPhotographer, PHOTOS.lakeBanner, ...PHOTOS.travel],
    },
  ];
}

export function PhotoPickerDialog({
  open,
  onOpenChange,
  multiple,
  initial = [],
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple?: boolean;
  initial?: string[];
  onPick: (photos: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        {open ? (
          <PhotoPicker
            multiple={multiple}
            initial={initial}
            onPick={(p) => {
              onPick(p);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PhotoPicker({
  multiple,
  initial,
  onPick,
}: {
  multiple: boolean | undefined;
  initial: string[];
  onPick: (photos: string[]) => void;
}) {
  const sets = usePhotoSets();
  const [setId, setSetId] = useState(sets[0]?.id ?? "studio");
  const [chosen, setChosen] = useState<string[]>(multiple ? [] : initial);
  const photos = sets.find((s) => s.id === setId)?.photos ?? [];

  const toggle = (p: string) => {
    if (!multiple) {
      onPick([p]);
      return;
    }
    setChosen((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="display-title text-xl">
          {multiple ? "Add images" : "Choose an image"}
        </DialogTitle>
        <DialogDescription>
          Pick from your galleries. Uploading new files needs a storage backend.
        </DialogDescription>
      </DialogHeader>
      <ScrollRow>
        <TabBar
          value={setId}
          onChange={setSetId}
          tabs={sets.map((s) => ({ value: s.id, label: s.label }))}
        />
      </ScrollRow>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p) => {
          const on = chosen.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              aria-pressed={on}
              aria-label={on ? "Selected photo" : "Photo"}
              className={cn(
                "relative overflow-hidden rounded ring-offset-2 ring-offset-background",
                on ? "ring-2 ring-primary" : "hover:opacity-80",
              )}
            >
              <img
                src={img(p, 240, 240)}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              {on ? (
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {multiple ? (
        <DialogFooter>
          <Button disabled={chosen.length === 0} onClick={() => onPick(chosen)}>
            Add {chosen.length || ""} image{chosen.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}

const MAX_BUTTONS = 2;
const MAX_ITEMS = 6;
const EXTERNAL = "__external__";

/** Which fields each section kind exposes, and how they're labelled. */
const FIELDS: Record<
  SiteSection["kind"],
  {
    heading: string;
    body: string | null;
    image: boolean;
    images: boolean;
    buttons: boolean;
    items: boolean;
  }
> = {
  hero: {
    heading: "Headline",
    body: "Introduction",
    image: true,
    images: false,
    buttons: true,
    items: false,
  },
  text: {
    heading: "Heading",
    body: "Text",
    image: true,
    images: false,
    buttons: true,
    items: false,
  },
  gallery: {
    heading: "Heading",
    body: "Caption",
    image: false,
    images: true,
    buttons: true,
    items: false,
  },
  blog: {
    heading: "Heading",
    body: "Introduction",
    image: false,
    images: false,
    buttons: false,
    items: false,
  },
  portfolio: {
    heading: "Heading",
    body: "Introduction",
    image: false,
    images: false,
    buttons: false,
    items: false,
  },
  pricing: {
    heading: "Heading",
    body: "Introduction",
    image: false,
    images: false,
    buttons: true,
    items: true,
  },
  testimonial: {
    heading: "Quote",
    body: "Attribution",
    image: false,
    images: false,
    buttons: false,
    items: false,
  },
  contact: {
    heading: "Heading",
    body: "Introduction",
    image: false,
    images: false,
    buttons: false,
    items: false,
  },
  cta: {
    heading: "Heading",
    body: "Subtext",
    image: false,
    images: false,
    buttons: true,
    items: false,
  },
};

export function SectionForm({
  section: s,
  pages,
  onChange,
}: {
  section: SiteSection;
  pages: SitePage[];
  onChange: (patch: Partial<SiteSection>) => void;
}) {
  const f = FIELDS[s.kind];
  const [picking, setPicking] = useState<"image" | "images" | null>(null);
  const id = (name: string) => `sf-${s.id}-${name}`;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor={id("heading")} className="text-xs">
          {f.heading}
        </Label>
        {s.kind === "testimonial" ? (
          <Textarea
            id={id("heading")}
            rows={3}
            value={s.heading}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
        ) : (
          <Input
            id={id("heading")}
            value={s.heading}
            maxLength={120}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
        )}
      </div>

      {f.body ? (
        <div className="space-y-1.5">
          <Label htmlFor={id("body")} className="text-xs">
            {f.body}
          </Label>
          {s.kind === "testimonial" ? (
            <Input
              id={id("body")}
              value={s.body}
              onChange={(e) => onChange({ body: e.target.value })}
            />
          ) : (
            <Textarea
              id={id("body")}
              rows={s.kind === "text" ? 5 : 3}
              value={s.body}
              onChange={(e) => onChange({ body: e.target.value })}
            />
          )}
        </div>
      ) : null}

      {f.image ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Image</p>
          <div className="flex items-center gap-3">
            {s.image ? (
              <img
                src={img(s.image, 200, 140)}
                alt="Section image"
                className="h-16 w-24 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="grid h-16 w-24 shrink-0 place-items-center rounded border border-dashed text-[10px] text-muted-foreground">
                No image
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setPicking("image")}>
                <ImagePlus /> {s.image ? "Change" : "Add image"}
              </Button>
              {s.image ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange({ image: "" })}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {f.images ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Images ({s.images.length})</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setPicking("images")}>
              <ImagePlus /> Add images
            </Button>
          </div>
          {s.images.length === 0 ? (
            <p className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">
              No images yet.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {s.images.map((p, i) => (
                <li key={`${p}-${i}`} className="group relative">
                  <img
                    src={img(p, 200, 200)}
                    alt={`Image ${i + 1}`}
                    className="aspect-square w-full rounded object-cover"
                  />
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <span className="flex gap-0.5">
                      <IconBtn
                        label={`Move image ${i + 1} left`}
                        disabled={i === 0}
                        onClick={() => onChange({ images: swap(s.images, i, i - 1) })}
                      >
                        <ArrowLeft />
                      </IconBtn>
                      <IconBtn
                        label={`Move image ${i + 1} right`}
                        disabled={i === s.images.length - 1}
                        onClick={() => onChange({ images: swap(s.images, i, i + 1) })}
                      >
                        <ArrowRight />
                      </IconBtn>
                    </span>
                    <IconBtn
                      label={`Remove image ${i + 1}`}
                      onClick={() => onChange({ images: s.images.filter((_, j) => j !== i) })}
                    >
                      <X />
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {f.buttons ? (
        <ButtonsEditor
          buttons={s.buttons}
          pages={pages}
          idPrefix={id("btn")}
          onChange={(buttons) => onChange({ buttons })}
        />
      ) : null}

      {s.kind === "contact" ? (
        <div className="space-y-1.5">
          <Label htmlFor={id("submit")} className="text-xs">
            Send button label
          </Label>
          <Input
            id={id("submit")}
            value={s.buttons[0]?.label ?? ""}
            maxLength={30}
            onChange={(e) => onChange({ buttons: [{ label: e.target.value, href: "" }] })}
          />
        </div>
      ) : null}

      {s.kind === "portfolio" ? (
        <PortfolioForm
          config={s.portfolio ?? DEFAULT_PORTFOLIO}
          onChange={(portfolio) => onChange({ portfolio })}
        />
      ) : null}

      {f.items ? (
        <div className="space-y-2">
          <p className="text-xs font-medium">Packages</p>
          {s.items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-md border p-2.5">
              <div className="flex gap-2">
                <Input
                  aria-label={`Package ${i + 1} name`}
                  value={item.name}
                  placeholder="Name"
                  onChange={(e) =>
                    onChange({ items: patchAt(s.items, i, { name: e.target.value }) })
                  }
                />
                <Input
                  aria-label={`Package ${i + 1} price`}
                  value={item.price}
                  placeholder="$0"
                  className="w-24"
                  onChange={(e) =>
                    onChange({ items: patchAt(s.items, i, { price: e.target.value }) })
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  aria-label={`Remove package ${i + 1}`}
                  onClick={() => onChange({ items: s.items.filter((_, j) => j !== i) })}
                >
                  <Trash2 />
                </Button>
              </div>
              <Input
                aria-label={`Package ${i + 1} description`}
                value={item.description}
                placeholder="What's included"
                onChange={(e) =>
                  onChange({ items: patchAt(s.items, i, { description: e.target.value }) })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={s.items.length >= MAX_ITEMS}
            onClick={() =>
              onChange({
                items: [...s.items, { name: "New package", price: "$0", description: "" }],
              })
            }
          >
            <Plus /> Add package
          </Button>
        </div>
      ) : null}

      <PhotoPickerDialog
        open={picking === "image"}
        onOpenChange={(o) => !o && setPicking(null)}
        initial={s.image ? [s.image] : []}
        onPick={([p]) => onChange({ image: p ?? "" })}
      />
      <PhotoPickerDialog
        open={picking === "images"}
        onOpenChange={(o) => !o && setPicking(null)}
        multiple
        onPick={(ps) => onChange({ images: [...s.images, ...ps] })}
      />
    </div>
  );
}

/** Choose which galleries a portfolio shows, their order, and the layout. */
export function PortfolioForm({
  config,
  onChange,
}: {
  config: PortfolioConfig;
  onChange: (config: PortfolioConfig) => void;
}) {
  const { state: demo } = useDemo();
  const set = (patch: Partial<PortfolioConfig>) => onChange({ ...config, ...patch });
  const included = config.galleryIds
    .map((id) => demo.galleries.find((g) => g.id === id))
    .filter((g): g is Gallery => !!g);
  const rest = demo.galleries.filter((g) => !config.galleryIds.includes(g.id));
  const move = (id: string, to: number) =>
    set({
      galleryIds: moveItem(
        config.galleryIds.map((x) => ({ id: x })),
        id,
        to,
      ).map((x) => x.id),
    });

  const row = (g: Gallery, i: number | null) => {
    const on = i !== null;
    const published = g.status === "published";
    return (
      <li key={g.id} className="flex items-center gap-2.5 border-b px-3 py-2 last:border-b-0">
        <img
          src={img(g.cover, 96, 96)}
          alt=""
          className="h-10 w-10 shrink-0 rounded object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{g.title}</p>
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <StatusBadge status={g.status} />
            {g.privacy === "password" ? (
              <span className="inline-flex items-center gap-0.5">
                <Lock className="h-3 w-3" /> Password
              </span>
            ) : null}
            {on && !published ? <span className="text-warning">Hidden until published</span> : null}
          </p>
        </div>
        {on ? (
          <span className="flex shrink-0">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={i === 0}
              onClick={() => move(g.id, i - 1)}
              aria-label={`Move ${g.title} up`}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={i === included.length - 1}
              onClick={() => move(g.id, i + 1)}
              aria-label={`Move ${g.title} down`}
            >
              <ArrowDown />
            </Button>
          </span>
        ) : null}
        <Switch
          checked={on}
          disabled={!on && !published}
          title={!on && !published ? "Publish this gallery to add it" : undefined}
          aria-label={`Show ${g.title} in portfolio`}
          onCheckedChange={(v) =>
            set({
              galleryIds: v
                ? [...config.galleryIds, g.id]
                : config.galleryIds.filter((x) => x !== g.id),
            })
          }
        />
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium">Galleries ({included.length} selected)</p>
        <ul aria-label="Portfolio galleries" className="rounded-md border">
          {included.map((g, i) => row(g, i))}
          {rest.map((g) => row(g, null))}
        </ul>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Only published galleries appear on your site. Drafts can be added once published.
        </p>
      </div>
      <Segmented
        label="Show"
        value={config.display}
        onChange={(v) => set({ display: v })}
        options={[
          ["covers", "Gallery covers"],
          ["photos", "All photos"],
        ]}
      />
      <Segmented
        label="Layout"
        value={config.layout}
        onChange={(v) => set({ layout: v })}
        options={[
          ["grid", "Grid"],
          ["masonry", "Masonry"],
          ["editorial", "Editorial"],
          ["slideshow", "Slideshow"],
        ]}
      />
      {config.layout === "grid" || config.layout === "masonry" ? (
        <Segmented
          label="Columns"
          value={String(config.columns) as "2" | "3" | "4"}
          onChange={(v) => set({ columns: Number(v) as PortfolioConfig["columns"] })}
          options={[
            ["2", "2"],
            ["3", "3"],
            ["4", "4"],
          ]}
        />
      ) : null}
      {config.layout !== "slideshow" ? (
        <Segmented
          label="Spacing"
          value={config.gap}
          onChange={(v) => set({ gap: v })}
          options={[
            ["none", "None"],
            ["small", "Small"],
            ["large", "Large"],
          ]}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="pf-limit" className="text-xs">
          Photos per gallery
        </Label>
        <Select value={String(config.limit)} onValueChange={(v) => set({ limit: Number(v) })}>
          <SelectTrigger id="pf-limit" className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="0">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium">Show gallery titles</span>
        <Switch checked={config.showTitles} onCheckedChange={(v) => set({ showTitles: v })} />
      </label>
    </div>
  );
}

function ButtonsEditor({
  buttons,
  pages,
  idPrefix,
  onChange,
}: {
  buttons: SectionButton[];
  pages: SitePage[];
  idPrefix: string;
  onChange: (buttons: SectionButton[]) => void;
}) {
  const internal = new Set(pages.map((p) => `/${p.slug}`));
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Buttons</p>
      {buttons.map((b, i) => {
        const isExternal = !internal.has(b.href);
        return (
          <div key={i} className="space-y-2 rounded-md border p-2.5">
            <div className="flex gap-2">
              <Input
                id={`${idPrefix}-${i}`}
                aria-label={`Button ${i + 1} label`}
                value={b.label}
                maxLength={30}
                placeholder="Button label"
                onChange={(e) => onChange(patchAt(buttons, i, { label: e.target.value }))}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label={`Remove button ${i + 1}`}
                onClick={() => onChange(buttons.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
            <Select
              value={isExternal ? EXTERNAL : b.href}
              onValueChange={(v) =>
                onChange(patchAt(buttons, i, { href: v === EXTERNAL ? "https://" : v }))
              }
            >
              <SelectTrigger aria-label={`Button ${i + 1} link`} className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={`/${p.slug}`}>
                    {p.title} page
                  </SelectItem>
                ))}
                <SelectItem value={EXTERNAL}>External link…</SelectItem>
              </SelectContent>
            </Select>
            {isExternal ? (
              <Input
                aria-label={`Button ${i + 1} URL`}
                value={b.href}
                placeholder="https://"
                onChange={(e) => onChange(patchAt(buttons, i, { href: e.target.value.trim() }))}
              />
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={buttons.length >= MAX_BUTTONS}
        onClick={() =>
          onChange([...buttons, { label: "Learn more", href: `/${pages[0]?.slug ?? ""}` }])
        }
      >
        <Plus /> Add button
      </Button>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-30 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  if (b < 0 || b >= list.length) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}

function patchAt<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
}
