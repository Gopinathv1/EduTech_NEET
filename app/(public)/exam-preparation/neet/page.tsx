import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import ExploreSivora from '@/components/public/ExploreSivora';
import { EXAMS } from '@/data/exams';
import ExamLoopVisual from '@/components/public/ExamLoopVisual';

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
      <Section>
        <ExamLoopVisual exam="NEET" />
      </Section>
      <ExamDetail exam={neet} />
    </>
  );
}

function ExamDetail({ exam }: { exam: typeof neet }) {
  const t = useTranslations('examPreparation.neetDetail');
  const tn = useTranslations('neetPractice');
  const features = t.raw('features') as string[];

  return (
    <>
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {exam.subjects.map((subject) => (
            <div key={subject} className="rounded-md border border-[#dce0e2] bg-white p-6">
              <h2 className="text-2xl font-black uppercase text-[#171717]">{subject}</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b6b67]">{t('subjectBody')}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-md border border-[#dce0e2] bg-white p-4">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#171717]">{feature}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section lazy>
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {([['FULL_TEST', 'full'], ['SUBJECT_TEST', 'subject'], ['CHAPTER_TEST', 'chapter']] as const).map(([type, label]) =>
            <PrimaryLink key={type} href={`/student/tests?type=${type}`}>{tn(label)}</PrimaryLink>)}
        </div>
        <p className="mb-6 text-sm text-[#6b6b67]">{tn('disclaimer')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/mock-tests">{t('primaryCta')}</PrimaryLink>
          <SecondaryLink href="/mock-tests">{t('secondaryCta')}</SecondaryLink>
        </div>
      </Section>
      <ExploreSivora exclude={['examPreparation']} />
    </>
  );
}
