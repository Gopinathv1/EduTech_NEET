import styles from './MarketplaceExperience.module.css';

const signals = [
  ['01', 'LEARNERS', 'Discover a useful next resource'],
  ['02', 'RESOURCES', 'Exam, language and learning areas'],
  ['03', 'PARTNERS', 'Future educator contributions'],
];

export default function MarketplaceProductVisual() {
  return (
    <div className={styles.visual} aria-label="SIVORA Marketplace resource journey">
      <div className={styles.visualHeader}><span>RESOURCE EXPLORER</span><span>MARKETPLACE / 01</span></div>
      <div className={styles.visualCanvas}>
        <div className={styles.visualGrid} />
        <div className={styles.visualCore}><span>SIVORA</span><small>RESOURCES</small></div>
        <div className={styles.visualSignals}>
          {signals.map(([number, title, detail]) => (
            <div key={title} className={styles.visualSignal}><span>{number}</span><strong>{title}</strong><small>{detail}</small></div>
          ))}
        </div>
      <div className={styles.visualFooter}><span>MARKETPLACE / FUTURE</span><strong>Connect learning resources with the next step.</strong></div>
      </div>
    </div>
  );
}
