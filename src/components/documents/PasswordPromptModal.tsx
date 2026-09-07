"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Lock } from "lucide-react";
import { useState } from "react";

export function PasswordPromptModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [password, setPassword] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dokumen Rahasia"
      description="Masukkan password untuk mengunduh dokumen ini."
      widthClass="max-w-sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(password);
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="Password"
          type="password"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-medium text-muted hover:bg-surface"
          >
            Batal
          </button>
          <Button type="submit" loading={loading} disabled={!password}>
            Buka Dokumen
          </Button>
        </div>
      </form>
    </Modal>
  );
}
