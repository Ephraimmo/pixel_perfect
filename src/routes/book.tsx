import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, ErrorState, Field, Logo } from "@/components/kit";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatTime, img, type Session } from "@/lib/demo-data";
import type { BookingType } from "@/lib/booking-data";
import { dayKey, fromKey, fromMins, toMins } from "@/lib/calendar";
import {
  availableSlots,
  bookingMessage,
  bookingWindow,
  durationText,
  firstAvailableDate,
  groupSlots,
  priceLabel,
  validateBookingForm,
  validateBookingSearch,
  type BookingForm,
} from "@/lib/booking";
import { sessionIcs } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Session — Karabo Photography" },
      {
        name: "description",
        content: "Choose a session, pick a date and time, and request your booking online.",
      },
      { property: "og:title", content: "Book a Session — Karabo Photography" },
      { property: "og:type", content: "website" },
    ],
  }),
  // Session type and date live in the URL so a "Book a family session" link can deep-link.
  validateSearch: validateBookingSearch,
  component: BookingPage,
  errorComponent: BookingError,
});

type Step = "type" | "time" | "details";

const STEPS: { value: Step; label: string }[] = [
  { value: "type", label: "Session" },
  { value: "time", label: "Date & time" },
  { value: "details", label: "Your details" },
];

const EMPTY_FORM: BookingForm = { name: "", email: "", phone: "", message: "", consent: false };

interface Confirmation {
  type: BookingType;
  date: string;
  start: string;
  end: string;
  name: string;
  email: string;
}

