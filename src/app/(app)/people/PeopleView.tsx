"use client";

import { AddUserModal } from "@/components/people/AddUserModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import type { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PeopleView({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function toggleActive(profile: Profile) {
    setBusyId(profile.id);
    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !profile.is_active }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      push("error", data.error || "Gagal memperbarui status.");
      return;
    }
    push("success", profile.is_active ? "Akun dinonaktifkan." : "Akun diaktifkan.");
    refresh();
  }

  async function handleDelete(profile: Profile) {
    if (
      !confirm(
        `Hapus akun ${profile.full_name || profile.email}? Tindakan ini permanen.`,
      )
    )
      return;
    setBusyId(profile.id);
    const res = await fetch(`/api/admin/users/${profile.id}`, { method: "DELETE" });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      push("error", data.error || "Gagal menghapus akun.");
      return;
    }
    push("success", "Akun dihapus.");
    refresh();
  }

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akun Admin & Pengguna ArsipOne GRCC"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" /> Tambah Pengguna
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="font-medium px-4 py-2.5">Nama</th>
              <th className="font-medium px-4 py-2.5">Email</th>
              <th className="font-medium px-4 py-2.5">Role</th>
              <th className="font-medium px-4 py-2.5">Status</th>
              <th className="font-medium px-4 py-2.5">Bergabung</th>
              <th className="font-medium px-4 py-2.5 w-32" />
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: busyId === p.id ? 0.5 : 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-dark">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.full_name || p.email} />
                    <span>
                      {p.full_name || "—"}
                      {p.id === currentUserId && (
                        <span className="text-xs text-muted font-normal"> (Anda)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.role === "admin" ? "accent" : "neutral"}>
                    {p.role === "admin" ? "Administrator" : "Pengguna"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.is_active ? "success" : "danger"}>
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {formatDate(p.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={busyId === p.id || p.id === currentUserId}
                      className="text-xs font-medium text-muted hover:text-dark disabled:opacity-40 px-2 py-1 rounded-md hover:bg-surface"
                    >
                      {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={busyId === p.id || p.id === currentUserId}
                      className="text-muted hover:text-danger disabled:opacity-40 p-1.5 rounded-md hover:bg-surface"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refresh} />
    </>
  );
}
