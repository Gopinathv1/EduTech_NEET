'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import { NAV_LINKS } from '@/lib/public/nav';
import { MenuIcon, CloseIcon } from './icons';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/**
 * Sticky public header: logo, full nav (inline on xl, drawer below),
 * language switcher, and Login / Register. Mobile drawer toggles with the
 * hamburger and closes on navigation.
 */
export default function PublicHeader() {
  const t = useTranslations('publicNav');
  const tNav = useTranslations('nav');
  const tA11y = useTranslations('a11y');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Logo />

        {/* Inline nav — only shown when there is genuinely room for all links;
            narrower screens use the hamburger drawer below. */}
        <nav className="hidden items-center min-[1440px]:flex" aria-label={tA11y('primaryNav')}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
                isActive(pathname, link.href)
                  ? 'text-brand'
                  : 'text-slate-600 hover:text-brand'
              }`}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <AccessibilityMenu />
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"
          >
            {tNav('login')}
          </Link>
          <Link
            href="/register"
            className="hidden rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark sm:inline-flex"
          >
            {tNav('register')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 min-[1440px]:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={tA11y('openMenu')}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet drawer */}
      {open ? (
        <nav
          id="mobile-nav"
          aria-label={tA11y('primaryNav')}
          className="border-t border-slate-200 bg-white px-4 py-3 min-[1440px]:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                    isActive(pathname, link.href)
                      ? 'bg-brand-soft text-brand'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-medium text-slate-700"
            >
              {tNav('login')}
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              {tNav('register')}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
