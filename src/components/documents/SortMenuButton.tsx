"use client";

import { useClickOutside } from "@/lib/hooks";
import type { SortValue } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Check } from "lucide-react";
import { useRef, useState } from "react";

const OPTIONS: { value: SortValue; label: string }[] = [
  { value: "created_at_desc", label: "Terbaru" },
  { value: "created_at_asc", label: "Terlama" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
  { value: "size_bytes_desc", label: "Ukuran Terbesar" },
  { value: "size_bytes_asc", label: "Ukuran Terkecil" },
];

export function SortMenuButton({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (value: SortValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium bg-white border border-border text-dark hover:bg-surface transition-colors"
      >
        <ArrowUpDown className="size-4 text-muted" /> Urutkan: {current.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-20 w-52 rounded-lg border border-border bg-white shadow-lg py-1"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-dark hover:bg-surface"
              >
                {opt.label}
                {opt.value === value && <Check className="size-3.5 text-accent-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
