const fs=require('fs');const {chromium}=require('@playwright/test');
const base='http://localhost:3010';
(async()=>{
 const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const results=[];
 const sources=JSON.parse(fs.readFileSync('reports/sanity-public-browser.json','utf8')).filter(x=>x.viewport.width===1440&&x.render&&['PUBLIC','ADMISSIONS'].includes(x.category));
 // Shared chrome destinations are exercised once; per-page content links are retained separately.
 const shared=new Set();
 for(const source of sources){
  await page.goto(base+source.route,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForTimeout(500);
  const links=await page.locator('a').evaluateAll(es=>es.map((e,i)=>({index:i,href:e.getAttribute('href'),text:e.innerText.trim(),shared:!!e.closest('header,footer'),visible:!!e.getBoundingClientRect().width})));
  for(const link of links){
   const row={route:source.route,control:link.text||link.href,href:link.href,type:'link'};
   if(!link.href){row.status='NO_DESTINATION';results.push(row);continue}
   if(link.shared&&shared.has(link.href)){row.status='SHARED_DESTINATION_COVERED_SEPARATELY';results.push(row);continue}
   if(link.shared)shared.add(link.href);
   if(!link.href.startsWith('/')&&!link.href.startsWith('#')){row.status='DESTINATION_CONSTRUCTION_ONLY';try{row.protocol=new URL(link.href).protocol}catch{row.status='INVALID_URL'}results.push(row);continue}
   try{
    await page.goto(base+source.route,{waitUntil:'domcontentloaded',timeout:90000});
    const target=page.locator('a').nth(link.index);
    if(!await target.isVisible()) {row.status='HIDDEN_CONTROL_NOT_CLICKED';results.push(row);continue}
    const href=await target.getAttribute('href');if(href!==link.href){row.status='DOM_CHANGED_NOT_CLICKED';results.push(row);continue}
    if(link.href==='#main-content'){await target.focus();await target.press('Enter');}
    else await target.click({timeout:7000});await page.waitForTimeout(150);
    row.destination=new URL(page.url()).pathname+new URL(page.url()).hash;
    if(link.href.startsWith('#'))row.status=await page.evaluate(h=>!!document.getElementById(h.slice(1)),link.href)?'ANCHOR_CLICKED':'BROKEN_FRAGMENT';
    else {row.status='CLICKED';if(new URL(link.href,base).hash)row.fragmentExists=await page.evaluate(h=>!!document.getElementById(h.slice(1)),new URL(link.href,base).hash);}
   }catch(e){row.status='CLICK_FAILED';row.error=e.message.split('\n')[0]}
   results.push(row);fs.writeFileSync('reports/sanity-control-actions.json',JSON.stringify(results,null,2));
  }
  console.log(source.route+': links exercised');
 }
 fs.writeFileSync('reports/sanity-control-actions.json',JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
