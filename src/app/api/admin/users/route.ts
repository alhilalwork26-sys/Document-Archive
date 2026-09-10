import { requireAdmin } from "@/lib/admin-guard";
import { APP_METADATA_MARKER, METADATA_KEYS } from "@/lib/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { email, password, full_name, role } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email dan kata sandi (minimal 8 karakter) wajib diisi." },
      { status: 400 },
    );
  }
  if (role && !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      [METADATA_KEYS.fullName]: full_name || email.split("@")[0],
      [METADATA_KEYS.role]: role || "user",
      [METADATA_KEYS.app]: APP_METADATA_MARKER,
    },
  });

  if (error) {
    // This Supabase project is shared with other GRCC apps (see
    // supabase-schema.sql) — auth.users is project-wide, so an email
    // already registered there by grccunairdashboard (or any other app)
    // collides here too, even though this app has never seen it. Rather
    // than dead-ending on that, link the existing auth user into this
    // app's profiles table instead of creating a duplicate account. The
    // person keeps logging in with whatever password their existing
    // account already has — we deliberately do NOT overwrite it with the
    // "Kata Sandi Awal" typed here, since that would also change their
    // password for the other app.
    const alreadyRegistered = /already.*registered|already.*exists/i.test(error.message);
    if (alreadyRegistered) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "Email ini sudah punya akun di Arsip Dokumen GRCC." },
          { status: 400 },
        );
      }

      let matchedUserId: string | null = null;
      let page = 1;
      while (!matchedUserId) {
        const { data: pageData, error: listError } = await admin.auth.admin.listUsers({
          page,
          perPage: 200,
        });
        if (listError || !pageData || pageData.users.length === 0) break;
        const match = pageData.users.find(
          (u) => u.email?.toLowerCase() === String(email).toLowerCase(),
        );
        if (match) matchedUserId = match.id;
        else if (pageData.users.length < 200) break;
        else page += 1;
      }

      if (!matchedUserId) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error: linkError } = await admin.from("profiles").upsert({
        id: matchedUserId,
        email,
        full_name: full_name || email.split("@")[0],
        role: role || "user",
        is_active: true,
      });

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, id: matchedUserId, linkedExisting: true });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.user?.id });
}
