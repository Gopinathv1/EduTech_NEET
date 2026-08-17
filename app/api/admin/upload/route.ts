import { getAdminSession } from '@/lib/auth/admin';
import { getStorage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, sniffImageMime } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/upload — multipart image upload for question images.
// Returns { url } which the question form stores as imageUrl.
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail('invalidUpload', 400);

  const file = form.get('file');
  if (!(file instanceof File)) return fail('noFile', 400);

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return fail('invalidType', 415);
  if (file.size > MAX_IMAGE_BYTES) return fail('tooLarge', 413);

  const buffer = Buffer.from(await file.arrayBuffer());

  // Defence-in-depth: the declared Content-Type must match the file's actual
  // magic bytes, so a forged header can't smuggle a non-image onto disk/CDN.
  const sniffed = sniffImageMime(buffer);
  if (!sniffed || sniffed !== file.type) return fail('invalidType', 415);

  const { url } = await getStorage().put({
    data: buffer,
    contentType: file.type,
    ext,
    keyPrefix: 'questions',
  });

  await logAudit(admin, {
    action: 'image.upload',
    entityType: 'Question',
    entityId: null,
    details: { url, size: file.size, type: file.type },
  });

  return ok({ url });
}
