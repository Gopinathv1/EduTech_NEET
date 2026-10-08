import { prisma } from '@/lib/prisma';
import type { AdmissionLeadInput } from '@/lib/validation/admission';

/**
 * Student-facing lead service: create a consultancy lead (with the CREATED event,
 * a COUNSELLING confirmation to the student and an in-app alert to all admins),
 * and read a student's current lead + status.
 */

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; code: 'leadExists' | 'invalidCountry' };

export async function createLead(
  studentId: string,
  input: AdmissionLeadInput,
): Promise<CreateLeadResult> {
  const now = new Date();
  return prisma.$transaction(async (tx): Promise<CreateLeadResult> => {
    // Serialize submissions for this student without changing records or schema.
    await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${studentId} FOR UPDATE`;
    const existing = await tx.admissionLead.findFirst({ where: { studentId }, select: { id: true } });
    if (existing) return { ok: false, code: 'leadExists' };
    const validIds = [...new Set(input.interestedCountryIds)];
    const countries = await tx.country.findMany({ where: { id: { in: validIds }, isActive: true }, select: { id: true } });
    if (!validIds.length || countries.length !== validIds.length) return { ok: false, code: 'invalidCountry' };
    const student = await tx.student.findUnique({ where: { id: studentId }, select: { name: true } });
    const studentName = student?.name ?? 'A student';
    const created = await tx.admissionLead.create({
      data: {
        studentId,
        neetScore: input.neetScore ?? null,
        marks: input.marks ?? null,
        category: input.category,
        budget: input.budget,
        interestedCountryId: validIds[0],
        interestedCountryIds: validIds,
        parentContact: input.parentContact,
        consentAt: now,
        status: 'NEW',
      },
      select: { id: true },
    });

    await tx.leadEvent.create({
      data: { leadId: created.id, type: 'CREATED', toStatus: 'NEW' },
    });

    // Confirmation to the student.
    await tx.notification.create({
      data: {
        studentId,
        type: 'COUNSELLING',
        targetAudience: 'STUDENTS',
        title: { en: 'Admission request received', ta: 'சேர்க்கை கோரிக்கை பெறப்பட்டது' },
        message: {
          en: 'Your admission-guidance request has been received. Track its progress in Admission Guidance.',
          ta: 'உங்கள் சேர்க்கை வழிகாட்டுதல் கோரிக்கை பெறப்பட்டது. சேர்க்கை வழிகாட்டுதல் பக்கத்தில் அதன் நிலையைப் பார்க்கலாம்.',
        },
        publishedAt: now,
      },
    });

    // In-app alert to all admins that a new lead arrived.
    await tx.notification.create({
      data: {
        studentId: null,
        type: 'COUNSELLING',
        targetAudience: 'ADMINS',
        title: { en: 'New admission lead', ta: 'New admission lead' },
        message: {
          en: `${studentName} submitted an admission-guidance request.`,
          ta: `${studentName} submitted an admission-guidance request.`,
        },
        publishedAt: now,
      },
    });

    return { ok: true, leadId: created.id };
  });
}

export type StudentLeadView = {
  id: string;
  status: string;
  createdAt: Date;
  neetScore: number | null;
  marks: number | null;
  category: string | null;
  budget: string | null;
  parentContact: string | null;
  countries: { id: string; name: unknown }[];
};

/** The student's current lead (latest), with interested-country names resolved. */
export async function getStudentLead(studentId: string): Promise<StudentLeadView | null> {
  const lead = await prisma.admissionLead.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      neetScore: true,
      marks: true,
      category: true,
      budget: true,
      parentContact: true,
      interestedCountryIds: true,
      interestedCountryId: true,
    },
  });
  if (!lead) return null;

  const ids = lead.interestedCountryIds.length
    ? lead.interestedCountryIds
    : lead.interestedCountryId
      ? [lead.interestedCountryId]
      : [];
  const countries = ids.length
    ? await prisma.country.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];

  return {
    id: lead.id,
    status: lead.status,
    createdAt: lead.createdAt,
    neetScore: lead.neetScore,
    marks: lead.marks,
    category: lead.category,
    budget: lead.budget,
    parentContact: lead.parentContact,
    countries,
  };
}
