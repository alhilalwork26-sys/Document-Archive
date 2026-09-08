"use client";

import { useClickOutside } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface RecentDoc {
  id: string;
  name: string;
  created_at: string;
  folder_id: string | null;
}

export function NotificationBell({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState(profile.notifications_seen_at);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("documents")
      .select("id,name,created_at,folder_id")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setDocs((data ?? []) as RecentDoc[]);
        setLoaded(true);
      });
  }, []);

  const unreadCount = docs.filter((d) => new Date(d.created_at) > new Date(lastSeenAt)).length;

  async function handleOpen() {
    const wasOpen = open;
    setOpen(!wasOpen);
    if (!wasOpen && unreadCount > 0) {
      const now = new Date().toISOString();
      setLastSeenAt(now);
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ notifications_seen_at: now })
        .eq("id", profile.id);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-label="Notifikasi"
        className="relative flex size-8 items-center justify-center rounded-lg text-muted hover:text-dark hover:bg-surface transition-colors"
      >
        <Bell className="size-4.5" />
        {loaded && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
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
            className="absolute left-0 top-10 z-30 w-72 rounded-xl border border-border bg-white shadow-lg overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-border">
              <p className="text-sm font-semibold text-dark">Aktivitas Terbaru</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {docs.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">Belum ada dokumen.</p>
              ) : (
                docs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={doc.folder_id ? `/folders/${doc.folder_id}` : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-surface transition-colors"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-muted mt-0.5">
                      <FileText className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-dark truncate">{doc.name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatDateTime(doc.created_at)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
