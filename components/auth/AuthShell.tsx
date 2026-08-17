import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import VVOverseasLogo from '@/components/brand/VVOverseasLogo';

/**
 * Shared layout for the auth screens: brand header, language switcher, and a
 * centered card. Server component — receives the (client) form as children.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-4 sm:px-8">
        <VVOverseasLogo label={t('brand')} />
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-black/30 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
