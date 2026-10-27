import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import {
  emailValues,
  filterTemplates,
  missingReason,
  renderEmail,
  sortOutbox,
  validateEmailDraft,
  validateEmailSearch,
  validateTemplateDraft,
} from "@/lib/emails";

const state = seedState();
const tpl = (id: string) => state.emailTemplates.find((t) => t.id === id)!;

describe("emailValues", () => {
  it("uses the client's next session, latest gallery and oldest unpaid invoice", () => {
    const v = emailValues("c4", state, DEMO_TODAY, "https://demo.test");
    expect(v["client.firstName"]).toBe("David");
    expect(v["session.date"]).toBe("Wednesday, April 23, 2025"); // product edit block, next after today
    expect(v["session.time"]).toBe("10:30 AM");
    expect(v["invoice.number"]).toBe("INV-1044");
    expect(v["invoice.balance"]).toBe("$560.00");
    expect(v["gallery.title"]).toBeUndefined(); // only a draft gallery
  });

  it("links the latest published gallery", () => {
    expect(emailValues("c1", state, DEMO_TODAY, "https://demo.test")["gallery.link"]).toBe(
      "https://demo.test/g/sarah-james-wedding",
    );
  });

  it("ignores cancelled and past sessions", () => {
    expect(emailValues("c8", state, DEMO_TODAY)["session.date"]).toBeUndefined(); // only a cancelled one
  });
});

describe("renderEmail", () => {
  it("fills a booking confirmation", () => {
    const r = renderEmail(tpl("et-booking"), emailValues("c2", state, DEMO_TODAY));
    expect(r.subject).toBe("You're booked, James! 🎉");
    expect(r.body).toContain("confirmed for Tuesday, April 22, 2025 at 1:00 PM at Studio");
    expect(r.body).toContain("Warmly,\nKarabo");
    expect(r.missing).toEqual([]);
  });

  it("reports fields a client has no data for", () => {
    const r = renderEmail(tpl("et-payment"), emailValues("c1", state, DEMO_TODAY));
    expect(r.missing).toEqual(["invoice.number", "invoice.balance", "invoice.dueDate"]);
    expect(r.subject).toContain("{{invoice.number}}");
    expect(missingReason("invoice.number")).toBe("no unpaid invoice");
    expect(missingReason("session.date")).toBe("no upcoming session");
  });
});

describe("validation", () => {
  const ok = { to: "a@b.co", subject: "Hi", body: "Hello" };
  const now = "2025-04-20T10:00";

  it("accepts a ready email and blocks unfilled fields", () => {
    expect(validateEmailDraft(ok, now)).toEqual({});
    expect(validateEmailDraft({ ...ok, body: "Due {{invoice.dueDate}}" }, now).body).toMatch(
      /highlighted/,
    );
    expect(validateEmailDraft({ ...ok, to: "nope" }, now).to).toBeDefined();
    expect(validateEmailDraft({ ...ok, subject: " " }, now).subject).toBeDefined();
  });

  it("needs a future time when scheduling", () => {
    expect(validateEmailDraft({ ...ok, scheduleAt: "2025-04-21T09:00" }, now)).toEqual({});
    expect(validateEmailDraft({ ...ok, scheduleAt: "2025-04-20T09:00" }, now).scheduleAt).toMatch(
      /future/,
    );
    expect(validateEmailDraft({ ...ok, scheduleAt: "" }, now).scheduleAt).toBeDefined();
  });

  it("checks templates and lists unknown fields once", () => {
    expect(validateTemplateDraft({ name: "", subject: "", body: "" })).toMatchObject({
      name: expect.any(String),
      subject: expect.any(String),
      body: expect.any(String),
    });
    expect(
      validateTemplateDraft({
        name: "x",
        subject: "{{oops}}",
        body: "{{client.name}} {{oops}} {{nah}}",
      }).unknown,
    ).toEqual(["oops", "nah"]);
  });
});

describe("lists", () => {
  it("orders scheduled (soonest) before sent (newest)", () => {
    expect(sortOutbox(state.sentEmails).map((e) => e.id)).toEqual([
      "em1",
      "em2",
      "em3",
      "em4",
      "em5",
    ]);
  });

  it("filters templates by text and category", () => {
    expect(filterTemplates(state.emailTemplates, "gallery").map((t) => t.id)).toEqual([
      "et-gallery",
    ]);
    expect(filterTemplates(state.emailTemplates, "", "payment").map((t) => t.id)).toEqual([
      "et-payment",
    ]);
    expect(filterTemplates(state.emailTemplates, "zzz")).toEqual([]);
  });

  it("validates search", () => {
    expect(validateEmailSearch({ view: "sent", q: "x", category: "gallery" })).toEqual({
      view: "sent",
      q: "x",
      category: "gallery",
    });
    expect(validateEmailSearch({ view: "inbox", category: "spam" })).toEqual({});
  });
});
