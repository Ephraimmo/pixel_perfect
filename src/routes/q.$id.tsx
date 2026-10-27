import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { Check, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, ErrorState, Logo } from "@/components/kit";
import { QuestionField } from "@/components/questionnaires";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate } from "@/lib/demo-data";
import type { Answer, Questionnaire } from "@/lib/questionnaires-data";
import { formatAnswer, isAnswered, responseProgress, validateAnswers } from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/q/$id")({
  head: () => ({
    meta: [
      { title: "Your questionnaire — Karabo Photography" },
      { name: "description", content: "Answer a few questions before your session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientQuestionnaire,
  errorComponent: ({ reset }) => (
    <Shell>
      <ErrorState
        title="This form didn't load"
        description="Please refresh the page or try again shortly."
        onRetry={reset}
      />
    </Shell>
  ),
});

function Shell({
  children,
  studio = "Karabo Photography",
}: {
  children: React.ReactNode;
  studio?: string;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="display-title truncate text-lg">{studio}</p>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            Forms by <Logo className="text-xs" />
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function ClientQuestionnaire() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const q = demo.questionnaires.find((x) => x.id === id);
  if (!ready)
    return (
      <Shell>
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label="Loading questionnaire"
          role="status"
        >
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-48" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </Shell>
    );
  if (!q)
    return (
      <Shell studio={demo.profile.studio}>
        <div className="rounded-lg border bg-card p-8 text-center shadow-soft">
          <p className="display-title text-2xl">This link isn't working</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The questionnaire may have been withdrawn. Email{" "}
            <a className="underline" href={`mailto:${demo.profile.email}`}>
              {demo.profile.email}
            </a>{" "}
            for a fresh link.
          </p>
        </div>
      </Shell>
    );
  return (
    <Shell studio={demo.profile.studio}>
      <Form key={q.id + q.status} questionnaire={q} />
    </Shell>
  );
}

function Form({ questionnaire: q }: { questionnaire: Questionnaire }) {
  const { state: demo, saveQuestionnaireAnswers, submitQuestionnaire } = useDemo();
  const [answers, setAnswers] = useState<Record<string, Answer>>(q.answers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const client = demo.clients.find((c) => c.id === q.clientId);
  const first = client?.name.split(" ")[0] ?? "there";
  const progress = responseProgress(q.questions, answers);
  const dirty = JSON.stringify(answers) !== JSON.stringify(q.answers);
  const overdue = q.dueDate < DEMO_TODAY;

  if (q.status === "submitted") {
    return (
      <div role="status" aria-live="polite">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
            <Check className="h-6 w-6" />
          </span>
          <h1 className="display-title mt-4 text-3xl">Thank you, {first}!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your answers were sent to {demo.profile.studio}
            {q.submittedAt ? ` on ${format(new Date(q.submittedAt), "MMMM d 'at' h:mm a")}` : ""}.
            Need to change something? Just reply to the email and we'll reopen it.
          </p>
        </div>
        <section className="mt-8 rounded-lg border bg-card shadow-soft">
          <h2 className="border-b px-5 py-3 text-sm font-semibold">Your answers</h2>
          <ol className="divide-y">
            {q.questions.map((question, i) => (
              <li key={question.id} className="px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  {i + 1}. {question.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 whitespace-pre-wrap text-sm",
                    !isAnswered(q.answers[question.id]) && "italic text-muted-foreground",
                  )}
                >
                  {formatAnswer(question, q.answers[question.id]) || "No answer"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Even with no required questions, an empty submission is almost certainly a mistake.
    if (progress.answered === 0) {
      toast.error("Answer at least one question before submitting.");
      return;
    }
    const found = validateAnswers(q.questions, answers);
    setErrors(found);
    const firstError = q.questions.find((x) => found[x.id]);
    if (firstError) {
      toast.error("A few answers need attention");
      document
        .getElementById(`block-${firstError.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submitQuestionnaire(q.id, answers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="eyebrow">Questionnaire</p>
      <h1 className="display-title mt-2 text-3xl">{q.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Hi {first} — these help us plan your session. It takes about{" "}
        {Math.max(2, Math.round(q.questions.length * 0.8))} minutes; you can save and come back any
        time.
      </p>
      {overdue ? (
        <p
          className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs"
          role="status"
        >
          This was due on {formatDate(q.dueDate)} — you can still send it, we'd love your answers.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Please send it by {formatDate(q.dueDate)}.
        </p>
      )}

      <div className="sticky top-0 z-10 -mx-4 mt-6 border-b bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4">
        <div className="flex items-center justify-between text-xs">
          <span>
            {progress.answered} of {progress.total} answered
          </span>
          <span className="text-muted-foreground">
            {dirty
              ? "Unsaved changes"
              : q.lastSavedAt
                ? `Saved ${format(new Date(q.lastSavedAt), "MMM d, h:mm a")}`
                : ""}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress"
        >
          <div
            className="h-full rounded-full bg-clay transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {q.questions.map((question, i) => (
          <div
            key={question.id}
            id={`block-${question.id}`}
            className={cn(
              "rounded-lg border bg-card p-4 shadow-soft sm:p-5",
              errors[question.id] && "border-destructive/40",
            )}
          >
            <QuestionField
              question={question}
              index={i}
              value={answers[question.id]}
              error={errors[question.id]}
              onChange={(v) => {
                setAnswers((a) => ({ ...a, [question.id]: v }));
                if (errors[question.id]) setErrors((e) => ({ ...e, [question.id]: "" }));
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="bg-card"
          disabled={!dirty}
          onClick={() => {
            saveQuestionnaireAnswers(q.id, answers);
            toast.success("Saved — you can close this page and finish later");
          }}
        >
          <Save /> Save and finish later
        </Button>
        <Button type="submit">
          <Send /> Submit answers
        </Button>
      </div>
      <div className="mt-8">
        <DemoNotice>
          Demo form: answers are saved to this browser's demo data and appear in the studio's
          Questionnaires.
        </DemoNotice>
      </div>
    </form>
  );
}
