import styles from './RouteExperience.module.css';

const content = {
  admissions: { title:'Your global study pathway', label:'Destination explorer', rows:['Choose a region','Compare destinations','Shortlist universities'], foot:'India → Your next destination' },
  counselling: { title:'A clearer next step', label:'Decision pathway', rows:['Your interests & strengths','Your study options','Your personal plan'], foot:'Understand → Explore → Plan' },
  exam: { title:'NEET practice workspace', label:'Practice preview', rows:['Physics · Chemistry · Biology','180 questions / 180 minutes','Review answers & performance'], foot:'720 maximum marks · 3 free attempts' },
  courses: { title:'Build your learning pathway', label:'Learning explorer', rows:['Find your starting point','Explore skills & subjects','Choose your next learning step'], foot:'Discover → Learn → Apply' },
  marketplace: { title:'Resources for your next step', label:'Resource explorer', rows:['Browse learning categories','Find useful books & materials','Review listing details'], foot:'Books · Study materials · Learning resources' },
};
export default function OpportunityVisual({kind='admissions',active=0}:{kind?:keyof typeof content;active?:number}) {
  const item=content[kind];
  return <div className={styles.visual} aria-label={item.label}>
    <small>SIVORA / {item.label}</small>
    <div className={styles.visualHead}><strong>{item.title}</strong><span aria-hidden="true">↗</span></div>
    <div className={styles.visualRows}>{item.rows.map((row,i)=><div className={styles.visualRow} key={row} style={i===active%3?{borderColor:'#698797'}:undefined}><span>0{i+1}</span><span>{row}</span><span aria-hidden="true">→</span></div>)}</div>
    <div className={styles.visualFoot}><span>{item.foot}</span></div>
  </div>;
}
