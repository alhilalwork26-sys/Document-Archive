import { APP_METADATA_MARKER, METADATA_KEYS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * One-time bootstrap for the very first Admin account. Self-disables the
 * moment any row exists in `profiles` — safe to leave deployed.
 */
export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ setupComplete: (count ?? 0) > 0 });
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Setup sudah selesai. Hubungi Admin untuk membuat akun baru." },
      { status: 403 },
    );
  }

  const { email, password, full_name } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email dan kata sandi (minimal 8 karakter) wajib diisi." },
      { status: 400 },
    );
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      [METADATA_KEYS.fullName]: full_name || email.split("@")[0],
      [METADATA_KEYS.role]: "admin",
      [METADATA_KEYS.app]: APP_METADATA_MARKER,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
