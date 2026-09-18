'use client';

import { useState } from 'react';
import styles from './CourseExperience.module.css';

const stages = [
  { name: 'DISCOVER', title: 'Choose the direction that fits.', body: 'Start with a practical goal: technology, communication, career readiness or personal learning.', signal: 'GOAL IDENTIFIED' },
  { name: 'LEARN', title: 'Build useful foundations.', body: 'Move through clear concepts and structured learning areas without losing sight of the real outcome.', signal: 'FOUNDATION ACTIVE' },
  { name: 'PRACTISE', title: 'Turn knowledge into repetition.', body: 'Use speaking, listening, exercises or projects to make each new skill more usable.', signal: 'PRACTICE LOOP' },
  { name: 'APPLY', title: 'Use the skill in context.', body: 'Bring learning into conversation, interviews, study, projects and everyday decisions.', signal: 'REAL CONTEXT' },
  { name: 'GROW', title: 'Keep moving to the next level.', body: 'Review progress, strengthen weak areas and choose the next useful learning pathway.', signal: 'NEXT PATH' },
] as const;

export default function CourseLearningJourney() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  function move(index: number) {
    setActive((index + stages.length) % stages.length);
  }

  return (
    <div className={styles.journey}>
      <div className={styles.journeyTabs} role="tablist" aria-label="Course learning journey">
        {stages.map((item, index) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={active === index ? styles.activeTab : undefined}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') move(active + 1);
              if (event.key === 'ArrowLeft') move(active - 1);
              if (event.key === 'Home') move(0);
              if (event.key === 'End') move(stages.length - 1);
            }}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>{item.name}
          </button>
        ))}
      </div>
      <div className={styles.journeyPanel} role="tabpanel">
        <div>
          <p>{String(active + 1).padStart(2, '0')} / {stage.name}</p>
          <h3>{stage.title}</h3>
          <p>{stage.body}</p>
        </div>
        <div className={styles.journeySignal}>
          <span>LEARNING STATE</span>
          <strong>{stage.signal}</strong>
          <div><i style={{ width: `${20 + active * 20}%` }} /></div>
          <small>{active + 1} of {stages.length} stages connected</small>
        </div>
      </div>
    </div>
  );
}
