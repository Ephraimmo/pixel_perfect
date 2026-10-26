// Public booking helpers — studio hours, slot availability and the request
// form. Pure so the booking page and its tests share them.

import { addDays, format } from "date-fns";
import type { Session } from "./demo-data";
import type { BookingType } from "./booking-data";
import { dayKey, fromKey, fromMins, toMins } from "./calendar";

export const BOOKING_RULES = {
  open: "08:00",
  close: "18:00",
  stepMins: 30,
  /** Sunday */
  closedWeekdays: [0] as number[],
  /** Earliest bookable day, counted from today. */
  minNoticeDays: 1,
  windowDays: 90,
  /** Kept free before and after existing sessions. */
  bufferMins: 30,
};

export type BookingRules = typeof BOOKING_RULES;

export interface BookingSearch {
  type?: string;
  date?: string;
}

export function validateBookingSearch(raw: Record<string, unknown>): BookingSearch {
  const out: BookingSearch = {};
  const { type, date } = raw;
  if (typeof type === "string" && /^[a-z0-9-]{1,40}$/.test(type)) out.type = type;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.date = date;
  return out;
}

export function bookingWindow(today: string, rules: BookingRules = BOOKING_RULES) {
  return {
    first: dayKey(addDays(fromKey(today), rules.minNoticeDays)),
    last: dayKey(addDays(fromKey(today), rules.windowDays)),
  };
}

/** Start times (HH:mm) a session of this length can be requested on `date`. */
export function availableSlots(
  date: string,
  durationMins: number,
  sessions: Session[],
  today: string,
  rules: BookingRules = BOOKING_RULES,
): string[] {
  const { first, last } = bookingWindow(today, rules);
  if (date < first || date > last) return [];
  if (rules.closedWeekdays.includes(fromKey(date).getDay())) return [];
  const busy = sessions
    .filter((s) => s.date === date && s.status !== "cancelled")
    .map((s) => [toMins(s.start) - rules.bufferMins, toMins(s.end) + rules.bufferMins] as const);
  const slots: string[] = [];
  for (let t = toMins(rules.open); t + durationMins <= toMins(rules.close); t += rules.stepMins) {
    const end = t + durationMins;
    if (busy.every(([b0, b1]) => end <= b0 || t >= b1)) slots.push(fromMins(t));
  }
  return slots;
}

/** First day with at least one free slot, or null if the window is full. */
export function firstAvailableDate(
  durationMins: number,
  sessions: Session[],
  today: string,
  rules: BookingRules = BOOKING_RULES,
): string | null {
  for (let i = rules.minNoticeDays; i <= rules.windowDays; i++) {
    const d = dayKey(addDays(fromKey(today), i));
    if (availableSlots(d, durationMins, sessions, today, rules).length) return d;
  }
  return null;
}

export function priceLabel(t: Pick<BookingType, "price">): string {
  return t.price === 0 ? "Free" : `$${t.price.toLocaleString("en-US")}`;
}

export function durationText(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h} ${h === 1 ? "hour" : "hours"}` : `${h.toFixed(1)} hours`;
}

/** Split a day's slots into morning / afternoon / evening for display. */
export function groupSlots(slots: string[]) {
  return [
    { label: "Morning", slots: slots.filter((s) => s < "12:00") },
    { label: "Afternoon", slots: slots.filter((s) => s >= "12:00" && s < "17:00") },
    { label: "Evening", slots: slots.filter((s) => s >= "17:00") },
  ].filter((g) => g.slots.length);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface BookingForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}

export function validateBookingForm(f: BookingForm): Partial<Record<keyof BookingForm, string>> {
  const errors: Partial<Record<keyof BookingForm, string>> = {};
  if (!f.name.trim()) errors.name = "Please tell us your name.";
  if (!f.email.trim()) errors.email = "We need an email to confirm your booking.";
  else if (!EMAIL_RE.test(f.email.trim()))
    errors.email = "That doesn't look like an email address.";
  const digits = f.phone.replace(/\D/g, "");
  if (f.phone.trim() && (digits.length < 7 || /[^\d\s()+.-]/.test(f.phone)))
    errors.phone = "Use digits, spaces, ( ) + or - only.";
  if (f.message.length > 1000) errors.message = "Please keep it under 1,000 characters.";
  if (!f.consent) errors.consent = "Please agree so we can contact you about this booking.";
  return errors;
}

/** The inquiry text stored on the lead the request creates. */
export function bookingMessage(t: BookingType, date: string, start: string, note: string): string {
  const when = `${format(fromKey(date), "EEEE, MMMM d")} at ${format(new Date(`2025-01-01T${start}:00`), "h:mm a")}`;
  return `Booking request: ${t.name} (${durationText(t.durationMins)}) on ${when}.${note.trim() ? `\n\n${note.trim()}` : ""}`;
}
