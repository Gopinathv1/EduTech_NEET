import { prisma } from '@/lib/prisma';
import type { SessionClaims } from '@/lib/auth/jwt';
import { logAudit } from '@/lib/audit';
import { localizedName } from '@/lib/admin/format';
import { budgetLabelEn, type LeadStatusCode } from '@/lib/admission/config';

/**
 * Admin-side lead pipeline operations. Each mutation appends a LeadEvent (the
 * drawer timeline) and — for status/assignment changes — an AuditLog entry.
 */

// English labels for the admin portal (English-only by design).
export const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  IN_PROGRESS: 'In progress',
  CONVERTED: 'Converted',
  CLOSED: 'Closed',
};

export const LEAD_STATUS_BADGE: Record<string, string> = {
  NEW: 'blue',
  CONTACTED: 'amber',
  IN_PROGRESS: 'amber',
  CONVERTED: 'green',
  CLOSED: 'slate',
};

export const budgetLabel = budgetLabelEn;

/** Change a lead's status, logging the transition to its timeline + the audit log. */
export async function changeLeadStatus(
  admin: SessionClaims,
  leadId: string,
  status: LeadStatusCode,
  note?: string,
): Promise<{ ok: boolean; code?: 'notFound' }> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (!lead) return { ok: false, code: 'notFound' };
  if (lead.status === status && !note) return { ok: true };

  await prisma.$transaction([
    prisma.admissionLead.update({ where: { id: leadId }, data: { status } }),
    prisma.leadEvent.create({
      data: {
        leadId,
        adminId: admin.sub,
        adminName: admin.name,
        type: 'STATUS_CHANGE',
        fromStatus: lead.status,
        toStatus: status,
        note: note?.trim() || null,
      },
    }),
  ]);

  await logAudit(admin, {
    action: 'lead.statusChange',
    entityType: 'AdmissionLead',
    entityId: leadId,
    details: { from: lead.status, to: status },
  });
  return { ok: true };
}

/** Assign (or unassign) a lead to an admin. */
export async function assignLead(
  admin: SessionClaims,
  leadId: string,
  assignedToId: string | null,
): Promise<{ ok: boolean; code?: 'notFound' | 'invalidAssignee' }> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return { ok: false, code: 'notFound' };

  let assigneeName = 'Unassigned';
  if (assignedToId) {
    const assignee = await prisma.admin.findUnique({ where: { id: assignedToId }, select: { name: true } });
    if (!assignee) return { ok: false, code: 'invalidAssignee' };
    assigneeName = assignee.name;
  }

  await prisma.$transaction([
    prisma.admissionLead.update({ where: { id: leadId }, data: { assignedToId } }),
    prisma.leadEvent.create({
      data: {
        leadId,
        adminId: admin.sub,
        adminName: admin.name,
        type: 'ASSIGNMENT',
        note: `Assigned to ${assigneeName}`,
      },
    }),
  ]);

  await logAudit(admin, {
    action: 'lead.assign',
    entityType: 'AdmissionLead',
    entityId: leadId,
    details: { assignedToId },
  });
  return { ok: true };
}

/** Append a free-text follow-up note to the lead timeline. */
export async function addLeadNote(
  admin: SessionClaims,
  leadId: string,
  note: string,
): Promise<{ ok: boolean; code?: 'notFound' }> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return { ok: false, code: 'notFound' };

  await prisma.leadEvent.create({
    data: { leadId, adminId: admin.sub, adminName: admin.name, type: 'NOTE', note: note.trim() },
  });
  await logAudit(admin, { action: 'lead.note', entityType: 'AdmissionLead', entityId: leadId });
  return { ok: true };
}

/** Full detail for the admin lead drawer: profile, performance, form data, timeline. */
export async function buildLeadDetail(leadId: string) {
  const lead = await prisma.admissionLead.findUnique({
    where: { id: leadId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          district: true,
          state: true,
          schoolName: true,
          board: true,
          class: true,
        },
      },
      interestedCountry: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!lead) return null;

  // Test-performance summary.
  const [attemptCount, best] = await Promise.all([
    prisma.testAttempt.count({
      where: { studentId: lead.studentId, status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } },
    }),
    prisma.result.findFirst({
      where: { attempt: { studentId: lead.studentId } },
      orderBy: { score: 'desc' },
      select: { score: true, totalQuestions: true },
    }),
  ]);

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
    createdAt: lead.createdAt.toISOString(),
    neetScore: lead.neetScore,
    marks: lead.marks,
    category: lead.category,
    budget: lead.budget,
    parentContact: lead.parentContact,
    consentAt: lead.consentAt ? lead.consentAt.toISOString() : null,
    assignedTo: lead.assignedTo,
    student: lead.student,
    countries: countries.map((c) => ({ id: c.id, name: localizedName(c.name, 'en') })),
    performance: {
      attempts: attemptCount,
      bestScore: best?.score ?? null,
      bestMax: best ? best.totalQuestions * 4 : null,
    },
    events: lead.events.map((e) => ({
      id: e.id,
      type: e.type,
      note: e.note,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      adminName: e.adminName,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof buildLeadDetail>>>;
