import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import {
  contractContext,
  contractTab,
  countContracts,
  daysWaiting,
  fieldsIn,
  filterContracts,
  parseBlocks,
  renderMerge,
  signatureMatches,
  validateContractSearch,
} from "@/lib/contracts";

const state = seedState();
const { contracts, clients } = state;
const byId = (id: string) => contracts.find((c) => c.id === id)!;
const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "";

describe("merge fields", () => {
  it("fills every field from the client, project and first session", () => {
    const ctx = contractContext(byId("k1"), state, DEMO_TODAY);
    const { text, missing } = renderMerge(byId("k1").body, ctx);
    expect(missing).toEqual([]);
    expect(text).toContain('Karabo Photography ("the Photographer") and Sarah Mitchell');
    expect(text).toContain("The total fee is $4,800.00");
    expect(text).toContain("deposit of $1,440.00"); // 30%
    expect(text).toContain("by May 15, 2025");
    expect(text).toContain("starting on April 21, 2025"); // first upcoming project session
    expect(text).toContain("Signed on April 20, 2025.");
  });

  it("leaves unavailable or unknown fields in place and reports them", () => {
    const ctx = contractContext({ clientId: "c5" }, state, DEMO_TODAY); // no project
    const { text, missing } = renderMerge("Hi {{client.name}}, {{project.value}} {{ nope }}", ctx);
    expect(text).toBe("Hi Olivia Brown, {{project.value}} {{ nope }}");
    expect(missing).toEqual(["project.value", "nope"]);
  });

  it("lists fields used", () => {
    expect(fieldsIn("{{a}} {{ b.c }} {{a}}")).toEqual(["a", "b.c"]);
  });
});

describe("parseBlocks", () => {
  it("splits headings, numbered lists and paragraphs", () => {
    expect(
      parseBlocks("## Title\n\nIntro line\nmore\n\n1. One\n2. Two\n\n## Next\nText under"),
    ).toEqual([
      { kind: "heading", text: "Title" },
      { kind: "para", text: "Intro line more" },
      { kind: "list", items: ["One", "Two"] },
      { kind: "heading", text: "Next" },
      { kind: "para", text: "Text under" },
    ]);
    expect(parseBlocks("  \n\n ")).toEqual([]);
  });
});

describe("status and list", () => {
  it("groups statuses into tabs", () => {
    expect(contractTab(byId("k3"))).toBe("awaiting"); // viewed
    expect(contractTab(byId("k5"))).toBe("awaiting"); // sent
    expect(contractTab({ status: "void" })).toBe("closed");
    expect(countContracts(contracts)).toEqual({
      all: 6,
      draft: 1,
      awaiting: 2,
      signed: 3,
      closed: 0,
    });
  });

  it("puts the longest-waiting contracts first", () => {
    const rows = filterContracts(contracts, clientName, {});
    expect(rows.map((c) => c.id).slice(0, 3)).toEqual(["k5", "k3", "k6"]);
    expect(filterContracts(contracts, clientName, { q: "khumalo" }).map((c) => c.id)).toEqual([
      "k4",
    ]);
    expect(filterContracts(contracts, clientName, { tab: "signed" })).toHaveLength(3);
  });

  it("counts days waiting only while awaiting a signature", () => {
    expect(daysWaiting(byId("k5"), DEMO_TODAY)).toBe(6);
    expect(daysWaiting(byId("k3"), DEMO_TODAY)).toBe(4);
    expect(daysWaiting(byId("k1"), DEMO_TODAY)).toBeNull();
    expect(daysWaiting(byId("k6"), DEMO_TODAY)).toBeNull();
  });

  it("validates search", () => {
    expect(validateContractSearch({ tab: "awaiting", q: "x", view: "templates" })).toEqual({
      tab: "awaiting",
      q: "x",
      view: "templates",
    });
    expect(validateContractSearch({ tab: "all", view: "grid" })).toEqual({});
  });
});

describe("signatureMatches", () => {
  it("requires the client's name, ignoring case and extra spaces", () => {
    expect(signatureMatches("  marcus   JOHNSON ", "Marcus Johnson")).toBe(true);
    expect(signatureMatches("Marcus", "Marcus Johnson")).toBe(false);
    expect(signatureMatches("", "")).toBe(false);
  });
});
