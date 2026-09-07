"use client";

import type { Folder } from "@/lib/types";
import { CATEGORY_LABELS, type FileCategory } from "@/lib/file-category";
import { useClickOutside } from "@/lib/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Filter } from "lucide-react";
import { useRef, useState } from "react";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FileCategory[];

export function FilterMenuButton({
  folders,
  selectedFolderId,
  onFolderChange,
  selectedCategories,
  onCategoriesChange,
}: {
  folders?: Folder[];
  selectedFolderId?: string | "all";
  onFolderChange?: (folderId: string | "all") => void;
  selectedCategories: Set<FileCategory>;
  onCategoriesChange: (categories: Set<FileCategory>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const activeCount =
    selectedCategories.size + (selectedFolderId && selectedFolderId !== "all" ? 1 : 0);

  function toggleCategory(cat: FileCategory) {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onCategoriesChange(next);
  }

  function reset() {
    onCategoriesChange(new Set());
    onFolderChange?.("all");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium bg-white border border-border text-dark hover:bg-surface transition-colors"
      >
        <Filter className="size-4 text-muted" /> Filter
        {activeCount > 0 && (
          <span className="flex items-center justify-center size-4 rounded-full bg-accent-600 text-white text-[10px] font-semibold">
            {activeCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-border bg-white shadow-lg p-3"
          >
            {folders && onFolderChange && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted mb-1.5">Folder</p>
                <select
                  value={selectedFolderId}
                  onChange={(e) => onFolderChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-white px-2 text-sm text-dark outline-none focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600"
                >
                  <option value="all">Semua folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs font-medium text-muted mb-1.5">Jenis File</p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 px-1.5 py-1.5 rounded-md text-sm text-dark hover:bg-surface cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="size-3.5 rounded border-border text-accent-600 focus:ring-accent-600/30"
                  />
                  {CATEGORY_LABELS[cat]}
                </label>
              ))}
            </div>

            {activeCount > 0 && (
              <button
                onClick={reset}
                className="mt-2 w-full text-center text-xs text-muted hover:text-dark py-1.5"
              >
                Reset filter
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
