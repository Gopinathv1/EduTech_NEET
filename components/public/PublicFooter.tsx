import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import { FOOTER_EXPLORE, FOOTER_COMPANY, type NavLink } from '@/lib/public/nav';

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  const t = useTranslations('publicNav');
  return (
    <div>
      <h3 className="text-sm font-semibold text-textPrimary">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-textSecondary hover:text-red-200">
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
    <footer className="border-t border-border bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-6 text-textSecondary">{t('blurb')}</p>
          </div>
          <FooterColumn title={t('explore')} links={FOOTER_EXPLORE} />
          <FooterColumn title={t('company')} links={FOOTER_COMPANY} />
          <div>
            <h3 className="text-sm font-semibold text-textPrimary">{t('getStarted')}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/register" className="text-sm text-textSecondary hover:text-red-200">
                  {t('registerLink')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-textSecondary hover:text-red-200">
                  {t('loginLink')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-textSecondary hover:text-red-200">
                  {t('contactLink')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-textPrimary">{t('exams')}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/#question-bank" className="text-sm text-textSecondary hover:text-red-200">
                  {t('neet')}
                </Link>
              </li>
              <li>
                <span className="text-sm text-textSecondary">{t('jeeSoon')}</span>
              </li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold text-textPrimary">{t('languages')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-textSecondary">
              <li>{t('english')}</li>
              <li>{t('tamil')}</li>
              <li>{t('hindi')}</li>
            </ul>
          </div>
        </div>

        {/* Required disclosure about admission guidance. */}
        <p className="mt-10 rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed text-slate-400">
          {t('disclaimer')}
        </p>

        <p className="mt-6 text-center text-xs text-textSecondary">
          © {year} {t('rights')}
        </p>
      </div>
    </footer>
  );
}
