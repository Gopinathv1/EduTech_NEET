import { pageMetadata } from '@/lib/seo';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';

const EXAM_COURSES = ['NEET', 'JEE'];

export async function generateMetadata() {
  const t = await getTranslations('seo.courses');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses' });
}

export default function CoursesPage() {
  const t = useTranslations('courses');
  const aiTopics = t.raw('aiTopics') as string[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('examEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('examTitle')}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {EXAM_COURSES.map((course) => (
              <Link key={course} href={`/exam-preparation/${course.toLowerCase()}`} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35">
                <h3 className="text-2xl font-black uppercase text-white">{course}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{t('examCardBody')}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('aiEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('aiTitle')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aiTopics.map((topic) => (
              <div key={topic} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/counselling">{t('talkCta')}</PrimaryLink>
          <SecondaryLink href="/exam-preparation">{t('examCta')}</SecondaryLink>
        </div>
      </Section>
    </>
  );
}
