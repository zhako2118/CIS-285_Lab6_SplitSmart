import type { BalanceDTO } from "@/lib/splitsmart";
import { formatCents } from "@/lib/money";
import { Avatar, EmptyState, Icons, cx } from "./ui";

/** FR5: color-coded net balances with a diverging bar per member. */
export function BalancesPanel({ balances }: { balances: BalanceDTO[] }) {
  if (balances.length === 0) {
    return (
      <EmptyState icon={Icons.scale} title="No balances yet">
        Add members and record an expense to see who owes whom.
      </EmptyState>
    );
  }
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.netCents)));
  const sum = balances.reduce((total, b) => total + b.netCents, 0);
  const sorted = [...balances].sort((a, b) => b.netCents - a.netCents || a.member.id - b.member.id);

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {sorted.map((b) => {
          const tone = b.netCents > 0 ? "positive" : b.netCents < 0 ? "negative" : "zero";
          const width = `${(Math.abs(b.netCents) / max) * 100}%`;
          return (
            <li key={b.member.id} data-testid={`balance-${b.member.name}`}>
              <div className="flex items-center gap-3">
                <Avatar id={b.member.id} name={b.member.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">{b.member.name}</span>
                    <span
                      className={cx(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        tone === "positive" && "text-emerald-600",
                        tone === "negative" && "text-rose-600",
                        tone === "zero" && "text-slate-500",
                      )}
                    >
                      {formatCents(b.netCents, { signed: true })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {tone === "positive" && "gets back"}
                      {tone === "negative" && "owes"}
                      {tone === "zero" && "settled up"}
                    </span>
                    <span className="tabular-nums">
                      paid {formatCents(b.paidCents)} · share {formatCents(b.owedCents)}
                    </span>
                  </div>
                  {/* Diverging bar: owes extends left of center, gets back extends right. */}
                  <div className="mt-1.5 grid h-1.5 grid-cols-2 gap-px overflow-hidden rounded-full bg-slate-100">
                    <div className="flex justify-end">
                      {tone === "negative" && <div className="h-full rounded-l-full bg-rose-400" style={{ width }} />}
                    </div>
                    <div>
                      {tone === "positive" && <div className="h-full rounded-r-full bg-emerald-500" style={{ width }} />}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p
        className={cx(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs",
          sum === 0 ? "bg-slate-50 text-slate-500" : "bg-rose-50 text-rose-700",
        )}
      >
        {sum === 0 && <span className="text-emerald-600 [&>svg]:h-4 [&>svg]:w-4">{Icons.check}</span>}
        Balances sum to {formatCents(sum)}
      </p>
    </div>
  );
}
