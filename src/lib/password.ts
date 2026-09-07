/**
 * Client-side password hashing for "confidential" documents (PBKDF2-SHA256,
 * per-document random salt, via the browser's native Web Crypto API).
 *
 * IMPORTANT — threat model: this is a soft, internal download gate, not a
 * defense against an authorized archive member. Row Level Security already
 * grants every active member full read access to document metadata (see
 * supabase-schema.sql), so the hash/salt are not secret from teammates —
 * this only stops a casual/accidental download of a marked-confidential
 * file without deliberately entering the shared password. It does not
 * encrypt the file itself and is not a substitute for RLS.
 */

const ITERATIONS = 100_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function deriveHash(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt);
  return { hash: bytesToHex(hash), salt: bytesToHex(salt) };
}

export async function verifyPassword(
  password: string,
  hash: string,
  saltHex: string,
): Promise<boolean> {
  const derived = await deriveHash(password, hexToBytes(saltHex));
  return bytesToHex(derived) === hash;
}
