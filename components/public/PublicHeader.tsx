'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AccessibilityMenu from '@/components/a11y/AccessibilityMenu';
import { NAV_GROUPS, NAV_LINKS } from '@/lib/public/nav';
import { MenuIcon, CloseIcon } from './icons';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function PublicHeader() {
  const t = useTranslations('publicNav');
  const tNav = useTranslations('nav');
  const tA11y = useTranslations('a11y');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-black/90 shadow-2xl shadow-black/30 backdrop-blur-xl'
          : 'border-b border-transparent bg-black/45 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex" aria-label={tA11y('primaryNav')}>
          <Link
            href="/"
            className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, '/')
                ? 'bg-brand-soft text-red-200'
                : 'text-textSecondary hover:bg-white/5 hover:text-white'
            }`}
            aria-current={isActive(pathname, '/') ? 'page' : undefined}
          >
            {t('home')}
          </Link>

          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="group relative">
              <button
                type="button"
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-textSecondary transition-colors hover:bg-white/5 hover:text-white"
              >
                {t(group.key)}
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-64 translate-y-2 rounded-2xl border border-white/10 bg-[#111]/95 p-2 opacity-0 shadow-2xl shadow-black/50 backdrop-blur-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {group.links.map((link) => (
                  <Link
                    key={`${group.key}-${link.href}-${link.key}`}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-textSecondary hover:bg-white/5 hover:text-white"
                  >
                    {t(link.key)}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {NAV_LINKS.filter((link) => link.href !== '/').map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isActive(pathname, link.href)
                  ? 'bg-brand-soft text-red-200'
                  : 'text-textSecondary hover:bg-white/5 hover:text-white'
              }`}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-full border border-brand/30 bg-brand-soft/70 px-3 py-1.5 text-xs font-semibold text-textPrimary lg:flex">
            <span className="text-red-200">{t('examNeet')}</span>
            <span className="ml-2 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[11px] text-textSecondary">
              {t('examJeeSoon')}
            </span>
          </div>
          <AccessibilityMenu />
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-textSecondary hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            {tNav('login')}
          </Link>
          <Link
            href="/register"
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark sm:inline-flex"
          >
            {t('getStarted')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-textPrimary hover:bg-surfaceElevated xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={tA11y('openMenu')}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label={tA11y('primaryNav')}
          className="border-t border-white/10 bg-black/95 px-4 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl xl:hidden"
        >
          <ul className="flex flex-col">
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`block rounded-2xl px-3 py-3 text-base font-medium ${
                  isActive(pathname, '/')
                    ? 'bg-brand-soft text-red-200'
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                }`}
                aria-current={isActive(pathname, '/') ? 'page' : undefined}
              >
                {t('home')}
              </Link>
            </li>

            {NAV_GROUPS.map((group) => (
              <li key={group.key} className="py-1">
                <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-red-300">
                  {t(group.key)}
                </p>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <Link
                      key={`${group.key}-${link.href}-${link.key}`}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-textSecondary hover:bg-white/5 hover:text-white"
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                </div>
              </li>
            ))}

            {NAV_LINKS.filter((link) => link.href !== '/').map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-2xl px-3 py-3 text-base font-medium ${
                    isActive(pathname, link.href)
                      ? 'bg-brand-soft text-red-200'
                      : 'text-textSecondary hover:bg-white/5 hover:text-white'
                  }`}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-white/10 pt-4">
            <LanguageSwitcher />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-full border border-brand/60 px-3 py-2.5 text-center text-sm font-medium text-white"
            >
              {tNav('login')}
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-full bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              {t('getStarted')}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
