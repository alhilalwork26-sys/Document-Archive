import { Skeleton } from "@/components/ui/Skeleton";

export default function PeopleLoading() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
