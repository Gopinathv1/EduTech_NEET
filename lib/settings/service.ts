import { unstable_cache, revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import type { SessionClaims } from '@/lib/auth/jwt';
import { DEFAULT_SETTINGS, type AppSettings, type SettingsUpdate } from './config';

/**
 * Server access to application settings. Reads are cached (short TTL + tag) so the
 * settings can be consulted on hot paths (result banner, maintenance gate) without
 * a query per request; writes upsert the changed keys, audit, and bust the cache.
 */

const SETTINGS_TAG = 'app-settings';

const load = unstable_cache(
  async (): Promise<AppSettings> => {
    const rows = await prisma.appSetting.findMany();
    const merged: AppSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key in merged) {
        (merged as Record<string, unknown>)[row.key] = row.value as unknown;
      }
    }
    return merged;
  },
  ['app-settings'],
  { revalidate: 60, tags: [SETTINGS_TAG] },
);

export async function getSettings(): Promise<AppSettings> {
  return load();
}

/** Persist changed settings, audit the change, and invalidate the cache. */
export async function updateSettings(patch: SettingsUpdate, admin: SessionClaims): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      }),
    ),
  );

  revalidateTag(SETTINGS_TAG);
  await logAudit(admin, {
    action: 'settings.update',
    entityType: 'AppSetting',
    entityId: null,
    details: patch as Prisma.InputJsonValue,
  });
}
