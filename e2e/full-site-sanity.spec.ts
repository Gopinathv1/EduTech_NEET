import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { signSession } from '../lib/auth/jwt';
import { PrismaClient } from '@prisma/client';
import { canShuffleOptions, displayToCanonical, optionDisplayOrder } from '../lib/attempts/options';
import { MONITORING_EVENT_LABELS, type MonitoringEventType } from '../lib/attempts/monitoring-contract';
loadEnvConfig(process.cwd());
const fixtures = JSON.parse(fs.readFileSync('tmp/sanity-fixtures.json', 'utf8'));
const prisma = new PrismaClient();
test.afterAll(async () => { await prisma.$disconnect(); });
test.beforeAll(() => {
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const u = new URL(process.env[key]!);
    if (u.hostname !== '127.0.0.1' || u.port !== '5433' || !['/sivora_test','/sivora_sanity_staging'].includes(u.pathname)) throw new Error('Local fixture database required');
  }
});
for (const width of [1440, 390]) {
  test(`contact validation, success, failure and readable text at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact');
    await expect(page.getByLabel('Your name')).toHaveCSS('color', 'rgb(16, 21, 28)');
    await expect(page.getByLabel('Your name')).toHaveCSS('background-color', 'rgb(237, 241, 245)');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await page.getByLabel('Your name').fill('Sanity Fixture');
    await page.getByLabel('Mobile').fill('123');
    await page.getByLabel('Email').fill('invalid');
    await page.getByLabel('Message', { exact: true }).fill('Local browser validation only');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await page.getByLabel('Mobile').fill('9999990071');
    await page.getByLabel('Email').fill('sanity@example.test');
    // Mock only the contact delivery boundary: no real enquiry or email.
    await page.route('**/api/contact', r => r.fulfill({ status: 500, json: { ok: false, error: 'INTERNAL_ERROR' } }));
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('form [role="alert"]').first()).toBeVisible();
    await expect(page.locator('form')).not.toContainText('auth.errors.INTERNAL_ERROR');
    await page.unroute('**/api/contact');
    await page.route('**/api/contact', r => r.fulfill({ status: 200, json: { ok: true } }));
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('form')).toHaveCount(0);
    await page.screenshot({ path: `reports/sanity-evidence/contact-success-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`navigation menu remains reachable and locale selector works at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 }); await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.locator('#mobile-nav'); await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Sell Books' }).click();
    await expect(page).toHaveURL(/marketplace\/sell/); await expect(menu).toHaveCount(0);
    if (width === 390) await page.getByRole('button', { name: 'Open menu' }).click();
    if (width === 390) await page.locator('#mobile-nav').getByRole('button', { name: 'தமிழ்' }).click();
    else await page.locator('header select').selectOption('ta');
    await expect.poll(async () => (await page.context().cookies()).find(x => x.name === 'NEXT_LOCALE')?.value).toBe('ta');
    await page.reload(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'hi', url: 'http://localhost:3010' }]);
    await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `reports/sanity-evidence/hindi-${width}.png`, fullPage: true });
  });
}
test('real student login, protected routes, logout and admin role guard', async ({ page }) => {
  await page.goto('/student/tests'); await expect(page).toHaveURL(/\/login\?/);
  await page.getByLabel('Mobile number').fill('9999990071');
  await page.getByLabel('Password', { exact: true }).fill(fixtures.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/student\/tests$/);
  await page.goto('/admin'); await expect(page).toHaveURL(/\/(student|admin\/login)(\?|$)/);
  expect((await page.request.get('/api/admin/students/export')).status()).toBe(401);
  await page.goto('/student');
  await page.getByRole('button', { name: /log out|logout/i }).click();
  await expect(page).toHaveURL('http://localhost:3010/');
  await page.goto('/student'); await expect(page).toHaveURL(/\/login/);
});
for (const [exam, id] of [['NEET', 'sivora-neet-sample-practice'], ['JEE', 'sivora-jee-sample-practice']]) {
  test(`${exam} sample lifecycle, persistence and monitoring failure isolation`, async ({ page, context }) => {
    await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);
    await page.setViewportSize({width:390,height:844});
    await page.goto(`/student/tests/${id}/start`);
    await page.getByRole('button', {name:/^(Start|Resume) Test$/}).click();
    await expect(page).toHaveURL(/\/attempt$/); await expect(page.getByText('Saved',{exact:true})).toBeVisible();
    await page.locator('fieldset label').first().click();
    await expect(page.getByText('Saved',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:/Save.*Next/}).click();
    await page.getByRole('button',{name:/Previous/}).click();
    await expect(page.locator('input[type=radio]:checked')).toHaveCount(1);
    await page.reload(); await expect(page.getByText('Saved',{exact:true})).toBeVisible();
    await expect(page.locator('input[type=radio]:checked')).toHaveCount(1);
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:`reports/sanity-evidence/${exam.toLowerCase()}-exam-desktop.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:`reports/sanity-evidence/${exam.toLowerCase()}-exam-mobile.png`,fullPage:true});
    await page.route('**/monitoring',r=>r.fulfill({status:503,json:{ok:false,error:'INTERNAL_ERROR'}}));
    await page.evaluate(()=>{document.dispatchEvent(new Event('copy'));document.dispatchEvent(new Event('paste'));document.dispatchEvent(new MouseEvent('contextmenu'));window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('fullscreenchange'));});
    await page.getByRole('button',{name:/Save.*Next/}).click();
    await page.getByRole('button',{name:/Previous/}).click();
    await expect(page.locator('input[type=radio]:checked')).toHaveCount(1);
    await page.unroute('**/monitoring');
    await page.getByRole('button',{name:'Questions',exact:true}).click();
    await expect(page.locator('#exam-palette')).toBeVisible();
    await page.getByRole('banner').getByRole('button',{name:'Submit test',exact:true}).click();
    await page.getByRole('button',{name:'Keep going',exact:true}).click();
    await page.getByRole('banner').getByRole('button',{name:'Submit test',exact:true}).click();
    await page.getByRole('button',{name:'Yes, submit',exact:true}).click();
    await expect(page).toHaveURL(/\/student\/results\//); await expect(page.getByText('Score',{exact:true})).toBeVisible();
    const attemptId = new URL(page.url()).pathname.split('/').pop()!;
    const attempt = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: { include: { question: { include: { translations: true } } } }, result: true } });
    let expected = 0;
    for (const answer of attempt.answers) {
      const content = answer.question.translations.find(t => t.language === 'en')!;
      if (answer.numericResponse !== null) expected += Math.abs(Number(answer.numericResponse) - Number(content.numericAnswer)) <= Number(content.numericTolerance ?? 0) ? 4 : -1;
      else if (answer.selectedOption !== null) {
        const order=optionDisplayOrder(attempt.seed,answer.questionId,attempt.shuffleOptions && canShuffleOptions(content,answer.question.questionType));
        expected += displayToCanonical(order,answer.selectedOption) === content.correctOption ? 4 : -1;
      }
    }
    expect(attempt.result!.score).toBe(expected);
    await expect(page.getByRole('tab', { name: 'Answer review', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Answer review', exact: true }).click();
    await page.getByRole('tab', { name: 'Analysis', exact: true }).click();
    await page.screenshot({path:`reports/sanity-evidence/${exam.toLowerCase()}-sample-result.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Take Another Attempt', exact: true }).click();
    await expect(page).toHaveURL(/\/start$/);
  });
}
test('populated performance charts have stable subject keys and readable result counters', async ({ page, context }) => {
  await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);
  const errors: string[] = []; page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
  await page.goto('/student/performance', { waitUntil: 'networkidle' });
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  expect(errors.filter(e => e.includes('same key'))).toEqual([]);
  const result = await prisma.result.findFirstOrThrow({ where: { attempt: { studentId: fixtures.student.id } } });
  await page.goto(`/student/results/${result.attemptId}`);
  await expect(page.locator('.text-green-200').first()).toHaveCSS('color','rgb(21, 128, 61)');
  await expect(page.locator('.text-red-200').first()).toHaveCSS('color','rgb(180, 35, 24)');
});
test('journey tabs, comparison buttons, AI chat and accessibility controls', async ({ page }) => {
  await page.goto('/admission-journey');
  const tabs=page.getByRole('tab');
  for(let i=0;i<await tabs.count();i++){await tabs.nth(i).click();await expect(tabs.nth(i)).toHaveAttribute('aria-selected','true');}
  await tabs.first().focus();await page.keyboard.press('End');await expect(tabs.last()).toBeFocused();
  await page.goto('/admissions');
  await page.getByRole('button',{name:/Add Russia/i}).click();
  await page.getByRole('button',{name:/Add Georgia/i}).click();
  await page.getByRole('link',{name:'Compare Countries',exact:true}).click();
  await expect(page).toHaveURL(/countries=russia,georgia/);
  await page.goto('/');
  await page.getByRole('button',{name:'Accessibility',exact:true}).click();
  await page.getByRole('switch',{name:/Large font/i}).click();
  await expect(page.locator('html')).toHaveAttribute('data-font-scale','large');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/Ask SIVORA.*AI/}).click();
  const input=page.locator('input[aria-label]').last();await input.fill('NEET preparation');
  await page.getByRole('button',{name:'Ask',exact:true}).click();
  await expect(page.getByText('NEET preparation',{exact:true})).toBeVisible();
  await page.screenshot({path:'reports/sanity-evidence/chat-open.png',fullPage:true});
});
test('legal pages use readable light-surface text', async ({page}) => {
  for(const route of ['/privacy','/terms']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCSS('color','rgb(16, 21, 28)');
    await expect(page.locator('main .text-textSecondary')).toHaveCSS('color','rgb(95, 105, 117)');
  }
});
test('numerical fixture saves, clears and scores without changing protected samples', async ({page,context}) => {
  await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);
  const response = await page.request.post('/api/attempts',{data:{testId:'sanity-local-numerical-test',language:'en'}});
  expect(response.status()).toBe(200);
  const {attemptId}=await response.json();
  await page.goto('/student/tests/sanity-local-numerical-test/attempt');
  const input=page.getByLabel('Numerical answer');await expect(input).toBeVisible();
  await input.fill('42');await input.blur();
  await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  await page.reload();await expect(input).toHaveValue('42');
  await page.getByRole('button',{name:'Clear response',exact:true}).click();
  await expect(input).toHaveValue('');
  await page.reload();await expect(input).toHaveValue('');
  await input.fill('42');await input.blur();
  await page.getByRole('banner').getByRole('button',{name:'Submit test',exact:true}).click();
  await page.getByRole('button',{name:'Yes, submit',exact:true}).click();
  await expect(page).toHaveURL(`/student/results/${attemptId}`);
  const result=await prisma.result.findUniqueOrThrow({where:{attemptId}});expect(result.score).toBe(4);
});
test('all monitoring event types persist without changing answers or the deadline', async ({page,context}) => {
  await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);
  const response=await page.request.post('/api/attempts',{data:{testId:'sivora-neet-sample-practice',language:'en'}});
  expect(response.status()).toBe(200);const {attemptId}=await response.json();
  const before=await prisma.testAttempt.findUniqueOrThrow({where:{id:attemptId},include:{answers:true}});
  const types=['TAB_HIDDEN','WINDOW_BLUR','FULLSCREEN_EXIT','COPY_ATTEMPT','PASTE_ATTEMPT','CONTEXT_MENU_ATTEMPT','TAB_VISIBLE','WINDOW_FOCUS','FULLSCREEN_ENTER'];
  const sent=await page.request.post(`/api/attempts/${attemptId}/monitoring`,{data:{events:types.map((eventType,sequence)=>({clientEventId:randomUUID(),eventType,sequence,clientTimestamp:new Date().toISOString()}))}});
  expect(sent.status()).toBe(200);
  expect(await prisma.attemptMonitoringEvent.count({where:{attemptId}})).toBeGreaterThanOrEqual(9);
  const after=await prisma.testAttempt.findUniqueOrThrow({where:{id:attemptId},include:{answers:true}});
  expect(after).toEqual(before);
  await page.goto('/student/tests/sivora-neet-sample-practice/attempt');await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  await page.getByRole('banner').getByRole('button',{name:'Submit test',exact:true}).click();
  await page.getByRole('button',{name:'Yes, submit',exact:true}).click();
  await expect(page).toHaveURL(`/student/results/${attemptId}`);
  await page.getByText('View monitoring history',{exact:true}).click();
  for(const type of types) await expect(page.getByText(MONITORING_EVENT_LABELS[type as MonitoringEventType],{exact:true}).first()).toBeVisible();
});
test('partner headings, testimonial carousel, chat contrast and favicon',async({page})=>{
  await page.goto('/partners');
  await expect(page.locator('main .public-light-section h2').first()).toHaveCSS('color','rgb(16, 21, 28)');
  await page.goto('/testimonials');
  const carousel=page.locator('[aria-roledescription="carousel"]');
  await expect(carousel.locator('div').first()).toHaveCSS('background-color','rgb(237, 241, 245)');
  const initial=await carousel.locator('p[aria-live]').textContent();
  await carousel.getByRole('button',{name:'Next',exact:true}).click();
  expect(await carousel.locator('p[aria-live]').textContent()).not.toBe(initial);
  await carousel.getByRole('button',{name:'Previous',exact:true}).click();
  await expect(carousel.locator('p[aria-live]')).toHaveText(initial!);
  await carousel.getByRole('button',{name:'Go to testimonial 3',exact:true}).click();
  await expect(carousel.getByRole('button',{name:'Go to testimonial 3',exact:true})).toHaveAttribute('aria-current','true');
  await page.getByRole('button',{name:/Ask SIVORA.*AI/}).click();
  await expect(page.getByRole('button',{name:'Clear Chat',exact:true})).toHaveCSS('color','rgb(95, 105, 117)');
  const icon=await page.locator('link[rel="icon"]').getAttribute('href');expect(icon).toBe('/branding/sivora-su-logo.png');
  expect((await page.request.get(icon!)).status()).toBe(200);
});

test('astrology course cards resolve their destination anchor on desktop and mobile',async({page})=>{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:1000});
    await page.goto('/courses/astrology');
    const cards=page.locator('a[href="/courses#astrology"]');
    expect(await cards.count()).toBe(12);
    await cards.first().click();
    await expect(page).toHaveURL('/courses#astrology');
    await expect(page.locator('#astrology')).toBeVisible();
    await expect(page.locator('#astrology h3')).toHaveText('Astrology');
  }
});
