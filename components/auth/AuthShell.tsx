import styles from '@/components/public/RouteExperience.module.css';
import { publicFont } from '@/lib/public/font';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import Logo from '@/components/public/Logo';

/**
 * Shared layout for the auth screens: brand header, language switcher, and a
 * centered card. Server component — receives the (client) form as children.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.auth} ${publicFont.className} public-site flex min-h-screen flex-col bg-[#f7f7f5] text-[#171717]`}>
      <header className="flex items-center justify-between border-b border-[#deded9] bg-[#f7f7f5] px-4 py-4 sm:px-8">
        <Logo className="text-[#171613]" size="default" />
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher variant="select" />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-5 py-16 sm:items-center">
        <div className="w-full max-w-md rounded-md border border-[#deded9] bg-white p-6 shadow-none sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
