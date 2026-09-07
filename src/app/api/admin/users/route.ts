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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.user?.id });
}
