import { describe, expect, it } from "vitest";
import { calculateBalances, formatCents, parseAmountToCents, splitEqually } from "@/lib/money";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("parseAmountToCents", () => {
  it.each([
    ["60", 6000],
    ["60.00", 6000],
    ["10", 1000],
    ["0.01", 1],
    ["12.3", 1230],
    ["$1,234.56", 123456],
    [" 7.05 ", 705],
    [19.99, 1999],
    ["1000000", 100_000_000],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseAmountToCents(input)).toEqual({ ok: true, value: cents });
  });

  it.each([
    ["0"],
    ["0.00"],
    ["-5"],
    ["-0.01"],
    [-20],
    [0],
    [""],
    ["   "],
    ["abc"],
    ["12.345"],
    ["1e3"],
    ["12..3"],
    ["1000000.01"],
    [Number.NaN],
    [Infinity],
    [null],
    [undefined],
    [{}],
  ])("rejects %j", (input) => {
    expect(parseAmountToCents(input).ok).toBe(false);
  });

  it("gives a clear message for zero and negative amounts", () => {
    expect(parseAmountToCents("0")).toEqual({ ok: false, error: "Amount must be greater than zero." });
    expect(parseAmountToCents("-5")).toEqual({ ok: false, error: "Amount must be greater than zero." });
  });
});

describe("splitEqually", () => {
  it("splits $60 three ways evenly", () => {
    expect(splitEqually(6000, [1, 2, 3])).toEqual([
      { memberId: 1, shareCents: 2000 },
      { memberId: 2, shareCents: 2000 },
      { memberId: 3, shareCents: 2000 },
    ]);
  });

  it("allocates exactly 1000 cents for $10 split three ways, extra cent to lowest ID", () => {
    const shares = splitEqually(1000, [3, 1, 2]);
    expect(sum(shares.map((s) => s.shareCents))).toBe(1000);
    expect(shares).toEqual([
      { memberId: 1, shareCents: 334 },
      { memberId: 2, shareCents: 333 },
      { memberId: 3, shareCents: 333 },
    ]);
  });

  it("is deterministic regardless of input order", () => {
    const a = splitEqually(1001, [7, 2, 9, 4]);
    const b = splitEqually(1001, [4, 9, 2, 7]);
    expect(a).toEqual(b);
    expect(a.map((s) => s.shareCents)).toEqual([251, 250, 250, 250]);
  });

  it("handles amounts smaller than the participant count", () => {
    expect(splitEqually(2, [1, 2, 3]).map((s) => s.shareCents)).toEqual([1, 1, 0]);
  });

  it("always sums to the amount (exhaustive small cases)", () => {
    for (let amount = 1; amount <= 500; amount++) {
      for (let n = 1; n <= 7; n++) {
        const ids = Array.from({ length: n }, (_, i) => i + 1);
        const shares = splitEqually(amount, ids).map((s) => s.shareCents);
        expect(sum(shares)).toBe(amount);
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("rejects invalid input", () => {
    expect(() => splitEqually(0, [1])).toThrow();
    expect(() => splitEqually(-100, [1])).toThrow();
    expect(() => splitEqually(10.5, [1])).toThrow();
    expect(() => splitEqually(100, [])).toThrow();
    expect(() => splitEqually(100, [1, 1])).toThrow();
  });
});

describe("calculateBalances", () => {
  it("computes Alice +$40, Bob -$20, Charlie -$20 for the $60 scenario", () => {
    const balances = calculateBalances([1, 2, 3], [
      { payerId: 1, amountCents: 6000, shares: splitEqually(6000, [1, 2, 3]) },
    ]);
    expect(balances.map((b) => [b.memberId, b.netCents])).toEqual([
      [1, 4000],
      [2, -2000],
      [3, -2000],
    ]);
  });

  it("updates with additional expenses and always sums to zero", () => {
    const expenses = [
      { payerId: 1, amountCents: 6000, shares: splitEqually(6000, [1, 2, 3]) },
      { payerId: 2, amountCents: 3000, shares: splitEqually(3000, [1, 2]) },
      { payerId: 3, amountCents: 1000, shares: splitEqually(1000, [1, 2, 3]) },
    ];
    const balances = calculateBalances([1, 2, 3, 4], expenses);
    const net = Object.fromEntries(balances.map((b) => [b.memberId, b.netCents]));
    // Alice: paid 6000, share 2000+1500+334 = 3834 -> +2166
    // Bob:   paid 3000, share 2000+1500+333 = 3833 -> -833
    // Charlie: paid 1000, share 2000+333 = 2333 -> -1333
    // Dana: no activity -> 0
    expect(net).toEqual({ 1: 2166, 2: -833, 3: -1333, 4: 0 });
    expect(sum(balances.map((b) => b.netCents))).toBe(0);
  });

  it("sums to zero for many random expenses", () => {
    let seed = 42;
    const rand = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % max;
    };
    const ids = [1, 2, 3, 4, 5, 6];
    const expenses = Array.from({ length: 300 }, () => {
      const participants = ids.filter(() => rand(2) === 1);
      if (participants.length === 0) participants.push(ids[rand(6)]);
      const amountCents = 1 + rand(99_999);
      return { payerId: ids[rand(6)], amountCents, shares: splitEqually(amountCents, participants) };
    });
    expect(sum(calculateBalances(ids, expenses).map((b) => b.netCents))).toBe(0);
  });

  it("detects corrupted share data", () => {
    expect(() =>
      calculateBalances([1, 2], [{ payerId: 1, amountCents: 100, shares: [{ memberId: 2, shareCents: 99 }] }]),
    ).toThrow();
  });
});

describe("formatCents", () => {
  it("formats positive, negative, and signed values", () => {
    expect(formatCents(4000)).toBe("$40.00");
    expect(formatCents(-2000)).toBe("-$20.00");
    expect(formatCents(4000, { signed: true })).toBe("+$40.00");
    expect(formatCents(0, { signed: true })).toBe("$0.00");
    expect(formatCents(123456789)).toBe("$1,234,567.89");
    expect(formatCents(5)).toBe("$0.05");
  });
});
