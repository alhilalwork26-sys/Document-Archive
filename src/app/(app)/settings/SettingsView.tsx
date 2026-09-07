"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Lock, User } from "lucide-react";
import { useState } from "react";

export function SettingsView({ profile }: { profile: Profile }) {
  const { push } = useToast();
  const [fullName, setFullName] = useState(profile.full_name);
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);
    setSavingName(false);
    if (error) {
      push("error", "Gagal memperbarui nama.");
      return;
    }
    push("success", "Nama berhasil diperbarui.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      push("error", "Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      push("error", "Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      push("error", "Gagal mengubah kata sandi.");
      return;
    }
    setPassword("");
    setConfirm("");
    push("success", "Kata sandi berhasil diubah.");
  }

  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola profil dan keamanan akun Anda" />

      <div className="flex flex-col gap-6 max-w-lg">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-4 text-muted" />
            <h2 className="text-sm font-semibold text-dark">Profil</h2>
            <Badge tone={profile.role === "admin" ? "accent" : "neutral"}>
              {profile.role === "admin" ? "Administrator" : "Pengguna"}
            </Badge>
          </div>
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <Input label="Email" value={profile.email} disabled />
            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <div>
              <Button type="submit" loading={savingName} size="sm">
                Simpan
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-4 text-muted" />
            <h2 className="text-sm font-semibold text-dark">Ubah Kata Sandi</h2>
          </div>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Input
              label="Kata Sandi Baru"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Konfirmasi Kata Sandi"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <div>
              <Button type="submit" loading={savingPassword} size="sm">
                Ubah Kata Sandi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
