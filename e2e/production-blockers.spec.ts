import { test, expect, type Page } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { signSession } from '../lib/auth/jwt';
import { canShuffleOptions, canonicalToDisplay, optionDisplayOrder } from '../lib/attempts/options';
loadEnvConfig(process.cwd());
for(const name of ['DATABASE_URL','DIRECT_URL']){const u=new URL(process.env[name]!);if(u.hostname!=='127.0.0.1'||u.port!=='5433'||u.pathname!=='/sivora_sanity_staging')throw Error('Isolated released staging required');}
const db=new PrismaClient();
const evidence:unknown[]=[];
test.afterAll(async()=>{const file='reports/sanity-representative-exams.json';const prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];const combined=new Map([...prior,...evidence].map((r:any)=>[r.exam+':'+r.mode,r]));fs.writeFileSync(file,JSON.stringify([...combined.values()],null,2));await db.$disconnect();});
const samples=['NEET','JEE'].flatMap(exam=>[
  {exam,label:'Full Mock',id:exam==='NEET'?'sivora-neet-full-mock-1':'sivora-jee-main-full-mock-1'},
  ...[2021,2022,2023,2024,2025].map(year=>({exam,label:`${year} PYQ`,id:exam==='NEET'?`neet-pyq-${year}-verified-partial`:`jee-pyq-${year}-year-practice`})),
  {exam,label:'Mixed',id:`${exam.toLowerCase()}-pyq-mixed-2021-2025`},
  {exam,label:'Subject-wise',id:exam==='NEET'?'neet-pyq-mixed-physics':'jee-pyq-mixed-jee_physics'},
  {exam,label:'Chapter-wise',id:''},
  {exam,label:'Conceptual nature',id:`${exam.toLowerCase()}-pyq-mixed-2021-2025`,nature:'CONCEPTUAL_THEORY'},
  {exam,label:'Numerical/problem-solving nature',id:`${exam.toLowerCase()}-pyq-mixed-2021-2025`,nature:'NUMERICAL_PROBLEM_SOLVING'},
]);
async function jump(page:Page,number:number){
  if(await page.getByRole('button',{name:'Questions',exact:true}).isVisible() && !await page.locator('#exam-palette').isVisible())await page.getByRole('button',{name:'Questions',exact:true}).click();
  await page.getByRole('button',{name:new RegExp(`^${number}: `)}).click();
}
for(const sample of samples)test(`${sample.exam}: ${sample.label} representative lifecycle`,async({page,context})=>{
  const errors:string[]=[],payments:string[]=[];page.on('pageerror',e=>errors.push(new URL(page.url()).pathname+': '+e.message));page.on('request',r=>{if(/razorpay|payments\/(create-order|retry-order)/.test(r.url()))payments.push(r.url());});
  const student=await db.student.create({data:{name:'Isolated representative verification',email:`representative-${randomUUID()}@example.test`,isEmailVerified:true}});
  await context.addCookies([{name:'session',value:await signSession({sub:student.id,kind:'student',role:'STUDENT',name:student.name}),url:'http://localhost:3010'}]);
  let id=sample.id;
  if(!id){const chapter=await db.test.findFirstOrThrow({where:{id:{startsWith:`${sample.exam.toLowerCase()}-pyq-mixed-`},testType:'CHAPTER_TEST',totalQuestions:{gte:3}},orderBy:{id:'asc'}});id=chapter.id;}
  const suffix='nature' in sample?`?nature=${sample.nature}`:'';
  await page.goto(`/student/tests/${id}/start${suffix}`);
  await page.getByRole('button',{name:'Start Test',exact:true}).click();
  await expect(page).toHaveURL(/\/attempt$/);await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  const initial=await db.testAttempt.findFirstOrThrow({where:{studentId:student.id,testId:id,status:'IN_PROGRESS'}});
  const definition=await db.test.findUniqueOrThrow({where:{id}});
  const rows=await db.question.findMany({where:{id:{in:initial.questionOrder}},include:{translations:true,subject:true}});
  const ordered=initial.questionOrder.map(id=>rows.find(q=>q.id===id)!);
  if('nature' in sample)expect(ordered.every(q=>q.questionNature===sample.nature)).toBe(true);
  if(sample.label==='Full Mock'){expect(initial.questionOrder.length).toBe(sample.exam==='NEET'?180:75);expect(definition.durationMinutes).toBe(180);expect(definition.price).toBe(0);expect(definition.isPublished).toBe(true);}
  let selected=sample.label==='Full Mock'?[...new Map(ordered.map(q=>[q.subject.code+(sample.exam==='JEE'?q.questionType:''),q])).values()]:[ordered.find(q=>q.questionType==='SINGLE_CORRECT'),ordered.find(q=>q.questionType==='NUMERICAL_VALUE'),ordered[Math.floor(ordered.length/2)],ordered.at(-1)].filter(Boolean).slice(0,3) as typeof ordered;
  selected=[...new Map(selected.map(q=>[q.id,q])).values()];
  const answers=new Map<string,string>();let expected=0;
  for(const [index,q] of selected.entries()){
    const number=initial.questionOrder.indexOf(q.id)+1;await jump(page,number);
    const en=q.translations.find(t=>t.language==='en')!;
    await expect(page.getByText(en.questionText,{exact:true})).toBeVisible();expect(en.questionText.trim().length).toBeGreaterThan(10);expect(/[\uFFFD]|Ã.|â€/.test(en.questionText)).toBe(false);
    const correct=index!==1;
    if(q.questionType==='NUMERICAL_VALUE'){const value=String(Number(en.numericAnswer)+(correct?0:100));await page.getByLabel('Numerical answer',{exact:true}).fill(value);await page.getByLabel('Numerical answer',{exact:true}).blur();answers.set(q.id,value);}
    else {const order=optionDisplayOrder(initial.seed,q.id,initial.shuffleOptions&&canShuffleOptions(en,q.questionType));let letter=canonicalToDisplay(order,en.correctOption!);if(!correct)letter=letter==='A'?'B':'A';await expect(page.getByRole('radio')).toHaveCount(4);await page.locator('label').filter({has:page.getByRole('radio')}).nth(['A','B','C','D'].indexOf(letter)).click();answers.set(q.id,letter);}
    expected+=correct?4:-1;
    await expect(page.getByText('Saved',{exact:true})).toBeVisible();
    for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await page.screenshot({path:`reports/sanity-evidence/representative-${sample.exam}-${sample.label.replace(/[^a-z0-9]/gi,'_')}-${number}-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await page.setViewportSize({width:1440,height:1000});
  }
  const timer=await page.getByRole('timer').textContent();await expect.poll(()=>page.getByRole('timer').textContent()).not.toBe(timer);
  await page.getByRole('button',{name:/Previous/}).click();await page.getByRole('button',{name:/Save.*Next/}).click();
  await page.reload();await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  await page.goto(`/student/tests/${id}/start${suffix}`);await page.getByRole('button',{name:'Resume Test',exact:true}).click();await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  const resumed=await db.testAttempt.findUniqueOrThrow({where:{id:initial.id}});expect(resumed.startedAt).toEqual(initial.startedAt);expect(resumed.questionOrder).toEqual(initial.questionOrder);expect(resumed.seed).toBe(initial.seed);
  for(const q of selected){await jump(page,initial.questionOrder.indexOf(q.id)+1);if(q.questionType==='NUMERICAL_VALUE')await expect(page.getByLabel('Numerical answer')).toHaveValue(answers.get(q.id)!);else await expect(page.getByRole('radio').nth(['A','B','C','D'].indexOf(answers.get(q.id)!))).toBeChecked();}
  await page.route('**/monitoring',r=>r.fulfill({status:503,json:{ok:false,error:'INTERNAL_ERROR'}}));
  await page.evaluate(()=>{document.dispatchEvent(new Event('copy'));document.dispatchEvent(new Event('paste'));document.dispatchEvent(new MouseEvent('contextmenu'));window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});
  await page.getByRole('button',{name:/Previous/}).click();await page.getByRole('button',{name:/Save.*Next/}).click();await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  await page.getByRole('banner').getByRole('button',{name:'Submit test',exact:true}).click();await page.getByRole('button',{name:'Yes, submit',exact:true}).click();await expect(page).toHaveURL(`/student/results/${initial.id}`);
  const result=await db.result.findUniqueOrThrow({where:{attemptId:initial.id}});expect(result.score).toBe(expected);expect(result.totalQuestions).toBe(initial.questionOrder.length);
  await page.getByRole('tab',{name:'Answer review',exact:true}).click();await expect(page.getByText(selected[0].translations.find(t=>t.language==='en')!.questionText,{exact:true}).first()).toBeVisible();await page.getByRole('tab',{name:'Analysis',exact:true}).click();
  await page.getByRole('link',{name:'Take Another Attempt',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/student/tests/${id}/start`));await page.getByRole('button',{name:'Start Test',exact:true}).click();await expect(page).toHaveURL(/\/attempt$/);await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  expect(await db.testAttempt.count({where:{studentId:student.id,testId:id}})).toBe(2);expect(errors).toEqual([]);expect(payments).toEqual([]);
  evidence.push({exam:sample.exam,mode:sample.label,testId:id,selectedQuestions:selected.map(q=>({externalId:q.externalId,type:q.questionType,subject:q.subject.code,nature:q.questionNature})),sampleSize:selected.length,totalQuestions:initial.questionOrder.length,expectedScore:expected,actualScore:result.score,viewports:[1440,390],checks:'render/text/options/input/navigation/timer/refresh/resume/submit/score/review/retake/monitoring transport failure',status:'PASS',scope:'isolated staging using repository artifacts; production text/options hashes reconciled separately'});
});
