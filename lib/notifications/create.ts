import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { AudienceMode } from './types';

/**
 * Helpers that create notifications: the automatic system messages (result ready,
 * new test published) and the audience helper the admin broadcast uses to scope
 * delivery. Payment-confirmation notifications are created in the payment service.
 */

/** Student where-clause for a broadcast audience (used for delivery counting). */
export function audienceStudentWhere(mode: AudienceMode, value?: string | null): Prisma.StudentWhereInput {
  switch (mode) {
    case 'CLASS':
      return value ? { class: value } : {};
    case 'DISTRICT':
      return value ? { district: value } : {};
    case 'BOARD':
      return value ? { board: value } : {};
    case 'ALL':
    default:
      return {};
  }
}

/**
 * Build the Prisma data for a per-student RESULT notification. Pure so it can be
 * created inside the finalize transaction (pass the tx client at the call site).
 */
export function buildResultNotificationData(input: {
  studentId: string;
  attemptId: string;
  title: unknown; // { en, ta } Json from Test.title
}): Prisma.NotificationCreateInput {
  const titleEn = localizedName(input.title, 'en') || 'your test';
  const titleTa = localizedName(input.title, 'ta') || titleEn;
  return {
    student: { connect: { id: input.studentId } },
    type: 'RESULT',
    targetAudience: 'STUDENTS',
    title: { en: 'Result ready', ta: 'முடிவு தயார்' },
    message: {
      en: `Your result for "${titleEn}" is ready. Tap to view your score and analysis.`,
      ta: `"${titleTa}" தேர்வின் முடிவு தயார். உங்கள் மதிப்பெண் மற்றும் பகுப்பாய்வைப் பார்க்க தட்டவும்.`,
    },
    linkUrl: `/student/results/${input.attemptId}`,
    publishedAt: new Date(),
  };
}

/**
 * Broadcast a NEW_MOCK_TEST notification to all students when a test is first
 * published. Records the delivered count (current student population).
 */
export async function notifyNewTestPublished(input: { testId: string; title: unknown }): Promise<void> {
  const titleEn = localizedName(input.title, 'en') || 'A new mock test';
  const titleTa = localizedName(input.title, 'ta') || titleEn;
  const deliveredCount = await prisma.student.count();

  await prisma.notification.create({
    data: {
      type: 'NEW_MOCK_TEST',
      targetAudience: 'STUDENTS',
      studentId: null,
      title: { en: 'New mock test available', ta: 'புதிய மாதிரித் தேர்வு கிடைக்கிறது' },
      message: {
        en: `"${titleEn}" is now available. Practise for just ₹30.`,
        ta: `"${titleTa}" இப்போது கிடைக்கிறது. ₹30க்கு பயிற்சி செய்யுங்கள்.`,
      },
      linkUrl: `/student/tests/${input.testId}`,
      deliveredCount,
      publishedAt: new Date(),
    },
  });
}
