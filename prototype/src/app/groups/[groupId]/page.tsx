import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddExpenseForm } from "@/components/add-expense-form";
import { AddMemberForm } from "@/components/add-member-form";
import { BalancesPanel } from "@/components/balances-panel";
import { ExpenseHistory } from "@/components/expense-history";
import { Avatar, Card, Icons, formatDate } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { getGroupDetail } from "@/lib/splitsmart";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ groupId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await getGroupDetail((await params).groupId);
  return { title: group ? `${group.name} · SplitSmart` : "Group not found · SplitSmart" };
}

export default async function GroupPage({ params }: Props) {
  const group = await getGroupDetail((await params).groupId);
  if (!group) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-emerald-700">
          ← All groups
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{group.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Created {formatDate(group.createdAt)}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Total spent" value={formatCents(group.totalCents)} />
          <Stat label="Members" value={String(group.members.length)} />
          <Stat label="Expenses" value={String(group.expenses.length)} />
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:order-2">
          <Card title="Balances" description="Paid minus share. Green gets back, red owes.">
            <BalancesPanel balances={group.balances} />
          </Card>
          <Card title="Members" description={`${group.members.length} in this group`}>
            <div className="space-y-4">
              <AddMemberForm groupId={group.id} />
              {group.members.length === 0 ? (
                <p className="text-sm text-slate-500">No members yet. Add the people sharing expenses.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {group.members.map((m) => (
                    <li
                      key={m.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-50 py-1 pr-3 pl-1 text-sm text-slate-700 ring-1 ring-slate-200"
                    >
                      <Avatar id={m.id} name={m.name} size="sm" />
                      {m.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:order-1 lg:col-span-2">
          <Card title="Add an expense" description="Split equally between the selected participants.">
            <AddExpenseForm groupId={group.id} members={group.members} />
          </Card>
          <Card
            title="Expense history"
            description={`${group.expenses.length} expense${group.expenses.length === 1 ? "" : "s"}`}
            action={<span className="text-slate-400">{Icons.receipt}</span>}
          >
            <ExpenseHistory expenses={group.expenses} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4">
      <dt className="text-xs text-slate-500 sm:text-sm">{label}</dt>
      <dd className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900 sm:text-2xl">{value}</dd>
    </div>
  );
}
