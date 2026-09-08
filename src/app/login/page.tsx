"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau kata sandi salah.");
      return;
    }
    router.replace(params.get("next") || "/dashboard");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Gagal mengirim email reset. Coba lagi.");
      return;
    }
    setResetSent(true);
  }

  return (
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
        <h1 className="text-lg font-semibold text-dark">ArsipOne GRCC</h1>
        <p className="text-sm text-muted text-center">
          Akses privat untuk dokumen internal GRCC
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              icon={<Mail className="size-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              name="password"
              autoComplete="current-password"
              icon={<Lock className="size-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" loading={loading} className="w-full mt-1">
              Masuk
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError(null);
              }}
              className="text-xs text-muted hover:text-accent-600 transition-colors text-center"
            >
              Lupa kata sandi?
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {resetSent ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <KeyRound className="size-8 text-accent-600" />
                <p className="text-sm text-dark font-medium">Email terkirim</p>
                <p className="text-xs text-muted">
                  Cek inbox {email} untuk tautan reset kata sandi.
                </p>
              </div>
            ) : (
              <>
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  icon={<Mail className="size-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" loading={loading} className="w-full mt-1">
                  Kirim tautan reset
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setResetSent(false);
                setError(null);
              }}
              className="text-xs text-muted hover:text-accent-600 transition-colors text-center"
            >
              Kembali ke halaman masuk
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-muted mt-6">
        Akun hanya dapat dibuat oleh Admin GRCC. Hubungi Admin jika Anda
        belum memiliki akses.
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
