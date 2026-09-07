"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

/** SSR-safe "has this component mounted on the client" check. */
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  widthClass?: string;
}

export function Modal({ open, onClose, title, description, children, widthClass = "max-w-md" }: ModalProps) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/25 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${widthClass} max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(10,10,10,0.25)] p-6`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-dark">{title}</h2>
                {description && (
                  <p className="text-sm text-muted mt-0.5">{description}</p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                aria-label="Tutup"
                className="text-muted hover:text-dark rounded-full p-1.5 hover:bg-surface transition-colors"
              >
                <X className="size-4" />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
