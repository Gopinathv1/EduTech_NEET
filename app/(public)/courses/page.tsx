import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import { AI_COURSE_TOPICS } from '@/data/courses';

const EXAM_COURSES = ['NEET', 'JEE'];

export const metadata = pageMetadata({
  title: 'Courses',
  description: 'Competitive exam courses and AI technology courses from SIVORA UP↑RISING.',
  path: '/courses',
});

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Courses"
        title="Courses for exams and future skills."
        subtitle="Explore guided programs for competitive exam preparation and technology learning."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">Competitive Exam Courses</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              NEET and JEE.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {EXAM_COURSES.map((course) => (
              <a key={course} href={`/exam-preparation/${course.toLowerCase()}`} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35">
                <h3 className="text-2xl font-black uppercase text-white">{course}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">Structured preparation, practice and mock assessment support.</p>
              </a>
            ))}
          </div>
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">AI & Technology Courses</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              Future skills in one place.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_COURSE_TOPICS.map((topic) => (
              <div key={topic} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/counselling">Talk To Counsellor</PrimaryLink>
          <SecondaryLink href="/exam-preparation">View Exam Preparation</SecondaryLink>
        </div>
      </Section>
    </>
  );
}
