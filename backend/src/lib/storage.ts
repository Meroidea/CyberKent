import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env";

/**
 * Object storage for evidence (FR31, Rule 6.5).
 *
 * Every object is encrypted here, before it leaves the process, with
 * AES-256-GCM under a key only the API holds. The store therefore only ever
 * sees ciphertext: a leaked store URL, a misconfigured bucket or a stolen
 * backup yields nothing readable. The tag authenticates the bytes, so a file
 * altered at rest fails to decrypt rather than being served.
 *
 * Two backends, one interface:
 *
 * - **Vercel Blob**, private, when `BLOB_READ_WRITE_TOKEN` is set — the
 *   production store.
 * - **Local disk**, under `backend/.storage`, in development only.
 *
 * In production with no Blob token, uploads are switched off and the API says
 * so, rather than writing evidence to a serverless function's ephemeral disk
 * where it would silently vanish.
 */

const FORMAT = Buffer.from("CKE1"); // magic + version, so the format can change

function key(): Buffer {
  const configured = process.env.EVIDENCE_ENCRYPTION_KEY;
  if (configured) {
    const raw = Buffer.from(configured, "base64");
    if (raw.length !== 32) throw new Error("EVIDENCE_ENCRYPTION_KEY must be 32 bytes, base64-encoded.");
    return raw;
  }
  /* Derived, so a deployment works without one more secret; setting a
     dedicated key lets the signing secret rotate without orphaning files. */
  return Buffer.from(crypto.hkdfSync("sha256", env.JWT_SECRET, "cyberkent", "evidence-encryption-v1", 32));
}

export function encrypt(plain: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([FORMAT, iv, cipher.getAuthTag(), body]);
}

export function decrypt(sealed: Buffer): Buffer {
  if (!sealed.subarray(0, 4).equals(FORMAT)) throw new Error("Not an evidence object.");
  const iv = sealed.subarray(4, 16);
  const tag = sealed.subarray(16, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(sealed.subarray(32)), decipher.final()]);
}

interface Backend {
  put(name: string, bytes: Buffer): Promise<void>;
  get(name: string): Promise<Buffer | null>;
}

const LOCAL_ROOT = path.resolve(process.cwd(), ".storage");

const localBackend: Backend = {
  async put(name, bytes) {
    const file = path.join(LOCAL_ROOT, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  },
  async get(name) {
    try {
      return await fs.readFile(path.join(LOCAL_ROOT, name));
    } catch {
      return null;
    }
  },
};

const blobBackend: Backend = {
  async put(name, bytes) {
    const { put } = await import("@vercel/blob");
    await put(name, bytes, { access: "private", contentType: "application/octet-stream", addRandomSuffix: false, allowOverwrite: false });
  },
  async get(name) {
    const { get } = await import("@vercel/blob");
    const result = await get(name, { access: "private", useCache: false });
    if (!result || !result.stream) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  },
};

function backend(): Backend | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobBackend;
  return env.isProduction ? null : localBackend;
}

export const storage = {
  /** Whether evidence can be accepted at all on this deployment. */
  available(): boolean {
    return backend() !== null;
  },

  async put(name: string, plain: Buffer): Promise<void> {
    const target = backend();
    if (!target) throw new Error("No evidence store is configured.");
    await target.put(name, encrypt(plain));
  },

  async get(name: string): Promise<Buffer | null> {
    const target = backend();
    if (!target) return null;
    const sealed = await target.get(name);
    return sealed ? decrypt(sealed) : null;
  },
};
