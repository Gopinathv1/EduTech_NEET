'use client';
import { useId, useState } from 'react';
import OpportunityVisual from './OpportunityVisual';
import styles from './RouteExperience.module.css';

const journey=[
  {title:'UNDERSTAND GOALS',headline:'Start with what matters to you.',body:'Bring your goals, interests, academic background and family questions into the conversation.',href:'/counselling'},
  {title:'EXPLORE PATHWAYS',headline:'See the routes that fit.',body:'Explore courses, destinations and broader international education pathways with context.',href:'/admissions'},
  {title:'COMPARE OPTIONS',headline:'Consider the trade-offs.',body:'Review destination, course, cost, travel and entry considerations before shortlisting.',href:'/admissions/compare'},
  {title:'COUNSELLING',headline:'Make the next decision clearer.',body:'Talk through your priorities and questions with SIVORA Counselling & Career Guidance.',href:'/counselling'},
  {title:'APPLICATION',headline:'Prepare the process.',body:'Understand the relevant application sequence, information and documentation for your chosen path.',href:'/admission-journey'},
  {title:'ADMISSION',headline:'Follow the institution’s process.',body:'Receive guidance around applicable admission communication and the next steps it sets out.',href:'/admission-journey'},
  {title:'NEXT STEPS',headline:'Keep moving with clarity.',body:'Plan applicable pre-departure and onward steps while staying mindful that authorities and institutions make the final decisions.',href:'/contact'},
];
export default function JourneyExperience({steps}:{steps?:string[]}) {
  const [active,setActive]=useState(0);const id=useId();
  const items=steps?steps.map((title,i)=>({title,headline:['Understand your starting point.','Explore the possibilities.','Compare what matters.','Make your next step clear.','Prepare the process.','Follow the institution’s process.','Move forward with guidance.'][i]??title,body:['Bring your interests, goals and academic background into the conversation.','Review courses, destinations and career pathways that fit your goals.','Consider course fit, cost, location and entry requirements together.','Turn your shortlist into a practical sequence of next steps.','Organize the relevant application information and documents.','Understand the next steps in the applicable admission process.','Return to your plan as new questions and opportunities arise.'][i]??'',href:'#callback'})):journey;
  const item=items[active];
  return <div className={styles.lifecycle}>
    <div className={styles.tabs} role="tablist" aria-label="Journey stages">{items.map((s,i)=><button key={s.title} id={`${id}-tab-${i}`} role="tab" aria-selected={active===i} aria-controls={`${id}-panel`} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;setActive(next);document.getElementById(`${id}-tab-${next}`)?.focus();}}}>0{i+1} / {s.title}</button>)}</div>
    <div className={styles.stage} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}><div><small>0{active+1} / {item.title}</small><h3>{item.headline}</h3><p>{item.body}</p><a href={item.href}>Explore your next step →</a></div><OpportunityVisual kind={steps?'counselling':'admissions'} active={active}/></div>
  </div>;
}
