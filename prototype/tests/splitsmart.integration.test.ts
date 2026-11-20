import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ServiceError,
  addMember,
  createExpense,
  createGroup,
  getGroupDetail,
  groupExists,
  listGroups,
} from "@/lib/splitsmart";

async function expectServiceError(promise: Promise<unknown>, status: number, field?: string) {
  const error = await promise.then(
    () => null,
    (e) => e,
  );
  expect(error).toBeInstanceOf(ServiceError);
  expect(error.status).toBe(status);
  if (field) expect(error.field).toBe(field);
}

const netByName = async (groupId: number) => {
  const detail = await getGroupDetail(groupId);
  return Object.fromEntries(detail!.balances.map((b) => [b.member.name, b.netCents]));
};

describe("SplitSmart service (SQLite via Prisma)", () => {
  let groupId: number;
  let alice: number, bob: number, charlie: number;
  let otherGroupMember: number;

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toBe("file:./test.db");
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. creates a group", async () => {
    const group = await createGroup({ name: "  Weekend   Trip " });
    expect(group.name).toBe("Weekend Trip");
    groupId = group.id;
    expect((await listGroups()).some((g) => g.id === groupId)).toBe(true);
  });

  it("rejects empty group names", async () => {
    await expectServiceError(createGroup({ name: "   " }), 400, "name");
    await expectServiceError(createGroup({}), 400, "name");
  });

  it("2. adds Alice, Bob, Charlie", async () => {
    alice = (await addMember(groupId, { name: "Alice" })).id;
    bob = (await addMember(groupId, { name: "Bob" })).id;
    charlie = (await addMember(String(groupId), { name: "Charlie" })).id;
    const detail = await getGroupDetail(groupId);
    expect(detail!.members.map((m) => m.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("rejects empty names, duplicate names, and invalid group IDs for members", async () => {
    await expectServiceError(addMember(groupId, { name: "" }), 400, "name");
    await expectServiceError(addMember(groupId, { name: "alice" }), 409, "name");
    await expectServiceError(addMember("abc", { name: "Dana" }), 400, "groupId");
    await expectServiceError(addMember(-1, { name: "Dana" }), 400, "groupId");
    await expectServiceError(addMember(999_999, { name: "Dana" }), 404, "groupId");
  });

  it("3-4. records $60 paid by Alice for all three: Alice +$40, Bob -$20, Charlie -$20", async () => {
    const expense = await createExpense(groupId, {
      description: "Dinner",
      amount: "60.00",
      payerId: alice,
      participantIds: [alice, bob, charlie],
      date: "2026-11-18",
    });
    expect(expense.amountCents).toBe(6000);
    expect(expense.shares.map((s) => s.shareCents)).toEqual([2000, 2000, 2000]);
    expect(await netByName(groupId)).toEqual({ Alice: 4000, Bob: -2000, Charlie: -2000 });
  });

  it("5. updates balances after additional expenses", async () => {
    await createExpense(groupId, {
      description: "Taxi",
      amount: "30",
      payerId: bob,
      participantIds: [alice, bob],
    });
    // Alice 4000 - 1500 = 2500; Bob -2000 + 3000 - 1500 = -500; Charlie -2000
    expect(await netByName(groupId)).toEqual({ Alice: 2500, Bob: -500, Charlie: -2000 });
  });

  it("6. rejects invalid, zero, and negative amounts", async () => {
    for (const amount of ["0", "0.00", "-10", -5, "abc", "", "10.999", null]) {
      await expectServiceError(
        createExpense(groupId, { description: "Bad", amount, payerId: alice, participantIds: [alice] }),
        400,
        "amount",
      );
    }
  });

  it("7. rejects invalid payer and participant IDs, including members of other groups", async () => {
    const other = await createGroup({ name: "Other group" });
    otherGroupMember = (await addMember(other.id, { name: "Mallory" })).id;
    const base = { description: "X", amount: "5", participantIds: [alice] };

    await expectServiceError(createExpense(groupId, { ...base, payerId: 999_999 }), 400, "payerId");
    await expectServiceError(createExpense(groupId, { ...base, payerId: otherGroupMember }), 400, "payerId");
    await expectServiceError(createExpense(groupId, { ...base, payerId: "x" }), 400, "payerId");
    await expectServiceError(
      createExpense(groupId, { ...base, payerId: alice, participantIds: [alice, otherGroupMember] }),
      400,
      "participantIds",
    );
    await expectServiceError(
      createExpense(groupId, { ...base, payerId: alice, participantIds: [999_999] }),
      400,
      "participantIds",
    );
    await expectServiceError(createExpense(groupId, { ...base, payerId: alice, participantIds: [] }), 400);
    await expectServiceError(createExpense(groupId, { ...base, payerId: alice, participantIds: [alice, alice] }), 400);
    await expectServiceError(createExpense(999_999, { ...base, payerId: alice }), 404, "groupId");
    await expectServiceError(createExpense(groupId, { ...base, description: "  ", payerId: alice }), 400, "description");
  });

  it("rejected expenses are not persisted", async () => {
    const detail = await getGroupDetail(groupId);
    expect(detail!.expenses).toHaveLength(2);
  });

  it("8. $10 split three ways stores exactly 1000 cents with deterministic remainder", async () => {
    const expense = await createExpense(groupId, {
      description: "Snacks",
      amount: "10",
      payerId: charlie,
      participantIds: [charlie, bob, alice], // order intentionally shuffled
    });
    const stored = await prisma.expenseShare.findMany({
      where: { expenseId: expense.id },
      orderBy: { memberId: "asc" },
    });
    expect(stored.reduce((s, r) => s + r.shareCents, 0)).toBe(1000);
    expect(stored.map((r) => [r.memberId, r.shareCents])).toEqual([
      [alice, 334],
      [bob, 333],
      [charlie, 333],
    ]);
  });

  it("9. group balances always sum to zero", async () => {
    for (const amount of ["0.01", "0.02", "99.99", "1234.57", "7"]) {
      await createExpense(groupId, {
        description: `Item ${amount}`,
        amount,
        payerId: bob,
        participantIds: [alice, bob, charlie],
      });
      const detail = await getGroupDetail(groupId);
      expect(detail!.balances.reduce((s, b) => s + b.netCents, 0)).toBe(0);
    }
  });

  it("10. data persists: a fresh Prisma connection reads the same records", async () => {
    const before = await getGroupDetail(groupId);
    await prisma.$disconnect();
    const after = await getGroupDetail(groupId);
    expect(after).toEqual(before);
    expect(after!.expenses).toHaveLength(8);
  });

  it("returns null for malformed or missing group IDs", async () => {
    expect(await getGroupDetail("abc")).toBeNull();
    expect(await getGroupDetail("0")).toBeNull();
    expect(await getGroupDetail(999_999)).toBeNull();
  });

  it("groupExists rejects malformed or missing IDs (drives the page-level 404)", async () => {
    expect(await groupExists(String(groupId))).toBe(true);
    for (const bad of ["abc", "0", "-1", "1.5", "", "999999", "99999999999"]) {
      expect(await groupExists(bad)).toBe(false);
    }
  });
});
