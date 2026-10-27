import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ClipboardList, PenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  TabBar,
  pageHead,
} from "@/components/kit";
import {
  QuestionEditor,
  ResponseStateBadge,
  SendQuestionnaireDialog,
} from "@/components/questionnaires";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate } from "@/lib/demo-data";
import type { Question } from "@/lib/questionnaires-data";
import {
  QUESTIONNAIRE_TABS,
  QUESTION_TYPE_LABELS,
  countQuestionnaires,
  questionnaireTab,
  responseProgress,
  sortQuestionnaires,
  validateQuestionnaireSearch,
  validateTemplate,
  type QuestionnaireSearch,
} from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/questionnaires/")({
  head: () => pageHead("Questionnaires", "Reusable questions, templates and client responses."),
  validateSearch: validateQuestionnaireSearch,
  component: Questionnaires,
  errorComponent: ({ reset }) => <PageError title="Couldn't load questionnaires" reset={reset} />,
});

type SearchPatch = { [K in keyof QuestionnaireSearch]?: QuestionnaireSearch[K] | undefined };

function Questionnaires() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateQuestionnaireSearch({ ...prev, ...patch }),
      replace: true,
    });
  const view = search.view ?? "sent";
  const counts = countQuestionnaires(demo.questionnaires, DEMO_TODAY);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Questionnaires"
        description={
          ready
            ? `${counts.awaiting + counts.overdue} awaiting answers · ${counts.overdue} overdue · ${counts.submitted} submitted`
            : "Reusable questions, templates and client responses."
        }
        actions={
          view === "templates" ? (
            <Button
              size="sm"
              onClick={() =>
                void goTo({ to: "/questionnaires/templates/$id", params: { id: "new" } })
              }
            >
              <Plus /> New Template
            </Button>
          ) : view === "library" ? (
            <LibraryQuestionDialog />
          ) : (
            <SendQuestionnaireDialog />
          )
        }
      />
      <div
        className="mb-5 inline-flex gap-1 rounded-lg border bg-card p-1"
        role="group"
        aria-label="Questionnaires view"
      >
        {(
          [
            ["sent", "Sent"],
            ["templates", "Templates"],
            ["library", "Question library"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => update({ view: v === "sent" ? undefined : v, tab: undefined })}
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
        <ListSkeleton label="Loading questionnaires" />
      ) : view === "templates" ? (
        <Templates />
      ) : view === "library" ? (
        <Library />
      ) : (
        <Sent tab={search.tab ?? "all"} onTab={(t) => update({ tab: t })} />
      )}
    </div>
  );
}

