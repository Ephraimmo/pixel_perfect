import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import {
  countProjects,
  daysUntil,
  filterProjects,
  isOverdue,
  projectMoney,
  projectOf,
  projectProgress,
  projectTab,
  validateProjectForm,
  validateProjectSearch,
} from "@/lib/projects";

const state = seedState();
const { projects, clients, invoices, sessions, galleries } = state;
const byId = (id: string) => projects.find((p) => p.id === id)!;
const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe("seed integrity", () => {
  it("links only to sessions and galleries that exist and belong to the project's client", () => {
    for (const p of projects) {
      for (const sid of p.sessionIds) {
        expect(sessions.find((s) => s.id === sid)?.clientId, `${p.id}/${sid}`).toBe(p.clientId);
      }
      for (const gid of p.galleryIds) {
        expect(galleries.find((g) => g.id === gid)?.clientId, `${p.id}/${gid}`).toBe(p.clientId);
      }
    }
  });

  it("never puts a session or gallery in two projects", () => {
    const s = projects.flatMap((p) => p.sessionIds);
    const g = projects.flatMap((p) => p.galleryIds);
    expect(new Set(s).size).toBe(s.length);
    expect(new Set(g).size).toBe(g.length);
  });

  it("links invoices to projects for the same client", () => {
    for (const inv of invoices.filter((i) => i.projectId)) {
      expect(byId(inv.projectId!).clientId).toBe(inv.clientId);
    }
  });
});

describe("filterProjects", () => {
  it("shows active projects soonest-due first", () => {
    const rows = filterProjects(projects, clientName, {});
    expect(rows.every((p) => projectTab(p) === "active")).toBe(true);
    expect(rows[0]?.id).toBe("pr2");
    expect(rows).toHaveLength(8);
  });

  it("filters by tab and searches project or client name", () => {
    expect(ids(filterProjects(projects, clientName, { tab: "completed" }))).toEqual(["pr9"]);
    expect(filterProjects(projects, clientName, { tab: "archived" })).toEqual([]);
    expect(ids(filterProjects(projects, clientName, { tab: "all", q: "naledi" }))).toEqual(["pr3"]);
    expect(
      ids(filterProjects(projects, clientName, { tab: "all", q: "WEDDING", sort: "name" })),
    ).toEqual(["pr5", "pr1"]);
  });

  it("sorts by value and newest", () => {
    expect(filterProjects(projects, clientName, { tab: "all", sort: "value" })[0]?.id).toBe("pr6");
    expect(filterProjects(projects, clientName, { tab: "all", sort: "recent" })[0]?.id).toBe("pr8");
  });

  it("counts tabs, including archived", () => {
    expect(countProjects(projects)).toEqual({ active: 8, completed: 1, archived: 0, all: 9 });
    expect(countProjects([{ ...byId("pr1"), archived: true }]).archived).toBe(1);
  });
});

describe("progress, dates and money", () => {
  it("computes checklist progress", () => {
    expect(projectProgress(byId("pr1").tasks)).toBe(75);
    expect(projectProgress(byId("pr9").tasks)).toBe(100);
    expect(projectProgress([])).toBe(0);
  });

  it("flags overdue work that isn't delivered", () => {
    expect(isOverdue(byId("pr2"), DEMO_TODAY)).toBe(true); // editing, due Apr 18
    expect(isOverdue(byId("pr9"), DEMO_TODAY)).toBe(false); // completed
    expect(isOverdue({ ...byId("pr2"), status: "delivered" }, DEMO_TODAY)).toBe(false);
    expect(daysUntil("2025-04-25", DEMO_TODAY)).toBe(5);
  });

  it("totals linked invoices", () => {
    expect(projectMoney(byId("pr1"), invoices)).toMatchObject({
      invoiced: 2400,
      paid: 2400,
      outstanding: 0,
      uninvoiced: 2400,
    });
    expect(projectMoney(byId("pr2"), invoices)).toMatchObject({
      invoiced: 560,
      paid: 0,
      outstanding: 560,
    });
    // Drafts don't count as invoiced.
    expect(projectMoney(byId("pr3"), invoices).invoiced).toBe(0);
  });

  it("finds the project for a session or gallery", () => {
    expect(projectOf(projects, { sessionId: "s6" })?.id).toBe("pr4");
    expect(projectOf(projects, { galleryId: "family-portraits" })?.id).toBe("pr3");
    expect(projectOf(projects, { sessionId: "s20" })).toBeUndefined();
  });
});

describe("validation", () => {
  const ok = {
    name: "Shoot",
    clientId: "c1",
    startDate: "2025-04-20",
    dueDate: "2025-05-01",
    value: "1200",
  };

  it("accepts a valid project", () => {
    expect(validateProjectForm(ok)).toEqual({});
    expect(validateProjectForm({ ...ok, value: "" })).toEqual({});
  });

  it("rejects missing fields, reversed dates and bad values", () => {
    expect(
      Object.keys(validateProjectForm({ ...ok, name: "", clientId: "", dueDate: "" })).sort(),
    ).toEqual(["clientId", "dueDate", "name"]);
    expect(validateProjectForm({ ...ok, dueDate: "2025-04-01" }).dueDate).toMatch(
      /before the start/,
    );
    expect(validateProjectForm({ ...ok, value: "-5" }).value).toBeDefined();
  });

  it("validates list search", () => {
    expect(validateProjectSearch({ tab: "completed", q: "x", sort: "value" })).toEqual({
      tab: "completed",
      q: "x",
      sort: "value",
    });
    expect(validateProjectSearch({ tab: "active", sort: "due", q: "" })).toEqual({});
  });
});
