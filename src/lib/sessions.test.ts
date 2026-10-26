import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState, type Session } from "@/lib/demo-data";
import {
  countSessionTabs,
  durationLabel,
  filterSessions,
  findConflicts,
  sessionIcs,
  sessionTab,
  slotLabel,
  validateSessionForm,
  validateSessionSearch,
} from "@/lib/sessions";

const { sessions, clients } = seedState();
const ids = (list: Session[]) => list.map((s) => s.id);
const byId = (id: string) => sessions.find((s) => s.id === id)!;

describe("tabs", () => {
  it("files sessions under upcoming, past or cancelled", () => {
    expect(sessionTab(byId("s1"), DEMO_TODAY)).toBe("upcoming");
    expect(sessionTab(byId("s8"), DEMO_TODAY)).toBe("past");
    expect(sessionTab(byId("s25"), DEMO_TODAY)).toBe("cancelled");
    // A confirmed session whose date has passed counts as past.
    expect(sessionTab({ ...byId("s1"), date: "2025-04-01" }, DEMO_TODAY)).toBe("past");
  });

  it("counts every tab", () => {
    const c = countSessionTabs(sessions, DEMO_TODAY);
    expect(c.all).toBe(sessions.length);
    expect(c.upcoming + c.past + c.cancelled).toBe(c.all);
    expect(c.cancelled).toBe(1);
    expect(c.past).toBe(7);
  });

  it("marks seeded past appointments completed", () => {
    expect(
      sessions
        .filter((s) => s.date < DEMO_TODAY && s.status !== "cancelled")
        .every((s) => s.status === "completed"),
    ).toBe(true);
  });
});

describe("filterSessions", () => {
  it("orders upcoming soonest first and past most recent first", () => {
    const up = filterSessions(sessions, clients, { tab: "upcoming" }, DEMO_TODAY);
    expect(up[0]?.id).toBe("s1");
    const past = filterSessions(sessions, clients, { tab: "past" }, DEMO_TODAY);
    expect(ids(past).slice(0, 2)).toEqual(["s10", "s9"]);
  });

  it("searches title, location and client name, and filters by kind", () => {
    expect(ids(filterSessions(sessions, clients, { tab: "all", q: "naledi" }, DEMO_TODAY))).toEqual(
      ["s18", "s12"],
    );
    expect(
      filterSessions(sessions, clients, { tab: "all", kind: "delivery" }, DEMO_TODAY).every(
        (s) => s.kind === "delivery",
      ),
    ).toBe(true);
    expect(
      ids(filterSessions(sessions, clients, { tab: "all", q: "coastal" }, DEMO_TODAY)),
    ).toEqual(["s6"]);
  });
});

describe("findConflicts", () => {
  it("finds overlaps on the same day, ignoring itself, cancelled and touching slots", () => {
    expect(
      ids(findConflicts(sessions, { date: "2025-04-23", start: "10:45", end: "11:15" })),
    ).toEqual(["s2", "s15"]);
    expect(
      findConflicts(sessions, { date: "2025-04-23", start: "11:00", end: "11:30" }, "s2").map(
        (s) => s.id,
      ),
    ).toEqual(["s15"]);
    expect(findConflicts(sessions, { date: "2025-04-21", start: "11:00", end: "13:00" })).toEqual(
      [],
    );
    // s25 is cancelled, so its slot is free.
    expect(findConflicts(sessions, { date: "2025-04-22", start: "11:00", end: "12:00" })).toEqual(
      [],
    );
  });
});

describe("labels and validation", () => {
  it("formats durations and slots", () => {
    expect(durationLabel("09:00", "11:00")).toBe("2 hours");
    expect(durationLabel("10:30", "12:00")).toBe("1 h 30 min");
    expect(durationLabel("16:00", "16:30")).toBe("30 min");
    expect(durationLabel("09:00", "10:00")).toBe("1 hour");
    expect(slotLabel("2025-04-24", "14:00")).toBe("Thu, Apr 24 · 2:00 PM");
  });

  it("validates the session form", () => {
    const ok = { title: "Shoot", clientId: "c1", date: "2025-04-24", start: "10:00", end: "11:00" };
    expect(validateSessionForm(ok)).toEqual({});
    expect(Object.keys(validateSessionForm({ ...ok, title: " ", clientId: "" })).sort()).toEqual([
      "clientId",
      "title",
    ]);
    expect(validateSessionForm({ ...ok, end: "10:00" }).end).toMatch(/after start/);
    expect(validateSessionForm({ ...ok, date: "" }).date).toBeDefined();
  });

  it("validates list search", () => {
    expect(validateSessionSearch({ tab: "past", q: "x", kind: "editing" })).toEqual({
      tab: "past",
      q: "x",
      kind: "editing",
    });
    expect(validateSessionSearch({ tab: "upcoming", q: "", kind: "party" })).toEqual({});
  });
});

describe("sessionIcs", () => {
  it("produces a valid single-event calendar file with escaped text", () => {
    const ics = sessionIcs(byId("s4"), "David Kim", "Karabo Photography");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20250424T140000\r\n");
    expect(ics).toContain("DTEND:20250424T150000\r\n");
    expect(ics).toContain("SUMMARY:Product Shoot — David Kim\r\n");
    expect(ics).toContain("softboxes. Client wants 3 hero shots");
    // Newlines in the description and commas in text fields are escaped.
    expect(ics).toContain("session with David Kim.\\n\\nBring the white sweep");
    expect(sessionIcs(byId("s23"), "Zanele Khumalo", "Studio")).toContain(
      "LOCATION:The Westin\\, Cape Town\r\n",
    );
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(sessionIcs(byId("s25"), "Hannah Lee", "Studio")).toContain("STATUS:CANCELLED");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});
