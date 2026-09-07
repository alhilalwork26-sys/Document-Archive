"use client";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENTS_BUCKET } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { FileText, Loader2, Lock, Plus, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function UploadModal({
  open,
  onClose,
  folderId,
  folders,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  folderId?: string;
  folders?: Folder[];
  onUploaded?: () => void;
}) {
  const { push } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [extraCategories, setExtraCategories] = useState<Folder[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [password, setPassword] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCategories = [...(folders ?? []), ...extraCategories];

  function reset() {
    setFile(null);
    setName("");
    setDescription("");
    setCategoryId("");
    setExtraCategories([]);
    setAddingCategory(false);
    setNewCategoryName("");
    setConfidential(false);
    setPassword("");
    setDragActive(false);
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    if (!name) setName(stripExtension(f.name));
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: trimmed, created_by: user?.id })
      .select()
      .single();
    if (error || !data) {
      push("error", "Gagal membuat kategori baru.");
      return;
    }
    setExtraCategories((c) => [...c, data as Folder]);
    setCategoryId(data.id as string);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    if (confidential && !password) {
      push("error", "Isi password untuk dokumen rahasia.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      push("error", "Sesi berakhir, silakan masuk kembali.");
      setUploading(false);
      return;
    }

    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      push("error", "Gagal mengunggah file.");
      setUploading(false);
      return;
    }

    let password_hash: string | undefined;
    let password_salt: string | undefined;
    if (confidential && password) {
      const hashed = await hashPassword(password);
      password_hash = hashed.hash;
      password_salt = hashed.salt;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      folder_id: folderId || categoryId || null,
      name: name.trim(),
      description: description.trim() || null,
      storage_path: path,
      size_bytes: file.size,
      mime_type: file.type || "application/octet-stream",
      uploaded_by: user.id,
      is_confidential: confidential,
      password_hash,
      password_salt,
    });

    setUploading(false);

    if (insertError) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
      push("error", "Gagal menyimpan dokumen.");
      return;
    }

    push("success", "Dokumen berhasil diunggah.");
    onUploaded?.();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!uploading) {
          reset();
          onClose();
        }
      }}
      title="Upload Dokumen"
      widthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{file.name}</p>
                  <p className="text-xs text-muted">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted hover:text-dark rounded-md p-1.5 hover:bg-surface transition-colors"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
                  dragActive
                    ? "border-accent-600 bg-accent-50"
                    : "border-border hover:border-accent-200 hover:bg-surface/60"
                }`}
              >
                <motion.div animate={{ y: dragActive ? -3 : 0 }}>
                  <UploadCloud className="size-6 text-muted" />
                </motion.div>
                <p className="text-sm font-medium text-dark">Klik untuk pilih file</p>
                <p className="text-xs text-muted">Semua format didukung · Maks 50MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          custom={1}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5"
        >
          <label className="text-sm font-medium text-dark">
            Nama Dokumen <span className="text-danger">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama dokumen…"
            required
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-dark outline-none transition-shadow focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600"
          />
        </motion.div>

        {!folderId && (
          <motion.div
            custom={2}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5"
          >
            <label className="text-sm font-medium text-dark">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <motion.button
                  type="button"
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                  className={`px-3 h-8 rounded-full text-sm font-medium border transition-colors ${
                    categoryId === cat.id
                      ? "border-accent-600 text-accent-700 bg-accent-50"
                      : "border-border text-muted hover:bg-surface"
                  }`}
                >
                  {cat.name}
                </motion.button>
              ))}

              <AnimatePresence mode="wait" initial={false}>
                {addingCategory ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-1 overflow-hidden"
                  >
                    <input
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                        if (e.key === "Escape") setAddingCategory(false);
                      }}
                      placeholder="Nama kategori baru…"
                      className="h-8 rounded-full border border-accent-600 bg-white px-3 text-sm outline-none w-40"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="text-accent-600 text-sm font-medium px-2 whitespace-nowrap"
                    >
                      Tambah
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add"
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setAddingCategory(true)}
                    className="flex items-center gap-1 px-3 h-8 rounded-full text-sm font-medium border border-dashed border-border text-muted hover:bg-surface hover:text-dark transition-colors"
                  >
                    <Plus className="size-3.5" /> Kategori Baru
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Pilih kategori yang sudah ada, atau buat sendiri (mis. SK, Kontrak, Legal).
            </p>
          </motion.div>
        )}

        <motion.div
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5"
        >
          <label className="text-sm font-medium text-dark">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat…"
            rows={3}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark outline-none transition-shadow focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600 resize-y"
          />
        </motion.div>

        <motion.div
          custom={4}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border bg-white px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
              <Lock className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark">Dokumen Rahasia</p>
              <p className="text-xs text-muted">Dilindungi password saat diunduh</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={confidential}
              onClick={() => setConfidential((c) => !c)}
              className={`relative w-10 h-6 rounded-full shrink-0 transition-colors duration-200 ${
                confidential ? "bg-accent-600" : "bg-border"
              }`}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute top-0.5 size-5 rounded-full bg-white shadow"
                style={{ left: confidential ? 18 : 2 }}
              />
            </button>
          </div>
          <AnimatePresence>
            {confidential && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat password untuk dokumen ini…"
                  required
                  className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          custom={5}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: uploading ? 1 : 1.01 }}
          whileTap={{ scale: uploading ? 1 : 0.98 }}
          type="submit"
          disabled={uploading || !file || !name.trim()}
          className="h-11 rounded-lg text-sm font-semibold bg-accent-600 text-white shadow-sm shadow-accent-600/20 hover:bg-accent-700 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2 transition-colors"
        >
          {uploading && <Loader2 className="size-4 animate-spin" />}
          Upload Dokumen
        </motion.button>
      </form>
    </Modal>
  );
}
