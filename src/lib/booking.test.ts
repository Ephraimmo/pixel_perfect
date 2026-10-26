import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState, type Session } from "@/lib/demo-data";
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
} from "@/lib/booking";

const { sessions, bookingTypes } = seedState();
const type = (id: string) => bookingTypes.find((t) => t.id === id)!;

describe("availableSlots", () => {
  it("needs a day's notice and stays inside the 90-day window", () => {
    expect(bookingWindow(DEMO_TODAY)).toEqual({ first: "2025-04-21", last: "2025-07-19" });
    expect(availableSlots(DEMO_TODAY, 60, [], DEMO_TODAY)).toEqual([]);
    expect(availableSlots("2025-07-20", 60, [], DEMO_TODAY)).toEqual([]);
  });

  it("is closed on Sundays", () => {
    expect(availableSlots("2025-04-27", 60, [], DEMO_TODAY)).toEqual([]);
  });

  it("offers half-hour starts that finish by closing on an empty day", () => {
    const slots = availableSlots("2025-05-05", 60, [], DEMO_TODAY);
    expect(slots[0]).toBe("08:00");
    expect(slots.at(-1)).toBe("17:00");
    expect(slots).toHaveLength(19);
    expect(availableSlots("2025-05-05", 120, [], DEMO_TODAY).at(-1)).toBe("16:00");
  });

  it("keeps a 30-minute buffer around booked sessions", () => {
    // Mon Apr 21: 9–11 wedding shoot and 1–5 editing block.
    expect(availableSlots("2025-04-21", 60, sessions, DEMO_TODAY)).toEqual(["11:30"]);
    expect(availableSlots("2025-04-21", 90, sessions, DEMO_TODAY)).toEqual([]);
  });

  it("ignores cancelled sessions", () => {
    const cancelled: Session = {
      ...sessions[0]!,
      date: "2025-05-05",
      start: "08:00",
      end: "18:00",
      status: "cancelled",
    };
    expect(availableSlots("2025-05-05", 60, [cancelled], DEMO_TODAY)).toHaveLength(19);
  });

  it("finds the first open day", () => {
    expect(firstAvailableDate(60, sessions, DEMO_TODAY)).toBe("2025-04-21");
    expect(firstAvailableDate(120, sessions, DEMO_TODAY)).toBe("2025-04-22");
    const fullDay = (date: string): Session => ({
      ...sessions[0]!,
      date,
      start: "07:00",
      end: "19:00",
      status: "confirmed",
    });
    expect(firstAvailableDate(60, [fullDay("2025-04-21"), fullDay("2025-04-22")], DEMO_TODAY)).toBe(
      "2025-04-23",
    );
  });
});

describe("display helpers", () => {
  it("labels prices and durations", () => {
    expect(priceLabel(type("consult"))).toBe("Free");
    expect(priceLabel(type("family"))).toBe("$350");
    expect(durationText(30)).toBe("30 min");
    expect(durationText(60)).toBe("1 hour");
    expect(durationText(90)).toBe("1.5 hours");
    expect(durationText(120)).toBe("2 hours");
  });

  it("groups slots by part of day", () => {
    expect(groupSlots(["09:00", "11:30", "12:00", "16:30", "17:00"])).toEqual([
      { label: "Morning", slots: ["09:00", "11:30"] },
      { label: "Afternoon", slots: ["12:00", "16:30"] },
      { label: "Evening", slots: ["17:00"] },
    ]);
  });

  it("writes the lead message", () => {
    expect(bookingMessage(type("portrait"), "2025-05-05", "14:30", "  Graduation photos  ")).toBe(
      "Booking request: Portrait Session (1 hour) on Monday, May 5 at 2:30 PM.\n\nGraduation photos",
    );
    expect(bookingMessage(type("consult"), "2025-05-05", "09:00", "")).toBe(
      "Booking request: Wedding Consultation (30 min) on Monday, May 5 at 9:00 AM.",
    );
  });
});

describe("validation", () => {
  const ok = { name: "Zoe", email: "zoe@example.com", phone: "", message: "", consent: true };

  it("accepts a complete request", () => {
    expect(validateBookingForm(ok)).toEqual({});
  });

  it("requires name, a valid email and consent", () => {
    expect(
      Object.keys(validateBookingForm({ ...ok, name: "", email: "zoe@", consent: false })).sort(),
    ).toEqual(["consent", "email", "name"]);
    expect(validateBookingForm({ ...ok, phone: "abc" }).phone).toBeDefined();
    expect(validateBookingForm({ ...ok, message: "x".repeat(1001) }).message).toBeDefined();
  });

  it("validates URL search", () => {
    expect(validateBookingSearch({ type: "family", date: "2025-05-05" })).toEqual({
      type: "family",
      date: "2025-05-05",
    });
    expect(validateBookingSearch({ type: "<script>", date: "soon" })).toEqual({});
  });
});
