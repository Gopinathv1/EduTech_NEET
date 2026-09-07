import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import { EXAMS } from '@/data/exams';

const neet = EXAMS.find((exam) => exam.slug === 'neet')!;

export async function generateMetadata() {
  const t = await getTranslations('seo.neetPreparation');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/exam-preparation/neet' });
}

export default function NeetPreparationPage() {
  const t = useTranslations('examPreparation.neetDetail');

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <ExamDetail exam={neet} />
    </>
  );
}

function ExamDetail({ exam }: { exam: typeof neet }) {
  const t = useTranslations('examPreparation.neetDetail');
  const features = t.raw('features') as string[];

  return (
    <>
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {exam.subjects.map((subject) => (
            <div key={subject} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
              <h2 className="text-2xl font-black uppercase text-white">{subject}</h2>
              <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{t('subjectBody')}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{feature}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/mock-tests">{t('primaryCta')}</PrimaryLink>
          <SecondaryLink href="/mock-tests">{t('secondaryCta')}</SecondaryLink>
        </div>
      </Section>
    </>
  );
}
