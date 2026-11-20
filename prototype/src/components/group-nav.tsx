"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { GroupSummary } from "@/lib/splitsmart";
import { Icons, cx } from "./ui";

/** Sidebar navigation on desktop; horizontally scrolling pills on mobile. */
export function GroupNav({ groups, variant }: { groups: GroupSummary[]; variant: "sidebar" | "pills" }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  if (variant === "pills") {
    return (
      <nav aria-label="Groups" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href="/"
          className={cx(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ring-1",
            isActive("/")
              ? "bg-emerald-600 text-white ring-emerald-600"
              : "bg-white text-slate-700 ring-slate-200",
          )}
        >
          All groups
        </Link>
        {groups.map((group) => {
          const href = `/groups/${group.id}`;
          return (
            <Link
              key={group.id}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cx(
                "max-w-[12rem] shrink-0 truncate rounded-full px-3 py-1.5 text-sm font-medium ring-1",
                isActive(href)
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : "bg-white text-slate-700 ring-slate-200",
              )}
            >
              {group.name}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Groups" className="flex flex-col gap-1">
      <Link
        href="/"
        aria-current={isActive("/") ? "page" : undefined}
        className={cx(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive("/") ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
        )}
      >
        {Icons.home}
        Dashboard
      </Link>
      <p className="mt-5 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Your groups
      </p>
      {groups.length === 0 && <p className="px-3 text-sm text-slate-500">No groups yet.</p>}
      {groups.map((group) => {
        const href = `/groups/${group.id}`;
        return (
          <Link
            key={group.id}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cx(
              "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition",
              isActive(href)
                ? "bg-emerald-500/15 font-semibold text-emerald-300"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <span className="truncate">{group.name}</span>
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
              {group.memberCount}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
