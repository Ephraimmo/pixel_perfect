import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarClock, MailCheck, MailOpen, Plus, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  pageHead,
} from "@/components/kit";
import { ComposeEmailDialog, EmailPreview } from "@/components/emails";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import { formatDate } from "@/lib/demo-data";
import type { EmailCategory, SentEmail } from "@/lib/emails-data";
import {
  EMAIL_CATEGORY_LABELS,
  filterTemplates,
  sortOutbox,
  validateEmailSearch,
  type EmailSearch,
} from "@/lib/emails";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/emails/")({
  head: () => pageHead("Email Templates", "Reusable emails with client details filled in."),
  validateSearch: validateEmailSearch,
  component: Emails,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your emails" reset={reset} />,
});

type SearchPatch = { [K in keyof EmailSearch]?: EmailSearch[K] | undefined };

function Emails() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({ search: (prev) => validateEmailSearch({ ...prev, ...patch }), replace: true });
  const view = search.view ?? "templates";
  const scheduled = demo.sentEmails.filter((e) => e.status === "scheduled").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Email Templates"
        description={
          ready
            ? `${demo.emailTemplates.length} templates · ${scheduled} scheduled · ${demo.sentEmails.length - scheduled} sent`
            : "Reusable emails with client details filled in."
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              onClick={() => void goTo({ to: "/emails/$id", params: { id: "new" } })}
            >
              <Plus /> New Template
            </Button>
            <ComposeEmailDialog
              trigger={
                <Button size="sm">
                  <Send /> Compose
                </Button>
              }
            />
          </>
        }
      />
      <div
        className="mb-5 inline-flex gap-1 rounded-lg border bg-card p-1"
        role="group"
        aria-label="Emails view"
      >
        {(
          [
            ["templates", "Templates"],
            ["sent", "Sent & scheduled"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() =>
              update({ view: v === "sent" ? "sent" : undefined, q: "", category: undefined })
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              view === v
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {!ready ? (
        <ListSkeleton label="Loading emails" />
      ) : view === "sent" ? (
        <Outbox />
      ) : (
        <Templates search={search} update={update} />
      )}
    </div>
  );
}

function Templates({ search, update }: { search: EmailSearch; update: (p: SearchPatch) => void }) {
  const { state: demo } = useDemo();
  const q = search.q ?? "";
  const rows = filterTemplates(demo.emailTemplates, q, search.category);
  let body: ReactNode;
  if (demo.emailTemplates.length === 0)
    body = (
      <EmptyState
        title="No email templates"
        description="Save the emails you send again and again — confirmations, reminders, gallery deliveries."
        action={
          <Button asChild size="sm">
            <Link to="/emails/$id" params={{ id: "new" }}>
              <Plus /> Create a template
            </Link>
          </Button>
        }
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        title="No templates match"
        description="Try another word or category."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ q: "", category: undefined })}
          >
            Clear filters
          </Button>
        }
      />
    );
  else
    body = (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <li key={t.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-soft">
            <span className="w-fit rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {EMAIL_CATEGORY_LABELS[t.category]}
            </span>
            <p className="mt-2 text-sm font-semibold">{t.name}</p>
            <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{t.subject}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Updated {formatDate(t.updatedAt)}
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
                <Link to="/emails/$id" params={{ id: t.id }}>
                  Edit
                </Link>
              </Button>
              <ComposeEmailDialog
                defaultTemplateId={t.id}
                trigger={
                  <Button size="sm" className="h-8 text-xs">
                    Use
                  </Button>
                }
              />
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="h-9 bg-card pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => update({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {(Object.keys(EMAIL_CATEGORY_LABELS) as EmailCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={search.category === c}
              onClick={() => update({ category: search.category === c ? undefined : c })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px]",
                search.category === c
                  ? "border-foreground bg-accent font-medium"
                  : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {EMAIL_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>
      {body}
    </>
  );
}

function Outbox() {
  const { state: demo, cancelScheduledEmail, sendEmail } = useDemo();
  const [viewing, setViewing] = useState<SentEmail | null>(null);
  const rows = sortOutbox(demo.sentEmails);
  const name = (e: SentEmail) =>
    demo.clients.find((c) => c.id === e.clientId)?.name ?? "You (test)";
  if (rows.length === 0)
    return (
      <EmptyState
        title="Nothing sent yet"
        description="Emails you send or schedule from Pixora show up here."
        action={
          <ComposeEmailDialog
            trigger={
              <Button size="sm">
                <Send /> Compose an email
              </Button>
            }
          />
        }
      />
    );
  return (
    <>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
        {rows.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-muted-foreground">
              {e.status === "scheduled" ? (
                <CalendarClock className="h-4 w-4 text-info" />
              ) : e.openedAt ? (
                <MailOpen className="h-4 w-4" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
            </span>
            <button
              type="button"
              onClick={() => setViewing(e)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-medium">{e.subject}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {name(e)} ·{" "}
                {e.status === "scheduled"
                  ? `scheduled for ${format(new Date(e.at), "MMM d 'at' h:mm a")}`
                  : `sent ${format(new Date(e.at), "MMM d 'at' h:mm a")}${e.openedAt ? " · opened" : ""}`}
              </span>
            </button>
            {e.status === "scheduled" ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  cancelScheduledEmail(e.id);
                  toast("Scheduled email cancelled", {
                    action: {
                      label: "Undo",
                      onClick: () =>
                        sendEmail({
                          clientId: e.clientId,
                          to: e.to,
                          subject: e.subject,
                          body: e.body,
                          templateId: e.templateId,
                          scheduleAt: e.at,
                        }),
                    },
                  });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90svh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {viewing?.status === "scheduled" ? "Scheduled email" : "Sent email"}
            </DialogTitle>
          </DialogHeader>
          {viewing ? (
            <EmailPreview
              from={`${demo.profile.name} <${demo.profile.email}>`}
              to={`${name(viewing)} <${viewing.to}>`}
              subject={viewing.subject}
              body={viewing.body}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