function BookingPage() {
  const { state: demo, ready, requestBooking } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const types = demo.bookingTypes.filter((t) => t.active);
  const type = types.find((t) => t.id === search.type);
  const [step, setStep] = useState<Step>(type ? "time" : "type");
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  const studio = demo.profile.studio;
  const date = type && search.date ? search.date : null;
  const slots =
    type && date ? availableSlots(date, type.durationMins, demo.sessions, DEMO_TODAY) : [];
  const end = type && time ? fromMins(toMins(time) + type.durationMins) : null;

  const chooseType = (t: BookingType) => {
    const first = firstAvailableDate(t.durationMins, demo.sessions, DEMO_TODAY);
    void navigate({ search: { type: t.id, ...(first ? { date: first } : {}) }, replace: true });
    setTime(null);
    setStep("time");
  };
  const chooseDate = (d: string) => {
    void navigate({ search: (prev) => ({ ...prev, date: d }), replace: true });
    setTime(null);
  };
  const restart = () => {
    void navigate({ search: {}, replace: true });
    setDone(null);
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setTime(null);
    setStep("type");
  };

  const errors = validateBookingForm(form);
  const shown = (k: keyof BookingForm) => (submitted ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!type || !date || !time || !end) return;
    if (Object.keys(errors).length) return;
    // Re-check: the slot may have been taken while the form was open.
    if (!availableSlots(date, type.durationMins, demo.sessions, DEMO_TODAY).includes(time)) {
      toast.error("That time was just taken — please pick another.");
      setTime(null);
      setStep("time");
      return;
    }
    requestBooking({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      type: type.clientType,
      source: "website",
      eventDate: date,
      location: type.location,
      budget: type.price,
      message: bookingMessage(type, date, time, form.message),
      requested: { typeId: type.id, date, start: time, end },
    });
    setDone({ type, date, start: time, end, name: form.name.trim(), email: form.email.trim() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="display-title truncate text-lg">{studio}</p>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            Booking by <Logo className="text-xs" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {!ready ? (
          <BookingSkeleton />
        ) : done ? (
          <Success confirmation={done} studio={studio} onRestart={restart} />
        ) : types.length === 0 ? (
          <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-soft">
            <p className="display-title text-2xl">Online booking is paused</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {studio} isn't taking online bookings right now. Email{" "}
              <a className="underline" href={`mailto:${demo.profile.email}`}>
                {demo.profile.email}
              </a>{" "}
              and we'll find a time together.
            </p>
          </div>
        ) : (
          <>
            <div className="max-w-2xl">
              <p className="eyebrow">Book online</p>
              <h1 className="display-title mt-2 text-3xl sm:text-4xl">Book a session</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a session and a time that suits you. {demo.profile.name} confirms every
                request personally within one business day.
              </p>
            </div>

            <Stepper
              step={step}
              canGo={(s) => s === "type" || (s === "time" && !!type) || (s === "details" && !!time)}
              onGo={setStep}
            />

            {step === "type" || !type ? (
              <TypeStep types={types} selected={type?.id} onChoose={chooseType} />
            ) : step === "time" || !date || !time || !end ? (
              <TimeStep
                type={type}
                sessions={demo.sessions}
                date={date}
                slots={slots}
                time={time}
                onDate={chooseDate}
                onTime={setTime}
                onBack={() => setStep("type")}
                onContinue={() => setStep("details")}
              />
            ) : (
              <form
                onSubmit={submit}
                noValidate
                className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
              >
                <section className="space-y-4 rounded-lg border bg-card p-4 shadow-soft sm:p-6">
                  <h2 className="text-lg font-semibold">Your details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="bk-name"
                      label="Full name"
                      required
                      error={shown("name")}
                      className="sm:col-span-2"
                    >
                      <Input
                        id="bk-name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        aria-invalid={!!shown("name")}
                      />
                    </Field>
                    <Field id="bk-email" label="Email" required error={shown("email")}>
                      <Input
                        id="bk-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        aria-invalid={!!shown("email")}
                      />
                    </Field>
                    <Field
                      id="bk-phone"
                      label="Phone"
                      error={shown("phone")}
                      hint="Optional — for day-of updates"
                    >
                      <Input
                        id="bk-phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        aria-invalid={!!shown("phone")}
                      />
                    </Field>
                    <Field
                      id="bk-message"
                      label="Anything we should know?"
                      error={shown("message")}
                      hint="Who's coming, ideas, location wishes..."
                      className="sm:col-span-2"
                    >
                      <Textarea
                        id="bk-message"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div>
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={form.consent}
                        onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
                        aria-invalid={!!shown("consent")}
                        className="mt-0.5"
                      />
                      <span>I agree that {studio} may contact me about this booking.</span>
                    </label>
                    {shown("consent") ? (
                      <p className="mt-1 text-xs text-destructive">{shown("consent")}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStep("time")}>
                      <ArrowLeft /> Back
                    </Button>
                    <Button type="submit">
                      <CalendarCheck2 /> Request booking
                    </Button>
                  </div>
                </section>
                <Summary
                  type={type}
                  date={date}
                  start={time}
                  end={end}
                  onChange={() => setStep("time")}
                />
              </form>
            )}

            <div className="mt-10">
              <DemoNotice>
                Demo booking page: requests are saved to this browser's demo data and appear in the
                studio's Leads, where the photographer can confirm them. No emails or payments are
                sent.
              </DemoNotice>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stepper({
  step,
  canGo,
  onGo,
}: {
  step: Step;
  canGo: (s: Step) => boolean;
  onGo: (s: Step) => void;
}) {
  const current = STEPS.findIndex((s) => s.value === step);
  return (
    <ol className="mt-6 flex items-center gap-2 text-xs sm:gap-3" aria-label="Booking steps">
      {STEPS.map((s, i) => (
        <li key={s.value} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={!canGo(s.value) || i > current}
            onClick={() => onGo(s.value)}
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors enabled:hover:bg-accent",
              i === current ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                i < current && "border-primary bg-primary text-primary-foreground",
                i === current && "border-foreground",
              )}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(i !== current && "hidden sm:inline")}>{s.label}</span>
          </button>
          {i < STEPS.length - 1 ? <span className="h-px w-4 bg-border sm:w-8" /> : null}
        </li>
      ))}
    </ol>
  );
}

function TypeStep({
  types,
  selected,
  onChoose,
}: {
  types: BookingType[];
  selected: string | undefined;
  onChoose: (t: BookingType) => void;
}) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Session types">
      {types.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onChoose(t)}
            aria-pressed={selected === t.id}
            className={cn(
              "photo-card photo-card-hover flex h-full w-full flex-col bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected === t.id && "ring-2 ring-primary",
            )}
          >
            <img
              src={img(t.image, 640, 420)}
              alt=""
              loading="lazy"
              className="aspect-[3/2] w-full bg-muted object-cover"
            />
            <span className="flex flex-1 flex-col p-4">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold">{t.name}</span>
                <span className="shrink-0 text-sm font-semibold">{priceLabel(t)}</span>
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {durationText(t.durationMins)}
              </span>
              <span className="mt-2 text-sm text-muted-foreground">{t.description}</span>
              <span className="mt-3 space-y-1">
                {t.includes.map((i) => (
                  <span key={i} className="flex items-start gap-1.5 text-xs">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {i}
                  </span>
                ))}
              </span>
              <span className="mt-auto pt-4 text-sm font-medium text-clay">
                Choose this session →
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TimeStep({
  type,
  sessions,
  date,
  slots,
  time,
  onDate,
  onTime,
  onBack,
  onContinue,
}: {
  type: BookingType;
  sessions: Session[];
  date: string | null;
  slots: string[];
  time: string | null;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { first, last } = bookingWindow(DEMO_TODAY);
  const bookable = (d: Date) =>
    availableSlots(dayKey(d), type.durationMins, sessions, DEMO_TODAY).length > 0;
  const anyDay = firstAvailableDate(type.durationMins, sessions, DEMO_TODAY);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-lg border bg-card p-4 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Pick a date &amp; time</h2>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft /> Change session
          </Button>
        </div>
        {!anyDay ? (
          <p
            className="mt-6 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
            role="status"
          >
            We're fully booked for the next three months. Email us and we'll add you to the
            waitlist.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            <Calendar
              mode="single"
              selected={date ? fromKey(date) : undefined}
              onSelect={(d) => d && onDate(dayKey(d))}
              defaultMonth={fromKey(date ?? anyDay)}
              startMonth={fromKey(first)}
              endMonth={fromKey(last)}
              disabled={(d) => !bookable(d)}
              className="mx-auto rounded-md border bg-card [--cell-size:2.4rem] md:mx-0"
            />
            <div className="min-w-0">
              {date ? (
                <>
                  <p className="text-sm font-medium">{format(fromKey(date), "EEEE, MMMM d")}</p>
                  <p className="text-xs text-muted-foreground">
                    {slots.length} {slots.length === 1 ? "time" : "times"} available ·{" "}
                    {durationText(type.durationMins)}
                  </p>
                  {slots.length === 0 ? (
                    <p
                      className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground"
                      role="status"
                    >
                      No times left on this day — please pick another date.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3" role="radiogroup" aria-label="Available times">
                      {groupSlots(slots).map((g) => (
                        <div key={g.label}>
                          <p className="eyebrow mb-1.5">{g.label}</p>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
                            {g.slots.map((s) => (
                              <button
                                key={s}
                                type="button"
                                role="radio"
                                aria-checked={time === s}
                                onClick={() => onTime(s)}
                                className={cn(
                                  "whitespace-nowrap rounded-md border px-2 py-2 text-xs font-medium tabular-nums transition-colors",
                                  time === s
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "bg-card hover:border-foreground/30 hover:bg-accent",
                                )}
                              >
                                {formatTime(s)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Pick a date to see available times.</p>
              )}
              <p className="mt-4 text-[11px] text-muted-foreground">
                Times are in the studio's local time. Closed Sundays.
              </p>
            </div>
          </div>
        )}
      </section>
      <div className="space-y-3">
        <Summary
          type={type}
          date={date}
          start={time}
          end={time ? fromMins(toMins(time) + type.durationMins) : null}
        />
        <Button className="w-full" disabled={!date || !time} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function Summary({
  type,
  date,
  start,
  end,
  onChange,
}: {
  type: BookingType;
  date: string | null;
  start: string | null;
  end: string | null;
  onChange?: () => void;
}) {
  return (
    <aside
      className="h-fit overflow-hidden rounded-lg border bg-card shadow-soft"
      aria-label="Booking summary"
    >
      <img src={img(type.image, 640, 280)} alt="" className="h-28 w-full bg-muted object-cover" />
      <div className="space-y-2.5 p-4 text-sm">
        <p className="font-semibold">{type.name}</p>
        <SummaryRow icon={<CalendarCheck2 className="h-4 w-4" />}>
          {date ? (
            format(fromKey(date), "EEE, MMM d, yyyy")
          ) : (
            <span className="text-muted-foreground">Choose a date</span>
          )}
        </SummaryRow>
        <SummaryRow icon={<Clock className="h-4 w-4" />}>
          {start && end ? (
            `${formatTime(start)} – ${formatTime(end)}`
          ) : (
            <span className="text-muted-foreground">Choose a time</span>
          )}
        </SummaryRow>
        <SummaryRow icon={<MapPin className="h-4 w-4" />}>{type.location}</SummaryRow>
        <div className="flex items-baseline justify-between border-t pt-2.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{priceLabel(type)}</span>
        </div>
        {type.deposit ? (
          <p className="text-xs text-muted-foreground">
            ${type.deposit} deposit due once your booking is confirmed. Nothing is charged now.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Free — nothing to pay.</p>
        )}
        {onChange ? (
          <button type="button" onClick={onChange} className="text-xs underline underline-offset-2">
            Change date or time
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function SummaryRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function Success({
  confirmation: c,
  studio,
  onRestart,
}: {
  confirmation: Confirmation;
  studio: string;
  onRestart: () => void;
}) {
  const download = () => {
    const pseudo: Session = {
      id: `request-${c.date}-${c.start}`,
      title: c.type.name,
      clientId: "",
      date: c.date,
      start: c.start,
      end: c.end,
      location: c.type.location,
      status: "pending",
      kind: c.type.kind,
      color: "info",
    };
    const blob = new Blob([sessionIcs(pseudo, studio, studio)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.type.id}-${c.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-lg text-center" role="status" aria-live="polite">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
        <Check className="h-6 w-6" />
      </span>
      <h1 className="display-title mt-4 text-3xl">Request sent, {c.name.split(" ")[0]}!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {studio} will confirm your {c.type.name.toLowerCase()} on{" "}
        <span className="font-medium text-foreground">
          {format(fromKey(c.date), "EEEE, MMMM d")} at {formatTime(c.start)}
        </span>{" "}
        by email to {c.email} within one business day.
      </p>
      <ol className="mx-auto mt-6 max-w-sm space-y-2 rounded-lg border bg-card p-4 text-left text-sm shadow-soft">
        {[
          "We check the time and confirm by email.",
          c.type.deposit
            ? `You pay a $${c.type.deposit} deposit to secure the date.`
            : "You'll get a video-call link with your confirmation.",
          "We send a short prep guide a few days before.",
        ].map((t, i) => (
          <li key={t} className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
              {i + 1}
            </span>
            {t}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="outline" className="bg-card" onClick={download}>
          <CalendarPlus /> Save to my calendar
        </Button>
        <Button variant="ghost" onClick={onRestart}>
          <RotateCcw /> Book another session
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Studio view (demo):{" "}
        <Link to="/leads" className="underline underline-offset-2">
          see this request in Leads
        </Link>
      </p>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading booking options" role="status">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function BookingError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <ErrorState
        title="Booking is unavailable right now"
        description="Something went wrong loading available times. Please try again in a moment."
        onRetry={() => {
          void router.invalidate();
          reset();
        }}
      />
    </div>
  );
}
