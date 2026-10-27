import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  CircleSlash,
  Clock,
  Copy,
  FlaskConical,
  Plus,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, Panel, pageHead } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, nowStamp, type ClientType } from "@/lib/demo-data";
import type {
  ActionKind,
  Automation,
  AutomationRun,
  AutomationStep,
  TriggerKind,
} from "@/lib/automations-data";
import type { LeadStage } from "@/lib/leads-data";
import { CLIENT_TYPE_LABELS } from "@/lib/clients";
import { LEAD_STAGES } from "@/lib/leads";
import { moveItem } from "@/lib/questionnaires";
import {
  ACTIONS,
  TRIGGERS,
  automationHasErrors,
  delayLabel,
  describeStep,
  describeTrigger,
  simulateRun,
  validateAutomation,
} from "@/lib/automations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/automations/$id")({
  head: () => pageHead("Workflow", "Edit triggers, steps and activation."),
  component: AutomationPage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this workflow" reset={reset} />,
});

const sid = () => `st-${Math.random().toString(36).slice(2, 8)}`;

function AutomationPage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const [fresh] = useState<Automation>(() => ({
    id: `a-${Date.now().toString(36)}`,
    name: "",
    description: "",
    trigger: { kind: "session_booked", days: 0 },
    clientTypes: [],
    steps: [],
    active: false,
    createdAt: DEMO_TODAY,
    updatedAt: DEMO_TODAY,
  }));
  if (!ready)
    return (
      <div
        className="mx-auto max-w-6xl space-y-4"
        aria-busy="true"
        aria-label="Loading workflow"
        role="status"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  const automation = id === "new" ? fresh : demo.automations.find((a) => a.id === id);
  if (!automation)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Workflow not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/automations">View workflows</Link>
            </Button>
          }
        />
      </div>
    );
  return <Editor key={automation.id} initial={automation} isNew={id === "new"} />;
}

