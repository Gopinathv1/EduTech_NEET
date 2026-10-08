import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { signSession } from '../lib/auth/jwt';
import { seedAdmissionsFixtures } from './fixtures/admissions-v2';

const url = new URL(process.env.DATABASE_URL ?? '');
if (url.hostname !== '127.0.0.1' || url.port !== '55441' || url.pathname !== '/admissions_v2_isolated') throw new Error('Isolated Admissions database required');
const db = new PrismaClient();
test.beforeAll(async () => { await seedAdmissionsFixtures(db); await db.rateLimit.deleteMany({ where: { key: { startsWith: 'admissions:ip:' } } }); });
test.afterAll(() => db.$disconnect());

test('destinations, geography, search, comparison and mobile layout', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/admissions?region=asia#destinations');
  await expect(page.locator('#destinations').getByRole('heading', { name: 'Russia', exact: true })).toBeVisible();
  await expect(page.getByText('8 destinations found', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search countries or universities' }).fill('Omsk');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('1 destinations found', { exact: true })).toBeVisible();
  await page.goto('/admissions?region=europe#destinations');
  await expect(page.getByText('0 destinations found', { exact: true })).toBeVisible();
  await expect(page.locator('#destinations').getByRole('heading', { name: 'Russia', exact: true })).toHaveCount(0);
  await page.goto('/admissions/russia');
  await expect(page.getByText(/Russia is transcontinental, spanning Europe and Asia/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eligibility and medical practice in India' })).toBeVisible();
  await page.goto('/admissions/kazakhstan');
  await expect(page.getByText(/Kazakhstan is transcontinental/)).toBeVisible();
  await page.goto('/admissions/universities');
  await page.getByRole('textbox', { name: 'Search universities or programmes' }).fill('Russia');
  await expect(page.getByText('5 universities found. 0/3 selected for comparison.', { exact: true })).toBeVisible();
  const buttons = page.getByRole('button', { name: 'Compare programme', exact: true });
  await buttons.nth(0).click(); await buttons.nth(0).click(); await buttons.nth(0).click();
  await expect(page.getByRole('region', { name: 'University programme comparison', exact: true })).toBeVisible();
  await expect(buttons.first()).toBeDisabled();
  await expect(page.getByRole('cell', { name: 'Confirm with university', exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `test-results/admissions-${info.project.name}-universities.png`, fullPage: true });
  await page.getByRole('textbox', { name: 'Search universities or programmes' }).fill('Armenian Medical Institute');
  await expect(page.getByRole('heading', { name: 'Armenian Medical Institute', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Institution identity source', exact: true })).toHaveAttribute('href', 'https://armedin.am/en/');
  await expect(page.getByText(/Current accreditation validity requires confirmation/)).toBeVisible();
  await page.goto('/admissions/compare?countries=russia,russia,georgia');
  await expect(page.getByRole('columnheader', { name: /Georgia/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('public counselling form persists consent and contact preference in admin inbox', async ({ page, browser }, info) => {
  const email = `admissions-${info.project.name}-${Date.now()}@example.invalid`;
  await page.goto('/admissions/russia?university=russia-1#enquiry');
  const form = page.getByRole('form', { name: 'Admissions counselling enquiry' });
  await expect(form.getByLabel('Programme or university (optional)')).toHaveValue('Omsk State Medical University');
  await form.getByLabel('Student name').fill('Isolated Admissions Test');
  await form.getByLabel('Indian mobile number').fill('9000000001');
  await form.getByLabel('Email', { exact: true }).fill(email);
  await form.getByLabel('Study path', { exact: true }).selectOption('Engineering');
  await form.getByLabel('Programme or university (optional)').fill('Mechanical engineering');
  await form.getByLabel('Preferred contact method').selectOption('Email');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Request counselling', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Enquiry received', exact: true })).toBeVisible();
  const record = await db.contactEnquiry.findFirstOrThrow({ where: { email } });
  expect(record.message).toContain('Contact preference: Email'); expect(record.message).toContain('Consent: agreed'); expect(record.message).toContain('Study path: Engineering'); expect(record.message).toContain('Destination: russia');
  const payload = { name: 'Isolated Admissions Test', mobile: '9000000001', email, studyPath: 'Engineering', programme: 'Mechanical engineering', destination: 'russia', contactPreference: 'Email', consent: true };
  const duplicate = await page.request.post('/api/admission/enquiries', { data: payload });
  expect((await duplicate.json()).duplicate).toBe(true);
  expect(await db.contactEnquiry.count({ where: { email } })).toBe(1);
  const adminContext = await browser.newContext();
  await adminContext.addCookies([{ name: 'session', value: await signSession({ sub: 'admissions-admin', kind: 'admin', role: 'ADMIN', name: 'Admissions test admin' }), url: 'http://127.0.0.1:3107' }]);
  const adminPage = await adminContext.newPage(); await adminPage.goto('/admin/contact-enquiries');
  await expect(adminPage.getByText(email, { exact: false })).toBeVisible();
  await adminPage.getByRole('textbox', { name: 'Search name, contact, programme or reference' }).fill(`SIV-${record.id.slice(-6).toUpperCase()}`);
  await adminPage.getByRole('button', { name: 'Search inbox' }).click();
  await expect(adminPage.getByText(email, { exact: false })).toBeVisible();
  await adminPage.getByRole('combobox', { name: 'Enquiry status' }).selectOption('RESPONDED');
  await expect(adminPage.getByRole('combobox', { name: 'Enquiry status' })).toHaveValue('RESPONDED');
  await expect.poll(async () => (await db.contactEnquiry.findUniqueOrThrow({ where: { id: record.id } })).status).toBe('RESPONDED');
  expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await adminPage.screenshot({ path: `test-results/admissions-${info.project.name}-inbox.png`, fullPage: true });
  await adminPage.route('**/api/admin/contact-enquiries/*/status', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'generic' }) }));
  await adminPage.getByRole('combobox', { name: 'Enquiry status' }).selectOption('CLOSED');
  await expect(adminPage.getByText('Status was not saved. Please try again.', { exact: true })).toBeVisible();
  await expect(adminPage.getByRole('combobox', { name: 'Enquiry status' })).toHaveValue('RESPONDED');
  await adminContext.close();
});

test('student lead lifecycle, concurrent duplicates, notes and authorization', async ({ page, browser }, info) => {
  const student = await db.student.create({ data: { name: 'Isolated Student', email: `lead-${info.project.name}-${Date.now()}@example.invalid` } });
  const studentToken = await signSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  await page.context().addCookies([{ name: 'session', value: studentToken, url: 'http://127.0.0.1:3107' }]);
  await page.goto('/student/admission-guidance');
  await expect(page.locator('#neetScore')).toHaveValue('');
  const payload = { neetScore: 300, marks: '', category: 'General', budget: 'UNSURE', parentContact: '9000000002', consent: true, interestedCountryIds: ['admissions-country-russia'] };
  const invalid = await page.request.post('/api/admission/leads', { data: { ...payload, interestedCountryIds: ['admissions-country-russia', 'missing-country'] } }); expect(invalid.status()).toBe(400);
  const results = await Promise.all([page.request.post('/api/admission/leads', { data: payload }), page.request.post('/api/admission/leads', { data: payload })]);
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
  expect(await db.admissionLead.count({ where: { studentId: student.id } })).toBe(1);
  const lead = await db.admissionLead.findFirstOrThrow({ where: { studentId: student.id } });
  expect(await db.leadEvent.count({ where: { leadId: lead.id, type: 'CREATED' } })).toBe(1);
  expect(await db.notification.count({ where: { studentId: student.id } })).toBe(1);
  expect((await page.request.get(`/api/admin/leads/${lead.id}`)).status()).toBe(401);
  const adminContext = await browser.newContext();
  await adminContext.addCookies([{ name: 'session', value: await signSession({ sub: 'admissions-admin', kind: 'admin', role: 'ADMIN', name: 'Test admin' }), url: 'http://127.0.0.1:3107' }]);
  expect((await adminContext.request.patch(`/api/admin/leads/${lead.id}/assign`, { data: { assignedToId: 'admissions-disabled-admin' } })).status()).toBe(400);
  expect((await adminContext.request.patch(`/api/admin/leads/${lead.id}/assign`, { data: { assignedToId: 'admissions-admin' } })).status()).toBe(200);
  for (const status of ['CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED']) {
    expect((await adminContext.request.patch(`/api/admin/leads/${lead.id}/status`, { data: { status, note: 'Isolated lifecycle test' } })).status()).toBe(200);
    if (status === 'CONVERTED') { await page.reload(); await expect(page.getByText('Counselling lead converted', { exact: true })).toBeVisible(); await expect(page.getByText('Enrolled', { exact: true })).toHaveCount(0); }
  }
  expect((await adminContext.request.post(`/api/admin/leads/${lead.id}/notes`, { data: { note: 'Isolated follow-up note' } })).status()).toBe(200);
  expect((await adminContext.request.post(`/api/admin/leads/${lead.id}/notes`, { data: { note: ' ' } })).status()).toBe(400);
  expect((await db.admissionLead.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe('CLOSED');
  expect(await db.leadEvent.count({ where: { leadId: lead.id } })).toBe(7);
  await page.reload(); await expect(page.getByText('Counselling request status only.', { exact: false })).toBeVisible();
  await page.screenshot({ path: `test-results/admissions-${info.project.name}-student.png`, fullPage: true });
  const adminPage = await adminContext.newPage(); await adminPage.goto('/admin/leads?q=Isolated'); await expect(adminPage.getByText('Isolated Student', { exact: true }).first()).toBeVisible();
  const disabledContext = await browser.newContext(); await disabledContext.addCookies([{ name: 'session', value: await signSession({ sub: 'admissions-disabled-admin', kind: 'admin', role: 'ADMIN', name: 'Disabled admin' }), url: 'http://127.0.0.1:3107' }]);
  expect((await disabledContext.request.get(`/api/admin/leads/${lead.id}`)).status()).toBe(401);
  expect((await disabledContext.request.get('/api/admin/contact-enquiries')).status()).toBe(401);
  expect((await disabledContext.request.get('/api/admin/leads/export')).status()).toBe(401);
  expect((await page.request.patch(`/api/admin/leads/${lead.id}/status`, { data: { status: 'NEW' } })).status()).toBe(401);
  const anonymous = await browser.newContext(); expect((await anonymous.request.get(`/api/admin/leads/${lead.id}`)).status()).toBe(401); expect((await anonymous.request.post('/api/admission/leads', { data: payload })).status()).toBe(401);
  const other = await db.student.create({ data: { name: 'Other Isolated Student' } });
  const otherContext = await browser.newContext(); await otherContext.addCookies([{ name: 'session', value: await signSession({ sub: other.id, kind: 'student', role: 'STUDENT', name: other.name }), url: 'http://127.0.0.1:3107' }]);
  const otherPage = await otherContext.newPage(); await otherPage.goto('/student/admission-guidance'); await expect(otherPage.locator('#neetScore')).toBeVisible();
  await Promise.all([adminContext.close(), disabledContext.close(), anonymous.close(), otherContext.close()]);
});


test('student form submits and returns to counselling status', async ({ page }, info) => {
  const student = await db.student.create({ data: { name: 'Form Isolated Student', email: `form-${info.project.name}-${Date.now()}@example.invalid` } });
  await page.context().addCookies([{ name: 'session', value: await signSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name }), url: 'http://127.0.0.1:3107' }]);
  await page.goto('/student/admission-guidance');
  await page.locator('#category').selectOption('General'); await page.locator('#budget').selectOption('UNSURE');
  await page.getByRole('button', { name: 'Russia', exact: true }).click();
  await page.locator('#parentContact').fill('9000000003'); await page.getByRole('checkbox').check();
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('a[href="/student/admission-guidance"]')).toBeVisible();
  await page.locator('a[href="/student/admission-guidance"]').click();
  await expect(page.getByText('Counselling request status only.', { exact: false })).toBeVisible();
  const lead = await db.admissionLead.findFirstOrThrow({ where: { studentId: student.id } }); expect(lead.neetScore).toBeNull(); expect(lead.consentAt).not.toBeNull();
});

test('enquiry errors preserve entered details and do not claim success', async ({ page }) => {
  await page.goto('/admissions/russia#enquiry');
  const form = page.getByRole('form', { name: 'Admissions counselling enquiry' });
  await form.getByLabel('Student name').fill('Isolated Failure Test'); await form.getByLabel('Indian mobile number').fill('9000000004'); await form.getByLabel('Email', { exact: true }).fill('failure@example.invalid'); await form.getByRole('checkbox').check();
  await page.route('**/api/admission/enquiries', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'generic' }) }));
  await form.getByRole('button', { name: 'Request counselling', exact: true }).click();
  await expect(page.getByText('We could not save your enquiry. Please try again.', { exact: true })).toBeVisible();
  await expect(form.getByLabel('Student name')).toHaveValue('Isolated Failure Test'); await expect(page.getByRole('heading', { name: 'Enquiry received', exact: true })).toHaveCount(0);
});


