import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import { FOOTER_COMPANY, type NavLink } from '@/lib/public/nav';

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  const t = useTranslations('publicNav');
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.22em] text-accent">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.key}`}>
            <Link href={link.href} className="text-sm text-textSecondary transition hover:text-accent">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ADMISSIONS: NavLink[] = [
  { href: '/countries', key: 'mbbsAbroad' },
  { href: '/countries', key: 'internationalEducation' },
  { href: '/admission-guidance', key: 'applicationGuidance' },
];

const COUNSELLING: NavLink[] = [
  { href: '/admission-guidance', key: 'mbbsCounsellingIndia' },
  { href: '/admission-guidance', key: 'collegeGuidance' },
  { href: '/contact', key: 'careerGuidance' },
];

const EXAM_PREP: NavLink[] = [
  { href: '/#neet-preparation', key: 'neet' },
  { href: '/mock-tests', key: 'questionBank' },
  { href: '/#previous-year-papers', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
];

export default function PublicFooter() {
  const t = useTranslations('site.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#02060a]">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)] py-16 sm:py-20">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-textSecondary">{t('blurb')}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-textSecondary">
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('english')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('tamil')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('hindi')}</span>
            </div>
          </div>

          <FooterColumn title="Study Abroad" links={ADMISSIONS} />
          <FooterColumn title={t('exams')} links={EXAM_PREP} />
          <FooterColumn title="Counselling" links={COUNSELLING} />
          <FooterColumn title={t('company')} links={FOOTER_COMPANY} />

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-accent">{t('getStarted')}</h3>
            <div className="mt-4 space-y-3">
              <Link href="/register" className="block text-sm text-textSecondary transition hover:text-accent">
                {t('registerLink')}
              </Link>
              <Link href="/login" className="block text-sm text-textSecondary transition hover:text-accent">
                {t('loginLink')}
              </Link>
              <Link href="/contact" className="block text-sm text-textSecondary transition hover:text-accent">
                {t('contactLink')}
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 border-l border-accent/40 bg-white/[0.025] p-4 text-xs leading-relaxed text-slate-400">
          {t('disclaimer')}
        </p>

        <div className="mt-8 flex flex-col gap-3 text-xs text-textSecondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('rights')}
          </p>
          <p>VV Overseas</p>
        </div>
      </div>
    </footer>
  );
}
