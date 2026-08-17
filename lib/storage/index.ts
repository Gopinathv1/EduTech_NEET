import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Pluggable file storage. The app depends only on the `StorageProvider`
 * interface, so moving to S3-compatible cloud storage later means adding one
 * implementation + swapping the factory — no call sites change.
 *
 * - Development: `LocalStorageProvider` writes under `public/uploads/…` and
 *   returns a same-origin URL. (Not durable on serverless hosts — hence the
 *   interface for cloud storage in production.)
 */

export type StoragePutInput = {
  data: Buffer;
  contentType: string;
  ext: string; // without a leading dot, e.g. "png"
  keyPrefix?: string; // logical folder, e.g. "questions"
};

export type StoredObject = { url: string; key: string };

export interface StorageProvider {
  put(input: StoragePutInput): Promise<StoredObject>;
}

class LocalStorageProvider implements StorageProvider {
  async put({ data, ext, keyPrefix = 'questions' }: StoragePutInput): Promise<StoredObject> {
    const dir = path.join(process.cwd(), 'public', 'uploads', keyPrefix);
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), data);
    const key = `uploads/${keyPrefix}/${filename}`;
    return { url: `/${key}`, key };
  }
}

/**
 * S3-compatible object storage (AWS S3, Cloudflare R2, Supabase Storage, MinIO).
 * Selected with `STORAGE_DRIVER=s3`. Durable + shared across instances, so it is
 * the right choice for serverless/multi-instance production where local disk is
 * not. Objects are written under `<keyPrefix>/<uuid>.<ext>` and served via the
 * public/CDN base URL.
 *
 * Env:
 *   S3_BUCKET               (required) bucket name
 *   S3_REGION               (default "us-east-1")
 *   S3_ENDPOINT             (optional) custom endpoint for R2/MinIO/Supabase
 *   S3_ACCESS_KEY_ID        (optional) omit to use the host's IAM role
 *   S3_SECRET_ACCESS_KEY    (optional)
 *   S3_PUBLIC_URL           (optional) CDN / public base, e.g. https://cdn.example.com
 *   S3_FORCE_PATH_STYLE     (optional) "true" for MinIO / R2 / Supabase
 *   S3_OBJECT_ACL           (optional) e.g. "public-read" if the bucket uses ACLs
 */
class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error('S3_BUCKET is required when STORAGE_DRIVER=s3');
    this.bucket = bucket;

    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    this.client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      // If keys are omitted, the SDK falls back to the host's credential chain
      // (IAM role, env, shared config) — preferred on AWS.
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async put({ data, contentType, ext, keyPrefix = 'questions' }: StoragePutInput): Promise<StoredObject> {
    const key = `${keyPrefix}/${randomUUID()}.${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        ACL: (process.env.S3_OBJECT_ACL as 'public-read' | undefined) || undefined,
      }),
    );
    return { url: this.publicUrl(key), key };
  }

  private publicUrl(key: string): string {
    const base = process.env.S3_PUBLIC_URL;
    if (base) return `${base.replace(/\/$/, '')}/${key}`;
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;
  cached = process.env.STORAGE_DRIVER === 's3' ? new S3StorageProvider() : new LocalStorageProvider();
  return cached;
}

// Accepted image uploads for question images.
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Sniff an image's real type from its magic bytes, so a renamed/forged
 * `Content-Type` can't smuggle a non-image (or a mismatched type) past the
 * client-supplied MIME check. Returns the canonical MIME or null if it doesn't
 * match any allowed image signature.
 */
export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // GIF: "GIF8"
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  // WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}
