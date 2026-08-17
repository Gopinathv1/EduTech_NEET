import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { getA11yPrefs } from '@/lib/a11y';
import StudentHeader from '@/components/student/StudentHeader';
import AccessibilitySettings from '@/components/a11y/AccessibilitySettings';

/**
 * Student settings page: accessibility (large font, high contrast) + display
 * language, all in one place. The header exposes the same controls as a quick
 * popover; this page is the discoverable, large-target version.
 */
export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login?next=/student/settings');

  const t = await getTranslations('a11y');
  const prefs = await getA11yPrefs();

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-textPrimary">{t('settingsTitle')}</h1>
        <p className="mt-1 text-sm text-textSecondary">{t('settingsSubtitle')}</p>
        <div className="mt-6">
          <AccessibilitySettings fontScale={prefs.fontScale} contrast={prefs.contrast} />
        </div>
      </main>
    </div>
  );
}
