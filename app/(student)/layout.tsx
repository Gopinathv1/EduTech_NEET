import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { getSettings } from '@/lib/settings/service';
import WhatsAppButton from '@/components/contact/WhatsAppButton';

/**
 * Wraps the whole student area. When maintenance mode is on (a super-admin
 * system setting), students see a maintenance screen; admins are unaffected so
 * they can keep working. The settings read is cached, so this adds no real cost.
 */
export default async function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  if (settings.maintenanceMode) {
    const session = await getSession();
    if (session?.kind !== 'admin') {
      const t = await getTranslations('errors.maintenance');
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4">
          <div className="max-w-md rounded-2xl border border-border bg-surfaceElevated p-8 text-center">
            <span className="text-4xl" aria-hidden="true">
              🛠️
            </span>
            <h1 className="mt-4 text-xl font-bold text-textPrimary">{t('title')}</h1>
            <p className="mt-2 text-sm text-textSecondary">{t('message')}</p>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  );
}
