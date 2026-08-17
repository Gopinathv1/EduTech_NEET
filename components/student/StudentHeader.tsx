import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { getStudentAudience, getUnreadCount, getNotificationsForStudent } from '@/lib/notifications/query';
import { getA11yPrefs } from '@/lib/a11y';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import LogoutButton from '@/components/auth/LogoutButton';
import NotificationBell, { type SerializedNotification } from '@/components/student/notifications/NotificationBell';

/** Shared header for student pages: brand, nav, notification bell, language, logout. */
export default async function StudentHeader() {
  const t = await getTranslations('nav');
  const locale = (await getLocale()) as ExamLanguage;
  const session = await getSession();
  const a11y = await getA11yPrefs();

  let unread = 0;
  let items: SerializedNotification[] = [];
  if (session?.kind === 'student') {
    const audience = await getStudentAudience(session.sub);
    if (audience) {
      const [count, recent] = await Promise.all([
        getUnreadCount(audience),
        getNotificationsForStudent(audience, locale, { take: 10 }),
      ]);
      unread = count;
      items = recent.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        linkUrl: n.linkUrl,
        createdAt: n.createdAt.toISOString(),
        read: n.read,
      }));
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surfaceElevated">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/student" className="text-lg font-bold text-brand">
            {t('brand')}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/student" className="font-medium text-textSecondary hover:text-brand">
              {t('dashboard')}
            </Link>
            <Link href="/student/tests" className="font-medium text-textSecondary hover:text-brand">
              {t('tests')}
            </Link>
            <Link href="/student/performance" className="font-medium text-textSecondary hover:text-brand">
              {t('performance')}
            </Link>
            <Link href="/student/admission-guidance" className="font-medium text-textSecondary hover:text-brand">
              {t('admission')}
            </Link>
            <Link href="/student/payments" className="font-medium text-textSecondary hover:text-brand">
              {t('payments')}
            </Link>
            <Link href="/help" className="font-medium text-textSecondary hover:text-brand">
              {t('help')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell key={locale} initialUnread={unread} items={items} />
          <AccessibilityMenu fontScale={a11y.fontScale} contrast={a11y.contrast} />
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