function Sent({
  tab,
  onTab,
}: {
  tab: NonNullable<QuestionnaireSearch["tab"]> | "all";
  onTab: (t: QuestionnaireSearch["tab"]) => void;
}) {
  const { state: demo } = useDemo();
  const counts = countQuestionnaires(demo.questionnaires, DEMO_TODAY);
  const rows = sortQuestionnaires(
    demo.questionnaires.filter((q) => tab === "all" || questionnaireTab(q, DEMO_TODAY) === tab),
    DEMO_TODAY,
  );
  const clientName = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";

  let body: ReactNode;
  if (demo.questionnaires.length === 0)
    body = (
      <EmptyState
        title="No questionnaires sent yet"
        description="Send one before a shoot to collect timelines, names and must-have shots."
        action={
          <SendQuestionnaireDialog
            trigger={
              <Button size="sm">
                <Plus /> Send your first questionnaire
              </Button>
            }
          />
        }
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        title={
          tab === "overdue"
            ? "Nothing overdue"
            : tab === "submitted"
              ? "No submissions yet"
              : "Nothing awaiting"
        }
        description="Responses move between tabs as clients answer."
        action={
          <Button size="sm" variant="outline" onClick={() => onTab(undefined)}>
            Show all
          </Button>
        }
      />
    );
  else
    body = (
      <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
        {rows.map((q) => {
          const p = responseProgress(q.questions, q.answers);
          return (
            <li key={q.id}>
              <Link
                to="/questionnaires/$id"
                params={{ id: q.id }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{q.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {clientName(q.clientId)} ·{" "}
                    {q.submittedAt
                      ? `submitted ${formatDate(q.submittedAt.slice(0, 10))}`
                      : `due ${formatDate(q.dueDate)}`}
                  </span>
                </span>
                <span className="hidden w-28 sm:block">
                  <span className="block text-right text-[11px] text-muted-foreground">
                    {p.answered}/{p.total} answered
                  </span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-clay"
                      style={{ width: `${p.percent}%` }}
                    />
                  </span>
                </span>
                <ResponseStateBadge questionnaire={q} />
              </Link>
            </li>
          );
        })}
      </ul>
    );

  return (
    <>
      <TabBar
        value={tab}
        onChange={(t) => onTab(t === "all" ? undefined : t)}
        tabs={QUESTIONNAIRE_TABS.map((t) => ({
          value: t.value,
          label: `${t.label} (${counts[t.value]})`,
        }))}
      />
      <div className="mt-4">{body}</div>
    </>
  );
}

function Templates() {
  const { state: demo } = useDemo();
  if (demo.questionnaireTemplates.length === 0)
    return (
      <EmptyState
        title="No templates"
        description="Build a questionnaire once and send it to every client."
        action={
          <Button asChild size="sm">
            <Link to="/questionnaires/templates/$id" params={{ id: "new" }}>
              <Plus /> New template
            </Link>
          </Button>
        }
      />
    );
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {demo.questionnaireTemplates.map((t) => {
        const sent = demo.questionnaires.filter((q) => q.templateId === t.id).length;
        return (
          <li key={t.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-soft">
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{t.description}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {t.questions.length} questions · sent {sent} {sent === 1 ? "time" : "times"} · updated{" "}
              {formatDate(t.updatedAt)}
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
                <Link to="/questionnaires/templates/$id" params={{ id: t.id }}>
                  Edit
                </Link>
              </Button>
              <SendQuestionnaireDialog
                defaultTemplateId={t.id}
                trigger={
                  <Button size="sm" className="h-8 text-xs">
                    Send
                  </Button>
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Library() {
  const { state: demo, deleteLibraryQuestion, restoreLibraryQuestion } = useDemo();
  if (demo.questionLibrary.length === 0)
    return (
      <EmptyState
        title="Your question library is empty"
        description="Save questions you ask often so you can add them to any template."
        action={<LibraryQuestionDialog />}
      />
    );
  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
      {demo.questionLibrary.map((q) => {
        const used = demo.questionnaireTemplates.filter((t) =>
          t.questions.some((x) => x.label === q.label),
        ).length;
        return (
          <li key={q.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {q.label}
                {q.required ? <span className="text-muted-foreground"> *</span> : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {QUESTION_TYPE_LABELS[q.type]}
                {q.options.length ? ` · ${q.options.join(" / ")}` : ""}
                {used ? ` · in ${used} ${used === 1 ? "template" : "templates"}` : ""}
              </span>
            </span>
            <LibraryQuestionDialog
              question={q}
              trigger={
                <button
                  type="button"
                  aria-label={`Edit ${q.label}`}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <PenLine className="h-3.5 w-3.5" />
                </button>
              }
            />
            <button
              type="button"
              aria-label={`Delete ${q.label}`}
              onClick={() => {
                deleteLibraryQuestion(q.id);
                toast("Question removed from library", {
                  description: "Templates that use it keep their copy.",
                  action: { label: "Undo", onClick: () => restoreLibraryQuestion(q) },
                });
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LibraryQuestionDialog({
  question,
  trigger,
}: {
  question?: Question;
  trigger?: ReactNode;
}) {
  const { saveLibraryQuestion } = useDemo();
  const blank = (): Question =>
    question ?? {
      id: `ql-${Date.now().toString(36)}`,
      label: "",
      type: "short",
      required: false,
      options: [],
      help: "",
    };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Question>(blank);
  const [submitted, setSubmitted] = useState(false);
  const error = validateTemplate({ name: "x", questions: [draft] }).byQuestion[draft.id];
  return (
    <>
      {trigger ? (
        <span
          onClick={() => {
            setDraft(blank());
            setSubmitted(false);
            setOpen(true);
          }}
        >
          {trigger}
        </span>
      ) : (
        <Button
          size="sm"
          onClick={() => {
            setDraft(blank());
            setSubmitted(false);
            setOpen(true);
          }}
        >
          <Plus /> New Question
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (error) return;
              saveLibraryQuestion({
                ...draft,
                label: draft.label.trim(),
                options: draft.options.map((o) => o.trim()),
              });
              toast.success(question ? "Question updated" : "Question added to your library");
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                {question ? "Edit question" : "New library question"}
              </DialogTitle>
              <DialogDescription>Library questions can be added to any template.</DialogDescription>
            </DialogHeader>
            <QuestionEditor
              question={draft}
              onChange={setDraft}
              error={submitted ? error : undefined}
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{question ? "Save question" : "Add question"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
