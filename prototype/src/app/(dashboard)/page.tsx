import Link from "next/link";
import { CreateGroupForm } from "@/components/create-group-form";
import { Card, EmptyState, Icons, formatDate } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { listGroups } from "@/lib/splitsmart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const groups = await listGroups();
  const totalCents = groups.reduce((sum, g) => sum + g.totalCents, 0);
  const expenseCount = groups.reduce((sum, g) => sum + g.expenseCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Create a group, add the people in it, and SplitSmart keeps everyone&apos;s balance exact to the cent.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Groups" value={String(groups.length)} />
        <Stat label="Expenses recorded" value={String(expenseCount)} />
        <Stat label="Total tracked" value={formatCents(totalCents)} />
      </dl>

      <Card title="Create a new group" description="Groups keep members, expenses, and balances together.">
        <CreateGroupForm />
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Your groups</h2>
        {groups.length === 0 ? (
          <EmptyState icon={Icons.users} title="No groups yet">
            Create your first group above — for a trip, a shared apartment, or a team lunch.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      {Icons.users}
                    </div>
                    <span className="text-xs text-slate-400">Created {formatDate(group.createdAt)}</span>
                  </div>
                  <h3 className="mt-4 truncate font-semibold text-slate-900 group-hover:text-emerald-700">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {group.memberCount} member{group.memberCount === 1 ? "" : "s"} · {group.expenseCount} expense
                    {group.expenseCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-4 text-xl font-semibold tabular-nums text-slate-900">
                    {formatCents(group.totalCents)}
                    <span className="ml-1.5 text-xs font-normal text-slate-400">total spent</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
