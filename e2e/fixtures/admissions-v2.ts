import type { PrismaClient } from '@prisma/client';
import { ADMISSION_COUNTRY_PROFILES } from '../../lib/data/admissions/countries';

/** Synthetic fixtures for the dedicated local Admissions browser-test database only. */
export async function seedAdmissionsFixtures(db: PrismaClient) {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (url.hostname !== '127.0.0.1' || url.port !== '55441' || url.pathname !== '/admissions_v2_isolated') throw new Error('Isolated Admissions database required');
  for (const country of ADMISSION_COUNTRY_PROFILES) await db.country.upsert({ where: { code: country.countryCode }, create: { id: `admissions-country-${country.slug}`, code: country.countryCode, name: { en: country.name, ta: country.name } }, update: {} });
  for (const [id, isActive] of [['admissions-admin', true], ['admissions-disabled-admin', false]] as const) await db.admin.upsert({ where: { id }, create: { id, name: id, email: `${id}@example.invalid`, passwordHash: 'test-fixture-no-login', isActive }, update: {} });
}
