import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, StatusBadge } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo-data";
import type { Answer, Question, QuestionType, Questionnaire } from "@/lib/questionnaires-data";
import { addDaysIso } from "@/lib/invoices";
import {
  QUESTION_TYPE_LABELS,
  RESPONSE_STATE_LABELS,
  hasOptions,
  responseState,
} from "@/lib/questionnaires";
import { cn } from "@/lib/utils";

const STATE_TONE = {
  not_started: "draft",
  in_progress: "sent",
  submitted: "paid",
  overdue: "overdue",
} as const;

export function ResponseStateBadge({ questionnaire }: { questionnaire: Questionnaire }) {
  const s = responseState(questionnaire, DEMO_TODAY);
  return <StatusBadge status={STATE_TONE[s]} label={RESPONSE_STATE_LABELS[s]} />;
}

/** One question as the client answers it. */
export function QuestionField({
  question: q,
  index,
  value,
  onChange,
  error,
  disabled,
}: {
  question: Question;
  index: number;
  value: Answer | undefined;
  onChange: (v: Answer) => void;
  error?: string | undefined;
  disabled?: boolean;
}) {
  const id = `qf-${q.id}`;
  const str = typeof value === "string" ? value : "";
  const list = Array.isArray(value) ? value : [];
  const describedBy =
    [q.help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  let control: ReactNode;
  if (q.type === "long")
    control = (
      <Textarea
        id={id}
        rows={4}
        value={str}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
    );
  else if (q.type === "choice")
    control = (
      <RadioGroup
        value={str}
        onValueChange={onChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        className="gap-2"
      >
        {q.options.map((o) => (
          <div key={o} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${o}`} value={o} />
            <Label htmlFor={`${id}-${o}`} className="font-normal">
              {o}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  else if (q.type === "multi")
    control = (
      <div className="space-y-2" role="group" aria-labelledby={`${id}-label`}>
        {q.options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={list.includes(o)}
              disabled={disabled}
              onCheckedChange={(v) =>
                onChange(v === true ? [...list, o] : list.filter((x) => x !== o))
              }
            />
            {o}
          </label>
        ))}
      </div>
    );
  else if (q.type === "yesno")
    control = (
      <RadioGroup
        value={str}
        onValueChange={onChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        className="flex gap-4"
      >
        {(["yes", "no"] as const).map((o) => (
          <div key={o} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${o}`} value={o} />
            <Label htmlFor={`${id}-${o}`} className="font-normal capitalize">
              {o}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  else
    control = (
      <Input
        id={id}
        type={q.type === "date" ? "date" : "text"}
        inputMode={q.type === "number" ? "numeric" : undefined}
        value={str}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(q.type === "number" && "max-w-32", q.type === "date" && "max-w-48")}
      />
    );

  return (
    <div className="space-y-2">
      <label
        id={`${id}-label`}
        htmlFor={hasOptions(q.type) || q.type === "yesno" ? undefined : id}
        className="block text-sm font-medium"
      >
        <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
        {q.label || <span className="text-muted-foreground">Untitled question</span>}
        {q.required ? <span className="text-muted-foreground"> *</span> : null}
      </label>
      {q.help ? (
        <p id={`${id}-help`} className="-mt-1 text-xs text-muted-foreground">
          {q.help}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

/** Edit one question: label, type, options, help and required. */
export function QuestionEditor({
  question: q,
  index,
  onChange,
  onMove,
  onRemove,
  error,
}: {
  question: Question;
  index?: number | undefined;
  onChange: (q: Question) => void;
  onMove?: ((dir: -1 | 1) => void) | undefined;
  onRemove?: (() => void) | undefined;
  error?: string | undefined;
}) {
  const set = (patch: Partial<Question>) => onChange({ ...q, ...patch });
  return (
    <div
      className={cn("space-y-3 rounded-md border bg-card p-3", error && "border-destructive/40")}
    >
      <div className="flex items-start gap-2">
        {index !== undefined ? (
          <span className="mt-2 w-5 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <Input
            aria-label={index !== undefined ? `Question ${index + 1} text` : "Question text"}
            value={q.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="Write the question"
            aria-invalid={!!error}
            className="h-8 text-sm"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        {onMove ? (
          <>
            <button
              type="button"
              aria-label="Move up"
              onClick={() => onMove(-1)}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Move down"
              onClick={() => onMove(1)}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            aria-label="Remove question"
            onClick={onRemove}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-7">
        <Select
          value={q.type}
          onValueChange={(v) => {
            const type = v as QuestionType;
            set({
              type,
              options:
                hasOptions(type) && q.options.length < 2 ? ["Option 1", "Option 2"] : q.options,
            });
          }}
        >
          <SelectTrigger className="h-8 w-40 text-xs" aria-label="Answer type">
            <SelectValue>{QUESTION_TYPE_LABELS[q.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={q.required}
            onCheckedChange={(v) => set({ required: v })}
            aria-label="Required"
          />
          Required
        </label>
      </div>
      {hasOptions(q.type) ? (
        <div className="space-y-1.5 sm:pl-7">
          {q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-3 w-3 shrink-0 border",
                  q.type === "choice" ? "rounded-full" : "rounded-sm",
                )}
              />
              <Input
                aria-label={`Option ${i + 1}`}
                value={o}
                onChange={(e) =>
                  set({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className="h-7 text-xs"
              />
              <button
                type="button"
                aria-label={`Remove option ${i + 1}`}
                onClick={() => set({ options: q.options.filter((_, j) => j !== i) })}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set({ options: [...q.options, `Option ${q.options.length + 1}`] })}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add option
          </button>
        </div>
      ) : null}
      <div className="sm:pl-7">
        <Input
          aria-label="Help text"
          value={q.help}
          onChange={(e) => set({ help: e.target.value })}
          placeholder="Help text (optional)"
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}

export function SendQuestionnaireDialog({
  trigger,
  defaultClientId = "",
  defaultProjectId = "",
  defaultTemplateId = "",
}: {
  trigger?: ReactNode;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultTemplateId?: string;
}) {
  const { state: demo, sendQuestionnaire } = useDemo();
  const goTo = useNavigate();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [dueDate, setDueDate] = useState(addDaysIso(DEMO_TODAY, 14));
  const [submitted, setSubmitted] = useState(false);
  const projects = demo.projects.filter((p) => p.clientId === clientId && !p.archived);
  const template = demo.questionnaireTemplates.find((t) => t.id === templateId);
  const client = demo.clients.find((c) => c.id === clientId);
  const dueError = !dueDate
    ? "Pick a due date."
    : dueDate < DEMO_TODAY
      ? "Due date can't be in the past."
      : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setClientId(defaultClientId);
          setProjectId(defaultProjectId);
          setTemplateId(defaultTemplateId || demo.questionnaireTemplates[0]?.id || "");
          setDueDate(addDaysIso(DEMO_TODAY, 14));
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Send /> Send Questionnaire
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            if (!clientId || !template || dueError) return;
            const sent = sendQuestionnaire({
              templateId,
              clientId,
              projectId: projectId || undefined,
              dueDate,
            });
            toast.success(`${template.name} sent to ${client?.name}`, {
              description: "Demo — no email is sent.",
            });
            setOpen(false);
            void goTo({ to: "/questionnaires/$id", params: { id: sent.id } });
          }}
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Send a questionnaire</DialogTitle>
            <DialogDescription>
              The client gets a private link to fill it in — they can save and come back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v);
                setProjectId("");
              }}
            >
              <SelectTrigger aria-label="Client" aria-invalid={submitted && !clientId}>
                <SelectValue placeholder="Choose a client">{client?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {demo.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !clientId ? (
              <p className="text-xs text-destructive">Choose a client.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Questionnaire</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger
                aria-label="Questionnaire template"
                aria-invalid={submitted && !template}
              >
                <SelectValue placeholder="Choose a template">
                  {template
                    ? `${template.name} (${template.questions.length} questions)`
                    : undefined}
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
            {submitted && !template ? (
              <p className="text-xs text-destructive">Choose a questionnaire.</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={projectId || "none"}
                disabled={!clientId}
                onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
              >
                <SelectTrigger aria-label="Project">
                  <SelectValue>
                    {projects.find((p) => p.id === projectId)?.name ?? "No project"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field id="sq-due" label="Due by" error={submitted ? dueError : undefined}>
              <Input
                id="sq-due"
                type="date"
                min={DEMO_TODAY}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Send /> Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
