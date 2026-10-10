import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import NeetYearNavigation from '../components/student/NeetYearNavigation';
import { neetYearAvailability } from '../lib/previous-year/neet-release-readiness';

// Actual year component with live read-only snapshot data; question layout follows ExamClient.
// Local preview only: no app login, attempts, scoring, database access or production publication.
const root = 'data/previous-year/neet/release-2013-2025';
const read = (name: string) => JSON.parse(fs.readFileSync(`${root}/${name}`, 'utf8'));
const manifest = read('manifest.json');
const questions = read('questions.json') as { databaseQuestionId: string; year: number; externalId: string; questionText: string; options: string[] }[];
const years = neetYearAvailability(questions.map(q => ({ id: q.databaseQuestionId, year: q.year })), manifest.yearPractices);
const navigation = renderToStaticMarkup(React.createElement(NeetYearNavigation, { years, verified: true }));
const css = fs.readFileSync('tmp/neet-release-preview.css', 'utf8');
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cards = (rows: typeof questions) => rows.map(q => `<article class="card"><h3>${q.year} · ${escape(q.externalId)}</h3><p class="stem">${escape(q.questionText)}</p>${q.options.map((o, i) => `<label class="option"><input type="radio" name="${escape(q.externalId)}" value="${'ABCD'[i]}" aria-label="Option ${'ABCD'[i]}"><span>${'ABCD'[i]}</span><span class="option-text">${escape(o)}</span></label>`).join('')}</article>`).join('');
const html = (body: string) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}
body{margin:0;background:#f5f7fa;color:#16213a;font-family:Arial,sans-serif}main{max-width:1000px;margin:auto;padding:16px}.card{padding:16px;background:white;border:1px solid #ddd;border-radius:12px;margin:16px 0}.stem,.option-text{white-space:pre-wrap;overflow-wrap:break-word}.option{display:flex;align-items:flex-start;gap:12px;border:1px solid #ddd;padding:16px;border-radius:12px;margin-top:12px}.option-text{min-width:0;font-size:14px}</style><div class="student-site"><main>${body}</main></div></html>`;
fs.mkdirSync(`${root}/evidence`, { recursive: true });
async function main() {
const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  for (const [name, width] of [['mobile', 360], ['desktop', 1280]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(html(navigation));
    if (await page.locator('#neet-pyq-years + p').count() !== 1 || await page.locator('li').count() !== 13) throw Error('Year navigation incomplete');
    for (const year of years) {
      const card = page.locator('li').filter({ has: page.locator('h3', { hasText: String(year.year) }) });
      if (year.comingSoon && (await card.locator('a').count() || !(await card.innerText()).includes('Questions coming soon'))) throw Error('Unavailable year launches an empty exam');
      if (year.comingSoon && /\d+ (approved )?questions/.test(await card.innerText())) throw Error('Unavailable year displays a fabricated count');
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Year navigation overflow');
    await page.screenshot({ path: `${root}/evidence/years-${name}.png`, fullPage: true });
    await page.setContent(html(cards(questions)));
    const actual = await page.evaluate(() => ({ stems: [...document.querySelectorAll('.stem')].map(x => x.textContent),
      options: [...document.querySelectorAll('.option-text')].map(x => x.textContent),
      overflow: document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('.stem,.option-text')].some(x => x.scrollWidth > x.clientWidth + 1) }));
    if (actual.overflow || JSON.stringify(actual.stems) !== JSON.stringify(questions.map(q => q.questionText))
      || JSON.stringify(actual.options) !== JSON.stringify(questions.flatMap(q => q.options))) throw Error('Question rendering mismatch/overflow');
    await page.locator('input[value="B"]').first().check();
    if (!(await page.locator('input[value="B"]').first().isChecked())) throw Error('Option selection failed');
    const samples = [questions.find(q => q.questionText.includes('λ')), questions.find(q => /[⁻²₂]/.test(q.questionText)), questions[0]].filter(Boolean) as typeof questions;
    await page.setContent(html(cards(samples)));
    await page.screenshot({ path: `${root}/evidence/questions-${name}.png`, fullPage: true });
    checks.push({ viewport: name, width, yearCards: 13, comingSoonWithoutLaunch: years.filter(y => y.comingSoon).map(y => y.year),
      questions: questions.length, options: questions.length * 4, questionTextPreserved: true, optionsPreserved: true, horizontalOverflow: false,
      radioSelection: 'PASS', scope: 'Actual React year component SSR; ExamClient-equivalent question layout. No authenticated app/attempt/scoring E2E.' });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(`${root}/evidence/render-checks.json`, JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
