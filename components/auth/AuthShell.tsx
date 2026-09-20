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
    <div className={`${styles.auth} ${publicFont.className} public-site flex min-h-screen flex-col bg-[#f5f7fa] text-[#10151c]`}>
      <header className="flex items-center justify-between border-b border-[#d9dee5] bg-[#f5f7fa] px-4 py-4 sm:px-8">
        <Logo className="text-[#171613]" size="default" />
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher variant="select" />
        </div>
      </header>
      <main id="main-content" className="relative flex flex-1 items-start justify-center overflow-hidden px-5 py-14 sm:items-center sm:py-20">
        <div aria-hidden="true" className="absolute left-0 top-0 hidden h-full w-[32%] border-r border-[#ffffff12] bg-[#07111f] lg:block" />
        <div className="relative w-full max-w-md border border-[#d9dee5] bg-white p-6 shadow-none sm:p-8">
          <p className="mb-6 text-[11px] font-bold uppercase tracking-[.2em] text-[#2774e6]">SIVORA UP↑RISING</p>
          {children}
        </div>
      </main>
    </div>
  );
}
