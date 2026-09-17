import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function main() {
  const { finalizeExpiredAttempts } = await import('../lib/attempts/expiry');
  const { prisma } = await import('../lib/prisma');
  const once = process.argv.includes('--once');
  try {
    do {
      const count = await finalizeExpiredAttempts();
      if (count) console.info(`Finalized ${count} expired attempts.`);
      if (!once) await new Promise(resolve => setTimeout(resolve, 1000));
    } while (!once);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