function Editor({ initial, isNew }: { initial: Automation; isNew: boolean }) {
  const {
    state: demo,
    saveAutomation,
    setAutomationActive,
    deleteAutomation,
    restoreAutomation,
    recordAutomationRun,
  } = useDemo();
  const goTo = useNavigate();
  const [draft, setDraft] = useState<Automation>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [testClient, setTestClient] = useState(demo.clients[0]?.id ?? "");
  const [testRun, setTestRun] = useState<AutomationRun | null>(null);
  const set = (patch: Partial<Automation>) => setDraft((d) => ({ ...d, ...patch }));
  const setStep = (id: string, patch: Partial<AutomationStep>) =>
    set({ steps: draft.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const errors = validateAutomation(draft, demo);
  const broken = automationHasErrors(errors);
  const stored = demo.automations.find((a) => a.id === initial.id);
  const active = stored?.active ?? false;
  const dirty =
    isNew ||
    JSON.stringify({ ...draft, active: 0, updatedAt: 0 }) !==
      JSON.stringify({ ...(stored ?? initial), active: 0, updatedAt: 0 });
  const triggerMeta = TRIGGERS[draft.trigger.kind];

  const save = () => {
    setSubmitted(true);
    if (broken) {
      toast.error("Fix the highlighted fields before saving.");
      return false;
    }
    saveAutomation({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      active,
    });
    toast.success(isNew ? "Workflow created — it's paused until you turn it on" : "Workflow saved");
    if (isNew) void goTo({ to: "/automations/$id", params: { id: draft.id }, replace: true });
    return true;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/automations"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Automations
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{isNew ? "New workflow" : initial.name}</h1>
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
                  deleteAutomation(initial.id);
                  void goTo({ to: "/automations" });
                  toast("Workflow deleted", {
                    action: { label: "Undo", onClick: () => restoreAutomation(stored ?? initial) },
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                onClick={() => {
                  const copy: Automation = {
                    ...(stored ?? initial),
                    id: `a-${Date.now().toString(36)}`,
                    name: `${initial.name} (copy)`,
                    active: false,
                    steps: (stored ?? initial).steps.map((s) => ({ ...s, id: sid() })),
                    createdAt: DEMO_TODAY,
                  };
                  saveAutomation(copy);
                  toast.success("Duplicated as a paused workflow");
                  void goTo({ to: "/automations/$id", params: { id: copy.id } });
                }}
              >
                <Copy /> Duplicate
              </Button>
            </>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty}>
            {isNew ? "Create workflow" : dirty ? "Save workflow" : "Saved"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <section className="space-y-4 rounded-lg border bg-card p-4 shadow-soft">
            <Field id="au-name" label="Name" required error={submitted ? errors.name : undefined}>
              <Input
                id="au-name"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Album reminder"
              />
            </Field>
            <Field id="au-desc" label="Description">
              <Input
                id="au-desc"
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="What it does, in a sentence"
              />
            </Field>
          </section>

          <section
            className="space-y-3 rounded-lg border bg-card p-4 shadow-soft"
            aria-labelledby="au-trigger-heading"
          >
            <h2 id="au-trigger-heading" className="text-sm font-semibold">
              When this happens
            </h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label>Trigger</Label>
                <Select
                  value={draft.trigger.kind}
                  onValueChange={(v) => {
                    const kind = v as TriggerKind;
                    set({
                      trigger: {
                        kind,
                        days: TRIGGERS[kind].days ? Math.max(draft.trigger.days, 1) : 0,
                      },
                    });
                  }}
                >
                  <SelectTrigger className="w-64" aria-label="Trigger">
                    <SelectValue>{triggerMeta.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRIGGERS) as TriggerKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {TRIGGERS[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {triggerMeta.days ? (
                <div className="space-y-1.5">
                  <Label htmlFor="au-days">Days</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="au-days"
                      type="number"
                      min={1}
                      max={60}
                      value={draft.trigger.days}
                      onChange={(e) =>
                        set({ trigger: { ...draft.trigger, days: Number(e.target.value) } })
                      }
                      className="w-20"
                      aria-invalid={submitted && !!errors.trigger}
                    />
                    <span className="text-xs text-muted-foreground">{triggerMeta.days}</span>
                  </div>
                </div>
              ) : null}
            </div>
            {submitted && errors.trigger ? (
              <p className="text-xs text-destructive">{errors.trigger}</p>
            ) : null}
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Only for these client types (none = everyone)
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Client types">
                {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((t) => {
                  const on = draft.clientTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set({
                          clientTypes: on
                            ? draft.clientTypes.filter((x) => x !== t)
                            : [...draft.clientTypes, t],
                        })
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        on
                          ? "border-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {CLIENT_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            className="space-y-3 rounded-lg border bg-card p-4 shadow-soft"
            aria-label="Steps"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Then do this</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 bg-card text-xs"
                onClick={() =>
                  set({
                    steps: [
                      ...draft.steps,
                      {
                        id: sid(),
                        kind: "send_email",
                        delayDays: 0,
                        emailTemplateId: demo.emailTemplates[0]?.id,
                      },
                    ],
                  })
                }
              >
                <Plus /> Add step
              </Button>
            </div>
            {submitted && errors.steps ? (
              <p className="text-xs text-destructive">{errors.steps}</p>
            ) : null}
            {draft.steps.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                Add the emails, questionnaires and to-dos this workflow should handle.
              </p>
            ) : (
              <ol className="space-y-2">
                {draft.steps.map((s, i) => {
                  const err = submitted ? errors.byStep[s.id] : undefined;
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        "space-y-2 rounded-md border p-3",
                        err && "border-destructive/40",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                        <Select
                          value={s.kind}
                          onValueChange={(v) => {
                            const kind = v as ActionKind;
                            setStep(s.id, {
                              kind,
                              emailTemplateId:
                                kind === "send_email"
                                  ? (s.emailTemplateId ?? demo.emailTemplates[0]?.id)
                                  : undefined,
                              questionnaireTemplateId:
                                kind === "send_questionnaire"
                                  ? (s.questionnaireTemplateId ??
                                    demo.questionnaireTemplates[0]?.id)
                                  : undefined,
                              stage: kind === "move_lead" ? (s.stage ?? "contacted") : undefined,
                              text:
                                kind === "create_task" || kind === "notify_me"
                                  ? (s.text ?? "")
                                  : undefined,
                            });
                          }}
                        >
                          <SelectTrigger
                            className="h-8 w-48 text-xs"
                            aria-label={`Step ${i + 1} action`}
                          >
                            <SelectValue>{ACTIONS[s.kind]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ACTIONS) as ActionKind[]).map((k) => (
                              <SelectItem key={k} value={k}>
                                {ACTIONS[k]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                          Wait
                          <Input
                            type="number"
                            min={0}
                            max={365}
                            value={s.delayDays}
                            onChange={(e) => setStep(s.id, { delayDays: Number(e.target.value) })}
                            aria-label={`Step ${i + 1} delay in days`}
                            className="h-8 w-16 text-xs"
                          />
                          days
                        </span>
                        <button
                          type="button"
                          aria-label={`Move step ${i + 1} up`}
                          onClick={() => set({ steps: moveItem(draft.steps, i, -1) })}
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move step ${i + 1} down`}
                          onClick={() => set({ steps: moveItem(draft.steps, i, 1) })}
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove step ${i + 1}`}
                          onClick={() => set({ steps: draft.steps.filter((x) => x.id !== s.id) })}
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="pl-7">
                        {s.kind === "send_email" ? (
                          <Select
                            value={s.emailTemplateId ?? ""}
                            onValueChange={(v) => setStep(s.id, { emailTemplateId: v })}
                          >
                            <SelectTrigger
                              className="h-8 text-xs"
                              aria-label={`Step ${i + 1} email template`}
                            >
                              <SelectValue placeholder="Choose an email template">
                                {demo.emailTemplates.find((t) => t.id === s.emailTemplateId)?.name}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {demo.emailTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : s.kind === "send_questionnaire" ? (
                          <Select
                            value={s.questionnaireTemplateId ?? ""}
                            onValueChange={(v) => setStep(s.id, { questionnaireTemplateId: v })}
                          >
                            <SelectTrigger
                              className="h-8 text-xs"
                              aria-label={`Step ${i + 1} questionnaire`}
                            >
                              <SelectValue placeholder="Choose a questionnaire">
                                {
                                  demo.questionnaireTemplates.find(
                                    (t) => t.id === s.questionnaireTemplateId,
                                  )?.name
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {demo.questionnaireTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : s.kind === "move_lead" ? (
                          <Select
                            value={s.stage ?? ""}
                            onValueChange={(v) => setStep(s.id, { stage: v as LeadStage })}
                          >
                            <SelectTrigger
                              className="h-8 text-xs"
                              aria-label={`Step ${i + 1} stage`}
                            >
                              <SelectValue placeholder="Choose a stage">
                                {LEAD_STAGES.find((x) => x.value === s.stage)?.label}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STAGES.map((x) => (
                                <SelectItem key={x.value} value={x.value}>
                                  {x.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={s.text ?? ""}
                            onChange={(e) => setStep(s.id, { text: e.target.value })}
                            placeholder={
                              s.kind === "create_task"
                                ? "Task, e.g. Call {{client.name}}"
                                : "Message, e.g. New booking from {{client.name}}"
                            }
                            aria-label={`Step ${i + 1} text`}
                            className="h-8 text-xs"
                          />
                        )}
                        {err ? <p className="mt-1 text-xs text-destructive">{err}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Activation</h2>
              <Switch
                checked={active}
                disabled={isNew}
                aria-label={active ? "Pause workflow" : "Activate workflow"}
                onCheckedChange={(on) => {
                  if (on && (broken || dirty)) {
                    setSubmitted(true);
                    toast.error(
                      dirty
                        ? "Save your changes before turning it on."
                        : "Fix the highlighted fields first.",
                    );
                    return;
                  }
                  setAutomationActive(initial.id, on);
                  toast.success(on ? "Workflow is on" : "Workflow paused");
                }}
              />
            </div>
            <p className={cn("mt-1 text-xs", active ? "text-success" : "text-muted-foreground")}>
              {isNew
                ? "Save the workflow first, then turn it on."
                : active
                  ? "Active — runs automatically."
                  : "Paused — nothing will run."}
            </p>
            <ol className="mt-4 space-y-2 border-l pl-4 text-xs">
              <li className="relative">
                <span className="absolute -left-[1.4rem] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-sand text-sand-foreground">
                  <Zap className="h-2.5 w-2.5" />
                </span>
                <span className="font-medium">{describeTrigger(draft.trigger)}</span>
                {draft.clientTypes.length ? (
                  <span className="block text-muted-foreground">
                    for {draft.clientTypes.join(" & ")} clients
                  </span>
                ) : null}
              </li>
              {draft.steps.map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-muted-foreground/50 ring-2 ring-card" />
                  <span className="text-muted-foreground">{delayLabel(s.delayDays)}: </span>
                  {describeStep(s, demo)}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Test run</h2>
            <p className="text-xs text-muted-foreground">
              Dry-runs the steps against a client's real data. Nothing is sent.
            </p>
            <Select value={testClient} onValueChange={setTestClient}>
              <SelectTrigger className="h-8 text-xs" aria-label="Test with client">
                <SelectValue>{demo.clients.find((c) => c.id === testClient)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {demo.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="w-full bg-card"
              onClick={() => {
                setSubmitted(true);
                if (draft.steps.length === 0) {
                  toast.error("Add a step to test.");
                  return;
                }
                const run = simulateRun(
                  draft,
                  testClient,
                  demo,
                  DEMO_TODAY,
                  nowStamp(),
                  `run-${Date.now().toString(36)}`,
                );
                setTestRun(run);
                if (!isNew) recordAutomationRun(run);
              }}
            >
              <FlaskConical /> Run test
            </Button>
            {testRun ? (
              <div role="status" className="rounded-md border bg-muted/30 p-3 text-xs">
                <p
                  className={cn(
                    "font-medium",
                    testRun.status === "failed"
                      ? "text-destructive"
                      : testRun.steps.every((s) => s.result === "skipped")
                        ? "text-muted-foreground"
                        : "text-success",
                  )}
                >
                  {testRun.status === "failed"
                    ? "Would fail"
                    : testRun.steps.every((s) => s.result === "skipped")
                      ? "Wouldn't run for this client"
                      : "Would succeed"}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {testRun.steps.map((s, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-0.5">
                        {s.result === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : s.result === "scheduled" ? (
                          <Clock className="h-3.5 w-3.5 text-info" />
                        ) : s.result === "skipped" ? (
                          <CircleSlash className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium">{s.label}</span>
                        {s.detail ? (
                          <span className="block break-words text-muted-foreground">
                            {s.detail}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
