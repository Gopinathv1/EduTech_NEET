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

  const navLinkClass = (href: string) =>
    `whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium transition-colors min-[1440px]:px-3 min-[1440px]:text-sm ${
      isActive(pathname, href)
        ? 'bg-brand-soft text-brand'
        : 'text-[#D1D1D1] hover:bg-brand-soft hover:text-textPrimary'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#2B2B2B] bg-[#050505]/94 shadow-xl shadow-black/8 backdrop-blur-xl'
          : 'border-b border-[#2B2B2B]/70 bg-[#050505]/82 backdrop-blur-lg'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-[clamp(1rem,3vw,3rem)] py-3">
        <div className="flex min-w-0 flex-1 items-center min-[1360px]:flex-none">
          <Logo />
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 min-[1360px]:flex" aria-label={tA11y('primaryNav')}>
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="group relative">
              <button
                type="button"
                className="whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-[#D1D1D1] transition-colors hover:bg-brand-soft hover:text-textPrimary min-[1440px]:px-3 min-[1440px]:text-sm"
              >
                {t(group.key)}
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-64 translate-y-2 rounded-2xl border border-[#2B2B2B] bg-[#111111]/95 p-2 opacity-0 shadow-2xl shadow-black/12 backdrop-blur-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {group.links.map((link) => (
                  <Link
                    key={`${group.key}-${link.href}-${link.key}`}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#D1D1D1] hover:bg-brand-soft hover:text-textPrimary"
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
              className={navLinkClass(link.href)}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <AccessibilityMenu />
          <div className="hidden md:block">
            <LanguageSwitcher variant="select" />
          </div>
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#D1D1D1] hover:bg-brand-soft hover:text-textPrimary sm:inline-flex"
          >
            {tNav('login')}
          </Link>
          <Link
            href="/#callback"
            className="hidden rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-2 text-sm font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 sm:inline-flex"
          >
            {t('getStarted')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl border border-[#2B2B2B] bg-[#111111] p-2 text-textPrimary hover:bg-brand-soft min-[1360px]:hidden"
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
          className="border-t border-[#2B2B2B] bg-[#050505]/96 px-4 py-4 shadow-2xl shadow-black/15 backdrop-blur-xl min-[1360px]:hidden"
        >
          <ul className="flex flex-col">
            {NAV_GROUPS.map((group) => (
              <li key={group.key} className="py-1">
                <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-brand">
                  {t(group.key)}
                </p>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <Link
                      key={`${group.key}-${link.href}-${link.key}`}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#D1D1D1] hover:bg-brand-soft hover:text-textPrimary"
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
                  className={`block rounded-lg px-3 py-3 text-base font-medium ${
                    isActive(pathname, link.href)
                      ? 'bg-brand-soft text-brand'
                      : 'text-[#D1D1D1] hover:bg-brand-soft hover:text-textPrimary'
                  }`}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-[#2B2B2B] pt-4">
            <LanguageSwitcher />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-brand/35 bg-[#111111] px-3 py-2.5 text-center text-sm font-medium text-textPrimary"
            >
              {tNav('login')}
            </Link>
            <Link
              href="/#callback"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gradient-to-r from-brand to-brand-light px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              {t('getStarted')}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
