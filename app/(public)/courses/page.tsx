import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { PLANNED_COURSES, type PlannedCourse } from '@/data/courses';
import CourseProductVisual from '@/components/public/CourseProductVisual';
import styles from '@/components/public/CourseExperience.module.css';

export async function generateMetadata() {
  const t = await getTranslations('seo.courses');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses' });
}

const neetCourses = PLANNED_COURSES.slice(0, 3);
const jeeCourses = PLANNED_COURSES.slice(3, 6);
const languageCourses = PLANNED_COURSES.slice(6, 8);

export default function CoursesPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>COURSES & FUTURE SKILLS</p>
            <h1>Learn with a clear path.</h1>
            <p className={styles.heroCopy}>
              SIVORA is preparing structured learning pathways for competitive exams and practical communication skills. Explore what is planned; enrollment will open soon.
            </p>
            <Link href="/exam-preparation" className="mt-7 inline-flex border-b border-current pb-1 text-sm font-semibold text-[#2774e6]">Explore free Exam Preparation practice →</Link>
          </div>
          <CourseProductVisual />
        </div>
      </section>

      <CourseSection eyebrow="NEET PREPARATION" title="Aligned to NEET preparation." description="Planned pathways for focused study. These module groupings are SIVORA learning pathways, not official NTA chapter structures." courses={neetCourses} />
      <CourseSection eyebrow="JEE MAIN PREPARATION" title="Built for a deliberate JEE Main path." description="Inspect the planned Physics, Chemistry and Mathematics pathways, each organised for sustained preparation." courses={jeeCourses} tinted />
      <CourseSection eyebrow="LANGUAGE SKILLS" title="Practical communication, step by step." description="Two planned pathways for everyday confidence, workplace communication and fluency practice." courses={languageCourses} />

      <section className={`${styles.section} ${styles.dark}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><p className={styles.sectionEyebrow}>FUTURE SKILLS · COMING LATER</p><h2>More pathways are ahead.</h2></div>
            <p>These future areas are being shaped as secondary SIVORA learning pathways. Curriculum details and enrollment will be announced separately.</p>
          </div>
          <div className={styles.languageGrid}>
            {['AI & Future Technologies', 'Yoga & Wellness', 'Astrology'].map((name, index) => (
              <article key={name} className={styles.language}>
                <span>0{index + 1} · COMING LATER</span><h3>{name}</h3><p>Future learning pathway. Details will be shared when this programme is ready.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.cta}>
            <div>
              <p className={styles.sectionEyebrow}>TEACH WITH SIVORA</p>
              <h2>Partner onboarding — Coming Soon.</h2>
              <p>Educators, institutes and learning partners will eventually be able to offer structured courses through the SIVORA platform. This is informational only for now.</p>
            </div>
            <span className="border border-[#2774e6]/30 bg-[#eaf2ff] px-4 py-3 text-xs font-bold tracking-[.12em] text-[#2774e6]">COMING SOON</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CourseSection({ eyebrow, title, description, courses, tinted = false }: { eyebrow: string; title: string; description: string; courses: readonly PlannedCourse[]; tinted?: boolean }) {
  return <section className={`${styles.section}${tinted ? ` ${styles.sectionTint}` : ''}`}>
    <div className={styles.sectionInner}>
      <div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>{eyebrow}</p><h2>{title}</h2></div><p>{description} Every current pathway is Coming Soon; purchasing is not available.</p></div>
      <div className={styles.discovery}>
        {courses.map((course, index) => <CourseRow key={course.title} course={course} index={index + 1} />)}
      </div>
    </div>
  </section>;
}

function CourseRow({ course, index }: { course: PlannedCourse; index: number }) {
  const hasTracks = Boolean(course.tracks);
  return <details className="group border-b border-[#d9dee5]" open={false}>
    <summary className="grid cursor-pointer list-none gap-4 py-7 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center sm:gap-7">
      <span className="text-xs text-[#7a8795]">{String(index).padStart(2, '0')}</span>
      <span><span className="block text-xs font-bold uppercase tracking-[.14em] text-[#2774e6]">{course.category}</span><strong className="mt-2 block text-3xl font-semibold tracking-[-.055em] text-[#10151c] sm:text-4xl">{course.title}</strong></span>
      <span className="flex items-center gap-3 text-xs font-bold tracking-[.1em] text-[#2774e6]"><span>{course.duration ?? 'TWO LEARNING TRACKS'}</span><span className="border border-[#2774e6]/30 bg-[#eaf2ff] px-2 py-1">COMING SOON</span><span aria-hidden>+</span></span>
    </summary>
    <div className="grid gap-5 border-t border-[#d9dee5] py-6 sm:grid-cols-2">
      {hasTracks ? course.tracks?.map((track) => <ModuleTrack key={track.title} title={track.title} duration={track.duration} modules={track.modules} />) : <ModuleTrack title="Planned modules" duration={course.duration ?? ''} modules={course.modules ?? []} />}
    </div>
    <p className="pb-6 text-xs font-semibold uppercase tracking-[.11em] text-[#5f6975]">Enrollment opening soon</p>
  </details>;
}

function ModuleTrack({ title, duration, modules }: { title: string; duration: string; modules: readonly string[] }) {
  return <section className="border border-[#d9dee5] bg-white p-5"><div className="flex items-baseline justify-between gap-4"><h3 className="text-lg font-semibold text-[#10151c]">{title}</h3><span className="text-xs font-bold text-[#2774e6]">{duration}</span></div><p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-[#5f6975]">10 planned modules</p><ol className="mt-4 grid gap-2 text-sm leading-5 text-[#5f6975]">{modules.map((module, index) => <li key={module}><span className="mr-2 text-xs text-[#7a8795]">{String(index + 1).padStart(2, '0')}</span>{module}</li>)}</ol></section>;
}
