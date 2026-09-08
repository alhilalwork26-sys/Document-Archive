"use client";

import { Modal } from "@/components/ui/Modal";
import type { DocumentFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Download, FileWarning } from "lucide-react";

function isTextLike(mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

export function PreviewModal({
  open,
  onClose,
  doc,
  signedUrl,
}: {
  open: boolean;
  onClose: () => void;
  doc: DocumentFile | null;
  signedUrl: string | null;
}) {
  if (!doc) return null;

  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";
  const isVideo = doc.mime_type.startsWith("video/");
  const isAudio = doc.mime_type.startsWith("audio/");
  const isText = isTextLike(doc.mime_type);
  const previewable = isImage || isPdf || isVideo || isAudio || isText;

  return (
    <Modal open={open} onClose={onClose} title={doc.name} widthClass="max-w-3xl">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted -mt-2">
          {formatBytes(doc.size_bytes)} · {formatDate(doc.updated_at || doc.created_at)}
          {doc.version > 1 && ` · Versi ${doc.version}`}
        </p>

        {!signedUrl ? (
          <div className="flex items-center justify-center h-64 rounded-xl bg-surface">
            <p className="text-sm text-muted">Memuat pratinjau…</p>
          </div>
        ) : isImage ? (
          // Short-lived signed URL, not a static asset next/image can optimize.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signedUrl}
            alt={doc.name}
            className="max-h-[70vh] w-auto mx-auto rounded-xl border border-border object-contain"
          />
        ) : isPdf || isText ? (
          <iframe
            src={signedUrl}
            title={doc.name}
            className="w-full h-[70vh] rounded-xl border border-border bg-white"
          />
        ) : isVideo ? (
          <video
            src={signedUrl}
            controls
            className="max-h-[70vh] w-full rounded-xl border border-border bg-dark"
          />
        ) : isAudio ? (
          <div className="flex items-center justify-center h-32 rounded-xl bg-surface px-6">
            <audio src={signedUrl} controls className="w-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 h-64 rounded-xl bg-surface text-center px-6">
            <FileWarning className="size-8 text-muted" />
            <p className="text-sm text-dark font-medium">
              Pratinjau tidak tersedia untuk jenis file ini
            </p>
            <p className="text-xs text-muted max-w-xs">
              Format ini (mis. Word/Excel/PowerPoint/ZIP) belum bisa ditampilkan langsung di
              browser tanpa mengirim file ke layanan pihak ketiga — silakan unduh untuk membukanya.
            </p>
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors"
            >
              <Download className="size-4" /> Unduh File
            </a>
          </div>
        )}

        {previewable && (
          <a
            href={signedUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="self-end inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-dark"
          >
            <Download className="size-3.5" /> Unduh file ini
          </a>
        )}
      </div>
    </Modal>
  );
}
