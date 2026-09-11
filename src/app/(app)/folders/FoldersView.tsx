"use client";

import { FolderCard } from "@/components/documents/FolderCard";
import { NewFolderModal } from "@/components/documents/NewFolderModal";
import { NewMenuButton } from "@/components/documents/NewMenuButton";
import { UploadModal } from "@/components/documents/UploadModal";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Folder } from "@/lib/types";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FoldersView({ initialFolders }: { initialFolders: Folder[] }) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  // Only top-level folders show here — sub-folders (parent_folder_id set)
  // appear nested inside their parent's own page.
  const rootFolders = initialFolders.filter((f) => !f.parent_folder_id);
  const pinnedFolders = rootFolders.filter((f) => f.is_pinned);
  const unpinnedFolders = rootFolders.filter((f) => !f.is_pinned);

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

      {pinnedFolders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted mb-3 flex items-center gap-1.5">
            <Pin className="size-3.5" /> Disematkan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinnedFolders.map((folder, i) => (
              <FolderCard key={folder.id} folder={folder} index={i} onChanged={refresh} />
            ))}
          </div>
        </section>
      )}

      {unpinnedFolders.length === 0 ? (
        rootFolders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted">Belum ada folder. Buat folder pertama Anda.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {unpinnedFolders.map((folder, i) => (
            <FolderCard key={folder.id} folder={folder} index={i} onChanged={refresh} />
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
