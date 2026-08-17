/**
 * PRODUCTION-SAFE reference seed.
 *
 * Unlike `seed.ts` (dev), this script:
 *   - is idempotent via UPSERT and DELETES NOTHING (safe to run on a live DB),
 *   - seeds ONLY reference data: the 4 subjects, their chapters (with
 *     weightage), and the 6 admission countries,
 *   - creates NO admins (never ship the default `SuperAdmin@123` password to
 *     production — provision the super admin separately, see DEPLOYMENT.md),
 *   - creates NO questions or tests (real content is added via the admin
 *     bulk-import / test builder).
 *
 * Run once after the first `prisma migrate deploy`:  npm run db:seed:reference
 */
import { PrismaClient } from '@prisma/client';
import { CHAPTERS, SUBJECTS, COUNTRIES } from './reference-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference data (idempotent, non-destructive)…');

  for (const s of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, order: s.order },
      create: { code: s.code, name: s.name, order: s.order },
    });

    const chapters = CHAPTERS[s.code] ?? {};
    for (const ch of Object.values(chapters)) {
      const nameEn = ch.name.en;
      // Chapters have no natural unique key beyond (subjectId, name.en); find by
      // that pair so re-runs update rather than duplicate.
      const existing = await prisma.chapter.findFirst({
        where: { subjectId: subject.id, name: { path: ['en'], equals: nameEn } },
        select: { id: true },
      });
      if (existing) {
        await prisma.chapter.update({
          where: { id: existing.id },
          data: { name: ch.name, class: ch.class, weightage: ch.weightage },
        });
      } else {
        await prisma.chapter.create({
          data: { subjectId: subject.id, name: ch.name, class: ch.class, weightage: ch.weightage },
        });
      }
    }
  }
  console.log(`  ✓ ${SUBJECTS.length} subjects + chapters`);

  for (const c of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.description, order: c.order },
      create: { code: c.code, name: c.name, description: c.description, order: c.order },
    });
  }
  console.log(`  ✓ ${COUNTRIES.length} countries`);

  console.log('✅  Reference seed complete. Provision the super admin separately (see DEPLOYMENT.md).');
}

main()
  .catch((e) => {
    console.error('❌  Reference seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
