'use client';
import { useId, useState } from 'react';
import OpportunityVisual from './OpportunityVisual';
import styles from './RouteExperience.module.css';

const journey=[
  {title:'DISCOVER',headline:'Start with what matters to you.',body:'Explore your interests, study paths and destinations. Bring your goals and questions into a conversation with SIVORA.',href:'/counselling'},
  {title:'PREPARE',headline:'Build a practical plan.',body:'Review your academic profile, preparation needs and documents. Understand the steps that connect your starting point to your chosen path.',href:'/exam-preparation'},
  {title:'APPLY',headline:'Take your next step with clarity.',body:'Compare universities and destinations, prepare applications and understand admission and visa requirements.',href:'/admissions'},
  {title:'LEARN',headline:'Settle in. Keep learning.',body:'Prepare for departure, arrival and university onboarding, with guidance for the transition into your studies.',href:'/courses'},
  {title:'SUCCEED',headline:'Keep your future in view.',body:'Build on your education with skills, resources and continued guidance for your next decision.',href:'/counselling'},
];
export default function JourneyExperience({steps}:{steps?:string[]}) {
  const [active,setActive]=useState(0);const id=useId();
  const items=steps?steps.map((title,i)=>({title,headline:['Understand your starting point.','Explore the possibilities.','Compare what matters.','Make your next step clear.','Move forward with guidance.'][i]??title,body:['Bring your interests, goals and academic background into the conversation.','Review courses, destinations and career pathways that fit your goals.','Consider course fit, cost, location and entry requirements together.','Turn your shortlist into a practical sequence of next steps.','Return to your plan as new questions and opportunities arise.'][i]??'',href:'#callback'})):journey;
  const item=items[active];
  return <div className={styles.lifecycle}>
    <div className={styles.tabs} role="tablist" aria-label="Journey stages">{items.map((s,i)=><button key={s.title} id={`${id}-tab-${i}`} role="tab" aria-selected={active===i} aria-controls={`${id}-panel`} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;setActive(next);document.getElementById(`${id}-tab-${next}`)?.focus();}}}>0{i+1} / {s.title}</button>)}</div>
    <div className={styles.stage} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}><div><small>0{active+1} / {item.title}</small><h3>{item.headline}</h3><p>{item.body}</p><a href={item.href}>Explore your next step →</a></div><OpportunityVisual kind={steps?'counselling':'admissions'} active={active}/></div>
  </div>;
}
