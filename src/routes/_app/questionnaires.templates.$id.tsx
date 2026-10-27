import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Library, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, pageHead } from "@/components/kit";
import {
  QuestionEditor,
  QuestionField,
  SendQuestionnaireDialog,
} from "@/components/questionnaires";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo-data";
import type { Answer, Question, QuestionnaireTemplate } from "@/lib/questionnaires-data";
import {
  QUESTION_TYPE_LABELS,
  moveItem,
  templateHasErrors,
  validateTemplate,
} from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/questionnaires/templates/$id")({
  head: () => pageHead("Questionnaire Template", "Build a reusable questionnaire."),
  component: TemplatePage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this template" reset={reset} />,
});

const qid = () => `q-${Math.random().toString(36).slice(2, 8)}`;

function TemplatePage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const [fresh] = useState<QuestionnaireTemplate>(() => ({
    id: `qt-${Date.now().toString(36)}`,
    name: "",
    description: "",
    questions: [],
    updatedAt: DEMO_TODAY,
  }));
  if (!ready)
    return (
      <div
        className="mx-auto max-w-6xl space-y-4"
        aria-busy="true"
        aria-label="Loading template"
        role="status"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  const template = id === "new" ? fresh : demo.questionnaireTemplates.find((t) => t.id === id);
  if (!template)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Template not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/questionnaires" search={{ view: "templates" }}>
                View templates
              </Link>
            </Button>
          }
        />
      </div>
    );
  return <Builder key={template.id} template={template} isNew={id === "new"} />;
}

function Builder({ template: t, isNew }: { template: QuestionnaireTemplate; isNew: boolean }) {
  const {
    state: demo,
    saveQuestionnaireTemplate,
    deleteQuestionnaireTemplate,
    restoreQuestionnaireTemplate,
  } = useDemo();
  const goTo = useNavigate();
  const [name, setName] = useState(t.name);
  const [description, setDescription] = useState(t.description);
  const [questions, setQuestions] = useState<Question[]>(t.questions);
  const [submitted, setSubmitted] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, Answer>>({});
  const errors = validateTemplate({ name, questions });
  const dirty =
    isNew ||
    name !== t.name ||
    description !== t.description ||
    JSON.stringify(questions) !== JSON.stringify(t.questions);

  const add = (q: Omit<Question, "id">) => setQuestions((list) => [...list, { ...q, id: qid() }]);
  const save = () => {
    setSubmitted(true);
    if (templateHasErrors(errors)) {
      toast.error("Fix the highlighted questions before saving.");
      return;
    }
    const next: QuestionnaireTemplate = {
      ...t,
      name: name.trim(),
      description: description.trim(),
      questions: questions.map((q) => ({
        ...q,
        label: q.label.trim(),
        options: q.options.map((o) => o.trim()),
      })),
      updatedAt: DEMO_TODAY,
    };
    saveQuestionnaireTemplate(next);
    toast.success(isNew ? "Template created" : "Template saved");
    if (isNew)
      void goTo({ to: "/questionnaires/templates/$id", params: { id: next.id }, replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/questionnaires"
        search={{ view: "templates" }}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Templates
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{isNew ? "New questionnaire" : t.name}</h1>
          {dirty && !isNew ? <span className="text-xs text-warning">Unsaved changes</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  deleteQuestionnaireTemplate(t.id);
                  void goTo({ to: "/questionnaires", search: { view: "templates" } });
                  toast("Template deleted", {
                    action: { label: "Undo", onClick: () => restoreQuestionnaireTemplate(t) },
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
              <SendQuestionnaireDialog
                defaultTemplateId={t.id}
                trigger={
                  <Button size="sm" variant="outline" className="bg-card">
                    Send to a client
                  </Button>
                }
              />
            </>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty}>
            {isNew ? "Create template" : dirty ? "Save template" : "Saved"}
          </Button>
        </div>
      </div>

      <div
        className="mb-3 inline-flex rounded-md border bg-card p-0.5 text-xs lg:hidden"
        role="group"
        aria-label="Builder view"
      >
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "rounded px-3 py-1 capitalize",
              view === v ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <section className={cn("min-w-0 space-y-4", view === "preview" && "max-lg:hidden")}>
          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-soft">
            <Field id="qb-name" label="Name" required error={submitted ? errors.name : undefined}>
              <Input
                id="qb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engagement Session Prep"
              />
            </Field>
            <Field id="qb-desc" label="Description">
              <Input
                id="qb-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When to send it"
              />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Questions ({questions.length})</h2>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 bg-card text-xs"
                    >
                      <Library /> From library
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
                    {demo.questionLibrary.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        Your library is empty.
                      </p>
                    ) : (
                      demo.questionLibrary.map((q) => (
                        <DropdownMenuItem
                          key={q.id}
                          onSelect={() => add({ ...q, options: [...q.options] })}
                        >
                          <span className="min-w-0">
                            <span className="block truncate">{q.label}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {QUESTION_TYPE_LABELS[q.type]}
                            </span>
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 bg-card text-xs"
                  onClick={() =>
                    add({ label: "", type: "short", required: false, options: [], help: "" })
                  }
                >
                  <Plus /> New question
                </Button>
              </div>
            </div>
            {submitted && errors.questions ? (
              <p className="text-xs text-destructive">{errors.questions}</p>
            ) : null}
            {questions.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                Add questions from your library or write new ones.
              </p>
            ) : (
              questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={i}
                  error={submitted ? errors.byQuestion[q.id] : undefined}
                  onChange={(next) =>
                    setQuestions((list) => list.map((x) => (x.id === q.id ? next : x)))
                  }
                  onMove={(dir) => setQuestions((list) => moveItem(list, i, dir))}
                  onRemove={() => setQuestions((list) => list.filter((x) => x.id !== q.id))}
                />
              ))
            )}
          </div>
        </section>
        <div
          className={cn(
            "min-w-0 lg:sticky lg:top-20 lg:self-start",
            view === "edit" && "max-lg:hidden",
          )}
        >
          <p className="eyebrow mb-2">Client preview</p>
          <div
            className="space-y-5 rounded-lg border bg-card p-5 shadow-soft"
            aria-label="Questionnaire preview"
          >
            <div>
              <p className="display-title text-xl">{name || "Untitled questionnaire"}</p>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Questions appear here as you add them.
              </p>
            ) : (
              questions.map((q, i) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  index={i}
                  value={previewAnswers[q.id]}
                  onChange={(v) => setPreviewAnswers((a) => ({ ...a, [q.id]: v }))}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
