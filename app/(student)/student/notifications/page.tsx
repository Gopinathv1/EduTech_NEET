import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { getStudentAudience, getNotificationsForStudent } from '@/lib/notifications/query';
import StudentHeader from '@/components/student/StudentHeader';
import NotificationsClient from '@/components/student/notifications/NotificationsClient';
import type { SerializedNotification } from '@/components/student/notifications/NotificationBell';

/** Full notification history with type filters + mark-all-read. Bilingual. */
export default async function NotificationsPage() {
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('notifications');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login?next=/student/notifications');

  const audience = await getStudentAudience(session.sub);
  const rows = audience ? await getNotificationsForStudent(audience, locale, { take: 100 }) : [];
  const items: SerializedNotification[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    linkUrl: n.linkUrl,
    createdAt: n.createdAt.toISOString(),
    read: n.read,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
        <div className="mt-6">
          <NotificationsClient key={locale} initialItems={items} />
        </div>
      </main>
    </div>
  );
}
