/**
 * Securely provision an admin / super-admin in ANY environment (esp.
 * production, where the dev seed's default passwords must never be used).
 *
 * Reads from env so no secret is passed on the command line / shell history:
 *   ADMIN_EMAIL      (required)
 *   ADMIN_PASSWORD   (required, min 8 chars)
 *   ADMIN_NAME       (default "Administrator")
 *   ADMIN_ROLE       "ADMIN" | "SUPER_ADMIN" (default "SUPER_ADMIN")
 *
 * Idempotent: upserts by email (resets the password + role on re-run).
 * Usage:
 *   ADMIN_EMAIL=you@org.in ADMIN_PASSWORD='a-strong-secret' \
 *   ADMIN_ROLE=SUPER_ADMIN npx tsx prisma/create-admin.ts
 */
import { PrismaClient, type AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';
  const role = (process.env.ADMIN_ROLE || 'SUPER_ADMIN') as AdminRole;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('ADMIN_ROLE must be ADMIN or SUPER_ADMIN.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, role, isActive: true, name },
    create: { email, passwordHash, role, isActive: true, name },
  });

  console.log(`✅  Admin ready: ${admin.email} (${admin.role}).`);
}

main()
  .catch((e) => {
    console.error('❌  create-admin failed:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
