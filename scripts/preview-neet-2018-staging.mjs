import { chromium } from '@playwright/test';
import fs from 'node:fs';

// Local HTML only. Does not launch the app, load environment variables or contact a database.
const root = 'data/previous-year/neet/2018';
const quarantine = JSON.parse(fs.readFileSync(`${root}/quarantine.json`, 'utf8'));
const questions = quarantine.filter(q => q.recoveredOptions).map(q => ({ ...q, questionText: q.recoveredQuestionText, options: q.recoveredOptions }));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const html = cards => `<html lang="en"><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fa;color:#16213a;font-family:Arial,sans-serif;font-size:16px;line-height:1.5}
main{max-width:850px;margin:auto;padding:16px}.card{border:1px solid #cad0d9;border-radius:12px;background:white;padding:16px;margin-bottom:16px}
p{white-space:pre-wrap;overflow-wrap:break-word}.option{display:flex;align-items:flex-start;gap:12px;border:1px solid #ddd;border-radius:12px;padding:16px;margin-top:12px}
.letter{width:28px;flex-shrink:0}.text{min-width:0;white-space:pre-wrap;overflow-wrap:break-word;font-size:14px}</style>
<main><h2>Quarantined NEET 2018 review — answers unverified</h2>${cards.map(q => `<article class="card"><b>AA · Question ${q.originalQuestionNumber}</b>
<p>${escape(q.questionText)}</p>${q.options.map((o, i) => `<label class="option"><input type="radio" name="q${q.originalQuestionNumber}" value="${'ABCD'[i]}" aria-label="Question ${q.originalQuestionNumber}, option ${'ABCD'[i]}"><span class="letter">${'ABCD'[i]}</span><span class="text">${escape(o)}</span></label>`).join('')}</article>`).join('')}</main></html>`;

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, width] of [['mobile', 360], ['desktop', 1100]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(html(questions));
    const check = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      stems: [...document.querySelectorAll('.card p')].map(x => x.textContent),
      options: [...document.querySelectorAll('.text')].map(x => x.textContent),
      overflow: [...document.querySelectorAll('p,.text')].some(x => x.scrollWidth > x.clientWidth + 1),
    }));
    if (check.scroll > width || check.overflow) throw Error(`Horizontal overflow at ${width}`);
    if (JSON.stringify(check.stems) !== JSON.stringify(questions.map(q => q.questionText))
      || JSON.stringify(check.options) !== JSON.stringify(questions.flatMap(q => q.options))) throw Error('Rendered English text changed');
    const first = questions[0].originalQuestionNumber;
    await page.locator(`input[name="q${first}"][value="B"]`).check();
    if (!(await page.locator(`input[name="q${first}"][value="B"]`).isChecked())) throw Error('Option selection failed');
    const cards = questions.filter(q => [12, 18, 34, 36].includes(q.originalQuestionNumber));
    await page.setContent(html(cards));
    for (const q of cards) {
      if (q.questionText.includes('\u20d7') || !q.questionText.includes('vec(')) throw Error('Vector notation fallback missing');
    }
    await page.screenshot({ path: `${root}/evidence/render-${name}.png`, fullPage: true });
    const diagramCards = quarantine.filter(q => q.sourceEvidence);
    const diagrams = diagramCards.map(q => `<article class="card"><b>AA · Quarantined question ${q.originalQuestionNumber}</b><img style="display:block;max-width:100%;height:auto" alt="Original AA question ${q.originalQuestionNumber}" src="data:image/png;base64,${fs.readFileSync(q.sourceEvidence).toString('base64')}"></article>`).join('');
    await page.setContent(`<html><meta charset="utf-8"><style>body{margin:0}img{max-width:100%}</style>${diagrams}</html>`);
    const imageCheck = await page.evaluate(() => ({ count: document.images.length, allLoaded: [...document.images].every(i => i.complete && i.naturalWidth > 0), overflow: document.documentElement.scrollWidth > window.innerWidth }));
    if (imageCheck.count !== 13 || !imageCheck.allLoaded || imageCheck.overflow) throw Error('Quarantine diagram preview failed');
    await page.screenshot({ path: `${root}/evidence/diagrams-${name}.png`, fullPage: true });
    results.push({ name, width, quarantinedTextRecordsChecked: questions.length, diagramsChecked: 13, optionsChecked: questions.length * 4,
      horizontalOverflow: false, questionTextPreserved: true, optionTextPreserved: true, radioSelectionPassed: true,
      notationIssueNumbers: [], notationResolvedNumbers: cards.map(q => q.originalQuestionNumber),
      notationFormat: 'Explicit vec(X) preserves vector meaning without the unsupported combining arrow. Screenshots require visual review in addition to DOM checks.',
      scope: 'Local quarantine review only; ExamClient whitespace/wrapping semantics. No validated/student-visible content, authenticated practice, filter or scoring E2E.' });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(`${root}/evidence/render-checks.json`, JSON.stringify(results, null, 2) + '\n');
console.log(results);
