"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#666560"];

export function NewFolderModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setColor(COLORS[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("folders").insert({
      name: name.trim(),
      description: description.trim() || null,
      color,
      created_by: user?.id,
    });
    setLoading(false);
    if (error) {
      push("error", "Gagal membuat folder.");
      return;
    }
    push("success", "Folder berhasil dibuat.");
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
      title="Folder Baru"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nama Folder"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="mis. Legal & Kontrak"
          required
          autoFocus
        />
        <Input
          label="Deskripsi (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Keterangan singkat isi folder"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-dark">Warna</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`size-7 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-offset-2 ring-accent-600 scale-105" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
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
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Buat Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
}
