"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function FilterChips({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.span
            key={chip.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-medium bg-accent-50 text-accent-700"
          >
            {chip.label}
            <button
              onClick={chip.onRemove}
              aria-label={`Hapus filter ${chip.label}`}
              className="rounded-full p-0.5 hover:bg-accent-100 transition-colors"
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
