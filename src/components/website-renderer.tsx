// Renders a photographer's site page from website state. Layout responds to
// the width of its own container (CSS container queries), so the same markup
// previews correctly inside desktop, tablet and phone frames. Colors, fonts,
// spacing and layout come from the site's design settings.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Lock, Menu, X } from "lucide-react";
import { useDemo } from "@/lib/store";
import { img } from "@/lib/demo-data";
import type { WebsiteState } from "@/lib/website";
import {
  formatPostDate,
  parseBody,
  parseInline,
  plainText,
  publishedPosts,
  readingMinutes,
  type BlogPost,
} from "@/lib/website-blog";
import { buildTheme, fontsHref, resolveDesign, type SiteTheme } from "@/lib/website-design";
import {
  DEFAULT_PORTFOLIO,
  navPages,
  type PortfolioConfig,
  type SectionButton,
  type SitePage,
  type SiteSection,
} from "@/lib/website-pages";
import { cn } from "@/lib/utils";

interface RenderProps {
  site: WebsiteState;
  page: SitePage;
  /** Navigate between pages inside the preview. */
  onNavigate?: (pageId: string) => void;
  selectedId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  /** Render this blog post instead of the page's sections. */
  post?: BlogPost;
}

/** Load the Google Fonts a design uses (once per stylesheet URL). */
function useDesignFonts(href: string | null) {
  useEffect(() => {
    if (!href || document.querySelector(`link[data-site-fonts="${CSS.escape(href)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset["siteFonts"] = href;
    document.head.appendChild(link);
  }, [href]);
}

export function SiteRenderer({
  site,
  page,
  onNavigate,
  selectedId,
  onSelectSection,
  post,
}: RenderProps) {
  const design = resolveDesign(site.templateId, site.design);
  const theme = buildTheme(design);
  useDesignFonts(fontsHref(design));
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = navPages(site.pages);
  const centeredHeader = design.header === "centered";

  const go = (href: string) => {
    const slug = href.replace(/^\//, "");
    const target = site.pages.find((p) => p.slug === slug);
    if (target) {
      onNavigate?.(target.id);
      setMenuOpen(false);
    }
  };

  const navLinks = nav.map((p) => (
    <button
      key={p.id}
      type="button"
      onClick={() => go(`/${p.slug}`)}
      aria-current={p.id === page.id ? "page" : undefined}
      className={cn(
        "transition-opacity hover:opacity-70",
        p.id === page.id ? "font-semibold" : "text-[var(--site-muted)]",
      )}
    >
      {p.title}
    </button>
  ));

  return (
    <div
      style={theme.style}
      className="@container min-h-full bg-[var(--site-bg)] text-[var(--site-text)]"
    >
      <header className="relative border-b border-[var(--site-line)]">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-5 py-4",
            theme.container,
            centeredHeader && "@2xl:flex-col @2xl:gap-3",
          )}
        >
          <button
            type="button"
            onClick={() => go("/")}
            className={cn("truncate text-left text-[1.15em]", theme.headingClass)}
          >
            {site.siteTitle}
          </button>
          <nav
            aria-label="Site"
            className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.875em] @2xl:flex"
          >
            {navLinks}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="@2xl:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen ? (
          <nav
            aria-label="Site menu"
            className="flex flex-col items-start border-t border-[var(--site-line)] px-5 py-2 text-[0.875em] @2xl:hidden [&>button]:py-2"
          >
            {navLinks}
          </nav>
        ) : null}
      </header>

      <main>
        {post ? (
          <PostArticle post={post} theme={theme} />
        ) : page.sections.length === 0 ? (
          <p className="px-5 py-24 text-center text-[0.875em] text-[var(--site-muted)]">
            This page has no sections yet.
          </p>
        ) : (
          page.sections.map((s) => (
            <SectionFrame
              key={s.id}
              section={s}
              selected={selectedId === s.id}
              onSelect={onSelectSection}
            >
              <SectionView section={s} theme={theme} onLink={go} posts={site.posts} />
            </SectionFrame>
          ))
        )}
      </main>

      <footer className="border-t border-[var(--site-line)] px-5 py-8 text-center text-[0.75em] text-[var(--site-muted)]">
        © {new Date().getFullYear()} {site.siteTitle} · Made with Pixora
      </footer>
    </div>
  );
}

function SectionFrame({
  section,
  selected,
  onSelect,
  children,
}: {
  section: SiteSection;
  selected: boolean;
  onSelect: ((id: string) => void) | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll only the preview's own scroll area, never the editor page itself.
    const el = ref.current;
    const box = el?.closest<HTMLElement>("[data-preview-scroll]");
    if (!selected || !el || !box) return;
    const r = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top < b.top || r.bottom > b.bottom) {
      box.scrollBy({ top: r.top - b.top - 12, behavior: "smooth" });
    }
  }, [selected]);
  if (!onSelect) return <>{children}</>;
  return (
    <div
      ref={ref}
      data-section-id={section.id}
      onClickCapture={(e) => {
        // In the editor, clicking a section selects it instead of following links.
        e.preventDefault();
        e.stopPropagation();
        onSelect(section.id);
      }}
      className={cn(
        "relative cursor-pointer outline-offset-[-2px] transition-[outline-color]",
        selected
          ? "outline-2 outline-[#c46a3a] outline-solid"
          : "outline-2 outline-transparent outline-solid hover:outline-[#c46a3a]/40",
      )}
    >
      {children}
    </div>
  );
}

function Buttons({
  buttons,
  onLink,
  center,
  light,
}: {
  buttons: SectionButton[];
  onLink: (href: string) => void;
  center?: boolean;
  light?: boolean;
}) {
  if (buttons.length === 0) return null;
  return (
    <div className={cn("mt-6 flex flex-wrap gap-3", center && "justify-center")}>
      {buttons.map((b, i) => {
        const cls = cn(
          "inline-flex items-center rounded-[var(--site-radius)] px-5 py-2.5 text-[0.875em] font-medium transition-opacity hover:opacity-85",
          i === 0
            ? light
              ? "bg-white text-black"
              : "bg-[var(--site-accent)] text-[var(--site-accent-fg)]"
            : light
              ? "border border-white/70 text-white"
              : "border border-current",
        );
        return /^https?:\/\//.test(b.href) ? (
          <a key={i} href={b.href} target="_blank" rel="noreferrer" className={cls}>
            {b.label}
          </a>
        ) : (
          <button key={i} type="button" onClick={() => onLink(b.href)} className={cls}>
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionView({
  section: s,
  theme,
  onLink,
  posts,
}: {
  section: SiteSection;
  theme: SiteTheme;
  onLink: (href: string) => void;
  posts: BlogPost[];
}) {
  const h = theme.headingClass;
  const { design } = theme;
  const center = design.align === "center";
  const wrap = cn("mx-auto px-5", theme.container, theme.pad);
  const radius = "rounded-[var(--site-radius)]";

  switch (s.kind) {
    case "hero": {
      const text = (light: boolean) => (
        <>
          <h1 className={cn(h, "text-[1.875em] leading-tight @2xl:text-[3em]")}>{s.heading}</h1>
          {s.body ? (
            <p
              className={cn(
                "mt-4 max-w-xl",
                light ? "text-white/85" : "text-[var(--site-muted)]",
                center && "mx-auto",
              )}
            >
              {s.body}
            </p>
          ) : null}
          <Buttons buttons={s.buttons} onLink={onLink} center={center} light={light} />
        </>
      );
      if (!s.image) {
        return <section className={cn(wrap, center && "text-center")}>{text(false)}</section>;
      }
      if (design.hero === "split") {
        return (
          <section className="grid items-center @2xl:grid-cols-2">
            <div className={cn("px-5 py-12 @2xl:px-12", center && "text-center")}>
              {text(false)}
            </div>
            <img
              src={img(s.image, 1000, 1200)}
              alt=""
              className="aspect-[4/5] w-full object-cover @2xl:aspect-auto @2xl:h-full"
            />
          </section>
        );
      }
      if (design.hero === "framed") {
        return (
          <section
            className={cn("mx-auto px-5 pt-8 pb-14", theme.container, center && "text-center")}
          >
            <img
              src={img(s.image, 1600, 800)}
              alt=""
              className={cn("aspect-[4/3] w-full object-cover @2xl:aspect-[2/1]", radius)}
            />
            <div className="mt-8">{text(false)}</div>
          </section>
        );
      }
      const dark = design.hero === "overlay-dark";
      return (
        <section className="relative">
          <img
            src={img(s.image, 1800, 1000)}
            alt=""
            className="aspect-[4/5] w-full object-cover @md:aspect-[16/10] @4xl:aspect-[2/1]"
          />
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end p-6 @2xl:p-14",
              center ? "items-center text-center" : "items-start",
              dark
                ? "bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white"
                : "bg-white/35 text-[#1a1a1a]",
            )}
          >
            {text(dark)}
          </div>
        </section>
      );
    }
    case "text":
      return (
        <section className={cn(wrap, "grid gap-8", s.image && "items-center @2xl:grid-cols-2")}>
          <div className={cn(!s.image && "max-w-2xl", !s.image && center && "mx-auto text-center")}>
            <h2 className={cn(h, "text-[1.5em] @2xl:text-[1.875em]")}>{s.heading}</h2>
            {s.body ? (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-[var(--site-muted)]">
                {s.body}
              </p>
            ) : null}
            <Buttons buttons={s.buttons} onLink={onLink} center={!s.image && center} />
          </div>
          {s.image ? (
            <img
              src={img(s.image, 900, 700)}
              alt=""
              className={cn("aspect-[4/3] w-full object-cover", radius)}
            />
          ) : null}
        </section>
      );
    case "gallery":
      return (
        <section className={wrap}>
          {s.heading ? (
            <h2 className={cn(h, "mb-6 text-[1.5em] @2xl:text-[1.875em]", center && "text-center")}>
              {s.heading}
            </h2>
          ) : null}
          {s.body ? (
            <p className={cn("-mt-3 mb-6 text-[var(--site-muted)]", center && "text-center")}>
              {s.body}
            </p>
          ) : null}
          {s.images.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--site-line)] py-10 text-center text-[0.875em] text-[var(--site-muted)]">
              No images yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-3 @2xl:gap-3">
              {s.images.map((p, i) => (
                <img
                  key={`${p}-${i}`}
                  src={img(p, 600, 600)}
                  alt=""
                  className={cn("aspect-square w-full object-cover", radius)}
                  loading="lazy"
                />
              ))}
            </div>
          )}
          <Buttons buttons={s.buttons} onLink={onLink} center={center} />
        </section>
      );
    case "pricing":
      return (
        <section className={wrap}>
          <h2 className={cn(h, "mb-2 text-[1.5em] @2xl:text-[1.875em]", center && "text-center")}>
            {s.heading}
          </h2>
          {s.body ? (
            <p className={cn("mb-6 text-[var(--site-muted)]", center && "text-center")}>{s.body}</p>
          ) : null}
          <div className="mt-6 grid gap-4 @2xl:grid-cols-3">
            {s.items.map((item, i) => (
              <div key={i} className={cn("bg-[var(--site-surface)] p-6", radius)}>
                <p className="text-[0.875em] font-medium">{item.name}</p>
                <p className={cn(h, "mt-2 text-[1.875em]")}>{item.price}</p>
                <p className="mt-2 text-[0.875em] text-[var(--site-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
          <Buttons buttons={s.buttons} onLink={onLink} center={center} />
        </section>
      );
    case "testimonial":
      return (
        <section className="bg-[var(--site-surface)]">
          <div className={cn("mx-auto max-w-3xl px-5 text-center", theme.pad)}>
            <p className={cn(h, "text-[1.5em] leading-snug @2xl:text-[1.875em]")}>{s.heading}</p>
            {s.body ? (
              <p className="mt-4 text-[0.875em] text-[var(--site-muted)]">{s.body}</p>
            ) : null}
          </div>
        </section>
      );
    case "portfolio":
      return <PortfolioSection section={s} theme={theme} />;
    case "blog":
      return <BlogSection section={s} theme={theme} posts={posts} />;
    case "contact":
      return <ContactSection section={s} theme={theme} />;
    case "cta":
      return (
        <section className="bg-[var(--site-accent)] text-[var(--site-accent-fg)]">
          <div className={cn("mx-auto max-w-3xl px-5 text-center", theme.pad)}>
            <h2 className={cn(h, "text-[1.5em] @2xl:text-[2.25em]")}>{s.heading}</h2>
            {s.body ? <p className="mt-3 opacity-80">{s.body}</p> : null}
            <Buttons buttons={s.buttons} onLink={onLink} center light />
          </div>
        </section>
      );
  }
}

// ---------- portfolio ----------

interface Tile {
  key: string;
  photo: string;
  title?: string;
  subtitle?: string;
  locked?: boolean;
  onOpen?: () => void;
}

const COLS: Record<PortfolioConfig["columns"], string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 @2xl:grid-cols-3",
  4: "grid-cols-2 @2xl:grid-cols-4",
};
const MASONRY_COLS: Record<PortfolioConfig["columns"], string> = {
  2: "columns-2",
  3: "columns-2 @2xl:columns-3",
  4: "columns-2 @2xl:columns-4",
};
const GAP: Record<PortfolioConfig["gap"], { grid: string; columns: string; item: string }> = {
  none: { grid: "gap-0", columns: "gap-0", item: "mb-0" },
  small: { grid: "gap-2", columns: "gap-2", item: "mb-2" },
  large: { grid: "gap-5", columns: "gap-5", item: "mb-5" },
};

function TileView({
  tile,
  className,
  aspect,
  showTitles,
}: {
  tile: Tile;
  className?: string | undefined;
  /** Aspect-ratio class, or "" to keep the photo's natural shape. */
  aspect: string;
  showTitles: boolean;
}) {
  const body = (
    <>
      <img
        src={aspect ? img(tile.photo, 800, 800) : img(tile.photo, 700)}
        alt={tile.title ?? ""}
        loading="lazy"
        className={cn(
          "w-full object-cover transition-transform duration-500",
          aspect,
          tile.onOpen && "group-hover:scale-[1.03]",
        )}
      />
      {showTitles && tile.title ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-left text-white">
          <span className="flex items-center gap-1.5 text-[0.95em] font-medium">
            {tile.locked ? <Lock className="h-3 w-3" aria-label="Password protected" /> : null}
            {tile.title}
          </span>
          {tile.subtitle ? (
            <span className="block text-[0.75em] opacity-80">{tile.subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </>
  );
  const cls = cn(
    "group relative block w-full overflow-hidden rounded-[var(--site-radius)]",
    className,
  );
  return tile.onOpen ? (
    <button
      type="button"
      onClick={tile.onOpen}
      className={cls}
      aria-label={tile.title ? `Open ${tile.title}` : undefined}
    >
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function PhotoLayout({ tiles, config }: { tiles: Tile[]; config: PortfolioConfig }) {
  const [index, setIndex] = useState(0);
  const gap = GAP[config.gap];
  if (tiles.length === 0) return null;

  if (config.layout === "slideshow") {
    const i = Math.min(index, tiles.length - 1);
    const tile = tiles[i]!;
    const step = (d: number) => setIndex((i + d + tiles.length) % tiles.length);
    const arrow =
      "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black";
    return (
      <div>
        <div className="relative">
          <TileView tile={tile} aspect="aspect-[3/2]" showTitles={config.showTitles} />
          {tiles.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous slide"
                className={cn(arrow, "left-3")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next slide"
                className={cn(arrow, "right-3")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-center text-[0.75em] text-[var(--site-muted)]" aria-live="polite">
          {i + 1} / {tiles.length}
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {tiles.map((t, j) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setIndex(j)}
              aria-label={`Show slide ${j + 1}`}
              aria-current={j === i ? "true" : undefined}
              className={cn(
                "h-14 w-20 shrink-0 overflow-hidden rounded-[var(--site-radius)]",
                j === i ? "ring-2 ring-[var(--site-accent)]" : "opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={img(t.photo, 160, 112)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (config.layout === "masonry") {
    return (
      <div className={cn(MASONRY_COLS[config.columns], gap.columns)}>
        {tiles.map((t) => (
          <TileView
            key={t.key}
            tile={t}
            aspect=""
            className={cn("break-inside-avoid", gap.item)}
            showTitles={config.showTitles}
          />
        ))}
      </div>
    );
  }

  if (config.layout === "editorial") {
    // A wide lead image, then pairs — repeating.
    return (
      <div className={cn("grid grid-cols-2", gap.grid)}>
        {tiles.map((t, j) => (
          <TileView
            key={t.key}
            tile={t}
            className={j % 3 === 0 ? "col-span-2" : undefined}
            aspect={j % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}
            showTitles={config.showTitles}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid", COLS[config.columns], gap.grid)}>
      {tiles.map((t) => (
        <TileView
          key={t.key}
          tile={t}
          aspect={config.display === "covers" ? "aspect-[4/5]" : "aspect-square"}
          showTitles={config.showTitles}
        />
      ))}
    </div>
  );
}

function PortfolioSection({ section: s, theme }: { section: SiteSection; theme: SiteTheme }) {
  const { state: demo } = useDemo();
  const config = s.portfolio ?? DEFAULT_PORTFOLIO;
  const [openId, setOpenId] = useState<string | null>(null);
  const center = theme.design.align === "center";
  // Only published galleries appear on the public site.
  const galleries = config.galleryIds
    .map((id) => demo.galleries.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g && g.status === "published");
  const photosOf = (g: (typeof galleries)[number]) =>
    config.limit > 0 ? g.photos.slice(0, config.limit) : g.photos;
  const open = galleries.find((g) => g.id === openId);
  const heading = (text: string, level: "h2" | "h3" = "h2") => {
    const Tag = level;
    return (
      <Tag
        className={cn(
          theme.headingClass,
          level === "h2" ? "mb-4 text-[1.5em] @2xl:text-[1.875em]" : "mb-3 text-[1.25em]",
          center && "text-center",
        )}
      >
        {text}
      </Tag>
    );
  };

  let content: ReactNode;
  if (galleries.length === 0) {
    content = (
      <p className="rounded-md border border-dashed border-[var(--site-line)] py-10 text-center text-[0.875em] text-[var(--site-muted)]">
        No published galleries selected yet.
      </p>
    );
  } else if (open) {
    content = (
      <div>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="mb-4 inline-flex items-center gap-1 text-[0.875em] text-[var(--site-muted)] hover:text-[var(--site-text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All work
        </button>
        {heading(open.title)}
        {open.description ? (
          <p className={cn("-mt-2 mb-6 text-[var(--site-muted)]", center && "text-center")}>
            {open.description}
          </p>
        ) : null}
        <PhotoLayout
          config={{ ...config, display: "photos" }}
          tiles={photosOf(open).map((p, i) => ({ key: `${p}-${i}`, photo: p }))}
        />
        <p className={cn("mt-6 text-[0.875em]", center && "text-center")}>
          <a
            href={`/g/${open.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4"
          >
            View the full gallery <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    );
  } else if (config.display === "covers") {
    content = (
      <PhotoLayout
        config={config}
        tiles={galleries.map((g) => ({
          key: g.id,
          photo: g.cover,
          title: g.title,
          subtitle: `${g.photoCount} photos`,
          locked: g.privacy === "password",
          onOpen: () => setOpenId(g.id),
        }))}
      />
    );
  } else {
    content = (
      <div className="space-y-12">
        {galleries.map((g) => (
          <div key={g.id}>
            {config.showTitles ? heading(g.title, "h3") : null}
            <PhotoLayout
              config={{ ...config, showTitles: false }}
              tiles={photosOf(g).map((p, i) => ({ key: `${g.id}-${p}-${i}`, photo: p }))}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={cn("mx-auto px-5", theme.container, theme.pad)}>
      {s.heading && !open ? heading(s.heading) : null}
      {s.body && !open ? (
        <p className={cn("-mt-2 mb-6 text-[var(--site-muted)]", center && "text-center")}>
          {s.body}
        </p>
      ) : null}
      {content}
    </section>
  );
}

// ---------- blog ----------

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/;

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        if (part.type === "bold") return <strong key={i}>{part.text}</strong>;
        if (part.type === "italic") return <em key={i}>{part.text}</em>;
        if (part.type === "link") {
          return SAFE_HREF.test(part.href) ? (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--site-accent)] underline underline-offset-4"
            >
              {part.text}
            </a>
          ) : (
            <span key={i}>{part.text}</span>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </>
  );
}

export function PostArticle({
  post,
  theme,
  onBack,
}: {
  post: BlogPost;
  theme: SiteTheme;
  onBack?: () => void;
}) {
  const h = theme.headingClass;
  return (
    <article className={cn("mx-auto max-w-3xl px-5", theme.pad)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-[0.875em] text-[var(--site-muted)] hover:text-[var(--site-text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All posts
        </button>
      ) : null}
      <p className="text-[0.8em] uppercase tracking-[0.14em] text-[var(--site-muted)]">
        {formatPostDate(post.date)} · {readingMinutes(post.body)} min read
      </p>
      <h1 className={cn(h, "mt-3 text-[2em] leading-tight @2xl:text-[2.75em]")}>
        {post.title || "Untitled post"}
      </h1>
      {post.excerpt ? (
        <p className="mt-4 text-[1.1em] text-[var(--site-muted)]">
          <InlineText text={post.excerpt} />
        </p>
      ) : null}
      {post.cover ? (
        <img
          src={img(post.cover, 1400, 800)}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-[var(--site-radius)] object-cover"
        />
      ) : null}
      <div className="mt-8 space-y-5 leading-relaxed">
        {parseBody(post.body).map((block, i) => {
          switch (block.type) {
            case "h2":
              return (
                <h2 key={i} className={cn(h, "pt-4 text-[1.5em]")}>
                  {block.text}
                </h2>
              );
            case "h3":
              return (
                <h3 key={i} className={cn(h, "pt-2 text-[1.2em]")}>
                  {block.text}
                </h3>
              );
            case "quote":
              return (
                <blockquote
                  key={i}
                  className={cn(h, "border-l-2 border-[var(--site-accent)] pl-5 text-[1.25em]")}
                >
                  <InlineText text={block.text} />
                </blockquote>
              );
            case "list":
              return (
                <ul key={i} className="list-disc space-y-1 pl-6">
                  {block.items.map((item, j) => (
                    <li key={j}>
                      <InlineText text={item} />
                    </li>
                  ))}
                </ul>
              );
            case "image":
              return (
                <figure key={i}>
                  <img
                    src={img(block.photo, 1400)}
                    alt={block.caption}
                    className="w-full rounded-[var(--site-radius)] object-cover"
                    loading="lazy"
                  />
                  {block.caption ? (
                    <figcaption className="mt-2 text-center text-[0.8em] text-[var(--site-muted)]">
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            case "p":
              return (
                <p key={i}>
                  <InlineText text={block.text} />
                </p>
              );
          }
        })}
      </div>
      {post.tags.length > 0 ? (
        <p className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--site-surface)] px-3 py-1 text-[0.75em] text-[var(--site-muted)]"
            >
              #{t}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}

function BlogSection({
  section: s,
  theme,
  posts,
}: {
  section: SiteSection;
  theme: SiteTheme;
  posts: BlogPost[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = publishedPosts(posts);
  const open = visible.find((p) => p.id === openId);
  const center = theme.design.align === "center";
  if (open) return <PostArticle post={open} theme={theme} onBack={() => setOpenId(null)} />;
  return (
    <section className={cn("mx-auto px-5", theme.container, theme.pad)}>
      {s.heading ? (
        <h2
          className={cn(
            theme.headingClass,
            "mb-2 text-[1.5em] @2xl:text-[1.875em]",
            center && "text-center",
          )}
        >
          {s.heading}
        </h2>
      ) : null}
      {s.body ? (
        <p className={cn("mb-8 text-[var(--site-muted)]", center && "text-center")}>{s.body}</p>
      ) : null}
      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--site-line)] py-10 text-center text-[0.875em] text-[var(--site-muted)]">
          No published posts yet.
        </p>
      ) : (
        <div className="grid gap-8 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              aria-label={`Read ${p.title}`}
              className="group text-left"
            >
              {p.cover ? (
                <span className="block overflow-hidden rounded-[var(--site-radius)]">
                  <img
                    src={img(p.cover, 800, 560)}
                    alt=""
                    loading="lazy"
                    className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </span>
              ) : null}
              <span className="mt-4 block text-[0.75em] uppercase tracking-[0.14em] text-[var(--site-muted)]">
                {formatPostDate(p.date)}
              </span>
              <span className={cn(theme.headingClass, "mt-1 block text-[1.25em] leading-snug")}>
                {p.title}
              </span>
              {p.excerpt ? (
                <span className="mt-2 block text-[0.9em] text-[var(--site-muted)]">
                  {plainText(p.excerpt)}
                </span>
              ) : null}
              <span className="mt-3 inline-block text-[0.875em] underline underline-offset-4">
                Read more
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ContactSection({ section: s, theme }: { section: SiteSection; theme: SiteTheme }) {
  const [sent, setSent] = useState(false);
  const field =
    "w-full rounded-[var(--site-radius)] border border-[var(--site-line)] bg-[var(--site-bg)] px-3 py-2 text-[0.875em] outline-none focus:border-[var(--site-accent)]";
  return (
    <section
      className={cn("mx-auto grid gap-10 px-5 @2xl:grid-cols-2", theme.container, theme.pad)}
    >
      <div>
        <h2 className={cn(theme.headingClass, "text-[1.5em] @2xl:text-[2.25em]")}>{s.heading}</h2>
        {s.body ? (
          <p className="mt-4 whitespace-pre-line text-[var(--site-muted)]">{s.body}</p>
        ) : null}
      </div>
      {sent ? (
        <p
          role="status"
          className="self-center rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6 text-[0.875em]"
        >
          Thanks! This is a preview, so the message wasn't sent — inquiries need a backend.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input required aria-label="Your name" placeholder="Your name" className={field} />
          <input required type="email" aria-label="Email" placeholder="Email" className={field} />
          <textarea
            aria-label="Message"
            placeholder="Tell me about your plans"
            rows={4}
            className={field}
          />
          <button
            type="submit"
            className="rounded-[var(--site-radius)] bg-[var(--site-accent)] px-5 py-2.5 text-[0.875em] font-medium text-[var(--site-accent-fg)]"
          >
            {s.buttons[0]?.label || "Send"}
          </button>
        </form>
      )}
    </section>
  );
}

/**
 * Renders children at a fixed virtual width and scales them down to fit the
 * available width, like a zoomed-out browser window.
 */
export function ScaledFrame({
  width,
  children,
  className,
}: {
  width: number;
  children: ReactNode;
  className?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const s = Math.min(1, o.clientWidth / width);
      setScale(s);
      setHeight(i.scrollHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className={cn("w-0 min-w-full overflow-hidden", className)} style={{ height }}>
      <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** What visitors see while the site is offline. */
export function ComingSoon({ site }: { site: WebsiteState }) {
  const theme = buildTheme(resolveDesign(site.templateId, site.design));
  return (
    <div
      style={theme.style}
      className="@container grid min-h-full place-items-center bg-[var(--site-bg)] px-6 py-24 text-center text-[var(--site-text)]"
    >
      <div>
        <p className={cn(theme.headingClass, "text-[2em]")}>{site.siteTitle}</p>
        <p className="mt-3 text-[var(--site-muted)]">Our new website is coming soon.</p>
      </div>
    </div>
  );
}
