import { Skeleton } from "@/components/ui/Skeleton";

export default function FolderLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-40 mb-4" />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
