import type { ExpenseDTO } from "@/lib/splitsmart";
import { formatCents } from "@/lib/money";
import { Avatar, EmptyState, Icons, formatDate } from "./ui";

/** FR4: every expense with description, amount, payer, participants, and date. */
export function ExpenseHistory({ expenses }: { expenses: ExpenseDTO[] }) {
  if (expenses.length === 0) {
    return (
      <EmptyState icon={Icons.receipt} title="No expenses recorded">
        Expenses you add will appear here, newest first.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {expenses.map((expense) => (
        <li key={expense.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {Icons.receipt}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{expense.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <time dateTime={expense.expenseDate.slice(0, 10)}>{formatDate(expense.expenseDate)}</time>
                    {" · "}paid by{" "}
                    <span className="font-medium text-slate-700">{expense.payer.name}</span>
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-slate-900">
                  {formatCents(expense.amountCents)}
                </p>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Participants">
                {expense.shares.map((share) => (
                  <li
                    key={share.member.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 py-0.5 pr-2.5 pl-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
                  >
                    <Avatar id={share.member.id} name={share.member.name} size="sm" />
                    {share.member.name}
                    <span className="tabular-nums text-slate-400">{formatCents(share.shareCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
