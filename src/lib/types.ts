export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  notifications_seen_at: string;
}

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
  is_pinned: boolean;
  document_count?: number;
  total_bytes?: number;
}

export type SortValue =
  | "created_at_desc"
  | "created_at_asc"
  | "name_asc"
  | "name_desc"
  | "size_bytes_desc"
  | "size_bytes_asc";

export interface DocumentFile {
  id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  is_confidential: boolean;
  password_hash: string | null;
  password_salt: string | null;
  version: number;
  updated_at: string;
  uploader?: Pick<Profile, "id" | "full_name" | "email">;
  folder?: Pick<Folder, "id" | "name">;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  uploader?: Pick<Profile, "id" | "full_name" | "email">;
}
