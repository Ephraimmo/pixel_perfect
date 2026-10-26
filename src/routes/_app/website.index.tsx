import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Eye, Globe, LayoutTemplate, Power, Rocket, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, PageHeader, Panel, pageHead } from "@/components/kit";
import { SiteStatusBadge, WebsiteTabs } from "@/components/website";
import { PublishDialog } from "@/components/website-publish";
import { ScaledFrame, SiteRenderer } from "@/components/website-renderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebsite } from "@/lib/website-store";
import { templateById } from "@/lib/website-templates";
import {
  changeSummary,
  copyText,
  hasUnpublishedChanges,
  publishedLabel,
  siteStatus,
  siteUrl,
} from "@/lib/website";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/")({
  head: () => pageHead("Website", "Your photography website's status, template and publishing."),
  component: WebsiteOverview,
});

/** Current time, refreshed every 30s so "x minutes ago" labels stay accurate. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function WebsiteOverview() {
  const { site, edit, unpublish, discard } = useWebsite();
  const now = useNow();
  const [confirmOffline, setConfirmOffline] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState(site.siteTitle);

  const home = site.pages.find((p) => p.kind === "home") ?? site.pages[0];
  const template = templateById(site.templateId);
  const status = siteStatus(site);
  const changed = hasUnpublishedChanges(site);
  const url = siteUrl(site);

  const changes = changed ? changeSummary(site, site.live) : [];

  const copyLink = async () => {
    if (await copyText(`https://${url}`)) toast.success("Site link copied");
    else toast.error("Couldn't copy — your browser blocked clipboard access.");
  };

  const saveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    const next = title.trim();
    if (!next) {
      toast.error("Your site needs a title.");
      return;
    }
    if (next === site.siteTitle) return;
    edit({ siteTitle: next });
    toast.success("Site title saved", { description: "Publish to make it live." });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <WebsiteTabs />
      <PageHeader
        title="Website"
        description={site.online ? `Your site is online at ${url}` : "Your site is offline"}
        actions={
          <>
            <Button asChild size="sm" variant="outline" className="bg-card">
              <Link to="/website/preview">
                <Eye /> Preview
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
              https://{url}
            </span>
          </div>
          <div className="relative max-h-[440px] overflow-hidden">
            {home ? (
              // A picture of the site: not focusable, so its links can't nest in ours.
              <div inert className="pointer-events-none">
                <ScaledFrame width={1280}>
                  <SiteRenderer site={site} page={home} />
                </ScaledFrame>
              </div>
            ) : null}
            <Link
              to="/website/preview"
              aria-label="Open site preview"
              className="absolute inset-0 transition-colors hover:bg-white/10"
            />
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Status</p>
              <SiteStatusBadge status={status} />
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="flex min-w-0 items-center gap-1">
                  <span className="truncate font-medium">{url}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    aria-label="Copy site link"
                    onClick={copyLink}
                  >
                    <Copy className="!size-3.5" />
                  </Button>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Last published</dt>
                <dd>{publishedLabel(site.lastPublishedAt, now)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Draft</dt>
                <dd>{changed ? "Has unpublished edits" : "Matches live site"}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent">
                <LayoutTemplate className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{template.name} template</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {template.category}
                  {site.publishedTemplateId !== site.templateId ? " · not published yet" : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="bg-card">
                <Link to="/website/templates">Change</Link>
              </Button>
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="text-sm font-medium">Publishing</p>
            {changes.length > 0 ? (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  {changes.length} unpublished change{changes.length === 1 ? "" : "s"}
                </summary>
                <ul aria-label="Unpublished changes" className="mt-2 space-y-1 pl-1">
                  {changes.map((c, i) => (
                    <li key={i}>· {c}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            <div className="mt-3 grid gap-2">
              <Button
                size="sm"
                onClick={() => setPublishing(true)}
                disabled={site.online && !changed}
              >
                <Rocket />
                {site.online
                  ? changed
                    ? "Publish changes"
                    : "Everything is published"
                  : "Bring site online"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline" className="bg-card">
                  <Link
                    to="/website-preview"
                    search={{ version: "live" }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> View live site
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  disabled={!site.online}
                  onClick={() => setConfirmOffline(true)}
                >
                  <Power /> Take offline
                </Button>
              </div>
              {changed ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setConfirmDiscard(true)}
                >
                  <Undo2 /> Discard unpublished changes
                </Button>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="mt-4 p-4">
        <form onSubmit={saveTitle} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ws-title" className="text-xs">
              Site title
            </Label>
            <Input
              id="ws-title"
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="bg-card">
            Save title
          </Button>
        </form>
      </Panel>

      <Panel className="mt-4">
        <p className="border-b px-4 py-2.5 text-sm font-medium">Publish history</p>
        <ul aria-label="Publish history" className="divide-y">
          {site.history.slice(0, 6).map((h) => (
            <li key={h.id} className="flex items-start gap-3 px-4 py-3 text-xs">
              <span
                className={cn(
                  "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  h.kind === "published"
                    ? "bg-success/12 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {h.kind === "published" ? (
                  <Rocket className="h-3 w-3" />
                ) : (
                  <Power className="h-3 w-3" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {h.kind === "published" ? "Published" : "Taken offline"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {publishedLabel(h.at, now)} · {h.by}
                  </span>
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {h.changes.slice(0, 3).join(" · ")}
                  {h.changes.length > 3 ? ` · +${h.changes.length - 3} more` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-4">
        <DemoNotice>
          <Globe className="mr-1 inline h-3 w-3 align-[-2px]" />
          Publishing is simulated: Pixora records each publish in this browser, but no site is
          hosted at {url} yet.
        </DemoNotice>
      </div>

      <PublishDialog open={publishing} onOpenChange={setPublishing} />

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unpublished changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your draft goes back to the version published{" "}
              {publishedLabel(site.lastPublishedAt, now).toLowerCase()}. {changes.length} change
              {changes.length === 1 ? "" : "s"} will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                discard();
                toast.success("Draft reset to the live version");
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOffline} onOpenChange={setConfirmOffline}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take your site offline?</AlertDialogTitle>
            <AlertDialogDescription>
              Visitors to {url} will see a "coming soon" page until you publish again. Your pages
              and edits are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                unpublish();
                toast.success("Website taken offline");
              }}
            >
              Take offline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
