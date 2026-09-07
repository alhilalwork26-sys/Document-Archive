"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const [checking, setChecking] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => setSetupComplete(Boolean(data.setupComplete)))
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal membuat akun admin.");
      return;
    }
    setDone(true);
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
          <h1 className="text-lg font-semibold text-dark">Siapkan Akun Admin</h1>
          <p className="text-sm text-muted text-center">
            Langkah pertama untuk mengaktifkan Arsip Dokumen GRCC
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {checking ? (
            <p className="text-sm text-muted text-center py-6">Memeriksa status…</p>
          ) : done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="size-8 text-success" />
              <p className="text-sm text-dark font-medium">Akun admin berhasil dibuat</p>
              <Link
                href="/login"
                className="text-sm text-accent-600 font-medium hover:underline mt-2"
              >
                Lanjut ke halaman masuk →
              </Link>
            </div>
          ) : setupComplete ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-sm text-dark">Setup sudah pernah dilakukan.</p>
              <Link
                href="/login"
                className="text-sm text-accent-600 font-medium hover:underline mt-2"
              >
                Ke halaman masuk →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Nama Lengkap"
                icon={<User className="size-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                icon={<Mail className="size-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Kata Sandi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" loading={loading} className="w-full mt-1">
                Buat Akun Admin
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
