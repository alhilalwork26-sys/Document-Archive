"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

export function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { push } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal membuat akun.");
      return;
    }
    push("success", `Akun untuk ${email} berhasil dibuat.`);
    reset();
    onCreated?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Tambah Pengguna"
      description="Buat akun baru — bagikan kata sandi ini secara aman ke pengguna."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nama Lengkap"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Kata Sandi Awal"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-dark">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "user" | "admin")}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-dark outline-none focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600"
          >
            <option value="user">Pengguna</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="h-10 px-4 rounded-lg text-sm font-medium text-muted hover:bg-surface"
          >
            Batal
          </button>
          <Button type="submit" loading={loading}>
            Buat Akun
          </Button>
        </div>
      </form>
    </Modal>
  );
}
