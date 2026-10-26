import { describe, expect, it } from "vitest";

import { DEMO_TODAY, STATE_VERSION, migrateState, seedState, type Session } from "@/lib/demo-data";
import {
  dayKey,
  fromKey,
  layoutDay,
  rangeLabel,
  sessionsIn,
  slotTime,
  stepCursor,
  validateCalendarSearch,
  visibleDays,
} from "@/lib/calendar";

const s = (id: string, start: string, end: string): Session => ({
  id,
  title: id,
  clientId: "c1",
  date: "2025-04-23",
  start,
  end,
  location: "",
  status: "confirmed",
  kind: "shoot",
  color: "info",
});
const cols = (placed: ReturnType<typeof layoutDay>) =>
  Object.fromEntries(placed.map((p) => [p.session.id, [p.col, p.cols]]));

describe("layoutDay", () => {
  it("gives non-overlapping sessions the full width", () => {
    expect(cols(layoutDay([s("a", "09:00", "10:00"), s("b", "10:00", "11:00")]))).toEqual({
      a: [0, 1],
      b: [0, 1],
    });
  });

  it("puts overlapping sessions side by side", () => {
    expect(cols(layoutDay([s("a", "10:00", "11:00"), s("b", "10:30", "12:00")]))).toEqual({
      a: [0, 2],
      b: [1, 2],
    });
  });

  it("reuses a freed column within a chained cluster", () => {
    // a overlaps b, b overlaps c, but a has ended when c starts.
    expect(
      cols(
        layoutDay([s("a", "09:00", "10:00"), s("b", "09:30", "11:00"), s("c", "10:00", "10:30")]),
      ),
    ).toEqual({ a: [0, 2], b: [1, 2], c: [0, 2] });
  });

  it("starts a new cluster after a gap", () => {
    const out = cols(
      layoutDay([
        s("a", "09:00", "10:00"),
        s("b", "09:00", "10:00"),
        s("c", "09:00", "10:00"),
        s("d", "13:00", "14:00"),
      ]),
    );
    expect(out["d"]).toEqual([0, 1]);
    expect(out["c"]).toEqual([2, 3]);
  });

  it("handles the seeded Wed Apr 23 overlap", () => {
    const wed = seedState().sessions.filter((x) => x.date === "2025-04-23");
    const out = cols(layoutDay(wed));
    expect(out["s2"]).toEqual([0, 2]);
    expect(out["s15"]).toEqual([1, 2]);
    expect(out["s13"]).toEqual([0, 1]);
  });
});

describe("ranges", () => {
  const apr20 = fromKey(DEMO_TODAY);

  it("shows a Sunday–Saturday week, one day, or a padded month", () => {
    expect(visibleDays("week", apr20).map(dayKey)).toEqual([
      "2025-04-20",
      "2025-04-21",
      "2025-04-22",
      "2025-04-23",
      "2025-04-24",
      "2025-04-25",
      "2025-04-26",
    ]);
    expect(visibleDays("day", apr20).map(dayKey)).toEqual(["2025-04-20"]);
    const month = visibleDays("month", apr20);
    expect(month).toHaveLength(35);
    expect(dayKey(month[0]!)).toBe("2025-03-30");
  });

  it("steps by the view's unit and labels the range", () => {
    expect(dayKey(stepCursor("week", apr20, 1))).toBe("2025-04-27");
    expect(dayKey(stepCursor("day", apr20, -1))).toBe("2025-04-19");
    expect(dayKey(stepCursor("month", apr20, 1))).toBe("2025-05-20");
    expect(rangeLabel("week", apr20)).toBe("Apr 20 – 26, 2025");
    expect(rangeLabel("week", fromKey("2025-04-28"))).toBe("Apr 27 – May 3, 2025");
    expect(rangeLabel("month", apr20)).toBe("April 2025");
  });

  it("collects the demo week's sessions in order and filters by kind", () => {
    const { sessions } = seedState();
    // The page drops cancelled sessions before laying out the calendar.
    const active = sessions.filter((x) => x.status !== "cancelled");
    expect(sessions.length - active.length).toBe(1);
    const week = sessionsIn(active, visibleDays("week", apr20));
    expect(week).toHaveLength(11);
    expect(week[0]?.id).toBe("s1");
    const shootsOnly = sessionsIn(
      sessions,
      visibleDays("week", apr20),
      new Set(["consultation", "editing", "delivery"] as const),
    );
    expect(shootsOnly.every((x) => x.kind === "shoot")).toBe(true);
  });
});

describe("slots and search", () => {
  it("snaps clicks to half-hour slots", () => {
    expect(slotTime(0, 48, 6)).toBe("06:00");
    expect(slotTime(100, 48, 6)).toBe("08:00");
    expect(slotTime(125, 48, 6)).toBe("08:30");
  });

  it("validates view and date params", () => {
    expect(validateCalendarSearch({ view: "month", date: "2025-05-01" })).toEqual({
      view: "month",
      date: "2025-05-01",
    });
    expect(validateCalendarSearch({ view: "year", date: "2025-13-45" })).toEqual({});
    expect(validateCalendarSearch({ date: "tomorrow" })).toEqual({});
  });
});

describe("v4 → v5 migration", () => {
  it("adds kinds to saved sessions and appends the new appointments", () => {
    const seed = seedState();
    const v4 = JSON.parse(
      JSON.stringify({
        ...seed,
        version: 4,
        sessions: seed.sessions.slice(0, 6).map(({ kind: _, ...x }) => x),
      }),
    );
    v4.sessions.push({ ...v4.sessions[0], id: "s-mine", title: "My own session" });
    const out = migrateState(v4)!;
    expect(out.version).toBe(STATE_VERSION);
    expect(out.sessions.find((x) => x.id === "s3")?.kind).toBe("consultation");
    expect(out.sessions.find((x) => x.id === "s-mine")?.kind).toBe("shoot");
    expect(out.sessions).toHaveLength(seed.sessions.length + 1);
  });
});
