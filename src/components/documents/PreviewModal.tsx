"use client";

import { Modal } from "@/components/ui/Modal";
import type { DocumentFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Download, FileWarning, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isTextLike(mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

/**
 * Renders .docx → HTML entirely client-side (mammoth.js parses the file
 * bytes we already fetched from our own private signed URL). The file
 * never leaves the browser or goes through any third-party viewer.
 */
function WordPreview({ signedUrl }: { signedUrl: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    // Resetting for the fetch this effect kicks off, not deriving state
    // from a prop change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHtml(null);
    setError(false);

    (async () => {
      try {
        const [{ default: mammoth }, { default: DOMPurify }, res] = await Promise.all([
          import("mammoth"),
          import("dompurify"),
          fetch(signedUrl),
        ]);
        const arrayBuffer = await res.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        if (!active) return;
        setHtml(DOMPurify.sanitize(value));
      } catch {
        if (active) setError(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [signedUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-64 rounded-xl bg-surface text-center px-6">
        <FileWarning className="size-8 text-muted" />
        <p className="text-sm text-dark font-medium">Gagal menampilkan pratinjau dokumen ini</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-surface">
        <Loader2 className="size-5 text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="prose-doc max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-white px-6 py-5 text-sm text-dark [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_table]:border-collapse [&_table]:w-full [&_table]:mb-3 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_img]:max-w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
  const isWord = doc.mime_type === WORD_MIME;
  const previewable = isImage || isPdf || isVideo || isAudio || isText || isWord;

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
        ) : isWord ? (
          <WordPreview signedUrl={signedUrl} />
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
              Format ini (mis. Excel/PowerPoint/ZIP) belum bisa ditampilkan langsung di browser
              tanpa mengirim file ke layanan pihak ketiga — silakan unduh untuk membukanya.
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
