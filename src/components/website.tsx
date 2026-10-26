import { type ReactNode } from "react";
import { FileText, Home, Images, Mail, Newspaper, Tag, User, type LucideIcon } from "lucide-react";
import { SubNav } from "@/components/kit";
import { PublishButton } from "@/components/website-publish";
import { img } from "@/lib/demo-data";
import type { SiteTemplate, TemplateLook } from "@/lib/website-templates";
import { SITE_STATUS_LABEL, type SiteStatus } from "@/lib/website";
import type { PageKind } from "@/lib/website-pages";
import { cn } from "@/lib/utils";

/**
 * Full-width row that scrolls sideways instead of widening the page. `w-0
 * min-w-full` stops wide content (long tab strips) from inflating the
 * layout's intrinsic width inside the sidebar's flex container.
 */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-0 min-w-full overflow-x-auto", className)}>{children}</div>;
}

export function WebsiteTabs() {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1 overflow-x-auto">
        <SubNav
          items={[
            { to: "/website", label: "Overview", exact: true },
            { to: "/website/templates", label: "Templates" },
            { to: "/website/pages", label: "Pages" },
            { to: "/website/design", label: "Design" },
            { to: "/website/portfolio", label: "Portfolio" },
            { to: "/website/blog", label: "Blog" },
            { to: "/website/preview", label: "Preview" },
          ]}
        />
      </div>
      <PublishButton className="mt-1 shrink-0" />
    </div>
  );
}

export const PAGE_ICON: Record<PageKind, LucideIcon> = {
  home: Home,
  about: User,
  portfolio: Images,
  pricing: Tag,
  contact: Mail,
  blog: Newspaper,
  custom: FileText,
};

const headingClass: Record<TemplateLook["heading"], string> = {
  serif: "font-display",
  "serif-italic": "font-display italic",
  sans: "font-sans font-semibold",
  "sans-caps": "font-sans uppercase tracking-[0.2em]",
};

/** Miniature (or large) mock of a site rendered with a template's look. */
export function SitePreview({
  t,
  title,
  nav = ["Home", "Work", "Contact"],
  large,
}: {
  t: SiteTemplate;
  title: string;
  /** Menu labels, in order. */
  nav?: string[];
  large?: boolean;
}) {
  const { look } = t;
  const font = headingClass[look.heading];
  const center = look.align === "center";
  const headline = <p className={cn(font, large ? "text-3xl" : "text-[11px]")}>{t.headline}</p>;
  const hero = img(t.image, large ? 1200 : 400, large ? 600 : 240);

  return (
    <div
      className={cn("overflow-hidden rounded-md border bg-card", large ? "text-sm" : "text-[8px]")}
    >
      <div className="flex items-center justify-between gap-2 border-b px-2 py-1">
        <span className={cn("truncate font-medium", font)}>{title}</span>
        <span className="flex min-w-0 gap-2 overflow-hidden text-muted-foreground">
          {nav.map((label, i) => (
            <span key={`${label}-${i}`} className="shrink-0">
              {label}
            </span>
          ))}
        </span>
      </div>
      {look.hero === "split" ? (
        <div className="grid grid-cols-2 items-center">
          <div className={cn("p-3", center && "text-center")}>
            {headline}
            <span
              className={cn(
                "mt-2 inline-block rounded-sm bg-foreground text-background",
                large ? "px-3 py-1 text-xs" : "px-1.5 py-0.5 text-[7px]",
              )}
            >
              View work
            </span>
          </div>
          <img src={hero} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
        </div>
      ) : look.hero === "framed" ? (
        <div className={cn(large ? "p-4" : "p-2", center && "text-center")}>
          <img
            src={hero}
            alt=""
            className={cn(
              "w-full rounded-sm object-cover",
              large ? "aspect-[2/1]" : "aspect-[5/3]",
            )}
            loading="lazy"
          />
          <div className="pt-2">{headline}</div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={hero}
            alt=""
            className={cn("w-full object-cover", large ? "aspect-[2/1]" : "aspect-[5/3]")}
            loading="lazy"
          />
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end p-3",
              center ? "items-center text-center" : "items-start text-left",
              look.hero === "overlay-dark"
                ? "bg-gradient-to-t from-black/50 to-transparent text-white"
                : "bg-white/10 text-foreground",
            )}
          >
            {headline}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 p-1">
        {t.strip.map((p) => (
          <img
            key={p}
            src={img(p, large ? 400 : 120, large ? 300 : 90)}
            alt=""
            className="aspect-[4/3] w-full rounded-sm object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

const statusClass: Record<SiteStatus, string> = {
  live: "bg-success/12 text-success",
  changes: "bg-warning/15 text-warning",
  offline: "bg-muted text-muted-foreground",
};

export function SiteStatusBadge({ status }: { status: SiteStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold",
        statusClass[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {SITE_STATUS_LABEL[status]}
    </span>
  );
}

/** Accessible single-choice button group. */
export function Segmented<T extends string>({
  label,
  hideLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  /** Keep the label for screen readers only (compact toolbars). */
  hideLabel?: boolean;
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div>
      {hideLabel ? null : <p className="mb-1.5 text-xs font-medium">{label}</p>}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-1"
      >
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 whitespace-nowrap rounded px-2 py-1.5 text-xs transition-colors",
              value === v
                ? "bg-card font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
