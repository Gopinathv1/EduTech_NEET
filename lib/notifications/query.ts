import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { ExamLanguage } from '@/lib/attempts/examState';

/**
 * Server-side notification reads for a student: which notifications are visible to
 * them (per-student messages + matching broadcasts), the unread count (one cheap
 * indexed query, safe to run on every page), the recent list, and mark-read.
 */

export type StudentAudience = {
  id: string;
  class: string | null;
  district: string | null;
  board: string | null;
};

/**
 * Prisma where-clause for notifications visible to a student: those addressed to
 * them directly, plus published STUDENTS/ALL broadcasts whose optional
 * class/district/board sub-filters match (a null sub-filter matches everyone).
 */
export function visibleToStudentWhere(student: StudentAudience): Prisma.NotificationWhereInput {
  return {
    isPublished: true,
    OR: [
      { studentId: student.id },
      {
        studentId: null,
        targetAudience: { in: ['ALL', 'STUDENTS'] },
        AND: [
          { OR: [{ targetClass: null }, { targetClass: student.class }] },
          { OR: [{ targetDistrict: null }, { targetDistrict: student.district }] },
          { OR: [{ targetBoard: null }, { targetBoard: student.board }] },
        ],
      },
    ],
  };
}

/** Count unread visible notifications. Single indexed query — cheap per page. */
export async function getUnreadCount(student: StudentAudience): Promise<number> {
  return prisma.notification.count({
    where: { ...visibleToStudentWhere(student), reads: { none: { studentId: student.id } } },
  });
}

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  createdAt: Date;
  read: boolean;
};

function toView(
  n: {
    id: string;
    type: string;
    title: unknown;
    message: unknown;
    linkUrl: string | null;
    createdAt: Date;
    reads: { id: string }[];
  },
  locale: ExamLanguage,
): NotificationView {
  return {
    id: n.id,
    type: n.type,
    title: localizedName(n.title, locale) || localizedName(n.title, 'en'),
    message: localizedName(n.message, locale) || localizedName(n.message, 'en'),
    linkUrl: n.linkUrl,
    createdAt: n.createdAt,
    read: n.reads.length > 0,
  };
}

/** Recent visible notifications with a per-student read flag, optionally by type. */
export async function getNotificationsForStudent(
  student: StudentAudience,
  locale: ExamLanguage,
  opts: { take?: number; type?: string } = {},
): Promise<NotificationView[]> {
  const where = visibleToStudentWhere(student);
  if (opts.type) where.type = opts.type as Prisma.NotificationWhereInput['type'];

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts.take ?? 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      linkUrl: true,
      createdAt: true,
      reads: { where: { studentId: student.id }, select: { id: true } },
    },
  });
  return rows.map((n) => toView(n, locale));
}

/** Mark one notification read (only if it is visible to this student). */
export async function markRead(student: StudentAudience, notificationId: string): Promise<boolean> {
  const visible = await prisma.notification.findFirst({
    where: { id: notificationId, ...visibleToStudentWhere(student) },
    select: { id: true },
  });
  if (!visible) return false;
  await prisma.notificationRead.upsert({
    where: { notificationId_studentId: { notificationId, studentId: student.id } },
    create: { notificationId, studentId: student.id },
    update: {},
  });
  return true;
}

/** Mark every currently-visible unread notification as read. Returns the count. */
export async function markAllRead(student: StudentAudience): Promise<number> {
  const unread = await prisma.notification.findMany({
    where: { ...visibleToStudentWhere(student), reads: { none: { studentId: student.id } } },
    select: { id: true },
  });
  if (unread.length === 0) return 0;
  const res = await prisma.notificationRead.createMany({
    data: unread.map((n) => ({ notificationId: n.id, studentId: student.id })),
    skipDuplicates: true,
  });
  return res.count;
}

/** Load the student's audience fields (class/district/board) for targeting. */
export async function getStudentAudience(studentId: string): Promise<StudentAudience | null> {
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, class: true, district: true, board: true },
  });
  return s;
}
