<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arsip Dokumen GRCC — Project Aktif

## Dev Server
```bash
npm run dev
# Server berjalan di http://localhost:3002 (port khusus, lihat package.json)
```

## Tech Stack
- Next.js (App Router) + Tailwind CSS v4 + Framer Motion
- Supabase: Auth per-pengguna + Postgres RLS + Storage privat (lihat `supabase-schema.sql`)

## Environment
`.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` — memakai project Supabase **`grccunairdashboard`**
yang sudah ada (dipakai bersama, bukan project khusus). Lihat `README.md` bagian
"Project Bersama" untuk cara membuat akun Admin pertama lewat `/setup`.

## Isolasi Project Bersama — JANGAN DILANGGAR
Semua tabel ada di schema Postgres `document_archive` (bukan `public`), dan
bucket Storage bernama `grcc-document-archive` (bukan `documents`) — lihat
`src/lib/constants.ts` dan `src/lib/supabase/{client,server}.ts` (opsi
`db: { schema: "document_archive" }`). Jangan pernah hardcode `"documents"`
sebagai nama bucket atau balik ke schema `public` — itu akan bentrok/bocor ke
aplikasi dashboard lain di project yang sama. Setiap akun baru WAJIB diberi
`user_metadata.app = APP_METADATA_MARKER` (lihat `src/lib/constants.ts`) saat
dibuat lewat `auth.admin.createUser`, karena trigger `handle_new_user` di
`supabase-schema.sql` hanya membuat baris `profiles` kalau penanda ini ada.

## Model Akses
Admin dan User punya hak yang **setara** untuk folder/dokumen (CRUD penuh).
Satu-satunya hal khusus Admin: mengelola akun lewat `/people` →
`src/app/api/admin/users/**` (memakai `SUPABASE_SERVICE_ROLE_KEY`, jangan pernah
dipanggil dari client tanpa lewat `requireAdmin()` di `src/lib/admin-guard.ts`).
