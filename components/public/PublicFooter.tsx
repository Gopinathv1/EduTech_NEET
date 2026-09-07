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
            <Link href={link.href} className="text-sm text-[#D1D1D1] transition hover:text-accent">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ADMISSIONS: NavLink[] = [
  { href: '/study-abroad', key: 'mbbsAbroad' },
  { href: '/study-abroad', key: 'studyEurope' },
  { href: '/study-abroad', key: 'internationalEducation' },
];

const COUNSELLING: NavLink[] = [
  { href: '/counselling', key: 'mbbsCounsellingIndia' },
  { href: '/counselling', key: 'collegeGuidance' },
  { href: '/counselling', key: 'careerGuidance' },
];

const EXAM_PREP: NavLink[] = [
  { href: '/exam-preparation', key: 'examPrepMenu' },
  { href: '/exam-preparation/neet', key: 'neet' },
  { href: '/exam-preparation/jee', key: 'jee' },
  { href: '/mock-tests', key: 'questionBank' },
];

const LEARNING: NavLink[] = [
  { href: '/courses', key: 'coursesLearning' },
];

export default function PublicFooter() {
  const t = useTranslations('site.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#050505]">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)] py-16 sm:py-20">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Logo className="text-white" size="footer" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#D1D1D1]">{t('blurb')}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#D1D1D1]">
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('english')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('tamil')}</span>
              <span className="rounded-lg border border-white/10 px-3 py-1.5">{t('hindi')}</span>
            </div>
          </div>

          <FooterColumn title="Admissions & Study Abroad" links={ADMISSIONS} />
          <FooterColumn title="Exam Preparation" links={EXAM_PREP} />
          <FooterColumn title="Counselling" links={COUNSELLING} />
          <FooterColumn title="Learning" links={LEARNING} />
          <FooterColumn title={t('company')} links={FOOTER_COMPANY} />
        </div>

        <p className="mt-8 border-l border-accent/40 bg-white/[0.04] p-4 text-xs leading-relaxed text-[#D1D1D1]">
          {t('disclaimer')}
        </p>

        <div className="mt-8 flex flex-col gap-3 text-xs text-[#D1D1D1] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('rights')}
          </p>
          <p>SIVORA UP↑RISING</p>
        </div>
      </div>
    </footer>
  );
}
