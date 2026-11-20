/**
 * SplitSmart server-side service layer. All database access goes through here;
 * it is used by API route handlers and server components, never by the browser.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { calculateBalances, parseAmountToCents, splitEqually } from "./money";
import {
  parseDescription,
  parseExpenseDate,
  parseGroupName,
  parseId,
  parseMemberName,
  parseParticipantIds,
} from "./validation";

/** An expected, user-facing failure with an HTTP status code. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 404 | 409,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: string }, field: string): T {
  if (!result.ok) throw new ServiceError(result.error, 400, field);
  return result.value;
}

// ---------- Serializable DTOs (safe to pass to client components) ----------

export interface GroupSummary {
  id: number;
  name: string;
  createdAt: string;
  memberCount: number;
  expenseCount: number;
  totalCents: number;
}

export interface MemberDTO {
  id: number;
  name: string;
}

export interface ExpenseDTO {
  id: number;
  description: string;
  amountCents: number;
  expenseDate: string;
  createdAt: string;
  payer: MemberDTO;
  shares: { member: MemberDTO; shareCents: number }[];
}

export interface BalanceDTO {
  member: MemberDTO;
  paidCents: number;
  owedCents: number;
  netCents: number;
}

export interface GroupDetail {
  id: number;
  name: string;
  createdAt: string;
  members: MemberDTO[];
  expenses: ExpenseDTO[];
  balances: BalanceDTO[];
  totalCents: number;
}

// ------------------------------- Groups (FR1) -------------------------------

export async function listGroups(): Promise<GroupSummary[]> {
  const [groups, totals] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true, expenses: true } } },
    }),
    prisma.expense.groupBy({ by: ["groupId"], _sum: { amountCents: true } }),
  ]);
  const totalByGroup = new Map(totals.map((t) => [t.groupId, t._sum.amountCents ?? 0]));
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    memberCount: g._count.members,
    expenseCount: g._count.expenses,
    totalCents: totalByGroup.get(g.id) ?? 0,
  }));
}

export async function createGroup(input: { name?: unknown }): Promise<GroupSummary> {
  const name = unwrap(parseGroupName(input.name), "name");
  const group = await prisma.group.create({ data: { name } });
  return {
    id: group.id,
    name: group.name,
    createdAt: group.createdAt.toISOString(),
    memberCount: 0,
    expenseCount: 0,
    totalCents: 0,
  };
}

/** Cheap existence check: false when the ID is malformed or the group does not exist. */
export async function groupExists(rawGroupId: unknown): Promise<boolean> {
  const id = parseId(rawGroupId, "Group ID");
  if (!id.ok) return false;
  const group = await prisma.group.findUnique({ where: { id: id.value }, select: { id: true } });
  return group !== null;
}

/** Returns null when the ID is malformed or the group does not exist. */
export async function getGroupDetail(rawGroupId: unknown): Promise<GroupDetail | null> {
  const id = parseId(rawGroupId, "Group ID");
  if (!id.ok) return null;
  const group = await prisma.group.findUnique({
    where: { id: id.value },
    include: {
      members: { orderBy: { id: "asc" }, select: { id: true, name: true } },
      expenses: {
        orderBy: [{ expenseDate: "desc" }, { id: "desc" }],
        include: {
          payer: { select: { id: true, name: true } },
          shares: {
            orderBy: { memberId: "asc" },
            include: { member: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!group) return null;

  const memberById = new Map(group.members.map((m) => [m.id, m]));
  const balances = calculateBalances(
    group.members.map((m) => m.id),
    group.expenses.map((e) => ({
      payerId: e.payerId,
      amountCents: e.amountCents,
      shares: e.shares.map((s) => ({ memberId: s.memberId, shareCents: s.shareCents })),
    })),
  ).map((b) => ({
    member: memberById.get(b.memberId)!,
    paidCents: b.paidCents,
    owedCents: b.owedCents,
    netCents: b.netCents,
  }));

  return {
    id: group.id,
    name: group.name,
    createdAt: group.createdAt.toISOString(),
    members: group.members,
    balances,
    totalCents: group.expenses.reduce((sum, e) => sum + e.amountCents, 0),
    expenses: group.expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      expenseDate: e.expenseDate.toISOString(),
      createdAt: e.createdAt.toISOString(),
      payer: e.payer,
      shares: e.shares.map((s) => ({ member: s.member, shareCents: s.shareCents })),
    })),
  };
}

async function requireGroup(rawGroupId: unknown) {
  const groupId = unwrap(parseId(rawGroupId, "Group ID"), "groupId");
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new ServiceError(`Group ${groupId} does not exist.`, 404, "groupId");
  return group;
}

// ------------------------------ Members (FR2) -------------------------------

export async function addMember(rawGroupId: unknown, input: { name?: unknown }): Promise<MemberDTO> {
  const name = unwrap(parseMemberName(input.name), "name");
  const group = await requireGroup(rawGroupId);

  const existing = await prisma.member.findMany({
    where: { groupId: group.id },
    select: { name: true },
  });
  if (existing.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    throw new ServiceError(`"${name}" is already a member of this group.`, 409, "name");
  }
  try {
    return await prisma.member.create({
      data: { name, groupId: group.id },
      select: { id: true, name: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ServiceError(`"${name}" is already a member of this group.`, 409, "name");
    }
    throw error;
  }
}

// ------------------------------ Expenses (FR3) ------------------------------

export interface CreateExpenseInput {
  description?: unknown;
  amount?: unknown;
  payerId?: unknown;
  participantIds?: unknown;
  date?: unknown;
}

export async function createExpense(
  rawGroupId: unknown,
  input: CreateExpenseInput,
): Promise<ExpenseDTO> {
  const description = unwrap(parseDescription(input.description), "description");
  const amountCents = unwrap(parseAmountToCents(input.amount), "amount");
  const payerId = unwrap(parseId(input.payerId, "Payer ID"), "payerId");
  const participantIds = unwrap(parseParticipantIds(input.participantIds), "participantIds");
  const expenseDate = unwrap(parseExpenseDate(input.date), "date");
  const group = await requireGroup(rawGroupId);

  const members = await prisma.member.findMany({
    where: { groupId: group.id },
    select: { id: true },
  });
  const memberIds = new Set(members.map((m) => m.id));
  if (!memberIds.has(payerId)) {
    throw new ServiceError("The payer must be a member of this group.", 400, "payerId");
  }
  const outsiders = participantIds.filter((id) => !memberIds.has(id));
  if (outsiders.length > 0) {
    throw new ServiceError(
      `All participants must be members of this group (invalid ID: ${outsiders.join(", ")}).`,
      400,
      "participantIds",
    );
  }

  const shares = splitEqually(amountCents, participantIds);
  const expense = await prisma.expense.create({
    data: {
      groupId: group.id,
      description,
      amountCents,
      payerId,
      expenseDate,
      shares: { create: shares },
    },
    include: {
      payer: { select: { id: true, name: true } },
      shares: {
        orderBy: { memberId: "asc" },
        include: { member: { select: { id: true, name: true } } },
      },
    },
  });
  return {
    id: expense.id,
    description: expense.description,
    amountCents: expense.amountCents,
    expenseDate: expense.expenseDate.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    payer: expense.payer,
    shares: expense.shares.map((s) => ({ member: s.member, shareCents: s.shareCents })),
  };
}
