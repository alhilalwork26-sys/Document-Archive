"use client";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENTS_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFile } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

export function ReplaceFileModal({
  open,
  onClose,
  doc,
  onReplaced,
}: {
  open: boolean;
  onClose: () => void;
  doc: DocumentFile | null;
  onReplaced?: () => void;
}) {
  const { push } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setDragActive(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !doc) return;
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      push("error", "Sesi berakhir, silakan masuk kembali.");
      setUploading(false);
      return;
    }

    const newPath = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(newPath, file, { upsert: false });

    if (uploadError) {
      push("error", "Gagal mengunggah file baru.");
      setUploading(false);
      return;
    }

    const { error: versionError } = await supabase.from("document_versions").insert({
      document_id: doc.id,
      version: doc.version,
      storage_path: doc.storage_path,
      size_bytes: doc.size_bytes,
      mime_type: doc.mime_type,
      uploaded_by: doc.uploaded_by,
    });

    if (versionError) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([newPath]);
      push("error", "Gagal menyimpan riwayat versi lama.");
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        storage_path: newPath,
        size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        version: doc.version + 1,
        updated_at: new Date().toISOString(),
        uploaded_by: user.id,
      })
      .eq("id", doc.id);

    setUploading(false);

    if (updateError) {
      push("error", "Gagal memperbarui dokumen.");
      return;
    }

    push("success", "File berhasil diganti. Versi lama tersimpan di riwayat.");
    onReplaced?.();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!uploading) {
          reset();
          onClose();
        }
      }}
      title="Ganti File"
      description={doc ? `Mengganti file untuk "${doc.name}"` : undefined}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-dark truncate">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-muted hover:text-dark rounded-md p-1.5 hover:bg-surface transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
              dragActive ? "border-accent-600 bg-accent-50" : "border-border hover:bg-surface"
            }`}
          >
            <UploadCloud className="size-6 text-muted" />
            <p className="text-sm font-medium text-dark">Klik untuk pilih file baru</p>
            <p className="text-xs text-muted">Maks 50MB · Versi lama tetap tersimpan</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={uploading}
            className="h-10 px-4 rounded-lg text-sm font-medium text-muted hover:bg-surface disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="h-10 px-4 rounded-lg text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {uploading && <Loader2 className="size-4 animate-spin" />}
            Ganti File
          </button>
        </div>
      </form>
    </Modal>
  );
}
