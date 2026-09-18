import styles from './MarketplaceExperience.module.css';

const signals = [
  ['01', 'LEARN', 'Books and study materials'],
  ['02', 'PREPARE', 'Exam and academic resources'],
  ['03', 'APPLY', 'Choose the resource that fits'],
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
        <div className={styles.visualFooter}><span>DISCOVER</span><strong>Find useful materials for the next move.</strong></div>
      </div>
    </div>
  );
}
