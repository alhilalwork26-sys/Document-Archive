export type FileCategory = "document" | "image" | "spreadsheet" | "archive" | "other";

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  document: "Dokumen",
  image: "Gambar",
  spreadsheet: "Spreadsheet",
  archive: "Arsip",
  other: "Lainnya",
};

/** Left-border accent color per file category, shown as a row indicator in DocumentTable. */
export const CATEGORY_COLORS: Record<FileCategory, string> = {
  document: "#4F46E5",
  image: "#0EA5E9",
  spreadsheet: "#10B981",
  archive: "#F59E0B",
  other: "#666560",
};

export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf" || mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  if (mimeType.includes("sheet") || mimeType.includes("csv") || mimeType.includes("excel"))
    return "spreadsheet";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";
  return "other";
}
