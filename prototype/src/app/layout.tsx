import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { GroupNav } from "@/components/group-nav";
import { Icons } from "@/components/ui";
import { listGroups } from "@/lib/splitsmart";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SplitSmart",
  description: "Track shared expenses and balances within groups.",
};

// Always read fresh data from SQLite; never prerender at build time.
export const dynamic = "force-dynamic";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
        {Icons.wallet}
      </span>
      <span className="text-lg font-bold tracking-tight">SplitSmart</span>
    </Link>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let groups: Awaited<ReturnType<typeof listGroups>> = [];
  let navError = false;
  try {
    groups = await listGroups();
  } catch (error) {
    console.error(error);
    navError = true;
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen lg:flex">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 px-4 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
            <div className="px-2">
              <Brand />
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              {navError ? (
                <p className="px-3 text-sm text-rose-300">Could not load groups.</p>
              ) : (
                <GroupNav groups={groups} variant="sidebar" />
              )}
            </div>
            <p className="px-3 text-xs text-slate-500">Prototype · data stored locally</p>
          </aside>

          {/* Mobile header */}
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 pt-3 pb-2 backdrop-blur lg:hidden">
            <div className="mb-2 text-slate-900">
              <Brand />
            </div>
            {!navError && <GroupNav groups={groups} variant="pills" />}
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
