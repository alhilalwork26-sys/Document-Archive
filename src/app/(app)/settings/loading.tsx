import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />

      <div className="flex flex-col gap-6 max-w-lg">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}
