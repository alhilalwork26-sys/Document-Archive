"use client";

import { DocumentTable } from "@/components/documents/DocumentTable";
import { FilterChips, type FilterChip } from "@/components/documents/FilterChips";
import { FilterMenuButton } from "@/components/documents/FilterMenuButton";
import { FolderCard } from "@/components/documents/FolderCard";
import { NewFolderModal } from "@/components/documents/NewFolderModal";
import { NewMenuButton } from "@/components/documents/NewMenuButton";
import { SortMenuButton } from "@/components/documents/SortMenuButton";
import { UploadModal } from "@/components/documents/UploadModal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENTS_BUCKET } from "@/lib/constants";
import { CATEGORY_LABELS, type FileCategory, getFileCategory } from "@/lib/file-category";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFile, Folder, SortValue } from "@/lib/types";
import { sortDocuments } from "@/lib/utils";
import { ChevronRight, Folder as FolderIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/** Walks the sub-folder tree under `rootId` to collect every folder id in
 *  it (including the root). Deleting the root folder cascades all of
 *  these away at the DB level, but their uploaded files in Storage need
 *  cleaning up ourselves first, or they'd leak. */
async function collectFolderTreeIds(
  supabase: ReturnType<typeof createClient>,
  rootId: string,
): Promise<string[]> {
  const all = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const { data } = await supabase.from("folders").select("id").in("parent_folder_id", frontier);
    const ids = (data ?? []).map((f: { id: string }) => f.id);
    if (ids.length === 0) break;
    all.push(...ids);
    frontier = ids;
  }
  return all;
}

export function FolderView({
  folder,
  ancestors,
  subfolders,
  initialDocuments,
}: {
  folder: Folder;
  ancestors: Folder[];
  subfolders: Folder[];
  initialDocuments: DocumentFile[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sort, setSort] = useState<SortValue>("created_at_desc");
  const [categoryFilter, setCategoryFilter] = useState<Set<FileCategory>>(new Set());

  const visibleDocuments = useMemo(() => {
    const rows =
      categoryFilter.size > 0
        ? initialDocuments.filter((d) => categoryFilter.has(getFileCategory(d.mime_type)))
        : initialDocuments;
    return sortDocuments(rows, sort);
  }, [initialDocuments, categoryFilter, sort]);

  const filterChips = useMemo(() => {
    const chips: FilterChip[] = [];
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
  }, [categoryFilter]);

  function refresh() {
    router.refresh();
  }

  async function handleDeleteFolder() {
    const warnSubfolders = subfolders.length > 0 ? ` dan ${subfolders.length} sub-folder` : "";
    if (
      !confirm(
        `Hapus folder "${folder.name}"${warnSubfolders} beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setDeleting(true);
    const supabase = createClient();

    const treeIds = await collectFolderTreeIds(supabase, folder.id);
    const { data: allDocs } = await supabase
      .from("documents")
      .select("storage_path")
      .in("folder_id", treeIds);
    if (allDocs && allDocs.length > 0) {
      await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove(allDocs.map((d: { storage_path: string }) => d.storage_path));
    }

    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    setDeleting(false);
    if (error) {
      push("error", "Gagal menghapus folder.");
      return;
    }
    push("success", "Folder dihapus.");
    router.replace(folder.parent_folder_id ? `/folders/${folder.parent_folder_id}` : "/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1.5 text-sm text-muted mb-4 flex-wrap">
        <Link href="/dashboard" className="hover:text-dark">
          Dashboard
        </Link>
        {ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            <Link href={`/folders/${a.id}`} className="hover:text-dark">
              {a.name}
            </Link>
          </span>
        ))}
        <ChevronRight className="size-3.5" />
        <span className="text-dark font-medium">{folder.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${folder.color}1a`, color: folder.color }}
          >
            <FolderIcon className="size-5.5" fill={`${folder.color}33`} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-dark tracking-tight">
              {folder.name}
            </h1>
            {folder.description && (
              <p className="text-sm text-muted mt-0.5">{folder.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={handleDeleteFolder} disabled={deleting}>
            <Trash2 className="size-4" /> Hapus Folder
          </Button>
          <NewMenuButton
            onNewFolder={() => setFolderModalOpen(true)}
            onUpload={() => setUploadOpen(true)}
          />
        </div>
      </div>

      {subfolders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted mb-3">Sub-folder</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subfolders.map((sub, i) => (
              <FolderCard key={sub.id} folder={sub} index={i} onChanged={refresh} />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-medium text-muted">Dokumen</h2>
        <div className="flex items-center gap-2">
          <FilterMenuButton
            selectedCategories={categoryFilter}
            onCategoriesChange={setCategoryFilter}
          />
          <SortMenuButton value={sort} onChange={setSort} />
        </div>
      </div>

      <FilterChips chips={filterChips} />

      <DocumentTable documents={visibleDocuments} onChanged={refresh} />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={folder.id}
        onUploaded={refresh}
      />
      <NewFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onCreated={refresh}
        parentFolderId={folder.id}
      />
    </>
  );
}
