// Complete browser + database verification. Both URLs are REQUIRED to target the isolated DB.
const { chromium, expect: baseExpect } = require('@playwright/test');
// The local Next development server may compile an API route on first use.
const expect = baseExpect.configure({ timeout: 30000 });
const { readFileSync, writeFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fixture = JSON.parse(readFileSync('test-results/neet-fixture.json', 'utf8'));
const base = 'http://localhost:3100';
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[key] ?? '');
  assert.equal(url.hostname, '127.0.0.1', `${key} must be local`);
  assert.equal(url.port, '55432', `${key} must use the isolated instance`);
}
const db = new PrismaClient();
const evidence = { transitions: [], widths: [], checks: [], pageErrors: [], paymentRequests: [] };
const password = 'Local-NEET-Test-2026!';
const clockSeconds = text => text.match(/\d+:\d{2}:\d{2}/)[0].split(':').reduce((n, v) => n * 60 + Number(v), 0);
async function main() {
  const users = await Promise.all([0, 1].map(async i => db.student.create({ data: {
    name: `Browser NEET ${Date.now()} ${i}`, mobile: `+9198${String(Date.now() + i).slice(-8)}`,
    passwordHash: await bcrypt.hash(password, 10),
  } })));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('request', req => { if (/razorpay|payments\/create-order/.test(req.url())) evidence.paymentRequests.push(req.url()); });
  const used = (testId = fixture.testId, studentId = users[0].id) => db.testAttempt.count({ where: { studentId, testId } });
  const active = () => db.testAttempt.findFirstOrThrow({ where: { studentId: users[0].id, testId: fixture.testId, status: 'IN_PROGRESS' } });
  const api = async (path, data = {}) => {
    const res = await context.request.post(`${base}${path}`, { data });
    return { status: res.status(), body: await res.json() };
  };
  async function login(user = users[0]) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Mobile number', { exact: true }).fill(user.mobile);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(/\/student$/);
  }
  const saved = () => expect(page.getByText('Saved', { exact: true })).toBeVisible();
  async function select(text) {
    await page.locator('label').filter({ has: page.getByText(text, { exact: true }) }).click();
    await saved();
  }
  async function palette(number, status) {
    await expect(page.getByRole('button', { name: `${number}: ${status}`, exact: true })).toBeVisible();
  }
  async function subject(name, number) {
    await page.getByRole('button', { name: new RegExp(`^${name} \\d+/45$`) }).click();
    await expect(page.getByText(`Question ${number} of 180`, { exact: true })).toBeVisible();
    await saved();
  }
  async function submit() {
    await page.getByRole('button', { name: 'Submit test', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
    await page.waitForURL(/\/student\/results\//);
    await expect(page.getByRole('heading', { name: 'NEET Mock Test Result', exact: true })).toBeVisible();
  }
  try {
    assert.equal((await api('/api/attempts', { testId: fixture.testId, language: 'en' })).status, 401);
    // A protected deep link must preserve its exact safe callback.
    await page.goto(`${base}/student/tests/${fixture.testId}/start`);
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.equal(new URL(page.url()).searchParams.get('callbackUrl'), `/student/tests/${fixture.testId}/start`);
    await login();
    evidence.transitions.push('Login → Student dashboard');
    await page.getByRole('link', { name: 'Exam Preparation', exact: true }).click();
    await page.waitForURL('**/exam-preparation');
    evidence.transitions.push('Student dashboard → Exam Preparation');
    await page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'NEET', exact: true }) }).click();
    await page.waitForURL('**/exam-preparation/neet');
    evidence.transitions.push('Exam Preparation → NEET');
    await page.getByRole('link', { name: /Full NEET Mock Tests/i }).click();
    await page.waitForURL('**/student/tests?type=FULL_TEST');
    evidence.transitions.push('NEET → Full Mock catalogue');
    assert.equal(await used(), 0);
    await page.locator(`a[href="/student/tests/${fixture.testId}"]`).first().click();
    await page.waitForURL(`**/student/tests/${fixture.testId}`);
    assert.equal(await used(), 0);
    evidence.transitions.push('Catalogue → Test detail');
    await page.locator(`a[href="/student/tests/${fixture.testId}/start"]`).first().click();
    await page.waitForURL('**/start');
    await expect(page.getByText('3 free attempts remaining / 3', { exact: true })).toBeVisible();
    assert.equal(await used(), 0);
    evidence.transitions.push('Test detail → Instructions (zero consumed)');
    await page.getByRole('button', { name: 'Start Test', exact: true }).click();
    await page.waitForURL('**/attempt');
    await saved();
    assert.equal(await used(), 1);
    const attempt = await active();
    evidence.transitions.push('Instructions → Exam (one consumed)');
    const questions = await db.question.findMany({ where: { id: { in: attempt.questionOrder } }, include: { subject: true } });
    const distribution = Object.fromEntries(['PHYSICS','CHEMISTRY','BOTANY','ZOOLOGY'].map(code => [code, questions.filter(q => q.subject.code === code).length]));
    assert.deepEqual(distribution, { PHYSICS:45, CHEMISTRY:45, BOTANY:45, ZOOLOGY:45 });
    evidence.distribution = distribution;
    await palette(1, 'Not answered'); await palette(5, 'Not visited');
    await select('2000'); await palette(1, 'Answered');
    await page.getByRole('button', { name: 'Mark for Review & Next', exact: true }).click();
    await saved(); await palette(1, 'Answered & Marked for Review');
    await select('2000');
    await page.getByRole('button', { name: 'Clear response', exact: true }).click();
    await saved(); await palette(2, 'Not answered');
    await page.getByRole('button', { name: 'Mark for Review & Next', exact: true }).click();
    await saved(); await palette(2, 'Marked for review');
    await page.getByRole('button', { name: 'Save & Next →', exact: true }).click();
    await saved(); await palette(3, 'Not answered');
    await select('2000'); await palette(4, 'Answered'); await palette(5, 'Not visited');
    await page.screenshot({ path: 'test-results/neet-palette-desktop.png', fullPage: true });
    await subject('Chemistry', 46); await select('200');
    await subject('Botany', 91); await select('2000');
    await subject('Zoology', 136); await select('2000');
    await subject('Physics', 1);
    await expect(page.locator('label').filter({has:page.getByText('2000',{exact:true})}).locator('input')).toBeChecked();
    const before = clockSeconds(await page.getByRole('timer').innerText());
    // Alter the browser wall clock without altering the server or monotonic clock.
    await page.clock.setFixedTime(new Date('2035-01-01T00:00:00Z'));
    const afterClockChange = clockSeconds(await page.getByRole('timer').innerText());
    assert(afterClockChange <= before);
    await page.reload(); await saved();
    const afterRefresh = clockSeconds(await page.getByRole('timer').innerText());
    assert(afterRefresh <= before); assert.equal(await used(), 1);
    const syncStarted = performance.now();
    const remaining = (await api(`/api/attempts/${attempt.id}/sync`)).body.remainingSeconds;
    const syncElapsed = Math.ceil((performance.now() - syncStarted) / 1000);
    assert(remaining <= afterRefresh && afterRefresh - remaining <= syncElapsed + 3, `timer: refresh=${afterRefresh}, server=${remaining}, requestSeconds=${syncElapsed}`);
    evidence.timer = { before, afterClockChange, afterRefresh, serverRemaining: remaining, syncElapsed };
    for (const [n, status] of [[1,'Answered & Marked for Review'],[2,'Marked for review'],[3,'Not answered'],[4,'Answered'],[5,'Not visited']]) await palette(n,status);
    evidence.checks.push('All five palette states, select/clear/mark/save-next, all subjects, refresh persistence, browser clock tampering, server timer');
    // Verify mobile with a phone-height viewport as well as tablet and desktop.
    for (const width of [360,390,430,768,1440]) {
      await page.setViewportSize({width,height:width < 768 ? 844 : 1000});
      await page.evaluate(() => window.scrollTo(0,0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`);
      assert(await page.getByRole('timer').isVisible());
      assert(await page.getByRole('button',{name:'Submit test',exact:true}).first().isVisible());
      const labels = await page.locator('label').evaluateAll(items=>items.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
      assert(labels.every(b=>b.w>=200 && b.h>=44));
      for (const name of ['Physics','Chemistry','Botany','Zoology']) assert(await page.getByRole('button',{name:new RegExp(`^${name} \\d+/45$`)}).isVisible());
      await page.screenshot({path:`test-results/neet-${width}.png`,fullPage:true});
      if (width<1024) {
        const toggle=page.getByRole('button',{name:'Questions',exact:true});
        if(await toggle.getAttribute('aria-expanded')!=='true') await toggle.click();
      }
      await palette(1,'Answered & Marked for Review');
      await page.getByRole('button',{name:'4: Answered',exact:true}).click();
      await saved();
      await expect(page.getByText('Question 4 of 180',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Submit test',exact:true}).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button',{name:'Keep going',exact:true}).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      evidence.widths.push({width,overflow:false,optionMinHeight:Math.min(...labels.map(b=>b.h)),timer:true,subjects:true,palette:true});
    }
    // Manual submission confirmation can be cancelled and then safely submitted.
    await page.getByRole('button',{name:'Submit test',exact:true}).first().click();
    const dialog=page.getByRole('dialog'); await expect(dialog).toBeVisible();
    const dialogCount=async label=>dialog.locator('dl > div').filter({has:page.getByText(label,{exact:true})}).locator('dd').innerText();
    assert.equal(await dialogCount('Answered'),'5 / 180');
    assert.equal(await dialogCount('Marked for review'),'2 / 180');
    await page.getByRole('button',{name:'Keep going',exact:true}).click();
    await expect(dialog).not.toBeVisible();
    await submit();
    const result=await db.result.findUniqueOrThrow({where:{attemptId:attempt.id}});
    assert.equal(result.score,15); assert.equal(result.correct,4); assert.equal(result.wrong,1); assert.equal(result.skipped,175); assert.equal(result.totalQuestions,180);
    const breakdown=Object.fromEntries(await Promise.all(Object.entries(result.subjectAnalysis).map(async([id,row])=>[(await db.subject.findUniqueOrThrow({where:{id}})).code,row])));
    assert.deepEqual(breakdown.PHYSICS,{correct:2,wrong:0,skipped:43,total:45});
    assert.deepEqual(breakdown.CHEMISTRY,{correct:0,wrong:1,skipped:44,total:45});
    assert.deepEqual(breakdown.BOTANY,{correct:1,wrong:0,skipped:44,total:45});
    assert.deepEqual(breakdown.ZOOLOGY,{correct:1,wrong:0,skipped:44,total:45});
    evidence.result={score:15,max:720,correct:4,incorrect:1,unanswered:175,attempted:5,accuracy:80,subjects:breakdown};
    const submitted=await db.testAttempt.findUniqueOrThrow({where:{id:attempt.id}});
    const elapsed=Math.min(10800,Math.max(0,Math.floor((submitted.submittedAt-submitted.startedAt)/1000)));
    const elapsedText=elapsed<60 ? `${elapsed}s` : `${Math.floor(elapsed/60)}m ${elapsed%60}s`;
    await expect(page.locator('dl > div').filter({has:page.getByText('Time taken',{exact:true})}).locator('dd')).toHaveText(elapsedText);
    evidence.result.timeTakenSeconds=elapsed;
    for (const width of [360,390,430]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`result overflow ${width}`);
    }
    await page.setViewportSize({width:1440,height:1000});
    await expect(page.getByText('80%',{exact:true}).first()).toBeVisible();
    const table=page.locator('table');
    await expect(table.getByRole('row')).toHaveCount(5);
    await page.screenshot({path:'test-results/neet-result.png',fullPage:true});
    assert.equal((await api(`/api/attempts/${attempt.id}/answer`,{questionId:attempt.questionOrder[0],action:'clear'})).status,409);
    assert.equal((await api(`/api/attempts/${attempt.id}/submit`)).status,200);
    assert.equal(await db.result.count({where:{attemptId:attempt.id}}),1);
    await page.getByRole('tab',{name:/review/i}).click();
    await expect(page.getByText('2 × 1000 = 2000.',{exact:true}).first()).toBeVisible();
    await expect(page.getByRole('heading',{name:'Attempt history'})).toBeVisible();
    evidence.checks.push('Server score 15/720, 4 correct/1 incorrect/175 unanswered, 80% accuracy, four subject rows, stored explanation review, immutable submission, idempotence');
    // Repeat via the UI: three real attempts and no fourth start.
    for(let n=2;n<=3;n++) {
      await page.getByRole('link',{name:'Take another attempt',exact:true}).click();
      await page.waitForURL('**/start');
      await expect(page.getByText(new RegExp(`${4-n} free attempt.*remaining / 3`))).toBeVisible();
      assert.equal(await used(),n-1);
      await page.getByRole('button',{name:'Start Test',exact:true}).click();
      await page.waitForURL('**/attempt'); await saved(); assert.equal(await used(),n);
      await submit();
    }
    await expect(page.getByText('3 / 3 attempts used',{exact:true})).toBeVisible();
    assert.equal(await page.getByRole('link',{name:'Take another attempt',exact:true}).count(),0);
    await page.goto(`${base}/student/tests/${fixture.testId}/start`);
    await expect(page.getByText('You have used your 3 free attempts for this test.',{exact:true})).toBeVisible();
    assert.equal((await api('/api/attempts',{testId:fixture.testId,language:'en'})).body.error,'attemptLimitReached');
    assert.equal(await used(),3);
    await api('/api/auth/logout'); await login();
    assert.equal((await api('/api/attempts',{testId:fixture.testId,language:'en'})).body.error,'attemptLimitReached');
    await page.goto(`${base}/student/tests/${fixture.secondTestId}/start`);
    await expect(page.getByText('3 free attempts remaining / 3',{exact:true})).toBeVisible();
    assert.equal(await used(fixture.secondTestId),0);
    const second=await api('/api/attempts',{testId:fixture.secondTestId,language:'en'}); assert(second.body.ok);
    await api('/api/auth/logout'); await login(users[1]);
    await page.goto(`${base}/student/tests/${fixture.testId}/start`);
    await expect(page.getByText('3 free attempts remaining / 3',{exact:true})).toBeVisible();
    const own=await api('/api/attempts',{testId:fixture.testId,language:'en'}); assert(own.body.ok);
    assert.equal(await used(fixture.testId,users[1].id),1);
    // Exact expiry rejection and server worker with browser-independent finalization.
    await db.testAttempt.update({where:{id:own.body.attemptId},data:{startedAt:new Date(Date.now()-181*60_000)}});
    assert.equal((await api(`/api/attempts/${own.body.attemptId}/answer`,{questionId:attempt.questionOrder[0],action:'answer',selectedOption:'A'})).status,409);
    assert.equal((await db.testAttempt.findUniqueOrThrow({where:{id:own.body.attemptId}})).status,'AUTO_SUBMITTED');
    await db.testAttempt.update({where:{id:second.body.attemptId},data:{startedAt:new Date(Date.now()-181*60_000)}});
    const worker=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/expire-attempts.ts','--once'],{encoding:'utf8',env:{...process.env,NODE_ENV:'test'}});
    assert.equal(worker.status,0,worker.stderr);
    assert.equal((await db.testAttempt.findUniqueOrThrow({where:{id:second.body.attemptId}})).status,'AUTO_SUBMITTED');
    evidence.checks.push('Attempts 1/2/3 through UI, fourth blocked, logout/login persistence, independent test/user quotas, exact expiry rejection, real expiry worker');
    assert.deepEqual(evidence.pageErrors,[]); assert.deepEqual(evidence.paymentRequests,[]);
    evidence.status='PASS';
    console.log(JSON.stringify(evidence,null,2));
  } catch(error) {
    evidence.status='FAIL'; evidence.failure=error.message;
    console.log('Failed page',page.url(),(await page.locator('body').innerText()).slice(0,2500));
    await page.screenshot({path:'test-results/neet-failure.png'});
    throw error;
  } finally {
    writeFileSync('test-results/neet-browser-report.json',JSON.stringify(evidence,null,2));
    await browser.close(); await db.$disconnect();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
