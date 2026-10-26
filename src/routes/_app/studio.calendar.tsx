import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Panel, pageHead } from "@/components/kit";
import { AddSessionDialog, StudioTabs } from "@/components/studio";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDemo } from "@/lib/store";
import { formatTime, type Session } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/studio/calendar")({
  head: () => pageHead("Studio Calendar", "Your week of shoots, consultations and edits."),
  component: StudioCalendar,
});

type View = "month" | "week" | "day";

// The demo data lives in the week of Apr 20, 2025.
const DEMO_ANCHOR = new Date(2025, 3, 20);
const FIRST_HOUR = 8;
const HOURS = Array.from({ length: 10 }, (_, i) => i + FIRST_HOUR); // 8am–5pm
const ROW = 52; // px per hour

const chip: Record<Session["color"], string> = {
  info: "bg-info/12 border-info/30 text-info",
  violet:
    "bg-[oklch(0.6_0.12_300/0.14)] border-[oklch(0.6_0.12_300/0.35)] text-[oklch(0.45_0.12_300)]",
  success: "bg-success/12 border-success/30 text-success",
};

const toMins = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function StudioCalendar() {
  const { state: demo } = useDemo();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(DEMO_ANCHOR);

  const step = (dir: 1 | -1) =>
    setCursor((c) =>
      view === "month" ? addMonths(c, dir) : addDays(c, dir * (view === "week" ? 7 : 1)),
    );

  const weekStart = startOfWeek(cursor);
  const days =
    view === "day" ? [cursor] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);
  const label =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "day"
        ? format(cursor, "EEEE, MMM d, yyyy")
        : `${format(weekStart, "MMM d")} – ${format(weekEnd, isSameMonth(weekStart, weekEnd) ? "d, yyyy" : "MMM d, yyyy")}`;

  const sessionsOn = (d: Date) => demo.sessions.filter((s) => s.date === dayKey(d));
  const client = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="mx-auto max-w-6xl">
      <StudioTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h1 className="display-title text-2xl">Studio Calendar</h1>
        <AddSessionDialog defaultDate={dayKey(cursor)} />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className="rounded p-1 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="min-w-40 text-center text-sm font-medium">{label}</p>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className="rounded p-1 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(DEMO_ANCHOR)}
              className="ml-2 rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              This week
            </button>
          </div>
          <div className="inline-flex rounded-md border p-0.5 text-xs">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-3 py-1 capitalize",
                  view === v
                    ? "bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "month" ? (
          <MonthGrid
            cursor={cursor}
            sessionsOn={sessionsOn}
            onPick={(d) => {
              setCursor(d);
              setView("day");
            }}
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div
              className={cn("grid", view === "day" ? "min-w-0" : "min-w-[640px]")}
              style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }}
            >
              <div />
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="border-b pb-2 text-center text-[11px] text-muted-foreground"
                >
                  {format(d, "EEE")}{" "}
                  <span className="font-medium text-foreground">{format(d, "d")}</span>
                </div>
              ))}

              <div className="relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: ROW }}
                    className="pr-2 pt-0.5 text-right text-[10px] text-muted-foreground"
                  >
                    {format(new Date(2025, 0, 1, h), "h a")}
                  </div>
                ))}
              </div>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="relative border-l"
                  style={{ height: ROW * HOURS.length }}
                >
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: ROW }} className="border-b border-dashed" />
                  ))}
                  {sessionsOn(d).map((s) => {
                    const top = ((toMins(s.start) - FIRST_HOUR * 60) / 60) * ROW;
                    const height = Math.max(26, ((toMins(s.end) - toMins(s.start)) / 60) * ROW - 3);
                    return (
                      <Popover key={s.id}>
                        <PopoverTrigger
                          className={cn(
                            "absolute inset-x-1 overflow-hidden rounded border px-1.5 py-1 text-left text-[11px] leading-tight",
                            chip[s.color],
                          )}
                          style={{ top: Math.max(0, top) + 1, height }}
                        >
                          <span className="block truncate font-medium">
                            {s.note ?? client(s.clientId)}
                          </span>
                          <span className="block truncate opacity-80">{s.title}</span>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 text-xs">
                          <p className="text-sm font-semibold">{s.title}</p>
                          <p className="mt-1 text-muted-foreground">{client(s.clientId)}</p>
                          <p className="mt-2">
                            {format(d, "EEE, MMM d")} · {formatTime(s.start)} – {formatTime(s.end)}
                          </p>
                          <p className="text-muted-foreground">{s.location}</p>
                          <p className="mt-2 capitalize">{s.status}</p>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function MonthGrid({
  cursor,
  sessionsOn,
  onPick,
}: {
  cursor: Date;
  sessionsOn: (d: Date) => Session[];
  onPick: (d: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-md border text-xs">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="border-b bg-muted/50 py-1.5 text-center text-[11px] text-muted-foreground"
        >
          {d}
        </div>
      ))}
      {days.map((d) => (
        <button
          key={d.toISOString()}
          type="button"
          onClick={() => onPick(d)}
          className={cn(
            "min-h-20 border-b border-r p-1.5 text-left align-top hover:bg-accent/40",
            !isSameMonth(d, cursor) && "text-muted-foreground/50",
          )}
        >
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full",
              isSameDay(d, DEMO_ANCHOR) && "bg-primary text-primary-foreground",
            )}
          >
            {format(d, "d")}
          </span>
          {sessionsOn(d).map((s) => (
            <span
              key={s.id}
              className={cn("mt-1 block truncate rounded border px-1 text-[10px]", chip[s.color])}
            >
              {formatTime(s.start)} {s.title}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}
