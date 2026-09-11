-- ============================================================
-- GRCC Document Archive — Supabase Schema
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- Aman dijalankan ulang (idempotent) berkat "if not exists" / "on conflict".
--
-- PROJECT INI DIPAKAI BERSAMA aplikasi GRCC lain (mis. grccunairdashboard).
-- Semua objek di bawah ini SENGAJA dinamai unik & ditaruh di schema
-- `document_archive` (bukan `public`) supaya:
--   1. Tidak bentrok dengan tabel/fungsi/trigger milik aplikasi lain yang
--      sudah ada di project yang sama.
--   2. Pengguna aplikasi lain (mis. dashboard) TIDAK otomatis punya akses
--      ke data arsip dokumen ini, meskipun mereka berbagi kolam Auth yang
--      sama (auth.users bersifat project-wide, tidak bisa dipisah).
--
-- LANGKAH WAJIB SETELAH MENJALANKAN SCRIPT INI:
-- Buka Project Settings → API → Data API Settings → "Exposed schemas",
-- tambahkan `document_archive` ke daftar (pisahkan dengan koma), lalu Save.
-- Tanpa langkah ini, aplikasi tidak bisa membaca/menulis data sama sekali.
-- ============================================================

create schema if not exists document_archive;

-- 1. PROFILES — satu baris per akun arsip dokumen (dibuat otomatis, TAPI
--    hanya untuk akun yang dibuat lewat aplikasi ini — lihat trigger di
--    bawah). Akun dari aplikasi GRCC lain di project yang sama TIDAK akan
--    otomatis punya baris di sini.
create table if not exists document_archive.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'user' check (role in ('admin','user')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Tracks when each member last opened the notification bell, so unread
-- "new document" counts can be computed as documents.created_at > this.
alter table document_archive.profiles
  add column if not exists notifications_seen_at timestamptz not null default now();

-- Auto-create a profile row whenever a new auth user is created *by this
-- app* — gated on `raw_user_meta_data->>'da_app' = 'document_archive'`,
-- which /api/setup and /api/admin/users always set. Sign-ups from other
-- apps sharing this Supabase project (no such marker) are skipped entirely.
--
-- NOTE: the metadata keys are prefixed `da_` (not plain `role`/`full_name`)
-- because grccunairdashboard's own `public.handle_new_user` trigger ALSO
-- fires on every auth.users insert and reads a plain `role` key from the
-- same shared metadata — a collision that broke account creation here the
-- first time (its own role check constraint rejected our "admin"/"user"
-- values and aborted the whole transaction). Never rename these back to
-- unprefixed keys.
create or replace function document_archive.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = document_archive
as $$
begin
  if new.raw_user_meta_data->>'da_app' = 'document_archive' then
    insert into document_archive.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'da_full_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'da_role', 'user')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_document_archive on auth.users;
create trigger on_auth_user_created_document_archive
  after insert on auth.users
  for each row execute function document_archive.handle_new_user();

-- Block a regular (non-service-role) client from ever changing role /
-- is_active on their own or anyone else's profile row — account
-- management only happens server-side via the service role key in
-- /api/admin/users, which is gated by an explicit admin check.
create or replace function document_archive.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = document_archive
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and auth.role() <> 'service_role' then
    raise exception 'Hanya admin yang dapat mengubah role atau status aktif akun';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_privilege_escalation_document_archive on document_archive.profiles;
create trigger trg_prevent_privilege_escalation_document_archive
  before update on document_archive.profiles
  for each row execute function document_archive.prevent_privilege_escalation();

-- Membership check used by every RLS policy below. SECURITY DEFINER so it
-- can read `profiles` regardless of the caller's own row-level access,
-- avoiding recursive-RLS issues.
create or replace function document_archive.is_archive_member()
returns boolean
language sql
security definer
stable
set search_path = document_archive
as $$
  select exists (
    select 1 from document_archive.profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

-- 2. FOLDERS
create table if not exists document_archive.folders (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  color              text not null default '#4F46E5',
  created_by         uuid references document_archive.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  is_pinned          boolean not null default false,
  -- Sub-folders: null = top-level folder. Cascades so deleting a folder
  -- also deletes its whole sub-tree (documents inside cascade too via
  -- documents.folder_id's own "on delete cascade").
  parent_folder_id   uuid references document_archive.folders(id) on delete cascade
);

alter table document_archive.folders add column if not exists is_pinned boolean not null default false;
alter table document_archive.folders add column if not exists parent_folder_id uuid references document_archive.folders(id) on delete cascade;

create index if not exists folders_parent_folder_id_idx on document_archive.folders(parent_folder_id);

-- 3. DOCUMENTS
create table if not exists document_archive.documents (
  id                uuid primary key default gen_random_uuid(),
  folder_id         uuid references document_archive.folders(id) on delete cascade,
  name              text not null,
  description       text,
  storage_path      text not null unique,
  size_bytes        bigint not null default 0,
  mime_type         text not null default 'application/octet-stream',
  uploaded_by       uuid references document_archive.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  -- "Dokumen Rahasia" — soft download gate, not encryption. See
  -- src/lib/password.ts for the threat model and hashing approach
  -- (PBKDF2-SHA256, hashed client-side, verified client-side against the
  -- salt/hash below — RLS already grants every member read access to
  -- these columns, same as every other document column).
  is_confidential   boolean not null default false,
  password_hash     text,
  password_salt     text,
  -- Versioning: `version`/`updated_at` describe the CURRENT file this row
  -- points to; superseded files are snapshotted into document_versions
  -- below rather than deleted, so old copies stay downloadable.
  version           integer not null default 1,
  updated_at        timestamptz not null default now()
);

alter table document_archive.documents add column if not exists description text;
alter table document_archive.documents add column if not exists is_confidential boolean not null default false;
alter table document_archive.documents add column if not exists password_hash text;
alter table document_archive.documents add column if not exists password_salt text;
alter table document_archive.documents add column if not exists version integer not null default 1;
alter table document_archive.documents add column if not exists updated_at timestamptz not null default now();

-- 3b. DOCUMENT VERSIONS — snapshot of a document's file each time it's
-- replaced via "Ganti File". The `documents` row above always holds the
-- CURRENT file; this table holds everything it superseded.
create table if not exists document_archive.document_versions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references document_archive.documents(id) on delete cascade,
  version       integer not null,
  storage_path  text not null,
  size_bytes    bigint not null default 0,
  mime_type     text not null default 'application/octet-stream',
  uploaded_by   uuid references document_archive.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists documents_folder_id_idx on document_archive.documents(folder_id);
create index if not exists documents_uploaded_by_idx on document_archive.documents(uploaded_by);
create index if not exists folders_created_by_idx on document_archive.folders(created_by);
create index if not exists document_versions_document_id_idx on document_archive.document_versions(document_id);

-- ── PRIVILEGES ────────────────────────────────────────────────────────────
-- A brand-new schema has no default grants (unlike `public`) — without
-- these, PostgREST/supabase-js gets "permission denied" even before RLS is
-- evaluated. Only `authenticated` + `service_role` get access; `anon` gets
-- none (every table also requires is_archive_member() via RLS below).
grant usage on schema document_archive to authenticated, service_role;
grant all on all tables in schema document_archive to authenticated, service_role;
alter default privileges in schema document_archive
  grant all on tables to authenticated, service_role;

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table document_archive.profiles          enable row level security;
alter table document_archive.folders           enable row level security;
alter table document_archive.documents         enable row level security;
alter table document_archive.document_versions enable row level security;

drop policy if exists "profiles_select_members" on document_archive.profiles;
create policy "profiles_select_members" on document_archive.profiles
  for select using (document_archive.is_archive_member());

-- Users may only edit their own row, and the trigger above still blocks
-- role/is_active changes even here.
drop policy if exists "profiles_update_self" on document_archive.profiles;
create policy "profiles_update_self" on document_archive.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Folders & documents: every active archive member (admin or user) has
-- equal full read/write access — this is an internal shared archive, not
-- per-client scoped storage. Non-members (incl. users of other GRCC apps
-- sharing this project) get nothing.
drop policy if exists "folders_all_members" on document_archive.folders;
create policy "folders_all_members" on document_archive.folders
  for all using (document_archive.is_archive_member())
  with check (document_archive.is_archive_member());

drop policy if exists "documents_all_members" on document_archive.documents;
create policy "documents_all_members" on document_archive.documents
  for all using (document_archive.is_archive_member())
  with check (document_archive.is_archive_member());

drop policy if exists "document_versions_all_members" on document_archive.document_versions;
create policy "document_versions_all_members" on document_archive.document_versions
  for all using (document_archive.is_archive_member())
  with check (document_archive.is_archive_member());

-- ── STORAGE ───────────────────────────────────────────────────────────────
-- Private bucket with a unique, prefixed name so it can't collide with a
-- bucket another GRCC app already created in this project. Every download
-- goes through a short-lived signed URL, never a public link.
insert into storage.buckets (id, name, public, file_size_limit)
values ('grcc-document-archive', 'grcc-document-archive', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "grcc_archive_bucket_select" on storage.objects;
create policy "grcc_archive_bucket_select" on storage.objects
  for select using (
    bucket_id = 'grcc-document-archive' and document_archive.is_archive_member()
  );

drop policy if exists "grcc_archive_bucket_insert" on storage.objects;
create policy "grcc_archive_bucket_insert" on storage.objects
  for insert with check (
    bucket_id = 'grcc-document-archive' and document_archive.is_archive_member()
  );

drop policy if exists "grcc_archive_bucket_update" on storage.objects;
create policy "grcc_archive_bucket_update" on storage.objects
  for update using (
    bucket_id = 'grcc-document-archive' and document_archive.is_archive_member()
  );

drop policy if exists "grcc_archive_bucket_delete" on storage.objects;
create policy "grcc_archive_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'grcc-document-archive' and document_archive.is_archive_member()
  );
