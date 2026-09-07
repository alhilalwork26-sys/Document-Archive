"use client";

import { FolderCard } from "@/components/documents/FolderCard";
import { NewFolderModal } from "@/components/documents/NewFolderModal";
import { NewMenuButton } from "@/components/documents/NewMenuButton";
import { UploadModal } from "@/components/documents/UploadModal";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Folder } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FoldersView({ initialFolders }: { initialFolders: Folder[] }) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Dokumen"
        description="Semua folder arsip dokumen internal GRCC"
        actions={
          <NewMenuButton
            onNewFolder={() => setFolderModalOpen(true)}
            onUpload={() => setUploadOpen(true)}
          />
        }
      />

      {initialFolders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">Belum ada folder. Buat folder pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {initialFolders.map((folder, i) => (
            <FolderCard key={folder.id} folder={folder} index={i} />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folders={initialFolders}
        onUploaded={refresh}
      />
      <NewFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onCreated={refresh}
      />
    </>
  );
}
