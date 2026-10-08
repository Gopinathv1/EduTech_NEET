import { prisma } from '@/lib/prisma';
import type { AdmissionsEnquiryInput } from '@/lib/validation/admissions-enquiry';

// Use the existing public enquiry inbox. No schema migration or outbound message.
export async function createAdmissionsEnquiry(input: AdmissionsEnquiryInput) {
  const { name, mobile, email, studyPath, destination, programme, contactPreference } = input;
  const message = ['Admissions counselling request', `Study path: ${studyPath}`, `Destination: ${destination || 'Undecided'}`, `Programme: ${programme || 'Undecided'}`, `Contact preference: ${contactPreference}`, 'Consent: agreed to contact about this enquiry'].join('\n');
  return prisma.$transaction(async (tx) => {
    // Advisory transaction lock also covers concurrent anonymous submissions.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`admissions:${mobile}:${email}`}))`;
    const existing = await tx.contactEnquiry.findFirst({ where: { mobile, email, message, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (existing) return { id: existing.id, duplicate: true };
    const created = await tx.contactEnquiry.create({ data: { name, mobile, email, message }, select: { id: true } });
    return { id: created.id, duplicate: false };
  });
}
