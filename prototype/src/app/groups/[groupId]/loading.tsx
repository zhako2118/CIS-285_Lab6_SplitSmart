import { Skeleton } from "@/components/ui";

export default function LoadingGroup() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading group">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-56" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
