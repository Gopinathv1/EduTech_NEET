import styles from './ExamLoopVisual.module.css';
import { EXAM_PRACTICE_LOOP_LABEL } from '@/lib/exams/product-status';

type Props = { exam?: 'NEET' | 'JEE' };

const stages = [
  ['01', 'QUESTION SET', 'Choose a structured set'],
  ['02', 'TIMED PRACTICE', 'Work through the attempt'],
  ['03', 'RESULT', 'Review what happened'],
  ['04', 'ANALYSIS', 'See subject and chapter signals'],
  ['05', 'WEAK AREAS', 'Spot the next useful focus'],
  ['06', 'NEXT PRACTICE', 'Return with a clearer plan'],
] as const;

export default function ExamLoopVisual({ exam = 'NEET' }: Props) {
  return (
    <div className={styles.visual} aria-label={`${exam} preparation practice loop`}>
      <div className={styles.top}><span>SIVORA / {exam} PREPARATION</span><strong>{EXAM_PRACTICE_LOOP_LABEL}</strong></div>
      <div className={styles.diagram}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.core}><span>{exam}</span><small>prepare · practice · improve</small></div>
        {stages.map(([number, title, copy], index) => <div key={title} className={`${styles.stage} ${styles[`stage${index}`]}`}><span>{number}</span><strong>{title}</strong><small>{copy}</small></div>)}
      </div>
      <div className={styles.bottom}><span>QUESTION → ATTEMPT → UNDERSTAND → IMPROVE</span><b>↺</b></div>
    </div>
  );
}
