import { describe, expect, it } from "vitest";
import {
  parseExpenseDate,
  parseGroupName,
  parseId,
  parseMemberName,
  parseParticipantIds,
} from "@/lib/validation";

describe("parseId", () => {
  it.each([[1], ["1"], [" 42 "], [2_147_483_647]])("accepts %j", (input) => {
    expect(parseId(input).ok).toBe(true);
  });
  it.each([[0], [-1], [1.5], ["abc"], ["1abc"], ["-3"], [""], [null], [undefined], [2_147_483_648], [[1]]])(
    "rejects %j",
    (input) => {
      expect(parseId(input).ok).toBe(false);
    },
  );
});

describe("names", () => {
  it("trims and collapses whitespace", () => {
    expect(parseMemberName("  Alice   Smith ")).toEqual({ ok: true, value: "Alice Smith" });
  });
  it.each([[""], ["   "], [null], [123], ["x".repeat(51)]])("rejects %j", (input) => {
    expect(parseMemberName(input).ok).toBe(false);
    expect(parseGroupName(input).ok).toBe(false);
  });
});

describe("parseParticipantIds", () => {
  it("accepts a list of unique IDs", () => {
    expect(parseParticipantIds([1, "2", 3])).toEqual({ ok: true, value: [1, 2, 3] });
  });
  it.each([[[]], [null], ["1,2"], [[1, 1]], [[1, "x"]], [[0]]])("rejects %j", (input) => {
    expect(parseParticipantIds(input).ok).toBe(false);
  });
});

describe("parseExpenseDate", () => {
  const now = new Date("2026-11-20T08:00:00Z");
  it("defaults to today at 12:00 UTC", () => {
    const result = parseExpenseDate(undefined, now);
    expect(result.ok && result.value.toISOString()).toBe("2026-11-20T12:00:00.000Z");
  });
  it("accepts a valid date", () => {
    const result = parseExpenseDate("2026-02-28", now);
    expect(result.ok && result.value.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });
  it.each([["2026-02-30"], ["2026/02/01"], ["yesterday"], ["1999-12-31"], ["2030-01-01"], [12345]])(
    "rejects %j",
    (input) => {
      expect(parseExpenseDate(input, now).ok).toBe(false);
    },
  );
});
