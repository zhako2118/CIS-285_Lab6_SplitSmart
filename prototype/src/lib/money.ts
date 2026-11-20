/**
 * Pure monetary logic for SplitSmart.
 *
 * All money is represented as integer cents. No floating-point arithmetic is
 * used for any stored or computed amount, so splits and balances are exact.
 */

/** Largest single expense accepted: $1,000,000.00 (fits a 32-bit Int column). */
export const MAX_EXPENSE_CENTS = 100_000_000;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const AMOUNT_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parse a user-entered dollar amount ("60", "60.5", "60.50", "1,234.56")
 * into integer cents using string arithmetic (no float rounding).
 * Rejects zero, negative, non-numeric, and >2-decimal input.
 */
export function parseAmountToCents(input: unknown): ParseResult<number> {
  if (typeof input !== "string" && typeof input !== "number") {
    return { ok: false, error: "Amount is required." };
  }
  if (typeof input === "number" && !Number.isFinite(input)) {
    return { ok: false, error: "Amount must be a valid number." };
  }
  const raw = String(input).trim().replace(/^\$/, "").replace(/,/g, "");
  if (raw === "") return { ok: false, error: "Amount is required." };
  if (raw.startsWith("-")) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  const match = AMOUNT_PATTERN.exec(raw);
  if (!match) {
    return {
      ok: false,
      error: "Amount must be a number with at most two decimal places.",
    };
  }
  const dollars = match[1].replace(/^0+(?=\d)/, "");
  if (dollars.length > 9) {
    return { ok: false, error: "Amount cannot exceed $1,000,000.00." };
  }
  const centsPart = (match[2] ?? "").padEnd(2, "0");
  const cents = Number(dollars) * 100 + Number(centsPart);
  if (cents <= 0) return { ok: false, error: "Amount must be greater than zero." };
  if (cents > MAX_EXPENSE_CENTS) {
    return { ok: false, error: "Amount cannot exceed $1,000,000.00." };
  }
  return { ok: true, value: cents };
}

/** Format integer cents as a USD string, e.g. 4000 -> "$40.00", -2000 -> "-$20.00". */
export function formatCents(cents: number, opts: { signed?: boolean } = {}): string {
  assertInteger(cents, "cents");
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const body = `$${dollars}.${String(abs % 100).padStart(2, "0")}`;
  if (cents < 0) return `-${body}`;
  if (opts.signed && cents > 0) return `+${body}`;
  return body;
}

export interface Share {
  memberId: number;
  shareCents: number;
}

/**
 * Split `amountCents` equally among participants.
 *
 * Every participant receives floor(amount / n) cents. The leftover
 * `amount % n` cents are given, one each, to the participants with the
 * lowest member IDs. Ordering by ID (not by input order) makes the result
 * deterministic regardless of how the participant list was submitted.
 * The returned shares always sum exactly to `amountCents`.
 */
export function splitEqually(amountCents: number, participantIds: number[]): Share[] {
  assertInteger(amountCents, "amountCents");
  if (amountCents <= 0) throw new Error("amountCents must be positive.");
  if (participantIds.length === 0) throw new Error("At least one participant is required.");
  const ids = [...participantIds].sort((a, b) => a - b);
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] === ids[i - 1]) throw new Error("Participant IDs must be unique.");
  }
  const n = ids.length;
  const base = Math.floor(amountCents / n);
  const remainder = amountCents % n;
  return ids.map((memberId, index) => ({
    memberId,
    shareCents: base + (index < remainder ? 1 : 0),
  }));
}

export interface BalanceExpense {
  payerId: number;
  amountCents: number;
  shares: Share[];
}

export interface MemberBalance {
  memberId: number;
  paidCents: number;
  owedCents: number;
  /** paid - owed. Positive: should receive money. Negative: owes money. */
  netCents: number;
}

/**
 * Compute each member's net balance (total paid minus allocated share).
 * Members with no activity get a zero balance. Because every expense's shares
 * sum to its amount, the net balances always sum to exactly zero; this is
 * verified and an error is thrown if stored data violates the invariant.
 */
export function calculateBalances(
  memberIds: number[],
  expenses: BalanceExpense[],
): MemberBalance[] {
  const map = new Map<number, MemberBalance>();
  const get = (memberId: number) => {
    let entry = map.get(memberId);
    if (!entry) {
      entry = { memberId, paidCents: 0, owedCents: 0, netCents: 0 };
      map.set(memberId, entry);
    }
    return entry;
  };
  memberIds.forEach(get);

  for (const expense of expenses) {
    const shareTotal = expense.shares.reduce((sum, s) => sum + s.shareCents, 0);
    if (shareTotal !== expense.amountCents) {
      throw new Error("Expense shares do not sum to the expense amount.");
    }
    get(expense.payerId).paidCents += expense.amountCents;
    for (const share of expense.shares) get(share.memberId).owedCents += share.shareCents;
  }

  const balances = [...map.values()].map((b) => ({ ...b, netCents: b.paidCents - b.owedCents }));
  const total = balances.reduce((sum, b) => sum + b.netCents, 0);
  if (total !== 0) throw new Error("Balances do not sum to zero.");
  return balances;
}

function assertInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be an integer number of cents.`);
}
