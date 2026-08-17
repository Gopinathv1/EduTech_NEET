import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import { FOOTER_EXPLORE, FOOTER_COMPANY, type NavLink } from '@/lib/public/nav';

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  const t = useTranslations('publicNav');
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-slate-600 hover:text-brand">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PublicFooter() {
  const t = useTranslations('site.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-600">{t('blurb')}</p>
          </div>
          <FooterColumn title={t('explore')} links={FOOTER_EXPLORE} />
          <FooterColumn title={t('company')} links={FOOTER_COMPANY} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t('getStarted')}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/register" className="text-sm text-slate-600 hover:text-brand">
                  {t('registerLink')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-brand">
                  {t('loginLink')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-600 hover:text-brand">
                  {t('contactLink')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Required disclosure about admission guidance. */}
        <p className="mt-10 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
          {t('disclaimer')}
        </p>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {year} {t('rights')}
        </p>
      </div>
    </footer>
  );
}
