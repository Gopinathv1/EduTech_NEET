import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { composeNotificationSchema } from '@/lib/validation/notification';
import { audienceStudentWhere } from '@/lib/notifications/create';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/notifications — compose and send a bilingual broadcast to
// students (optionally scoped by class / district / board). Records the delivered
// count (matching students) for the history, and audits the send.
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = composeNotificationSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  const d = parsed.data;

  const studentWhere = audienceStudentWhere(d.audienceMode, d.audienceValue);
  const deliveredCount = await prisma.student.count({ where: studentWhere });

  const created = await prisma.notification.create({
    data: {
      type: d.type,
      targetAudience: 'STUDENTS',
      studentId: null,
      title: { en: d.titleEn, ta: d.titleTa },
      message: { en: d.messageEn, ta: d.messageTa },
      targetClass: d.audienceMode === 'CLASS' ? d.audienceValue : null,
      targetDistrict: d.audienceMode === 'DISTRICT' ? d.audienceValue : null,
      targetBoard: d.audienceMode === 'BOARD' ? d.audienceValue : null,
      linkUrl: d.linkUrl || null,
      deliveredCount,
      createdByName: admin.name,
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  await logAudit(admin, {
    action: 'notification.send',
    entityType: 'Notification',
    entityId: created.id,
    details: { type: d.type, audienceMode: d.audienceMode, audienceValue: d.audienceValue ?? null, deliveredCount },
  });

  return ok({ id: created.id, deliveredCount });
}
