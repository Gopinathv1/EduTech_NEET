import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { AI_FUTURE_SKILL_CATEGORIES, AI_LEARNING_PATH } from '@/data/courses';
import AstrologyLearningSection from '@/components/public/AstrologyLearningSection';
import CourseProductVisual from '@/components/public/CourseProductVisual';
import CourseLearningJourney from '@/components/public/CourseLearningJourney';
import { PrimaryLink, SecondaryLink } from '@/components/public/ui';
import styles from '@/components/public/CourseExperience.module.css';

export async function generateMetadata() {
  const t = await getTranslations('seo.courses');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses' });
}

const discovery = [
  ['01', 'AI & Future Skills', 'Build practical foundations across AI, data, programming and emerging technologies.', '#ai-future-skills'],
  ['02', 'Spoken English', 'Strengthen communication for everyday life, interviews, workplaces and presentations.', '#spoken-languages'],
  ['03', 'Spoken Hindi', 'Build useful Hindi for conversation, travel, social settings and workplace communication.', '#spoken-languages'],
  ['04', 'Academic Preparation', 'Connect focused exam preparation with the broader learning journey.', '/exam-preparation'],
  ['05', 'Astrology Learning', 'Explore the existing SIVORA astrology pathway as a distinct personal-learning area.', '#astrology'],
] as const;

const englishAreas = ['Everyday communication', 'Workplace communication', 'Interview communication', 'Presentations', 'Vocabulary', 'Grammar in conversation', 'Listening', 'Pronunciation', 'Real-life speaking practice'];
const hindiAreas = ['Everyday conversation', 'Workplace Hindi', 'Travel & social communication', 'Vocabulary', 'Sentence building', 'Listening', 'Pronunciation', 'Real-life speaking practice'];

export default function CoursesPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>COURSES &amp; FUTURE SKILLS</p>
            <h1>LEARN WHAT MOVES YOU FORWARD.</h1>
            <p className={styles.heroCopy}>Practical learning for technology, communication, career preparation and personal growth—connected in one clear SIVORA experience.</p>
            <div className={styles.actions}>
              <PrimaryLink href="#course-discovery">Explore learning paths</PrimaryLink>
              <SecondaryLink href="/counselling">Get guidance</SecondaryLink>
            </div>
          </div>
          <CourseProductVisual />
        </div>
      </section>

      <section id="course-discovery" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><p className={styles.sectionEyebrow}>COURSE DISCOVERY</p><h2>Choose a useful direction.</h2></div>
            <p>Start with the capability you want to build, then move into a pathway designed around practice and real use.</p>
          </div>
          <div className={styles.discovery}>
            {discovery.map(([number, title, body, href]) => (
              <Link key={number} href={href} className={styles.discoveryRow}>
                <span>{number}</span><h3>{title}</h3><p>{body}</p><b>↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="spoken-languages" className={`${styles.section} ${styles.dark}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><p className={styles.sectionEyebrow}>LANGUAGE LEARNING</p><h2>Listen. Understand. Speak.</h2></div>
            <p>Communication grows through context and repetition. These pathways focus on useful speaking, listening and sentence-building practice.</p>
          </div>
          <div className={styles.languageGrid}>
            <article className={styles.language}>
              <span>01 / PRACTICAL COMMUNICATION</span><h3>Spoken English</h3>
              <p>Build confidence for conversations that matter in education, work and everyday life.</p>
              <div className={styles.learningAreas}>{englishAreas.map(area => <span key={area}>↗ {area}</span>)}</div>
              <Link href="/counselling" className={styles.languageLink}>Ask about Spoken English ↗</Link>
            </article>
            <article className={styles.language}>
              <span>02 / PRACTICAL COMMUNICATION</span><h3>Spoken Hindi</h3>
              <p>Develop practical Hindi for clearer communication across social, travel and workplace settings.</p>
              <div className={styles.learningAreas}>{hindiAreas.map(area => <span key={area}>↗ {area}</span>)}</div>
              <Link href="/counselling" className={styles.languageLink}>Ask about Spoken Hindi ↗</Link>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-future-skills" className={styles.section}>
        <div className={`${styles.sectionInner} ${styles.aiLayout}`}>
          <div className={styles.aiIntro}>
            <p className={styles.sectionEyebrow}>AI &amp; FUTURE SKILLS</p>
            <h2>Build for what comes next.</h2>
            <p>The existing SIVORA pathway spans supported foundations in AI, programming, data and emerging technology. Availability remains clearly marked rather than commercially implied.</p>
          </div>
          <div>
            <div className={styles.aiRows}>
              {AI_FUTURE_SKILL_CATEGORIES.map((category, index) => (
                <div key={category} className={styles.aiRow}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{formatCategory(category)}</strong>
                  <small>COMING SOON</small>
                </div>
              ))}
            </div>
            <div className={styles.aiPath}>{AI_LEARNING_PATH.map(step => <span key={step}>{formatCategory(step)}</span>)}</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><p className={styles.sectionEyebrow}>LEARNING JOURNEY</p><h2>From interest to useful skill.</h2></div>
            <p>A connected progression keeps discovery, learning, practice and application part of one experience.</p>
          </div>
          <CourseLearningJourney />
        </div>
      </section>

      <AstrologyLearningSection />

      <section className={styles.section}>
        <div className={`${styles.sectionInner} ${styles.cta}`}>
          <div><p className={styles.sectionEyebrow}>YOUR NEXT LEARNING STEP</p><h2>Not sure which pathway fits?</h2><p>Use the existing counselling experience to discuss your goals without implying enrollment, pricing or certification that has not been configured.</p></div>
          <div className={styles.actions}><PrimaryLink href="/counselling">Get guidance</PrimaryLink><SecondaryLink href="/exam-preparation">Explore exam preparation</SecondaryLink></div>
        </div>
      </section>
    </div>
  );
}

function formatCategory(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\bAi\b/g, 'AI').replace(/\bRag\b/g, 'RAG').replace(/\bLlm\b/g, 'LLM').replace(/^./, letter => letter.toUpperCase());
}
