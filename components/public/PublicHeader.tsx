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
    <header className="sticky top-0 z-50 border-b border-border bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/85">
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
                  ? 'bg-brand-soft text-red-200'
                  : 'text-textSecondary hover:text-white'
              }`}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-lg border border-brand/30 bg-surface px-2 py-1.5 text-sm font-semibold text-textPrimary lg:flex">
            <span className="text-red-200">{t('examNeet')}</span>
            <span className="ml-2 rounded-full border border-border bg-surfaceElevated px-2 py-0.5 text-xs text-textSecondary">
              {t('examJeeSoon')}
            </span>
          </div>
          <AccessibilityMenu />
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-textSecondary hover:bg-surfaceElevated hover:text-white sm:inline-flex"
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
            className="inline-flex items-center justify-center rounded-lg p-2 text-textPrimary hover:bg-surfaceElevated min-[1440px]:hidden"
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
          className="border-t border-border bg-black px-4 py-3 min-[1440px]:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                    isActive(pathname, link.href)
                      ? 'bg-brand-soft text-red-200'
                      : 'text-textSecondary hover:bg-surfaceElevated hover:text-white'
                  }`}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-brand/60 px-3 py-2.5 text-center text-sm font-medium text-white"
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
