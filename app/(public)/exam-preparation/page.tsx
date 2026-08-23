import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import { EXAM_HUB_FEATURES, EXAMS } from '@/data/exams';

export const metadata = pageMetadata({
  title: 'Exam Preparation',
  description: 'Choose your exam and access structured preparation, practice, mock tests, question banks and performance insights.',
  path: '/exam-preparation',
});

export default function ExamPreparationPage() {
  return (
    <>
      <PageHero
        eyebrow="Exam Preparation"
        title="Prepare for the exam that matters to you."
        subtitle="Choose your exam and access structured preparation, practice, mock tests, question banks and performance insights."
      />

      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {EXAMS.map((exam, index) => (
            <Link
              key={exam.slug}
              href={exam.active ? `/exam-preparation/${exam.slug}` : '/exam-preparation'}
              className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
            >
              <p className="text-sm font-black text-brand">0{index + 1}</p>
              <h2 className="mt-5 text-2xl font-black uppercase text-white">{exam.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{exam.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {exam.subjects.map((subject) => (
                  <span key={subject} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-3 py-1.5 text-xs font-bold text-white">
                    {subject}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">What You Get</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              One preparation system.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXAM_HUB_FEATURES.map((feature) => (
              <div key={feature} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">Start Your Preparation</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">Choose your exam and begin.</h2>
          </div>
          <div className="mt-6 lg:mt-0">
            <PrimaryLink href="/mock-tests">Start Your Preparation</PrimaryLink>
          </div>
        </div>
      </Section>
    </>
  );
}
