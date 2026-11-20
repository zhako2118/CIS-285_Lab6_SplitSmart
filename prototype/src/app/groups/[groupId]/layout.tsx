import { notFound } from "next/navigation";
import { groupExists } from "@/lib/splitsmart";

export const dynamic = "force-dynamic";

type Props = { children: React.ReactNode; params: Promise<{ groupId: string }> };

/**
 * Validate the group before any HTML is streamed. This layout sits above this segment's
 * loading.tsx Suspense boundary, so calling notFound() here still yields an HTTP 404.
 * (notFound() inside the page runs after the 200 shell has been sent.)
 */
export default async function GroupLayout({ children, params }: Props) {
  if (!(await groupExists((await params).groupId))) notFound();
  return children;
}
