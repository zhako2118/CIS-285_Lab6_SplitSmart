import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-emerald-600">404</p>
      <h1 className="mt-1 text-lg font-semibold text-slate-900">Group not found</h1>
      <p className="mt-2 text-sm text-slate-500">This group doesn&apos;t exist or the link is invalid.</p>
      <Link href="/" className={`${buttonClass} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
