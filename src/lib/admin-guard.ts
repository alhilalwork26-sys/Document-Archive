import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type GuardResult =
  | { profile: Profile }
  | { error: string; status: 401 | 403 };

/**
 * Server-side check that the current session belongs to an active admin.
 * Uses the RLS-bound client (not the service role) so the caller's identity
 * cannot be spoofed — only after this passes should a route reach for
 * createAdminClient().
 */
export async function requireAdmin(): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return { error: "Forbidden", status: 403 };
  }

  return { profile };
}
