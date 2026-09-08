"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFile, DocumentVersion } from "@/lib/types";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function VersionHistoryModal({
  open,
  onClose,
  doc,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  doc: DocumentFile | null;
  onDownload: (storagePath: string, filename: string) => void;
}) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc) return;
    // Kicking off the loading state for the fetch below, not deriving
    // state from a prop change (the pattern this rule is meant to catch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("document_versions")
      .select(
        "*, uploader:profiles!document_versions_uploaded_by_fkey(id,full_name,email)",
      )
      .eq("document_id", doc.id)
      .order("version", { ascending: false })
      .then(({ data }) => {
        setVersions((data ?? []) as unknown as DocumentVersion[]);
        setLoading(false);
      });
  }, [open, doc]);

  if (!doc) return null;

  return (
    <Modal open={open} onClose={onClose} title="Riwayat Versi" description={doc.name}>
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        <div className="flex items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-dark">Versi {doc.version}</span>
              <span className="text-[10px] font-semibold uppercase text-accent-700 bg-white rounded-full px-2 py-0.5">
                Terbaru
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {formatDateTime(doc.updated_at)} · {formatBytes(doc.size_bytes)}
            </p>
          </div>
          <button
            onClick={() => onDownload(doc.storage_path, doc.name)}
            className="rounded-md p-1.5 text-accent-700 hover:bg-white transition-colors"
            aria-label="Unduh versi ini"
          >
            <Download className="size-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 text-muted animate-spin" />
          </div>
        )}

        {!loading && versions.length === 0 && (
          <p className="text-center text-sm text-muted py-6">
            Belum ada versi lama — dokumen ini belum pernah diganti.
          </p>
        )}

        {versions.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-dark">Versi {v.version}</span>
              <p className="text-xs text-muted mt-0.5">
                {formatDateTime(v.created_at)} · {formatBytes(v.size_bytes)}
              </p>
              {v.uploader && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar name={v.uploader.full_name || v.uploader.email} size="sm" />
                  <span className="text-xs text-muted">
                    {v.uploader.full_name || v.uploader.email}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => onDownload(v.storage_path, `${doc.name} (v${v.version})`)}
              className="rounded-md p-1.5 text-muted hover:text-dark hover:bg-surface transition-colors"
              aria-label={`Unduh versi ${v.version}`}
            >
              <Download className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
