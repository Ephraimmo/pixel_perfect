import { type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="display-title mt-1 text-2xl text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <p className="display-title mt-2 text-2xl text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-soft", className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      {Icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="display-title mt-4 text-lg text-foreground">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const statusStyles: Record<string, { label?: string; className: string }> = {
  published: { className: "bg-clay/10 text-clay border-clay/25" },
  paid: { className: "bg-clay/10 text-clay border-clay/25" },
  signed: { className: "bg-clay/10 text-clay border-clay/25" },
  accepted: { className: "bg-clay/10 text-clay border-clay/25" },
  won: { className: "bg-clay/10 text-clay border-clay/25" },
  fulfilled: { className: "bg-clay/10 text-clay border-clay/25" },
  active: { className: "bg-clay/10 text-clay border-clay/25" },
  scheduled: { className: "bg-sand text-sand-foreground border-transparent" },
  sent: { className: "bg-sand text-sand-foreground border-transparent" },
  "awaiting-signature": { label: "Awaiting signature", className: "bg-sand text-sand-foreground border-transparent" },
  contacted: { className: "bg-sand text-sand-foreground border-transparent" },
  quoted: { className: "bg-sand text-sand-foreground border-transparent" },
  pending: { className: "bg-sand text-sand-foreground border-transparent" },
  invited: { className: "bg-sand text-sand-foreground border-transparent" },
  draft: { className: "bg-secondary text-secondary-foreground border-transparent" },
  new: { className: "bg-secondary text-secondary-foreground border-transparent" },
  inactive: { className: "bg-secondary text-secondary-foreground border-transparent" },
  archived: { className: "bg-muted text-muted-foreground border-transparent" },
  past: { className: "bg-muted text-muted-foreground border-transparent" },
  completed: { className: "bg-muted text-muted-foreground border-transparent" },
  overdue: { className: "bg-destructive/10 text-destructive border-destructive/25" },
  declined: { className: "bg-destructive/10 text-destructive border-destructive/25" },
  lost: { className: "bg-destructive/10 text-destructive border-destructive/25" },
  refunded: { className: "bg-destructive/10 text-destructive border-destructive/25" },
  cancelled: { className: "bg-destructive/10 text-destructive border-destructive/25" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = statusStyles[status] ?? { className: "bg-secondary text-secondary-foreground border-transparent" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        style.className,
      )}
    >
      {label ?? status.replace(/-/g, " ")}
    </span>
  );
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  destructive = true,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm font-medium text-clay underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export { Button };
