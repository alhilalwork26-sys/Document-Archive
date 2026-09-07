import { createClient } from "@/lib/supabase/server";
import type { DocumentFile, Folder } from "@/lib/types";
import { notFound } from "next/navigation";
import { FolderView } from "./FolderView";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: folder }, { data: documents }] = await Promise.all([
    supabase.from("folders").select("*").eq("id", id).single<Folder>(),
    supabase
      .from("documents")
      .select(
        "*, uploader:profiles!documents_uploaded_by_fkey(id,full_name,email)",
      )
      .eq("folder_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!folder) notFound();

  return (
    <FolderView
      folder={folder}
      initialDocuments={(documents ?? []) as unknown as DocumentFile[]}
    />
  );
}
