"use client";

import { DocumentTable } from "@/components/documents/DocumentTable";
import { FilterChips, type FilterChip } from "@/components/documents/FilterChips";
import { FilterMenuButton } from "@/components/documents/FilterMenuButton";
import { FolderCard } from "@/components/documents/FolderCard";
import { getFileIcon } from "@/components/documents/file-icon";
import { NewFolderModal } from "@/components/documents/NewFolderModal";
import { NewMenuButton } from "@/components/documents/NewMenuButton";
import { SortMenuButton } from "@/components/documents/SortMenuButton";
import { UploadModal } from "@/components/documents/UploadModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { CATEGORY_LABELS, getFileCategory, type FileCategory } from "@/lib/file-category";
import type { DocumentFile, Folder, SortValue } from "@/lib/types";
import { formatBytes, formatDate, sortDocuments } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function DashboardView({
  initialFolders,
  initialDocuments,
}: {
  initialFolders: Folder[];
  initialDocuments: DocumentFile[];
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [sort, setSort] = useState<SortValue>("created_at_desc");
  const [folderFilter, setFolderFilter] = useState<string | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Set<FileCategory>>(new Set());

  const recent = initialDocuments.slice(0, 6);

  const visibleDocuments = useMemo(() => {
    let rows = initialDocuments;
    if (folderFilter !== "all") rows = rows.filter((d) => d.folder_id === folderFilter);
    if (categoryFilter.size > 0)
      rows = rows.filter((d) => categoryFilter.has(getFileCategory(d.mime_type)));
    return sortDocuments(rows, sort);
  }, [initialDocuments, folderFilter, categoryFilter, sort]);

  const filterChips = useMemo(() => {
    const chips: FilterChip[] = [];
    if (folderFilter !== "all") {
      const folder = initialFolders.find((f) => f.id === folderFilter);
      if (folder) {
        chips.push({
          key: `folder-${folder.id}`,
          label: folder.name,
          onRemove: () => setFolderFilter("all"),
        });
      }
    }
    for (const cat of categoryFilter) {
      chips.push({
        key: `category-${cat}`,
        label: CATEGORY_LABELS[cat],
        onRemove: () =>
          setCategoryFilter((prev) => {
            const next = new Set(prev);
            next.delete(cat);
            return next;
          }),
      });
    }
    return chips;
  }, [folderFilter, categoryFilter, initialFolders]);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan arsip dokumen internal GRCC"
        actions={
          <NewMenuButton
            onNewFolder={() => setFolderModalOpen(true)}
            onUpload={() => setUploadOpen(true)}
          />
        }
      />

      <section className="mb-8">
        <h2 className="text-sm font-medium text-muted mb-3">Folder</h2>
        {initialFolders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted">Belum ada folder. Buat folder pertama Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialFolders.map((folder, i) => (
              <FolderCard key={folder.id} folder={folder} index={i} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted mb-3">Terbaru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((doc, i) => {
              const Icon = getFileIcon(doc.mime_type);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatDate(doc.created_at)} · {formatBytes(doc.size_bytes)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-medium text-muted">Semua File</h2>
          <div className="flex items-center gap-2">
            <FilterMenuButton
              folders={initialFolders}
              selectedFolderId={folderFilter}
              onFolderChange={setFolderFilter}
              selectedCategories={categoryFilter}
              onCategoriesChange={setCategoryFilter}
            />
            <SortMenuButton value={sort} onChange={setSort} />
          </div>
        </div>
        <FilterChips chips={filterChips} />
        <DocumentTable documents={visibleDocuments} showFolder onChanged={refresh} />
      </section>

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
