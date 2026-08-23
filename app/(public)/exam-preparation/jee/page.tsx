import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import { EXAMS } from '@/data/exams';

const jee = EXAMS.find((exam) => exam.slug === 'jee')!;

export const metadata = pageMetadata({
  title: 'JEE Preparation',
  description: 'JEE preparation with Physics, Chemistry, Mathematics, question banks, mock tests and performance analytics.',
  path: '/exam-preparation/jee',
});

export default function JeePreparationPage() {
  return (
    <>
      <PageHero
        eyebrow="Exam Preparation"
        title="JEE Preparation"
        subtitle="Structured practice, concept reinforcement, chapter-wise tests and mock assessments for engineering entrance preparation."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {jee.subjects.map((subject) => (
            <div key={subject} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
              <h2 className="text-2xl font-black uppercase text-white">{subject}</h2>
              <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">Practise concepts, chapters and previous-pattern assessment formats.</p>
            </div>
          ))}
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jee.features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{feature}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4 text-xs leading-6 text-[#D1D1D1]">
          SIVORA UP↑RISING does not claim official NTA affiliation.
        </p>
      </Section>
      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/mock-tests">Ask About JEE</PrimaryLink>
          <SecondaryLink href="/counselling">Talk To Counsellor</SecondaryLink>
        </div>
      </Section>
    </>
  );
}
