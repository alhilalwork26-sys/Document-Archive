"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  FolderLock,
  Search,
  UploadCloud,
  Users,
} from "lucide-react";
import Link from "next/link";

const BUBBLES = [
  { Icon: FileText, className: "left-[6%] top-[10%] size-16", tone: "bg-danger/10 text-danger", delay: 0 },
  { Icon: Users, className: "right-[8%] top-[6%] size-16", tone: "bg-accent-100 text-accent-700", delay: 0.6 },
  { Icon: UploadCloud, className: "left-0 top-[46%] size-16", tone: "bg-accent-50 text-accent-600", delay: 1.1 },
  { Icon: Search, className: "right-0 top-[42%] size-16", tone: "bg-warning/10 text-warning", delay: 0.3 },
  { Icon: FolderLock, className: "left-[14%] bottom-0 size-16", tone: "bg-warning/10 text-warning", delay: 0.9 },
  { Icon: CheckCircle2, className: "right-[16%] bottom-[2%] size-16", tone: "bg-success/10 text-success", delay: 1.4 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local asset */}
          <img src="/grcc-mark.png" alt="GRCC" className="h-7 w-auto" />
          <span className="text-sm font-semibold text-dark">ArsipOne</span>
        </div>
        <Link
          href="/login"
          className="h-9 px-4 rounded-full text-sm font-medium bg-white border border-border text-dark hover:bg-surface transition-colors inline-flex items-center"
        >
          Masuk
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10 pb-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-dark"
        >
          Satu Tempat Aman untuk{" "}
          <span className="text-muted">Semua Dokumen Penting</span> GRCC
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-base sm:text-lg text-muted max-w-2xl mx-auto"
        >
          ArsipOne GRCC adalah tempat penyimpanan dokumen penting GRCC —
          terorganisir, tercatat, dan hanya bisa diakses oleh tim internal
          yang berwenang.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <Link
            href="/login"
            className="inline-flex h-12 px-7 items-center justify-center rounded-full bg-dark text-white text-sm font-semibold hover:bg-black transition-colors shadow-lg shadow-dark/10"
          >
            Masuk ke ArsipOne
          </Link>
        </motion.div>
      </main>

      <div className="relative max-w-3xl mx-auto h-[340px] sm:h-[400px] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-32 sm:size-36 items-center justify-center rounded-full bg-accent-50"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static local asset */}
            <img src="/grcc-mark.png" alt="GRCC" className="h-10 w-auto" />
          </motion.div>
        </motion.div>

        {BUBBLES.map(({ Icon, className, tone, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${className}`}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
              className={`flex size-full items-center justify-center rounded-full ${tone}`}
            >
              <Icon className="size-6" strokeWidth={1.75} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <footer className="max-w-4xl mx-auto px-6 pb-10 text-center">
        <p className="text-xs text-muted">
          Akses privat — akun hanya dibuat oleh Admin GRCC.
        </p>
      </footer>
    </div>
  );
}
