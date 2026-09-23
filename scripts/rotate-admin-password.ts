/**
 * Rotates the password for one existing Admin account.
 *
 * This is intentionally narrow: it never creates accounts and updates only
 * passwordHash. Run it with a direct (non-pooled) DATABASE_URL, a normalised
 * target email, and a newly chosen password supplied through the environment.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';

const prisma = new PrismaClient();
const CONFIRMATION = 'RESET_EXISTING_ADMIN';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  if (required('ADMIN_PASSWORD_ROTATION_CONFIRM') !== CONFIRMATION) {
    throw new Error('Explicit password-rotation confirmation is required.');
  }

  const email = required('ADMIN_EMAIL').trim().toLowerCase();
  const password = required('ADMIN_PASSWORD');
  if (password.length < 8 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD must be between 8 and 72 characters.');
  }

  const databaseUrl = required('DATABASE_URL');
  const target = new URL(databaseUrl);
  if (target.hostname.includes('pooler')) {
    throw new Error('Use the direct, non-pooled DATABASE_URL for this controlled rotation.');
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!admin) throw new Error('Target Admin account was not found.');

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(password) },
  });

  console.log('Admin password rotation completed.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Admin password rotation failed.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
