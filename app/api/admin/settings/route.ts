import { getSuperAdminSession } from '@/lib/auth/admin';
import { settingsUpdateSchema } from '@/lib/settings/config';
import { updateSettings } from '@/lib/settings/service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/settings — update system configuration (super admin only).
export async function POST(req: Request) {
  const admin = await getSuperAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = settingsUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });

  await updateSettings(parsed.data, admin);
  return ok();
}
