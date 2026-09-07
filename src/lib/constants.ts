/**
 * This app shares its Supabase project with other GRCC apps (e.g.
 * grccunairdashboard). Everything below is namespaced so it can never
 * collide with tables/buckets/metadata keys those other apps already own:
 * - DB tables live in the `document_archive` Postgres schema, not `public`.
 * - The storage bucket uses a prefixed, unique name.
 * See supabase-schema.sql and README.md for the full isolation approach.
 */
export const DOCUMENTS_BUCKET = "grcc-document-archive";

/**
 * auth.users is shared project-wide, and so is `raw_user_meta_data` on it —
 * grccunairdashboard's own `handle_new_user` trigger reads a plain `role`
 * key from that same metadata and enforces its OWN check constraint on it,
 * which broke account creation here the first time (its trigger fired on
 * our inserts too and choked on our "admin"/"user" values). Every metadata
 * key this app writes is prefixed `da_` so it can never collide with keys
 * another app on this project reads or writes.
 */
export const METADATA_KEYS = {
  /** Marks a user as belonging to this app — gates the profile-creation
   *  trigger in supabase-schema.sql so unrelated sign-ups are ignored. */
  app: "da_app",
  role: "da_role",
  fullName: "da_full_name",
} as const;

/** Value stamped under METADATA_KEYS.app for every account this app creates. */
export const APP_METADATA_MARKER = "document_archive";
