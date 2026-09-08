"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENTS_BUCKET } from "@/lib/constants";
import { CATEGORY_COLORS, getFileCategory } from "@/lib/file-category";
import { verifyPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Lock, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getFileIcon } from "./file-icon";
import { PasswordPromptModal } from "./PasswordPromptModal";

export function DocumentTable({
  documents,
  showFolder = false,
  onChanged,
}: {
  documents: DocumentFile[];
  showFolder?: boolean;
  onChanged?: () => void;
}) {
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDownload, setPendingDownload] = useState<DocumentFile | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sorting and type/folder filtering are controlled by the page-level
  // Filter/Sort buttons — this only applies the quick text search on top of
  // whatever (already sorted & filtered) list it's handed.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? documents.filter((d) => d.name.toLowerCase().includes(q)) : documents;
  }, [documents, query]);

  async function doDownload(doc: DocumentFile) {
    setBusyId(doc.id);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.storage_path, 60, { download: doc.name });
    setBusyId(null);
    if (error || !data) {
      push("error", "Gagal membuat tautan unduhan.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  function handleDownload(doc: DocumentFile) {
    if (doc.is_confidential) {
      setPasswordError(null);
      setPendingDownload(doc);
      return;
    }
    doDownload(doc);
  }

  async function handlePasswordSubmit(password: string) {
    if (!pendingDownload?.password_hash || !pendingDownload?.password_salt) return;
    setPasswordLoading(true);
    const ok = await verifyPassword(
      password,
      pendingDownload.password_hash,
      pendingDownload.password_salt,
    );
    setPasswordLoading(false);
    if (!ok) {
      setPasswordError("Password salah.");
      return;
    }
    const doc = pendingDownload;
    setPendingDownload(null);
    await doDownload(doc);
  }

  async function handleDelete(doc: DocumentFile) {
    if (!confirm(`Hapus "${doc.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyId(doc.id);
    const supabase = createClient();
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    setBusyId(null);
    setOpenMenu(null);
    if (error) {
      push("error", "Gagal menghapus dokumen.");
      return;
    }
    push("success", "Dokumen dihapus.");
    onChanged?.();
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Search className="size-4 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari dokumen…"
          className="flex-1 text-sm outline-none placeholder:text-muted/70"
        />
      </div>

      <div className="min-w-[640px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="font-medium px-4 py-2.5">Nama</th>
              {showFolder && <th className="font-medium px-4 py-2.5">Folder</th>}
              <th className="font-medium px-4 py-2.5">Diunggah Oleh</th>
              <th className="font-medium px-4 py-2.5">Tanggal</th>
              <th className="font-medium px-4 py-2.5">Ukuran</th>
              <th className="font-medium px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((doc) => {
                const Icon = getFileIcon(doc.mime_type);
                const accent = CATEGORY_COLORS[getFileCategory(doc.mime_type)];
                return (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: busyId === doc.id ? 0.5 : 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors"
                  >
                    <td
                      className="pl-3 pr-4 py-3 border-l-4"
                      style={{ borderLeftColor: accent }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${accent}1a`, color: accent }}
                        >
                          <Icon className="size-4" />
                        </div>
                        <span className="truncate font-medium text-dark">{doc.name}</span>
                        {doc.is_confidential && (
                          <Lock className="size-3.5 text-muted shrink-0" aria-label="Dokumen rahasia" />
                        )}
                      </div>
                    </td>
                    {showFolder && (
                      <td className="px-4 py-3 text-muted">
                        {doc.folder?.name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted">
                      {doc.uploader ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={doc.uploader.full_name || doc.uploader.email} />
                          <span className="truncate">
                            {doc.uploader.full_name || doc.uploader.email}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatBytes(doc.size_bytes)}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === doc.id ? null : doc.id)
                        }
                        className="rounded-md p-1.5 text-muted hover:text-dark hover:bg-surface"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {openMenu === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenu(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-4 top-9 z-20 w-40 rounded-lg border border-border bg-white shadow-lg py-1"
                          >
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                handleDownload(doc);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dark hover:bg-surface"
                            >
                              <Download className="size-3.5" /> Unduh
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface"
                            >
                              <Trash2 className="size-3.5" /> Hapus
                            </button>
                          </motion.div>
                        </>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted py-10">
            {query ? "Tidak ada dokumen yang cocok." : "Belum ada dokumen."}
          </p>
        )}
      </div>

      <PasswordPromptModal
        key={pendingDownload?.id ?? "none"}
        open={!!pendingDownload}
        onClose={() => setPendingDownload(null)}
        onSubmit={handlePasswordSubmit}
        loading={passwordLoading}
        error={passwordError}
      />
    </div>
  );
}
