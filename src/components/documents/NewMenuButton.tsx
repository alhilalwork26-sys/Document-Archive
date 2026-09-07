"use client";

import { useClickOutside } from "@/lib/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, Plus, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

export function NewMenuButton({
  onNewFolder,
  onUpload,
}: {
  onNewFolder: () => void;
  onUpload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors shadow-sm shadow-accent-600/20"
      >
        <Plus className="size-4" /> Baru
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-border bg-white shadow-lg py-1"
          >
            <button
              onClick={() => {
                setOpen(false);
                onNewFolder();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-dark hover:bg-surface"
            >
              <FolderPlus className="size-4 text-muted" /> Folder Baru
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onUpload();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-dark hover:bg-surface"
            >
              <UploadCloud className="size-4 text-muted" /> Unggah Dokumen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
