import { type ParseResult } from "./money";

export const NAME_MAX = 50;
export const DESCRIPTION_MAX = 100;

/** Parse a positive integer database ID from a route param or JSON value. */
export function parseId(input: unknown, label = "ID"): ParseResult<number> {
  let value: number;
  if (typeof input === "number") {
    value = input;
  } else if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    value = Number(input.trim());
  } else {
    return { ok: false, error: `${label} must be a positive integer.` };
  }
  if (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) {
    return { ok: false, error: `${label} must be a positive integer.` };
  }
  return { ok: true, value };
}

/** Trim, collapse internal whitespace, and enforce a non-empty bounded string. */
export function parseText(input: unknown, label: string, max: number): ParseResult<string> {
  if (typeof input !== "string") return { ok: false, error: `${label} is required.` };
  const value = input.trim().replace(/\s+/g, " ");
  if (value === "") return { ok: false, error: `${label} cannot be empty.` };
  if (value.length > max) {
    return { ok: false, error: `${label} must be ${max} characters or fewer.` };
  }
  return { ok: true, value };
}

export const parseGroupName = (input: unknown) => parseText(input, "Group name", NAME_MAX);
export const parseMemberName = (input: unknown) => parseText(input, "Member name", NAME_MAX);
export const parseDescription = (input: unknown) =>
  parseText(input, "Description", DESCRIPTION_MAX);

/**
 * Parse an optional "YYYY-MM-DD" expense date. Missing -> today (UTC).
 * Stored at 12:00 UTC so the calendar day never shifts across time zones.
 */
export function parseExpenseDate(input: unknown, now = new Date()): ParseResult<Date> {
  if (input === undefined || input === null || input === "") {
    const today = now.toISOString().slice(0, 10);
    return { ok: true, value: new Date(`${today}T12:00:00.000Z`) };
  }
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { ok: false, error: "Date must be in YYYY-MM-DD format." };
  }
  const date = new Date(`${input}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
    return { ok: false, error: "Date is not a valid calendar date." };
  }
  const year = date.getUTCFullYear();
  if (year < 2000 || date.getTime() > now.getTime() + 366 * 24 * 3600 * 1000) {
    return { ok: false, error: "Date must be between 2000 and one year from today." };
  }
  return { ok: true, value: date };
}

/** Parse a list of participant IDs: non-empty, all valid, no duplicates. */
export function parseParticipantIds(input: unknown): ParseResult<number[]> {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: "Select at least one participant." };
  }
  const ids: number[] = [];
  for (const raw of input) {
    const parsed = parseId(raw, "Participant ID");
    if (!parsed.ok) return parsed;
    if (ids.includes(parsed.value)) {
      return { ok: false, error: "Each participant can only be selected once." };
    }
    ids.push(parsed.value);
  }
  return { ok: true, value: ids };
}
