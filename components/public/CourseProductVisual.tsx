import styles from './CourseExperience.module.css';

const pathways = [
  { key: 'EXAMS', detail: 'NEET · JEE · PRACTICE' },
  { key: 'LANGUAGES', detail: 'ENGLISH · HINDI · COMMUNICATE' },
  { key: 'FUTURE SKILLS', detail: 'AI · TECHNOLOGY · COMING LATER' },
];

export default function CourseProductVisual() {
  return (
    <div className={styles.visual} aria-label="SIVORA connected learning pathway">
      <div className={styles.visualHeader}>
        <span>LEARNING SYSTEM</span>
        <span>ROADMAP / PLANNED</span>
      </div>
      <div className={styles.visualCanvas}>
        <div className={styles.visualGrid} />
        <div className={styles.visualCore}>
          <span>SIVORA</span>
          <small>LEARNING</small>
        </div>
        <div className={styles.visualPathways}>
          {pathways.map((path, index) => (
            <div key={path.key} className={styles.visualPath}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{path.key}</strong>
              <small>{path.detail}</small>
            </div>
          ))}
        </div>
        <div className={styles.visualOutcome}>
          <span>GROW</span>
          <strong>Build knowledge and skills for what comes next.</strong>
        </div>
      </div>
    </div>
  );
}
