import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, BellRing, Copy, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, PageError, Panel, pageHead } from "@/components/kit";
import { ResponseStateBadge } from "@/components/questionnaires";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate } from "@/lib/demo-data";
import { formatAnswer, isAnswered, responseProgress, responseState } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/questionnaires/$id")({
  head: () => pageHead("Questionnaire", "Client answers and response status."),
  component: QuestionnairePage,
  errorComponent: ({ reset }) => (
    <PageError title="Couldn't load this questionnaire" reset={reset} />
  ),
});

const stamp = (iso: string) => format(new Date(iso), "MMM d, yyyy 'at' h:mm a");

function QuestionnairePage() {
  const { id } = Route.useParams();
  const {
    state: demo,
    ready,
    remindQuestionnaire,
    reopenQuestionnaire,
    deleteQuestionnaire,
    restoreQuestionnaire,
  } = useDemo();
  const goTo = useNavigate();
  const q = demo.questionnaires.find((x) => x.id === id);

  if (!ready)
    return (
      <div
        className="mx-auto max-w-5xl space-y-4"
        aria-busy="true"
        aria-label="Loading questionnaire"
        role="status"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  if (!q)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Questionnaire not found"
          description="It may have been deleted, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/questionnaires">View questionnaires</Link>
            </Button>
          }
        />
      </div>
    );

  const client = demo.clients.find((c) => c.id === q.clientId);
  const project = demo.projects.find((p) => p.id === q.projectId);
  const state = responseState(q, DEMO_TODAY);
  const progress = responseProgress(q.questions, q.answers);
  const link = typeof window === "undefined" ? `/q/${q.id}` : `${window.location.origin}/q/${q.id}`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/questionnaires"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Questionnaires
      </Link>
      <div className="flex flex-col gap-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{q.title}</h1>
          <ResponseStateBadge questionnaire={q} />
        </div>
        <p className="text-sm text-muted-foreground">
          {client ? (
            <Link to="/clients/$id" params={{ id: client.id }} className="hover:underline">
              {client.name}
            </Link>
          ) : null}
          {project ? (
            <>
              {" · "}
              <Link to="/projects/$id" params={{ id: project.id }} className="hover:underline">
                {project.name}
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 rounded-lg border bg-card shadow-soft">
          <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Answers</h2>
            <span className="text-xs text-muted-foreground">
              {progress.answered} of {progress.total} answered
            </span>
          </div>
          {state === "not_started" || (state === "overdue" && progress.answered === 0) ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {client?.name ?? "The client"} hasn't started yet. Answers appear here as they save.
            </p>
          ) : (
            <ol className="divide-y">
              {q.questions.map((question, i) => {
                const a = q.answers[question.id];
                return (
                  <li key={question.id} className="px-5 py-3.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {i + 1}. {question.label}
                      {question.required ? " *" : ""}
                    </p>
                    <p
                      className={cn(
                        "mt-1 whitespace-pre-wrap text-sm",
                        !isAnswered(a) && "italic text-muted-foreground",
                      )}
                    >
                      {isAnswered(a)
                        ? formatAnswer(question, a)
                        : question.required && state !== "submitted"
                          ? "Not answered yet (required)"
                          : "No answer"}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="space-y-4">
          <Panel className="p-4 text-xs">
            <h2 className="text-sm font-semibold">Status</h2>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Answered"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  state === "submitted" ? "bg-success" : "bg-clay",
                )}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <dl className="mt-3 space-y-1.5">
              <Row label="Sent">{stamp(q.sentAt)}</Row>
              <Row label="Due">
                <span className={cn(state === "overdue" && "font-medium text-rose")}>
                  {formatDate(q.dueDate)}
                </span>
              </Row>
              {q.lastSavedAt && state !== "submitted" ? (
                <Row label="Last saved">{stamp(q.lastSavedAt)}</Row>
              ) : null}
              {q.submittedAt ? <Row label="Submitted">{stamp(q.submittedAt)}</Row> : null}
              {q.remindedAt ? <Row label="Reminded">{stamp(q.remindedAt)}</Row> : null}
            </dl>
          </Panel>
          <Panel className="space-y-2 p-4">
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start bg-card"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  toast.success("Client link copied", { description: link });
                } catch {
                  toast.info(link);
                }
              }}
            >
              <Copy /> Copy client link
            </Button>
            <Button asChild size="sm" variant="outline" className="w-full justify-start bg-card">
              <a href={`/q/${q.id}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Open client view
              </a>
            </Button>
            {state !== "submitted" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-card"
                onClick={() => {
                  remindQuestionnaire(q.id);
                  toast.success(`Reminder sent to ${client?.name}`, {
                    description: "Demo — no email is sent.",
                  });
                }}
              >
                <BellRing /> Send reminder
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-card"
                onClick={() => {
                  reopenQuestionnaire(q.id);
                  toast("Reopened — the client can edit their answers again");
                }}
              >
                <RotateCcw /> Reopen for edits
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                deleteQuestionnaire(q.id);
                void goTo({ to: "/questionnaires" });
                toast("Questionnaire deleted", {
                  action: { label: "Undo", onClick: () => restoreQuestionnaire(q) },
                });
              }}
            >
              <Trash2 /> Delete
            </Button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
