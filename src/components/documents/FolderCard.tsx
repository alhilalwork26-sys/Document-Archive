"use client";

import type { Folder } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { motion } from "framer-motion";
import { Folder as FolderIcon } from "lucide-react";
import Link from "next/link";

export function FolderCard({ folder, index = 0 }: { folder: Folder; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/folders/${folder.id}`}
        className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md hover:border-accent-200"
      >
        <div
          className="flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${folder.color}1a`, color: folder.color }}
        >
          <FolderIcon className="size-5.5" fill={`${folder.color}33`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-dark truncate">{folder.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {folder.document_count ?? 0} File
            {" · "}
            {formatBytes(folder.total_bytes ?? 0)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
