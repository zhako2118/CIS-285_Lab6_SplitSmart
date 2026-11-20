"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">
        SplitSmart couldn&apos;t load this page. Your saved data is safe — try again in a moment.
      </p>
      <button type="button" onClick={reset} className={`${buttonClass} mt-6`}>
        Try again
      </button>
    </div>
  );
}
