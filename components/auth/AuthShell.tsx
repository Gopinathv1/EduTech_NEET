import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';

/**
 * Shared layout for the auth screens: brand header, language switcher, and a
 * centered card. Server component — receives the (client) form as children.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="text-lg font-bold text-brand">
          {t('brand')}
        </Link>
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
