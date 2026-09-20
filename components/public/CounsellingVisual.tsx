import styles from './CounsellingVisual.module.css';

const nodes = [
  ['GOALS', 'What matters now'],
  ['SKILLS', 'What comes naturally'],
  ['INTERESTS', 'What sparks curiosity'],
  ['EXAMS', 'Preparation direction'],
  ['CAREER', 'Possible pathways'],
  ['ADMISSIONS', 'Course and destination'],
] as const;

export default function CounsellingVisual() {
  return (
    <div className={styles.visual} aria-label="SIVORA counselling clarity map">
      <div className={styles.grid} />
      <div className={styles.label}>SIVORA / CLARITY MAP</div>
      <svg className={styles.lines} viewBox="0 0 720 520" aria-hidden="true">
        <path d="M360 252 C260 190 170 128 72 92" />
        <path d="M360 252 C360 170 360 105 360 40" />
        <path d="M360 252 C460 190 550 128 648 92" />
        <path d="M360 275 C255 340 170 400 72 452" />
        <path d="M360 275 C360 350 360 415 360 480" />
        <path d="M360 275 C465 340 550 400 648 452" />
      </svg>
      <div className={styles.student}>STUDENT<small>the starting point</small></div>
      <div className={styles.clarity}>CLARITY<small>before the next step</small></div>
      {nodes.map(([title, copy], index) => (
        <div key={title} className={`${styles.node} ${styles[`node${index}`]}`}>
          <span>0{index + 1}</span><strong>{title}</strong><small>{copy}</small>
        </div>
      ))}
      <div className={styles.footer}><span>CONNECTED GUIDANCE</span><strong>Understand → Explore → Decide</strong></div>
    </div>
  );
}
