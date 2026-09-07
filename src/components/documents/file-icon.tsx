import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

export function getFileIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("word") || mimeType.includes("document")) return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("csv") || mimeType.includes("excel"))
    return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return FileArchive;
  return File;
}
