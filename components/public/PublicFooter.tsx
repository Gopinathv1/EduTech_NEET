import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Logo from './Logo';
import type { NavLink } from '@/lib/public/nav';

function FooterColumn({ titleKey, links }: { titleKey: string; links: NavLink[] }) {
  const t = useTranslations('publicNav');
  const tf = useTranslations('site.footer');
  return (
    <div>
      <h3 className="text-sm font-medium text-white">{tf(titleKey)}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.key}`}>
            <Link href={link.href} className="text-sm text-[#bfc8cc] transition hover:text-accent">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PRODUCTS: NavLink[] = [
  { href: '/admissions', key: 'admissionsMenu' },
  { href: '/counselling', key: 'counsellingMenu' },
  { href: '/exam-preparation', key: 'examPrepMenu' },
  { href: '/courses', key: 'coursesMenu' },
  { href: '/marketplace', key: 'marketplace' },
];

const LEARNING: NavLink[] = [
  { href: '/courses#ai-future-skills', key: 'aiFutureSkills' },
  { href: '/courses/astrology', key: 'astrologyLearning' },
  { href: '/exam-preparation', key: 'examPrepMenu' },
];

const RESOURCES: NavLink[] = [
  { href: '/admissions', key: 'countries' },
  { href: '/marketplace', key: 'marketplace' },
  { href: '/testimonials', key: 'testimonials' },
];

const COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/partners', key: 'partnerWithUs' },
  { href: '/contact', key: 'contact' },
];

const HELP: NavLink[] = [
  { href: '/counselling', key: 'counsellingMenu' },
  { href: '/contact', key: 'contact' },
];

const LEGAL: NavLink[] = [
  { href: '/privacy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
];

export default function PublicFooter() {
  const t = useTranslations('site.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#07111f] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)] py-20 sm:py-28">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 border-b border-white/15 pb-16 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-6 flex flex-col gap-6 lg:flex-row lg:justify-between">
            <Logo className="text-white" size="footer" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#bfc8cc]">{t('blurb')}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#bfc8cc]">
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('english')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('tamil')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('hindi')}</span>
            </div>
          </div>

          <FooterColumn titleKey="products" links={PRODUCTS} />
          <FooterColumn titleKey="learning" links={LEARNING} />
          <FooterColumn titleKey="resources" links={RESOURCES} />
          <FooterColumn titleKey="company" links={COMPANY} />
          <FooterColumn titleKey="help" links={HELP} />
          <FooterColumn titleKey="legal" links={LEGAL} />
        </div>

        <p className="mt-8 border-l border-white/20 bg-white/[0.04] p-4 text-xs leading-relaxed text-[#bfc8cc]">
          {t('disclaimer')}
        </p>

        <div className="mt-8 flex flex-col gap-3 text-xs text-[#bfc8cc] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('rights')}
          </p>
          <p className="text-4xl font-medium leading-[0.9] tracking-[-0.06em] text-white sm:text-6xl">RISE BEYOND<br />BOUNDARIES.</p>
        </div>
      </div>
    </footer>
  );
}
