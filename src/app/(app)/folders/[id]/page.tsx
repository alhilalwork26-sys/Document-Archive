import { createClient } from "@/lib/supabase/server";
import type { DocumentFile, Folder } from "@/lib/types";
import { notFound } from "next/navigation";
import { FolderView } from "./FolderView";

async function getAncestors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startParentId: string | null,
): Promise<Folder[]> {
  const ancestors: Folder[] = [];
  let parentId = startParentId;
  // Sequential — nesting is expected to be shallow (a few levels), so a
  // handful of round trips beats the complexity of a recursive CTE here.
  while (parentId) {
    const { data: parent } = await supabase
      .from("folders")
      .select("*")
      .eq("id", parentId)
      .single<Folder>();
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.parent_folder_id;
  }
  return ancestors;
}

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: folder }, { data: documents }, { data: subfolders }] = await Promise.all([
    supabase.from("folders").select("*").eq("id", id).single<Folder>(),
    supabase
      .from("documents")
      .select(
        "*, uploader:profiles!documents_uploaded_by_fkey(id,full_name,email)",
      )
      .eq("folder_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("folders")
      .select("*")
      .eq("parent_folder_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!folder) notFound();

  const subfolderIds = (subfolders ?? []).map((f) => f.id);
  const { data: subfolderDocs } =
    subfolderIds.length > 0
      ? await supabase.from("documents").select("id,folder_id,size_bytes").in("folder_id", subfolderIds)
      : { data: [] as { id: string; folder_id: string | null; size_bytes: number }[] };

  const subfoldersWithStats: Folder[] = (subfolders ?? []).map((f) => {
    const inFolder = (subfolderDocs ?? []).filter((d) => d.folder_id === f.id);
    return {
      ...f,
      document_count: inFolder.length,
      total_bytes: inFolder.reduce((sum, d) => sum + d.size_bytes, 0),
    };
  });

  const ancestors = await getAncestors(supabase, folder.parent_folder_id);

  return (
    <FolderView
      folder={folder}
      ancestors={ancestors}
      subfolders={subfoldersWithStats}
      initialDocuments={(documents ?? []) as unknown as DocumentFile[]}
    />
  );
}
