# Arsip Dokumen GRCC

Aplikasi arsip dokumen internal GRCC — privat, aman, dan hanya bisa diakses oleh akun yang dibuat oleh Admin (tidak ada pendaftaran publik).

## Tech Stack

- Next.js (App Router, TypeScript) + Tailwind CSS v4 + Framer Motion + lucide-react
- Supabase: Auth (per-pengguna, bukan akun bersama) + Postgres dengan Row Level Security + Storage privat

## Project Bersama (grccunairdashboard)

Aplikasi ini **sengaja digabung** ke project Supabase `grccunairdashboard` yang sudah ada, bukan project baru. Supaya tidak bentrok dan tidak membocorkan data ke pengguna aplikasi lain di project yang sama, semua objek arsip dokumen diisolasi:

- Tabel (`profiles`, `folders`, `documents`) ditaruh di schema Postgres **`document_archive`**, bukan `public` — tidak menyentuh tabel dashboard yang sudah ada.
- Bucket Storage pakai nama unik **`grcc-document-archive`**, bukan `documents` — tidak bentrok kalau dashboard sudah punya bucket bernama itu.
- Auth (`auth.users`) memang dipakai bersama (satu project = satu kolam Auth), **tapi** setiap akun yang dibuat aplikasi ini ditandai `user_metadata.app = "document_archive"`. Baris `profiles` arsip dokumen hanya dibuat untuk akun yang punya penanda ini — pengguna dashboard yang sudah ada **tidak otomatis** dapat akses ke arsip dokumen.
- Semua kebijakan RLS memakai fungsi `document_archive.is_archive_member()` yang mengecek keanggotaan eksplisit di tabel `profiles` milik arsip — bukan sekadar "sudah login", supaya pengguna dashboard lain tetap tidak bisa baca/tulis data arsip meski mereka juga punya sesi login yang valid di project yang sama.

## 1. Ambil Kredensial Project

1. Buka dashboard Supabase project **grccunairdashboard**.
2. **Project Settings → API**, catat:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (rahasia!) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Jalankan Schema Database

Buka **SQL Editor** di dashboard Supabase → New Query → salin-tempel seluruh isi file [`supabase-schema.sql`](./supabase-schema.sql) → Run.

Script ini membuat:
- Schema `document_archive` beserta tabel `profiles`, `folders`, `documents` dan Row Level Security-nya
- Trigger yang membuat baris `profiles` **hanya** untuk akun bertanda `app = "document_archive"`
- Bucket Storage privat `grcc-document-archive` (limit 50MB per file, hanya lewat signed URL sementara)

Aman dijalankan ulang kapan saja (idempotent) — tidak menyentuh tabel/objek dashboard yang sudah ada.

## 3. Expose Schema `document_archive` (WAJIB)

Secara default Supabase hanya mengekspos schema `public` lewat API. Karena arsip dokumen pakai schema terpisah, harus ditambahkan manual:

1. **Project Settings → API → Data API Settings**.
2. Di kolom **"Exposed schemas"**, tambahkan `document_archive` (pisahkan dengan koma dari `public` yang sudah ada).
3. **Save**.

Tanpa langkah ini aplikasi akan gagal total membaca/menulis data (error "schema must be one of the following").

## 4. Konfigurasi Environment

```bash
cp .env.local.example .env.local
```

Isi tiga nilai dari langkah 1. **Jangan pernah** menaruh `SUPABASE_SERVICE_ROLE_KEY` di variabel berawalan `NEXT_PUBLIC_` — key ini hanya boleh dipakai di server (lihat `src/lib/supabase/server.ts`).

## 5. Jalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3002](http://localhost:3002).

> Port sengaja diset ke **3002** agar tidak bentrok dengan project GRCC lain yang menjalankan `next dev` di port 3000/3001.

## 6. Buat Akun Admin Pertama

Karena tidak ada pendaftaran publik, akun pertama dibuat lewat halaman bootstrap satu-kali:

1. Buka **`/setup`** (mis. `http://localhost:3002/setup`).
2. Isi nama, email, dan kata sandi Admin.
3. Halaman ini otomatis menonaktifkan diri setelah akun pertama dibuat — percobaan berikutnya akan ditolak oleh server (memeriksa apakah `document_archive.profiles` sudah berisi baris, bukan seluruh `auth.users` project).

## 7. Tambah 3 Akun Pengguna

Login sebagai Admin → menu **Pengguna** (`/people`) → **Tambah Pengguna**. Bagikan kata sandi awal secara aman ke masing-masing pengguna; mereka bisa menggantinya lewat **Pengaturan** setelah login, atau memakai "Lupa kata sandi?" di halaman masuk.

Admin dan Pengguna memiliki hak yang **setara** untuk membuat folder serta mengunggah/menghapus dokumen — perbedaan Admin hanya pada pengelolaan akun (`/people`).

## Catatan Keamanan

- Tidak ada halaman pendaftaran publik — akun hanya dibuat oleh Admin lewat API server-side yang memakai `service_role` key.
- RLS di semua tabel memakai `document_archive.is_archive_member()` — cek keanggotaan eksplisit, bukan sekadar status login — supaya pengguna aplikasi lain di project yang sama tidak otomatis dapat akses.
- Kolom `role` dan `is_active` di `profiles` dikunci lewat trigger database (`prevent_privilege_escalation`) — hanya proses server yang memakai `service_role` yang bisa mengubahnya, tidak bisa dari browser meski lewat DevTools.
- Bucket Storage bersifat privat dengan nama unik; setiap unduhan memakai signed URL yang kedaluwarsa dalam 60 detik, tidak ada tautan publik permanen.
- Halaman ini diset `robots: noindex` agar tidak terindeks mesin pencari.

## Deploy ke Vercel

1. Push repo ini ke GitHub/GitLab.
2. Import project di [vercel.com/new](https://vercel.com/new).
3. Tambahkan tiga environment variable dari langkah 1 di pengaturan project Vercel.
4. Deploy — lalu ulangi langkah 6 (`/setup`) di URL produksi untuk membuat Admin pertama.
