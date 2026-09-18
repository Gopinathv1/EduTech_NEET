import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/auth/ProfileForm';
import StudentHeader from '@/components/student/StudentHeader';
import type { Locale } from '@/i18n/config';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login');

  const student = await prisma.student.findUnique({ where: { id: session.sub } });
  if (!student) redirect('/login');

  const t = await getTranslations('auth.profile');
  const ta11y = await getTranslations('a11y');

  const initial = {
    name: student.name,
    schoolName: student.schoolName ?? '',
    class: student.class ?? '12',
    board: student.board ?? 'State Board',
    preferredLanguage: (student.preferredLanguage as Locale) ?? 'en',
  };

  return (
    <>
      <StudentHeader />
      <main className="student-profile-shell">
        <div className="student-profile-card space-y-5">
        <div>
          <p className="student-eyebrow">STUDENT PROFILE</p>
          <h1 className="mt-3 text-3xl font-semibold text-textPrimary">{t('title')}</h1>
          <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>
        </div>
        <ProfileForm initial={initial} />
        <p className="text-center text-sm">
          <Link
            href="/student/settings"
            className="font-medium text-brand hover:text-red-200"
          >
            {ta11y('settingsTitle')}
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link
            href="/student"
            className="font-medium text-textSecondary hover:text-textSecondary"
          >
            {t('backToDashboard')}
          </Link>
        </p>
        </div>
      </main>
    </>
  );
}
