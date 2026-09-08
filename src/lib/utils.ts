import type { DocumentFile, SortValue } from "@/lib/types";

export function sortDocuments(docs: DocumentFile[], sort: SortValue): DocumentFile[] {
  const [key, dir] = [sort.slice(0, sort.lastIndexOf("_")), sort.slice(sort.lastIndexOf("_") + 1)] as [
    "name" | "created_at" | "size_bytes",
    "asc" | "desc",
  ];
  const sorted = [...docs].sort((a, b) => {
    let cmp = 0;
    if (key === "name") cmp = a.name.localeCompare(b.name);
    else if (key === "created_at")
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    else cmp = a.size_bytes - b.size_bytes;
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
