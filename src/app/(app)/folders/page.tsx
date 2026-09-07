import { createClient } from "@/lib/supabase/server";
import type { DocumentFile, Folder } from "@/lib/types";
import { FoldersView } from "./FoldersView";

export default async function FoldersPage() {
  const supabase = await createClient();

  const [{ data: folders }, { data: documents }] = await Promise.all([
    supabase.from("folders").select("*").order("created_at", { ascending: false }),
    supabase.from("documents").select("id,folder_id,size_bytes"),
  ]);

  const docs = (documents ?? []) as unknown as Pick<
    DocumentFile,
    "id" | "folder_id" | "size_bytes"
  >[];

  const foldersWithStats: Folder[] = (folders ?? []).map((f) => {
    const inFolder = docs.filter((d) => d.folder_id === f.id);
    return {
      ...f,
      document_count: inFolder.length,
      total_bytes: inFolder.reduce((sum, d) => sum + d.size_bytes, 0),
    };
  });

  return <FoldersView initialFolders={foldersWithStats} />;
}
