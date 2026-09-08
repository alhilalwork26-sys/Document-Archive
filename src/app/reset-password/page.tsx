"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Tautan reset sudah kedaluwarsa. Minta tautan baru dari halaman masuk.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent-600 text-white shadow-lg shadow-accent-600/25">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-dark">Atur Kata Sandi Baru</h1>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="size-8 text-success" />
              <p className="text-sm text-dark font-medium">Kata sandi diperbarui</p>
              <p className="text-xs text-muted">Mengalihkan ke dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Kata Sandi Baru"
                type="password"
                icon={<Lock className="size-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                icon={<Lock className="size-4" />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" loading={loading} className="w-full mt-1">
                Simpan Kata Sandi
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
