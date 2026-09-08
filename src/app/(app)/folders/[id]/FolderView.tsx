"use client";

import { DocumentTable } from "@/components/documents/DocumentTable";
import { FilterChips, type FilterChip } from "@/components/documents/FilterChips";
import { FilterMenuButton } from "@/components/documents/FilterMenuButton";
import { SortMenuButton } from "@/components/documents/SortMenuButton";
import { UploadModal } from "@/components/documents/UploadModal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENTS_BUCKET } from "@/lib/constants";
import { CATEGORY_LABELS, type FileCategory, getFileCategory } from "@/lib/file-category";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFile, Folder, SortValue } from "@/lib/types";
import { sortDocuments } from "@/lib/utils";
import { ChevronRight, Folder as FolderIcon, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function FolderView({
  folder,
  initialDocuments,
}: {
  folder: Folder;
  initialDocuments: DocumentFile[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
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

  async function handleDeleteFolder() {
    if (
      !confirm(
        `Hapus folder "${folder.name}" beserta seluruh isinya (${initialDocuments.length} file)? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setDeleting(true);
    const supabase = createClient();
    if (initialDocuments.length > 0) {
      await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove(initialDocuments.map((d) => d.storage_path));
    }
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    setDeleting(false);
    if (error) {
      push("error", "Gagal menghapus folder.");
      return;
    }
    push("success", "Folder dihapus.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1.5 text-sm text-muted mb-4">
        <Link href="/dashboard" className="hover:text-dark">
          Dashboard
        </Link>
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
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud className="size-4" /> Unggah
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-3">
        <FilterMenuButton
          selectedCategories={categoryFilter}
          onCategoriesChange={setCategoryFilter}
        />
        <SortMenuButton value={sort} onChange={setSort} />
      </div>

      <FilterChips chips={filterChips} />

      <DocumentTable documents={visibleDocuments} onChanged={() => router.refresh()} />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={folder.id}
        onUploaded={() => router.refresh()}
      />
    </>
  );
}
