import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import {
  filterLeads,
  leadTrend,
  leadsByStage,
  matchingClient,
  nextStage,
  pipelineValue,
  validateLeadForm,
  validateLeadSearch,
  winRate,
} from "@/lib/leads";

const { leads, clients } = seedState();
const names = (list: { name: string }[]) => list.map((l) => l.name);

describe("filterLeads", () => {
  it("lists newest inquiries first", () => {
    const rows = filterLeads(leads, {});
    expect(rows[0]?.name).toBe("Emma Wilson");
    expect(rows.at(-1)?.name).toBe("Fatima Ebrahim");
  });

  it("filters by type and searches name, email, location and message", () => {
    expect(filterLeads(leads, { type: "commercial" })).toHaveLength(2);
    expect(names(filterLeads(leads, { q: "drone" }))).toEqual(["Nomvula Sithole"]);
    expect(names(filterLeads(leads, { q: "STELLENBOSCH" }))).toEqual(["Lindiwe Ndlovu"]);
    expect(filterLeads(leads, { q: "drone", type: "portrait" })).toEqual([]);
  });
});

describe("pipeline numbers", () => {
  it("groups by stage", () => {
    const g = leadsByStage(leads);
    expect(Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length]))).toEqual({
      new: 4,
      contacted: 2,
      consultation: 2,
      proposal: 2,
      booked: 2,
      lost: 2,
    });
  });

  it("values only open leads", () => {
    // 3800+4500+1200+1600 + 350+900 + 650+5200 + 2400+3900
    expect(pipelineValue(leads)).toBe(24500);
  });

  it("matches the dashboard: 8 new leads, up 33% on the previous 30 days", () => {
    expect(leadTrend(leads, DEMO_TODAY)).toEqual({ current: 8, previous: 6, change: 33 });
    expect(leadTrend([], DEMO_TODAY)).toEqual({ current: 0, previous: 0, change: null });
  });

  it("computes win rate from decided leads", () => {
    expect(winRate(leads)).toBe(50);
    expect(winRate(leads.filter((l) => l.stage === "new"))).toBeNull();
  });
});

describe("matchingClient", () => {
  it("recognises an inquiry from an existing client by email", () => {
    const emma = leads.find((l) => l.id === "l1")!;
    expect(matchingClient(emma, clients)?.id).toBe("c3");
    expect(matchingClient({ email: " EMMA@emmawilson.com " }, clients)?.id).toBe("c3");
    expect(matchingClient({ email: "new@person.com" }, clients)).toBeUndefined();
  });

  it("prefers the linked client", () => {
    expect(matchingClient({ email: "x@y.z", clientId: "c10" }, clients)?.name).toBe(
      "Liam O'Connor",
    );
  });
});

describe("validateLeadForm", () => {
  const ok = {
    name: "Zoe Smith",
    email: "zoe@smith.com",
    phone: "",
    budget: "1200",
    message: "Engagement shoot",
  };

  it("accepts a complete inquiry, including one from an existing client", () => {
    expect(validateLeadForm(ok, leads)).toEqual({});
    expect(validateLeadForm({ ...ok, email: "sarah@sarahmitchell.com" }, leads)).toEqual({});
  });

  it("flags missing fields, bad budgets and duplicate open leads", () => {
    const e = validateLeadForm({ ...ok, name: "", message: " ", budget: "lots" }, leads);
    expect(Object.keys(e).sort()).toEqual(["budget", "message", "name"]);
    expect(validateLeadForm({ ...ok, email: "ruan@thecopperpot.co.za" }, leads).email).toMatch(
      /open lead/,
    );
    // A lost lead can inquire again.
    expect(validateLeadForm({ ...ok, email: "jason.naidoo@brightpath.io" }, leads)).toEqual({});
  });
});

describe("stages and search", () => {
  it("walks the usual flow", () => {
    expect(nextStage("new")).toBe("contacted");
    expect(nextStage("proposal")).toBe("booked");
    expect(nextStage("booked")).toBeNull();
    expect(nextStage("lost")).toBeNull();
  });

  it("validates URL search", () => {
    expect(validateLeadSearch({ q: "x", type: "event", view: "list", lead: "l1" })).toEqual({
      q: "x",
      type: "event",
      view: "list",
      lead: "l1",
    });
    expect(validateLeadSearch({ q: " ", type: "boudoir", view: "grid", lead: 3 })).toEqual({});
  });
});
