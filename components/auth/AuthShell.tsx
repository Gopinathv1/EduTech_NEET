import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import Logo from '@/components/public/Logo';

/**
 * Shared layout for the auth screens: brand header, language switcher, and a
 * centered card. Server component — receives the (client) form as children.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  return (
    <div className="public-site flex min-h-screen flex-col bg-[#f5f1e9] text-[#171613]">
      <header className="flex items-center justify-between border-b border-[#d2c9bd] bg-[#f5f1e9] px-4 py-4 sm:px-8">
        <Logo className="text-[#171613]" size="default" />
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center">
        <div className="w-full max-w-md rounded-md border border-[#d2c9bd] bg-[#eee8df] p-6 shadow-none sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
