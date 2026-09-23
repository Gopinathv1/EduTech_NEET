import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import ExploreSivora from '@/components/public/ExploreSivora';
import { EXAMS } from '@/data/exams';
import ExamLoopVisual from '@/components/public/ExamLoopVisual';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

const jee = EXAMS.find((exam) => exam.slug === 'jee')!;

export async function generateMetadata() {
  const t = await getTranslations('seo.jeePreparation');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/exam-preparation/jee' });
}

export default async function JeePreparationPage() {
  const t = await getTranslations('examPreparation.jeeDetail');
  const features = t.raw('features') as string[];
  const session = await getSession();

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <Section>
        <ExamLoopVisual exam="JEE" />
      </Section>
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {jee.subjects.map((subject) => (
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
        <p className="mt-6 rounded-md border border-[#dce0e2] bg-white p-4 text-xs leading-6 text-[#6b6b67]">
          {t('disclaimer')}
        </p>
      </Section>
      <Section>
        <div className="rounded-md border border-[#dce0e2] bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">DEMO PRACTICE</p>
          <h2 className="mt-3 text-3xl font-black text-[#171717]">Try JEE Demo Practice</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b6b67]">A 15-question original SIVORA starter set: 5 Physics, 5 Chemistry and 5 Mathematics questions in 30 minutes. This is not an official JEE mock.</p>
          <Link href={session?.kind === 'student' ? '/student/tests?q=JEE' : '/login?callbackUrl=%2Fstudent%2Ftests%3Fq%3DJEE'} className="mt-6 inline-flex rounded-md bg-[#10151c] px-5 py-3 text-sm font-semibold text-white">{session?.kind === 'student' ? 'Take JEE Demo Test →' : 'Login to Take Demo Test →'}</Link>
        </div>
      </Section>
      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/counselling">{t('primaryCta')}</PrimaryLink>
          <SecondaryLink href="/counselling">{t('secondaryCta')}</SecondaryLink>
        </div>
      </Section>
      <ExploreSivora exclude={['examPreparation']} />
    </>
  );
}
