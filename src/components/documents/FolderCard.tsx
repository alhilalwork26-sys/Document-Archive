"use client";

import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { motion } from "framer-motion";
import { Folder as FolderIcon, Pin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function FolderCard({
  folder,
  index = 0,
  onChanged,
}: {
  folder: Folder;
  index?: number;
  onChanged?: () => void;
}) {
  const { push } = useToast();
  const [pinning, setPinning] = useState(false);

  async function togglePin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPinning(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("folders")
      .update({ is_pinned: !folder.is_pinned })
      .eq("id", folder.id);
    setPinning(false);
    if (error) {
      push("error", "Gagal mengubah status sematan.");
      return;
    }
    onChanged?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      <Link
        href={`/folders/${folder.id}`}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md hover:border-accent-200"
      >
        <div
          className="flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${folder.color}1a`, color: folder.color }}
        >
          <FolderIcon className="size-5.5" fill={`${folder.color}33`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-dark truncate pr-5">{folder.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {folder.document_count ?? 0} File
            {" · "}
            {formatBytes(folder.total_bytes ?? 0)}
          </p>
        </div>
      </Link>

      <button
        onClick={togglePin}
        disabled={pinning}
        aria-label={folder.is_pinned ? "Lepas sematan folder" : "Sematkan folder"}
        aria-pressed={folder.is_pinned}
        className={`absolute top-4 right-4 flex size-7 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-50 ${
          folder.is_pinned
            ? "text-accent-600 opacity-100"
            : "text-muted opacity-0 group-hover:opacity-100 hover:text-dark focus-visible:opacity-100"
        }`}
      >
        <Pin className="size-4" fill={folder.is_pinned ? "currentColor" : "none"} />
      </button>
    </motion.div>
  );
}
