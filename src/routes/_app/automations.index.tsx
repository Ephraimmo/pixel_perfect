import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  Clock,
  PauseCircle,
  Plus,
  RotateCcw,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  StatusBadge,
  pageHead,
} from "@/components/kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, nowStamp } from "@/lib/demo-data";
import type { AutomationRun, StepResult } from "@/lib/automations-data";
import {
  automationHasErrors,
  delayLabel,
  describeStep,
  describeTrigger,
  filterRuns,
  runStats,
  simulateRun,
  validateAutomation,
  validateAutomationSearch,
  type AutomationSearch,
} from "@/lib/automations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/automations/")({
  head: () => pageHead("Automations", "Workflows that run themselves, and their history."),
  validateSearch: validateAutomationSearch,
  component: Automations,
  errorComponent: ({ reset }) => <PageError title="Couldn't load automations" reset={reset} />,
});

type SearchPatch = { [K in keyof AutomationSearch]?: AutomationSearch[K] | undefined };

function Automations() {
  const { state: demo, ready, setAutomationsActive } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateAutomationSearch({ ...prev, ...patch }),
      replace: true,
    });
  const view = search.view ?? "workflows";
  const active = demo.automations.filter((a) => a.active);
  const stats = runStats(demo.automationRuns, DEMO_TODAY);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Automations"
        description={
          ready
            ? `${active.length} of ${demo.automations.length} active · ${stats.runs} runs in the last 30 days${stats.failed ? ` · ${stats.failed} failed` : ""}`
            : "Workflows that run themselves, and their history."
        }
        actions={
          <>
            {active.length ? (
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                onClick={() => {
                  const ids = active.map((a) => a.id);
                  setAutomationsActive(ids, false);
                  toast(`Paused ${ids.length} workflows`, {
                    action: { label: "Undo", onClick: () => setAutomationsActive(ids, true) },
                  });
                }}
              >
                <PauseCircle /> Pause all
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={() => void goTo({ to: "/automations/$id", params: { id: "new" } })}
            >
              <Plus /> New Workflow
            </Button>
          </>
        }
      />
      <div
        className="mb-5 inline-flex gap-1 rounded-lg border bg-card p-1"
        role="group"
        aria-label="Automations view"
      >
        {(
          [
            ["workflows", "Workflows"],
            ["history", "Execution history"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() =>
              update({
                view: v === "history" ? "history" : undefined,
                status: undefined,
                automation: undefined,
              })
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
        <ListSkeleton label="Loading automations" />
      ) : view === "history" ? (
        <History search={search} update={update} />
      ) : (
        <Workflows />
      )}
    </div>
  );
}

function Workflows() {
  const { state: demo, setAutomationActive } = useDemo();
  if (demo.automations.length === 0)
    return (
      <EmptyState
        title="No workflows yet"
        description="Automate the emails and to-dos you repeat for every client — confirmations, reminders, follow-ups."
        action={
          <Button asChild size="sm">
            <Link to="/automations/$id" params={{ id: "new" }}>
              <Plus /> Create a workflow
            </Link>
          </Button>
        }
      />
    );
  return (
    <ul className="space-y-3">
      {demo.automations.map((a) => {
        const s = runStats(demo.automationRuns, DEMO_TODAY, a.id);
        const errors = validateAutomation(a, demo);
        const broken = automationHasErrors(errors);
        return (
          <li
            key={a.id}
            className={cn("rounded-lg border bg-card p-4 shadow-soft", !a.active && "bg-card/60")}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 rounded-md p-1.5",
                  a.active ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
                )}
              >
                <Zap className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to="/automations/$id"
                  params={{ id: a.id }}
                  className="text-sm font-semibold hover:underline"
                >
                  {a.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-sand px-2 py-0.5 font-medium text-sand-foreground">
                    {describeTrigger(a.trigger)}
                  </span>
                  {a.steps.map((st) => (
                    <span key={st.id} className="inline-flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="rounded-full border px-2 py-0.5">
                        {st.delayDays ? (
                          <span className="text-muted-foreground">
                            {delayLabel(st.delayDays)}:{" "}
                          </span>
                        ) : null}
                        {describeStep(st, demo)}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {s.runs
                    ? `${s.runs} ${s.runs === 1 ? "run" : "runs"} in 30 days · ${s.successRate}% succeeded`
                    : "No runs in the last 30 days"}
                  {a.clientTypes.length ? ` · ${a.clientTypes.join(" & ")} clients only` : ""}
                  {broken ? (
                    <span className="ml-1 font-medium text-destructive">· needs attention</span>
                  ) : null}
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs">
                <span
                  className={cn(
                    "hidden sm:inline",
                    a.active ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {a.active ? "Active" : "Paused"}
                </span>
                <Switch
                  checked={a.active}
                  aria-label={`${a.active ? "Pause" : "Activate"} ${a.name}`}
                  onCheckedChange={(on) => {
                    if (on && broken) {
                      toast.error(`Fix “${a.name}” before turning it on`, {
                        description:
                          Object.values(errors.byStep)[0] ??
                          errors.steps ??
                          errors.trigger ??
                          errors.name,
                      });
                      return;
                    }
                    setAutomationActive(a.id, on);
                    toast.success(on ? `${a.name} is on` : `${a.name} paused`);
                  }}
                />
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const RESULT_ICON: Record<StepResult, ReactNode> = {
  done: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  scheduled: <Clock className="h-3.5 w-3.5 text-info" />,
  skipped: <CircleSlash className="h-3.5 w-3.5 text-muted-foreground" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

function History({
  search,
  update,
}: {
  search: AutomationSearch;
  update: (p: SearchPatch) => void;
}) {
  const { state: demo, recordAutomationRun } = useDemo();
  const [open, setOpen] = useState<string | null>(null);
  const runs = filterRuns(demo.automationRuns, search);
  const nameOf = (id: string) =>
    demo.automations.find((a) => a.id === id)?.name ?? "Deleted workflow";

  const retry = (run: AutomationRun) => {
    const a = demo.automations.find((x) => x.id === run.automationId);
    if (!a || !run.clientId) {
      toast.error("This run can't be retried — its workflow or client is gone.");
      return;
    }
    const next = {
      ...simulateRun(
        a,
        run.clientId,
        demo,
        DEMO_TODAY,
        nowStamp(),
        `run-${Date.now().toString(36)}`,
      ),
      test: false,
      event: `Retry · ${run.event}`,
    };
    recordAutomationRun(next);
    setOpen(next.id);
    if (next.status === "failed")
      toast.error("Retry failed again", {
        description: next.steps.find((s) => s.result === "failed")?.detail,
      });
    else toast.success("Retry succeeded");
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select
          value={search.automation ?? "all"}
          onValueChange={(v) => update({ automation: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-9 bg-card text-xs sm:w-64" aria-label="Filter by workflow">
            <SelectValue>
              {search.automation ? nameOf(search.automation) : "All workflows"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All workflows</SelectItem>
            {demo.automations.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.status ?? "all"}
          onValueChange={(v) =>
            update({ status: v === "all" ? undefined : (v as "success" | "failed") })
          }
        >
          <SelectTrigger className="h-9 bg-card text-xs sm:w-40" aria-label="Filter by result">
            <SelectValue>
              {search.status === "failed"
                ? "Failed"
                : search.status === "success"
                  ? "Succeeded"
                  : "All results"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="success">Succeeded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {demo.automationRuns.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Each time a workflow runs, its steps and results are logged here."
        />
      ) : runs.length === 0 ? (
        <EmptyState
          title="No runs match"
          description="Try another workflow or result."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => update({ status: undefined, automation: undefined })}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
          {runs.map((r) => {
            const expanded = open === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : r.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                >
                  {r.status === "failed" ? (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.event}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {nameOf(r.automationId)} · {format(new Date(r.at), "MMM d 'at' h:mm a")}
                    </span>
                  </span>
                  {r.test ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      Test
                    </span>
                  ) : null}
                  <StatusBadge
                    status={r.status === "failed" ? "overdue" : "paid"}
                    label={r.status === "failed" ? "Failed" : "Succeeded"}
                  />
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                {expanded ? (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <ol className="space-y-2">
                      {r.steps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="mt-0.5">{RESULT_ICON[s.result]}</span>
                          <span className="min-w-0">
                            <span className="font-medium">{s.label}</span>
                            <span className="ml-1.5 capitalize text-muted-foreground">
                              · {s.result}
                            </span>
                            {s.detail ? (
                              <span className="block break-words text-muted-foreground">
                                {s.detail}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                    {r.status === "failed" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-card text-xs"
                          onClick={() => retry(r)}
                        >
                          <RotateCcw /> Retry
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                          <Link to="/automations/$id" params={{ id: r.automationId }}>
                            <ArrowRight /> Open workflow
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
