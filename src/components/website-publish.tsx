// Publish flow for the website builder: review changes and pre-publish checks,
// a simulated publish with progress steps, then a confirmation screen.
// No hosting backend exists — "publishing" copies the draft to the local live
// snapshot (see publishSite in lib/website.ts).

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useDemo } from "@/lib/store";
import { useWebsite } from "@/lib/website-store";
import {
  changeSummary,
  copyText,
  hasUnpublishedChanges,
  publishChecks,
  siteUrl,
  type WebsiteState,
} from "@/lib/website";
import { cn } from "@/lib/utils";

const STEP_MS = 650;

function imageCount(site: WebsiteState): number {
  const fromSections = site.pages
    .flatMap((p) => p.sections)
    .reduce((n, s) => n + (s.image ? 1 : 0) + s.images.length, 0);
  return fromSections + site.posts.filter((p) => p.cover).length;
}

/** Opens the publish dialog; shows how many changes are waiting. */
export function PublishButton({ className }: { className?: string }) {
  const { site } = useWebsite();
  const [open, setOpen] = useState(false);
  const changes = hasUnpublishedChanges(site) ? changeSummary(site, site.live).length : 0;
  const upToDate = site.online && changes === 0;

  return (
    <>
      <Button size="sm" className={className} disabled={upToDate} onClick={() => setOpen(true)}>
        {upToDate ? <Check /> : <Rocket />}
        {upToDate ? "Published" : site.online ? "Publish changes" : "Publish site"}
        {!upToDate && changes > 0 ? (
          <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[10px] tabular-nums">
            {changes}
          </span>
        ) : null}
      </Button>
      <PublishDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PublishDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent
        className="max-h-[90svh] max-w-lg overflow-y-auto"
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        onInteractOutside={(e) => busy && e.preventDefault()}
      >
        {open ? <PublishFlow onBusy={setBusy} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

type Phase = "review" | "publishing" | "done";

function PublishFlow({
  onBusy,
  onClose,
}: {
  onBusy: (busy: boolean) => void;
  onClose: () => void;
}) {
  const { site, publish } = useWebsite();
  const { state: demo } = useDemo();
  const [phase, setPhase] = useState<Phase>("review");
  const [step, setStep] = useState(0);
  // Freeze what was reviewed so the summary doesn't change under the user.
  const [changes] = useState(() => changeSummary(site, site.live));
  const [checks] = useState(() => publishChecks(site, demo.galleries));
  const url = siteUrl(site);
  const steps = [
    "Saving your draft",
    `Building ${site.pages.length} pages`,
    `Optimizing ${imageCount(site)} images`,
    `Publishing to ${url}`,
  ];

  useEffect(() => {
    if (phase !== "publishing") return;
    if (step >= steps.length) {
      publish();
      onBusy(false);
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setStep((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step]);

  const start = () => {
    onBusy(true);
    setStep(0);
    setPhase("publishing");
  };

  if (phase === "publishing") {
    return (
      <div aria-live="polite">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Publishing…</DialogTitle>
          <DialogDescription>Keep this window open — it only takes a moment.</DialogDescription>
        </DialogHeader>
        <Progress
          value={(step / steps.length) * 100}
          className="mt-5 h-1.5"
          aria-label="Publish progress"
        />
        <ol className="mt-4 space-y-2.5 text-sm">
          {steps.map((label, i) => (
            <li
              key={label}
              className={cn("flex items-center gap-2.5", i > step && "text-muted-foreground")}
            >
              {i < step ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : i === step ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="h-4 w-4 rounded-full border" />
              )}
              {label}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <DialogHeader className="mt-3 items-center sm:text-center">
          <DialogTitle className="display-title text-2xl">Your website is live</DialogTitle>
          <DialogDescription>
            {changes.length} change{changes.length === 1 ? "" : "s"} published to {url}.
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto mt-4 flex max-w-sm items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-left text-sm">
          <span className="min-w-0 flex-1 truncate">https://{url}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Copy site link"
            onClick={async () => {
              if (await copyText(`https://${url}`)) toast.success("Site link copied");
              else toast.error("Couldn't copy — your browser blocked clipboard access.");
            }}
          >
            <Copy />
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Demo: nothing is uploaded — the live version is kept in this browser.
        </p>
        <DialogFooter className="mt-5 gap-2 sm:justify-center">
          <Button asChild variant="outline">
            <Link
              to="/website-preview"
              search={{ version: "live" }}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink /> View live site
            </Link>
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="display-title text-xl">
          {site.online ? "Publish your changes?" : "Bring your site online?"}
        </DialogTitle>
        <DialogDescription>
          Visitors to <span className="font-medium text-foreground">{url}</span> will see the
          current draft.
        </DialogDescription>
      </DialogHeader>

      <section className="mt-4">
        <p className="text-xs font-medium">
          {changes.length === 0
            ? "No content changes"
            : `${changes.length} change${changes.length === 1 ? "" : "s"}`}
        </p>
        {changes.length > 0 ? (
          <ul
            aria-label="Changes to publish"
            className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-3 text-xs"
          >
            {changes.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/50" /> {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Your draft matches the last published version.
          </p>
        )}
      </section>

      <section className="mt-4">
        <p className="text-xs font-medium">Checks</p>
        {checks.length === 0 ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Everything looks good
          </p>
        ) : (
          <ul aria-label="Publish warnings" className="mt-2 space-y-2">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 rounded-md bg-warning/10 p-2.5 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span className="flex-1">{c.message}</span>
                <Link
                  to={c.fix.to}
                  {...(c.fix.params ? { params: c.fix.params } : {})}
                  onClick={onClose}
                  className="shrink-0 font-medium underline-offset-2 hover:underline"
                >
                  {c.fix.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {checks.length > 0 ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Warnings don't stop you publishing.
          </p>
        ) : null}
      </section>

      <DialogFooter className="mt-5 gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={start}>
          <Rocket /> {site.online ? "Publish now" : "Publish and go online"}
        </Button>
      </DialogFooter>
    </>
  );
}
