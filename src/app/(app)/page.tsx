import { createClient } from "@/lib/supabase/server";
import type { DocumentFile, Folder } from "@/lib/types";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: folders }, { data: documents }] = await Promise.all([
    supabase.from("folders").select("*").order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select(
        "*, uploader:profiles!documents_uploaded_by_fkey(id,full_name,email), folder:folders!documents_folder_id_fkey(id,name)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const docs = (documents ?? []) as unknown as DocumentFile[];

  const foldersWithStats: Folder[] = (folders ?? []).map((f) => {
    const inFolder = docs.filter((d) => d.folder_id === f.id);
    return {
      ...f,
      document_count: inFolder.length,
      total_bytes: inFolder.reduce((sum, d) => sum + d.size_bytes, 0),
    };
  });

  return <DashboardView initialFolders={foldersWithStats} initialDocuments={docs} />;
}
