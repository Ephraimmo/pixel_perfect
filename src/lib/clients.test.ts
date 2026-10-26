import { describe, expect, it } from "vitest";

import { DEMO_TODAY, STATE_VERSION, migrateState, seedState } from "@/lib/demo-data";
import {
  clientTimeline,
  countClients,
  filterClients,
  groupByDay,
  initials,
  parseTags,
  relativeDay,
  sortNotes,
  validateClientForm,
  validateClientListSearch,
} from "@/lib/clients";

const clients = seedState().clients;
const names = (list: { name: string }[]) => list.map((c) => c.name);

describe("filterClients", () => {
  it("lists every client by most recent activity by default", () => {
    const rows = filterClients(clients, {});
    expect(rows).toHaveLength(clients.length);
    expect(rows[0]?.name).toBe("Sarah Mitchell");
    const dates = rows.map((c) => c.lastActivity);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("filters by status, starred and type", () => {
    expect(names(filterClients(clients, { status: "starred" })).sort()).toEqual([
      "James Carter",
      "Naledi Mokoena",
    ]);
    expect(filterClients(clients, { status: "past" }).every((c) => c.status === "past")).toBe(true);
    expect(names(filterClients(clients, { type: "wedding", sort: "name" }))).toEqual([
      "Liam O'Connor",
      "Sarah Mitchell",
    ]);
  });

  it("searches name, email, company, city, tags and phone digits", () => {
    expect(names(filterClients(clients, { q: "  amber & oak " }))).toEqual(["David Kim"]);
    expect(names(filterClients(clients, { q: "retainer", sort: "name" }))).toEqual([
      "James Carter",
      "Zanele Khumalo",
    ]);
    expect(names(filterClients(clients, { q: "010-2481" }))).toEqual(["Sarah Mitchell"]);
    expect(names(filterClients(clients, { q: "0102481" }))).toEqual(["Sarah Mitchell"]);
    expect(filterClients(clients, { q: "nobody here" })).toEqual([]);
  });

  it("combines filters", () => {
    expect(filterClients(clients, { status: "past", type: "wedding" })).toEqual([]);
    expect(names(filterClients(clients, { status: "active", q: "durban", sort: "name" }))).toEqual([
      "Olivia Brown",
      "Zanele Khumalo",
    ]);
  });

  it("sorts by name, newest, sessions and spend without mutating input", () => {
    const before = names(clients);
    expect(filterClients(clients, { sort: "name" })[0]?.name).toBe("David Kim");
    expect(filterClients(clients, { sort: "newest" })[0]?.name).toBe("Olivia Brown");
    expect(filterClients(clients, { sort: "sessions" })[0]?.name).toBe("Naledi Mokoena");
    expect(filterClients(clients, { sort: "spent" })[0]?.name).toBe("Zanele Khumalo");
    expect(names(clients)).toEqual(before);
  });
});

describe("countClients", () => {
  it("counts the total, each status and starred", () => {
    expect(countClients(clients)).toEqual({ all: 12, active: 8, past: 4, starred: 2 });
  });
});

describe("validateClientListSearch", () => {
  it("keeps valid values and drops defaults", () => {
    expect(
      validateClientListSearch({ status: "past", type: "event", q: "zan", sort: "name" }),
    ).toEqual({ status: "past", type: "event", q: "zan", sort: "name" });
    expect(
      validateClientListSearch({ status: "all", type: "all", q: " ", sort: "recent" }),
    ).toEqual({});
  });

  it("ignores unknown values", () => {
    expect(validateClientListSearch({ status: "vip", type: "boudoir", q: 3, sort: "x" })).toEqual(
      {},
    );
  });
});

describe("validateClientForm", () => {
  const ok = { name: "Thandi Nkosi", email: "thandi@nkosi.co.za", phone: "(555) 010-1111" };

  it("accepts a valid new client", () => {
    expect(validateClientForm(ok, clients)).toEqual({});
    expect(validateClientForm({ ...ok, phone: "" }, clients)).toEqual({});
  });

  it("requires a name and a well-formed email", () => {
    expect(validateClientForm({ ...ok, name: "  " }, clients).name).toBeDefined();
    expect(validateClientForm({ ...ok, email: "" }, clients).email).toMatch(/enter/i);
    expect(validateClientForm({ ...ok, email: "thandi@nkosi" }, clients).email).toMatch(
      /doesn't look/,
    );
  });

  it("rejects an email another client already uses, ignoring case", () => {
    expect(validateClientForm({ ...ok, email: " SARAH@sarahmitchell.com " }, clients).email).toBe(
      "Sarah Mitchell already uses this email.",
    );
  });

  it("rejects short or non-numeric phone numbers", () => {
    expect(validateClientForm({ ...ok, phone: "123" }, clients).phone).toBeDefined();
    expect(validateClientForm({ ...ok, phone: "call me 5550101234" }, clients).phone).toBeDefined();
  });
});

describe("small helpers", () => {
  it("builds initials", () => {
    expect(initials("Naledi Mokoena")).toBe("NM");
    expect(initials("Liam O'Connor")).toBe("LO");
    expect(initials("cher")).toBe("C");
    expect(initials("  ")).toBe("?");
  });

  it("parses tags", () => {
    expect(parseTags("Wedding 2025, album ,  , Album")).toEqual(["Wedding 2025", "album"]);
  });

  it("describes days relative to the demo date", () => {
    expect(relativeDay(DEMO_TODAY, DEMO_TODAY)).toBe("Today");
    expect(relativeDay("2025-04-19", DEMO_TODAY)).toBe("Yesterday");
    expect(relativeDay("2025-04-15", DEMO_TODAY)).toBe("5 days ago");
    expect(relativeDay("2025-04-06", DEMO_TODAY)).toBe("2 weeks ago");
    expect(relativeDay("2024-10-21", DEMO_TODAY)).toBe("Oct 2024");
  });
});

describe("migrateState", () => {
  it("upgrades v2 saved state without losing the user's changes", () => {
    const seed = seedState();
    const v2 = {
      ...seed,
      version: 2,
      clients: [
        {
          id: "c2",
          name: "James Carter",
          email: "james@jamescarter.com",
          avatar: "x",
          sessions: 7,
          starred: false,
        },
        {
          id: "c-new",
          name: "Added Locally",
          email: "a@b.co",
          avatar: "y",
          sessions: 0,
          starred: true,
        },
      ],
    };
    const out = migrateState(JSON.parse(JSON.stringify(v2)));
    expect(out?.version).toBe(STATE_VERSION);
    const james = out?.clients.find((c) => c.id === "c2");
    expect(james).toMatchObject({ sessions: 7, starred: false, company: "Carter Travel Co." });
    expect(out?.clients.find((c) => c.id === "c-new")).toMatchObject({
      starred: true,
      type: "portrait",
      tags: [],
    });
    // New seed clients are appended; nothing is duplicated.
    expect(out?.clients.filter((c) => c.id === "c2")).toHaveLength(1);
    expect(out?.clients.some((c) => c.id === "c6")).toBe(true);
  });

  it("rejects unusable data", () => {
    expect(migrateState(null)).toBeNull();
    expect(migrateState({ version: 1, galleries: [], clients: [] })).toBeNull();
    expect(migrateState({ version: STATE_VERSION, galleries: "no" })).toBeNull();
  });
});

describe("client profile helpers", () => {
  const state = seedState();
  const sarah = state.clients.find((c) => c.id === "c1")!;

  it("builds a newest-first timeline ending with when they became a client", () => {
    const t = clientTimeline(sarah, state.clientEvents);
    expect(
      t.every((e) => e.id.startsWith("created") || state.clientEvents.some((x) => x.id === e.id)),
    ).toBe(true);
    expect(t.filter((e) => e.kind !== "created")).toHaveLength(7);
    expect(t[0]?.title).toBe("Gallery viewed");
    expect(t.at(-1)).toMatchObject({ kind: "created", at: "2024-09-14", detail: "via Referral" });
  });

  it("groups entries by day in order", () => {
    const groups = groupByDay([
      { at: "2025-04-19T16:00:00" },
      { at: "2025-04-19T09:00:00" },
      { at: "2025-04-18T10:00:00" },
    ]);
    expect(groups.map((g) => [g.day, g.items.length])).toEqual([
      ["2025-04-19", 2],
      ["2025-04-18", 1],
    ]);
  });

  it("sorts pinned notes first, then newest", () => {
    const notes = sortNotes(state.clientNotes.filter((n) => n.clientId === "c1"));
    expect(notes.map((n) => n.id)).toEqual(["n1", "n2"]);
    const unpinned = sortNotes(notes.map((n) => ({ ...n, pinned: false })));
    expect(unpinned.map((n) => n.id)).toEqual(["n2", "n1"]);
  });

  it("lets a client keep their own email when editing", () => {
    expect(
      validateClientForm({ name: "Sarah", email: sarah.email, phone: "" }, state.clients, "c1"),
    ).toEqual({});
  });

  it("links seeded galleries to clients and migrates v3 state", () => {
    expect(state.galleries.map((g) => g.clientId)).toEqual(["c1", "c6", "c4", "c2"]);
    const v3 = JSON.parse(
      JSON.stringify({
        ...state,
        version: 3,
        galleries: state.galleries.map(({ clientId: _, ...g }) => g),
        clientNotes: undefined,
        clientEvents: undefined,
        invoices: undefined,
      }),
    );
    const out = migrateState(v3);
    expect(out?.galleries.map((g) => g.clientId)).toEqual(["c1", "c6", "c4", "c2"]);
    expect(out?.invoices).toHaveLength(state.invoices.length);
    expect(out?.clientNotes).toHaveLength(state.clientNotes.length);
  });
});
