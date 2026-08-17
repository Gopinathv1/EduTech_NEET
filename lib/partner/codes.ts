import { prisma } from '@/lib/prisma';

const PREFIX = 'VVP';

export async function nextPartnerCode(): Promise<string> {
  const latest = await prisma.agency.findFirst({
    where: { partnerCode: { startsWith: `${PREFIX}-` } },
    orderBy: { partnerCode: 'desc' },
    select: { partnerCode: true },
  });
  const last = latest?.partnerCode.match(/^VVP-(\d{6})$/)?.[1];
  const next = last ? Number(last) + 1 : 1;
  return `${PREFIX}-${String(next).padStart(6, '0')}`;
}
