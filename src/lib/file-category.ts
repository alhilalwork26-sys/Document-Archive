export type FileCategory = "document" | "image" | "spreadsheet" | "archive" | "other";

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  document: "Dokumen",
  image: "Gambar",
  spreadsheet: "Spreadsheet",
  archive: "Arsip",
  other: "Lainnya",
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
