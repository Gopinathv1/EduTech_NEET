import styles from './CourseExperience.module.css';

const pathways = [
  { key: 'AI', detail: 'BUILD · PROJECT · APPLY' },
  { key: 'ENGLISH', detail: 'LISTEN · SPEAK · PRACTISE' },
  { key: 'HINDI', detail: 'UNDERSTAND · SPEAK · CONNECT' },
];

export default function CourseProductVisual() {
  return (
    <div className={styles.visual} aria-label="SIVORA connected learning pathway">
      <div className={styles.visualHeader}>
        <span>LEARNING SYSTEM</span>
        <span>PATH 01 / ACTIVE</span>
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
          <span>APPLY</span>
          <strong>Turn learning into forward movement.</strong>
        </div>
      </div>
    </div>
  );
}