test('public API validates consent, serialises duplicate submissions and throttles spam', async ({ request }, info) => {
  const email = `parallel-${info.project.name}-${Date.now()}@example.invalid`;
  const payload = { name: 'Isolated Parallel Test', mobile: '9000000005', email, studyPath: 'Postgraduate', programme: 'Data science', destination: 'other', contactPreference: 'WhatsApp', consent: true };
  const headers = { 'x-forwarded-for': info.project.name === 'desktop' ? '198.18.1.1' : '198.18.1.2' };
  const invalid = await request.post('/api/admission/enquiries', { headers, data: { ...payload, consent: false } }); expect(invalid.status()).toBe(400);
  expect(await db.contactEnquiry.count({ where: { email } })).toBe(0);
  const responses = await Promise.all([request.post('/api/admission/enquiries', { headers, data: payload }), request.post('/api/admission/enquiries', { headers, data: payload })]);
  expect(responses.map((response) => response.status())).toEqual([200, 200]);
  const bodies = await Promise.all(responses.map((response) => response.json())); expect(bodies[0].reference).toBe(bodies[1].reference);
  expect(await db.contactEnquiry.count({ where: { email } })).toBe(1);
  await request.post('/api/admission/enquiries', { headers, data: payload }); await request.post('/api/admission/enquiries', { headers, data: payload });
  const throttled = await request.post('/api/admission/enquiries', { headers, data: payload }); expect(throttled.status()).toBe(429);
  expect(await db.contactEnquiry.count({ where: { email } })).toBe(1);
});
