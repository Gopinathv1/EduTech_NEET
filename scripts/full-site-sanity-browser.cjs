/* Local-only rendered evidence collector. Never use against a deployed site. */
const fs = require('fs');
const { chromium } = require('@playwright/test');
require('@next/env').loadEnvConfig(process.cwd());
const base = 'http://localhost:3010';
const routes = require('../reports/full-site-sanity-routes.json');
const fixtures = JSON.parse(fs.readFileSync('tmp/sanity-fixtures.json', 'utf8'));
const publicDynamic = [
  ...['russia','georgia','vietnam','armenia','uzbekistan','kyrgyzstan','tajikistan','kazakhstan'].map(x=>`/admissions/${x}`),
  ...[...fs.readFileSync('lib/marketplace/catalog.ts','utf8').matchAll(/slug: '([^']+)'/g)].map(x=>`/marketplace/${x[1]}`),
];
async function cookie(kind) {
  const { SignJWT } = await import('jose');
  const account = fixtures[kind];
  return new SignJWT({kind,role:kind==='admin'?'SUPER_ADMIN':kind==='partner'?'PARTNER':'STUDENT',name:'Sanity Review',agencyId:account.agencyId})
    .setProtectedHeader({alg:'HS256'}).setSubject(account.id).setIssuer('neet-platform').setAudience('neet-platform')
    .setIssuedAt().setExpirationTime('2h').sign(new TextEncoder().encode(process.env.JWT_SECRET));
}
(async()=>{
 fs.mkdirSync('reports/sanity-evidence',{recursive:true});
 const browser=await chromium.launch({headless:true}); const results=[];
 const scope=process.argv[2]||'public';
 let list=routes.filter(r=>r.category!=='API / NON-VISUAL'&&!r.dynamic);
 if(scope==='public') list=list.filter(r=>!r.auth).concat(publicDynamic.map(route=>({route,category:'PUBLIC'})));
 if(scope==='protected') list=list.filter(r=>r.auth&&!r.route.startsWith('/partner')).concat(fixtures.tests.filter(t=>t.isPublished).flatMap(t=>[
   {route:`/student/tests/${t.id}`,category:'STUDENT',auth:true},
   {route:`/student/tests/${t.id}/start`,category:'EXAM',auth:true},
   {route:`/student/tests/${t.id}/checkout`,category:'STUDENT',auth:true},
   {route:`/admin/tests/${t.id}`,category:'ADMIN',auth:true},
 ]));
 if(scope==='dynamic') list=routes.filter(r=>r.auth&&r.route.startsWith('/partner')).concat([
  {route:`/admin/partners/${fixtures.partner.agencyId}`,category:'ADMIN',auth:true},
  {route:`/admin/students/${fixtures.student.id}`,category:'ADMIN',auth:true},
  {route:`/admin/question-bank/${fixtures.question.id}`,category:'ADMIN',auth:true},
  {route:`/admin/question-bank/${fixtures.question.id}/history`,category:'ADMIN',auth:true},
  ...fixtures.results.map(x=>({route:`/student/results/${x.attemptId}`,category:'RESULT',auth:true})),
  ...fixtures.tests.filter(t=>t.isPublished).flatMap(t=>['','/start','/checkout'].map(s=>({route:`/student/tests/${t.id}${s}`,category:s==='/start'?'EXAM':'STUDENT',auth:true}))),
  ...fixtures.tests.filter(t=>t.isPublished).map(t=>({route:`/admin/tests/${t.id}`,category:'ADMIN',auth:true})),
 ]);
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  const context=await browser.newContext({viewport});const page=await context.newPage();
  for(const r of list){
   await context.clearCookies();
   if(r.auth)await context.addCookies([{name:'session',value:await cookie(r.route.startsWith('/admin')?'admin':r.route.startsWith('/partner')?'partner':'student'),url:base}]);
   const errors=[],failed=[];const onError=e=>errors.push(e.message);const onConsole=m=>{if(m.type()==='error')errors.push(m.text())};const onResponse=res=>{if(res.status()>=400)failed.push({url:res.url().replace(base,''),status:res.status()})};
   page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
   const entry={route:r.route,category:r.category,viewport,errors,failed,actions:[]};
   try{
    const response=await page.goto(base+r.route,{waitUntil:'networkidle',timeout:90000});await page.waitForTimeout(250);
    entry.httpStatus=response.status();entry.finalPath=new URL(page.url()).pathname;
    entry.render=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),controls:[...document.querySelectorAll('a,button,input,select,textarea,summary')].map((e,index)=>{const rect=e.getBoundingClientRect();return {index,tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||e.name||'').trim().slice(0,160),href:e.getAttribute('href'),type:e.type,disabled:e.disabled||false,visible:rect.width>0&&rect.height>0,width:Math.round(rect.width),height:Math.round(rect.height)}})}));
    const summaries=page.locator('summary');for(let i=0;i<await summaries.count();i++){await summaries.nth(i).click();entry.actions.push({control:'summary',index:i,action:'open/close',open:await summaries.nth(i).evaluate(e=>e.parentElement.open)});await summaries.nth(i).click();}
    const forms=page.locator('form');entry.forms=[];for(let i=0;i<await forms.count();i++){entry.forms.push(await forms.nth(i).evaluate(e=>({fields:[...e.querySelectorAll('input,select,textarea')].map(x=>({name:x.name,type:x.type,required:x.required,label:x.labels?.[0]?.textContent})),emptyValid:e.checkValidity()})));}
    entry.assetChecks=[];
    for(const src of entry.render.brokenImages){const res=await context.request.get(new URL(src,base).href);entry.assetChecks.push({src,status:res.status(),note:res.ok()?'Deferred image URL resolves; not proof of visual load':'Asset request failed'});}
    const screenshot=`reports/sanity-evidence/${scope}-${viewport.width}-${r.route.replace(/[^a-z0-9]/gi,'_')||'home'}.png`;await page.screenshot({path:screenshot,fullPage:true});entry.screenshot=screenshot;
   }catch(e){entry.failure=e.message}
   page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);results.push(entry);
   fs.writeFileSync(`reports/sanity-${scope}-browser.json`,JSON.stringify(results,null,2));
   console.log(JSON.stringify({route:r.route,width:viewport.width,status:entry.httpStatus,overflow:entry.render?.overflow,errors:errors.length,failure:entry.failure}));
  }
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
