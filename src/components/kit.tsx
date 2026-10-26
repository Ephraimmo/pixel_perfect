import { type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Aperture, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatar } from "@/lib/demo-data";
import { initials } from "@/lib/clients";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Standard head() metadata for an app page. */
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — Pixora` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — Pixora` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-1.5 text-foreground", className)}>
      <Aperture className="h-[1.1em] w-[1.1em]" strokeWidth={2.25} />
      <span className="font-display text-[1.15em] font-medium tracking-tight">Pixora</span>
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="display-title text-2xl text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-soft", className)}>{children}</section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="display-title text-lg text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const tone = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/12 text-info",
  rose: "bg-rose/12 text-rose",
  muted: "bg-muted text-muted-foreground",
} as const;

const statusTone: Record<string, keyof typeof tone> = {
  published: "success",
  active: "success",
  paid: "success",
  confirmed: "success",
  connected: "success",
  draft: "warning",
  pending: "warning",
  processing: "rose",
  shipped: "info",
  archived: "muted",
  inactive: "muted",
  past: "muted",
  sent: "info",
  partial: "warning",
  overdue: "rose",
  void: "muted",
  completed: "info",
  cancelled: "rose",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize",
        tone[statusTone[status] ?? "muted"],
      )}
    >
      {label ?? status}
    </span>
  );
}

/** Honest banner for demo-only functionality. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-sand-foreground/15 bg-sand px-4 py-3 text-sand-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

/** Round avatar from a full image URL. */
export function Avatar({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string | undefined;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-8 w-8 shrink-0 rounded-full object-cover", className)}
      loading="lazy"
    />
  );
}

/** A person's photo, or their initials when there is none. */
export function PersonAvatar({
  name,
  photo,
  size = 96,
  className,
}: {
  name: string;
  photo: string;
  size?: number;
  className?: string;
}) {
  if (photo) return <Avatar src={avatar(photo, size)} alt="" className={className} />;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-[11px] font-semibold text-sand-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Inline error with an optional retry. */
export function ErrorState({
  title,
  description = "Something went wrong while loading this. Your demo data is safe.",
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <p className="display-title mt-2 text-lg text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4 bg-card" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Route errorComponent body: keeps the app shell and offers a retry. */
export function PageError({ title, reset }: { title: string; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-5xl">
      <ErrorState
        title={title}
        onRetry={() => {
          void router.invalidate();
          reset();
        }}
      />
    </div>
  );
}

/** Placeholder rows while demo data loads. */
export function ListSkeleton({ rows = 5, label }: { rows?: number; label: string }) {
  return (
    <div
      className="divide-y rounded-lg border bg-card"
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="hidden h-3 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Labelled form control with an optional error message (wire aria-describedby to `${id}-error`). */
export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
        {required ? <span className="text-muted-foreground"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Segmented links between sibling pages (e.g. Products / Orders). */
export function SubNav({ items }: { items: { to: string; label: string; exact?: boolean }[] }) {
  return (
    <div className="mb-5 inline-flex gap-1 rounded-lg border bg-card p-1">
      {items.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          activeOptions={{ exact: i.exact ?? false }}
          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "bg-accent !text-foreground font-medium" }}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

/** Underlined tab strip used across app pages. */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-6 overflow-x-auto border-b", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px shrink-0 border-b-2 pb-2.5 text-sm transition-colors",
            value === t.value
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export { Button };
