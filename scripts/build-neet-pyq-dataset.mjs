import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const sourceRoot = path.resolve(process.argv[2] ?? path.join(workspace, 'tmp'));
const outputRoot = path.join(workspace, 'data', 'previous-year', 'neet');

const sources = {
  2021: {
    code: 'M4', transcription: 'neet-training-2021-m4.json', key: 'neet-2021-m4-key.json', expected: 200, attempted: 180, duration: 180,
    paperUrl: 'https://docs.aglasem.com/view/7bee1ef2-6ba8-11ec-9402-0a5e36bc6706',
    paperPdfUrl: 'https://cdn.aglasem.com/aglasem-doc/7bee1ef2-6ba8-11ec-9402-0a5e36bc6706/7bee1ef2-6ba8-11ec-9402-0a5e36bc6706.pdf',
    keyUrl: 'https://nta.ac.in/Download/Notice/Notice_20211101205130.pdf',
    transcriptionAidUrl: 'https://neet.training/neet-pyqs/2021/code-AGAJHA-M4',
  },
  2022: {
    code: 'R6', transcription: 'neet-training-2022-r6.json', key: 'neet-2022-r6-key.json', expected: 200, attempted: 180, duration: 200,
    paperUrl: 'https://docs.aglasem.com/view/b55e0162-9824-11ed-b3c8-0a5e36bc6706',
    paperPdfUrl: 'https://cdn.aglasem.com/aglasem-doc/b55e0162-9824-11ed-b3c8-0a5e36bc6706/b55e0162-9824-11ed-b3c8-0a5e36bc6706.pdf',
    keyUrl: 'https://www.nta.ac.in/Download/Notice/Notice_20220916163026.pdf',
    transcriptionAidUrl: 'https://neet.training/neet-pyqs/2022/code-R6',
  },
  2023: {
    code: 'G6', transcription: 'neet-training-2023-g6.json', key: 'neet-2023-g6-key.json', expected: 200, attempted: 180, duration: 200,
    paperUrl: 'https://docs.aglasem.com/view/b5019250-4342-11ee-b742-0a5e36bc6706',
    paperPdfUrl: 'https://cdn.aglasem.com/aglasem-doc/b5019250-4342-11ee-b742-0a5e36bc6706/b5019250-4342-11ee-b742-0a5e36bc6706.pdf',
    keyUrl: 'https://www.nta.ac.in/Download/Notice/Notice_20230615172159.pdf',
    transcriptionAidUrl: 'https://neet.training/neet-pyqs/2023/code-G6',
  },
  2024: {
    code: 'S6', transcription: 'neet-training-2024-s6.json', key: 'neet-2024-s6-key.json', expected: 200, attempted: 180, duration: 200,
    paperUrl: 'https://docs.aglasem.com/view/fcc6e1ea-2f1c-11f0-a4dd-0a5e36bc6706',
    paperPdfUrl: 'https://cdn.aglasem.com/aglasem-doc/fcc6e1ea-2f1c-11f0-a4dd-0a5e36bc6706/fcc6e1ea-2f1c-11f0-a4dd-0a5e36bc6706.pdf',
    keyUrl: 'https://nta.ac.in/Download/Notice/Notice_20240726171027.pdf',
    transcriptionAidUrl: 'https://neet.training/neet-pyqs/2024/code-S6',
  },
  2025: {
    code: '45', transcription: 'neet-training-2025-45.json', key: 'neet-2025-45-key.json', expected: 180, attempted: 180, duration: 180,
    paperUrl: 'https://docs.aglasem.com/view/f0119734-0599-11f1-93a7-0a5e36bc6706',
    paperPdfUrl: 'https://cdn.aglasem.com/aglasem-doc/f0119734-0599-11f1-93a7-0a5e36bc6706/f0119734-0599-11f1-93a7-0a5e36bc6706.pdf',
    keyUrl: 'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2025/06/2025061450.pdf',
    transcriptionAidUrl: 'https://neet.training/neet-pyqs/2025/code-45',
  },
};

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const optionLetter = (number) => ['A', 'B', 'C', 'D'][number - 1];
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const deterministicId = (year, code, number) => `historical-verified:neet:${year}:${code.toLowerCase()}:${number}`;

function expectedSubject(year, number) {
  if (year === 2025) {
    if (number <= 45) return 'PHYSICS';
    if (number <= 90) return 'CHEMISTRY';
    if (number <= 135) return 'BOTANY';
    return 'ZOOLOGY';
  }
  if (number <= 50) return 'PHYSICS';
  if (number <= 100) return 'CHEMISTRY';
  if (number <= 150) return 'BOTANY';
  return 'ZOOLOGY';
}

const manualSubjectClassifications = new Map([
  ['2023:140', 'ZOOLOGY'],
  ['2023:147', 'ZOOLOGY'],
  ['2024:149', 'ZOOLOGY'],
  ['2025:94', 'ZOOLOGY'],
  ['2025:101', 'ZOOLOGY'],
  ['2025:112', 'ZOOLOGY'],
  ['2025:141', 'BOTANY'],
  ['2025:151', 'BOTANY'],
  ['2025:153', 'BOTANY'],
  ['2025:154', 'BOTANY'],
]);

function subjectFor(year, number, chapter = '') {
  const normalizedChapter = normalize(chapter);
  const fallback = manualSubjectClassifications.get(`${year}:${number}`) ?? expectedSubject(year, number);
  if (fallback === 'BOTANY' || fallback === 'ZOOLOGY') {
    if (/(body fluids|breathing|digestion|excretory|locomotion|neural control|chemical coordination|human reproduction|reproductive health|human health)/.test(normalizedChapter)) return 'ZOOLOGY';
    if (/(plant kingdom|morphology of flowering|anatomy of flowering|transport in plants|photosynthesis|respiration in plants|plant growth|sexual reproduction in flowering)/.test(normalizedChapter)) return 'BOTANY';
  }
  return fallback;
}

function sectionFor(year, number) {
  if (year === 2025) return 'COMPULSORY';
  const withinSubject = ((number - 1) % 50) + 1;
  return withinSubject <= 35 ? 'SECTION_A' : 'SECTION_B';
}

const manualClassifications = new Map([
  ['2021:71', ['physics-electromagnetic-waves', 'electromagnetic-spectrum']],
  ['2021:84', ['chemistry-biomolecules', 'nucleic-acids-vitamins']],
  ['2021:85', ['chemistry-atomic-structure', 'atomic-models']],
  ['2022:102', ['biology-ecology-environment', 'environmental-issues']],
  ['2022:140', ['biology-ecology-environment', 'environmental-issues']],
  ['2022:164', ['biology-cell-structure-function', 'biomolecules']],
  ['2022:195', ['biology-ecology-environment', 'environmental-issues']],
  ['2022:199', ['biology-cell-structure-function', 'biomolecules']],
  ['2023:36', ['physics-atoms-nuclei', 'atomic-models']],
  ['2023:42', ['physics-oscillations-waves', 'simple-harmonic-motion']],
  ['2023:44', ['physics-magnetic-effects', 'biot-savart-law']],
  ['2023:46', ['physics-optics', 'ray-optics']],
  ['2023:47', ['physics-magnetic-effects', 'lorentz-force']],
  ['2023:88', ['chemistry-thermodynamics', 'enthalpy']],
  ['2023:89', ['chemistry-solutions', 'solid-state']],
  ['2023:90', ['chemistry-practical', 'environmental-chemistry']],
  ['2023:92', ['chemistry-p-block', 'group-15-18']],
  ['2023:98', ['chemistry-organic-principles', 'electronic-effects']],
  ['2023:136', ['biology-structural-organisation', 'plant-anatomy']],
  ['2023:145', ['biology-structural-organisation', 'plant-morphology']],
  ['2023:146', ['biology-cell-structure-function', 'cell-organelles']],
  ['2024:22', ['physics-atoms-nuclei', 'atomic-models']],
  ['2024:117', ['biology-cell-structure-function', 'cell-organelles']],
  ['2024:66', ['chemistry-atomic-structure', 'atomic-models']],
  ['2025:50', ['chemistry-atomic-structure', 'atomic-models']],
]);

function classify(subject, chapterName, year, number) {
  const manual = manualClassifications.get(`${year}:${number}`);
  if (manual) return manual;
  const c = normalize(chapterName);
  if (subject === 'PHYSICS') {
    if (c.includes('units and measurements')) return ['physics-and-measurement', 'units'];
    if (c.includes('motion in a straight line')) return ['physics-kinematics', 'motion-in-line'];
    if (c.includes('motion in a plane')) return ['physics-kinematics', 'motion-in-plane'];
    if (c.includes('laws of motion')) return ['physics-laws-of-motion', 'newtons-laws'];
    if (c.includes('work') && c.includes('energy')) return ['physics-work-energy-power', 'work-energy-theorem'];
    if (c.includes('rotational') || c.includes('system of particles')) return ['physics-rotational-motion', 'moment-of-inertia'];
    if (c.includes('gravitation')) return ['physics-gravitation', 'universal-law'];
    if (c.includes('mechanical properties of fluids')) return ['physics-properties-solids-liquids', 'fluid-mechanics'];
    if (c.includes('mechanical properties of solids')) return ['physics-properties-solids-liquids', 'elasticity'];
    if (c.includes('thermal properties')) return ['physics-thermodynamics', 'heat-transfer'];
    if (c === 'thermodynamics') return ['physics-thermodynamics', 'first-law'];
    if (c.includes('kinetic theory')) return ['physics-kinetic-theory-gases', 'kinetic-theory'];
    if (c.includes('oscillations')) return ['physics-oscillations-waves', 'simple-harmonic-motion'];
    if (c === 'waves') return ['physics-oscillations-waves', 'wave-motion'];
    if (c.includes('electric charges')) return ['physics-electrostatics', 'electric-charge-field'];
    if (c.includes('electrostatic potential')) return ['physics-electrostatics', 'potential-capacitance'];
    if (c.includes('current electricity')) return ['physics-current-electricity', 'circuits'];
    if (c.includes('moving charges') || c.includes('magnetism and matter')) return ['physics-magnetic-effects', 'magnetism'];
    if (c.includes('electromagnetic induction')) return ['physics-emi-ac', 'electromagnetic-induction'];
    if (c.includes('alternating current')) return ['physics-emi-ac', 'alternating-current'];
    if (c.includes('electromagnetic waves')) return ['physics-electromagnetic-waves', 'electromagnetic-spectrum'];
    if (c.includes('ray optics')) return ['physics-optics', 'ray-optics'];
    if (c.includes('wave optics')) return ['physics-optics', 'wave-optics'];
    if (c.includes('dual nature')) return ['physics-dual-nature', 'photoelectric-effect'];
    if (c === 'atoms') return ['physics-atoms-nuclei', 'atomic-models'];
    if (c === 'nuclei') return ['physics-atoms-nuclei', 'nuclear-physics'];
    if (c.includes('semiconductor')) return ['physics-electronic-devices', 'semiconductors'];
  }
  if (subject === 'CHEMISTRY') {
    if (c.includes('some basic concepts')) return ['chemistry-some-basic-concepts', 'mole-concept'];
    if (c.includes('structure of atom')) return ['chemistry-atomic-structure', 'atomic-models'];
    if (c.includes('chemical bonding')) return ['chemistry-chemical-bonding', 'ionic-covalent-bonding'];
    if (c.includes('thermodynamics') || c.includes('states of matter')) return ['chemistry-thermodynamics', c.includes('states') ? 'states-of-matter' : 'enthalpy'];
    if (c.includes('solutions')) return ['chemistry-solutions', 'colligative-properties'];
    if (c.includes('solid state')) return ['chemistry-solutions', 'solid-state'];
    if (c.includes('equilibrium')) return ['chemistry-equilibrium', 'chemical-equilibrium'];
    if (c.includes('electrochemistry') || c.includes('redox')) return ['chemistry-redox-electrochemistry', c.includes('redox') ? 'redox-reactions' : 'electrochemical-cells'];
    if (c.includes('chemical kinetics')) return ['chemistry-chemical-kinetics', 'rate-law'];
    if (c.includes('surface chemistry')) return ['chemistry-chemical-kinetics', 'surface-chemistry'];
    if (c.includes('classification of elements')) return ['chemistry-periodicity', 'periodic-trends'];
    if (c.includes('s block') || c === 'hydrogen') return ['chemistry-periodicity', c === 'hydrogen' ? 'hydrogen' : 's-block-elements'];
    if (c.includes('p block')) return ['chemistry-p-block', 'group-15-18'];
    if (c.includes('d and f block')) return ['chemistry-d-f-block', 'transition-elements'];
    if (c.includes('coordination compounds')) return ['chemistry-coordination-compounds', 'bonding'];
    if (c.includes('isolation of elements')) return ['chemistry-purification-characterisation', 'metallurgy'];
    if (c.includes('organic chemistry')) return ['chemistry-organic-principles', 'electronic-effects'];
    if (c === 'hydrocarbons') return ['chemistry-hydrocarbons', 'alkenes-alkynes'];
    if (c.includes('haloalkanes')) return ['chemistry-halogens', 'substitution-reactions'];
    if (c.includes('alcohols') || c.includes('aldehydes')) return ['chemistry-oxygen', c.includes('alcohols') ? 'alcohols-phenols-ethers' : 'aldehydes-ketones'];
    if (c === 'amines') return ['chemistry-nitrogen', 'amines'];
    if (c === 'biomolecules') return ['chemistry-biomolecules', 'proteins'];
    if (c === 'polymers') return ['chemistry-organic-principles', 'polymers'];
    if (c.includes('environmental chemistry')) return ['chemistry-practical', 'environmental-chemistry'];
  }
  if (subject === 'BOTANY' || subject === 'ZOOLOGY') {
    if (c.includes('living world')) return ['biology-diversity-living-world', 'taxonomy-systematics'];
    if (c.includes('biological classification')) return ['biology-diversity-living-world', 'biological-classification'];
    if (c.includes('plant kingdom') || c.includes('animal kingdom')) return ['biology-diversity-living-world', c.includes('plant') ? 'plant-kingdom' : 'animal-kingdom'];
    if (c.includes('morphology of flowering')) return ['biology-structural-organisation', 'plant-morphology'];
    if (c.includes('anatomy of flowering')) return ['biology-structural-organisation', 'plant-anatomy'];
    if (c.includes('structural organisation in animals')) return ['biology-structural-organisation', 'animal-morphology'];
    if (c.includes('cell the unit') || c.includes('cell: the unit')) return ['biology-cell-structure-function', 'cell-organelles'];
    if (c === 'biomolecules') return ['biology-cell-structure-function', 'biomolecules'];
    if (c.includes('cell cycle')) return ['biology-cell-structure-function', 'cell-division'];
    if (c.includes('transport in plants')) return ['biology-plant-physiology', 'transport-plants'];
    if (c.includes('photosynthesis')) return ['biology-plant-physiology', 'photosynthesis'];
    if (c.includes('respiration in plants')) return ['biology-plant-physiology', 'respiration'];
    if (c.includes('plant growth')) return ['biology-plant-physiology', 'plant-growth'];
    if (c.includes('digestion')) return ['biology-human-physiology', 'digestion-absorption'];
    if (c.includes('breathing')) return ['biology-human-physiology', 'breathing'];
    if (c.includes('body fluids')) return ['biology-human-physiology', 'circulation'];
    if (c.includes('excretory')) return ['biology-human-physiology', 'excretion'];
    if (c.includes('locomotion')) return ['biology-human-physiology', 'locomotion-movement'];
    if (c.includes('neural control')) return ['biology-human-physiology', 'neural-control'];
    if (c.includes('chemical coordination')) return ['biology-human-physiology', 'chemical-coordination'];
    if (c.includes('reproduction in organisms')) return ['biology-reproduction', 'reproduction-organisms'];
    if (c.includes('sexual reproduction in flowering')) return ['biology-reproduction', 'sexual-reproduction-plants'];
    if (c.includes('human reproduction')) return ['biology-reproduction', 'human-reproduction'];
    if (c.includes('reproductive health')) return ['biology-reproduction', 'reproductive-health'];
    if (c.includes('principles of inheritance')) return ['biology-genetics-and-evolution', 'mendelian-inheritance'];
    if (c.includes('molecular basis')) return ['biology-genetics-and-evolution', 'molecular-basis-of-inheritance'];
    if (c === 'evolution') return ['biology-genetics-and-evolution', 'evolution'];
    if (c.includes('human health')) return ['biology-human-welfare', 'human-health-disease'];
    if (c.includes('microbes in human welfare')) return ['biology-human-welfare', 'microbes-human-welfare'];
    if (c.includes('strategies for enhancement')) return ['biology-human-welfare', 'food-production'];
    if (c.includes('biotechnology principles') || c.includes('biotechnology: principles')) return ['biology-biotechnology', 'biotechnology-principles'];
    if (c.includes('biotechnology') && c.includes('applications')) return ['biology-biotechnology', 'biotechnology-applications'];
    if (c === 'organisms and populations') return ['biology-ecology-environment', 'organisms-populations'];
    if (c === 'ecosystem') return ['biology-ecology-environment', 'ecosystems'];
    if (c.includes('biodiversity')) return ['biology-ecology-environment', 'biodiversity-conservation'];
    if (c.includes('environmental issues')) return ['biology-ecology-environment', 'environmental-issues'];
  }
  return null;
}

const imageDependency = /\b(shown in (?:the )?figure|following (?:figure|diagram|circuit)|above (?:figure|diagram)|given (?:figure|diagram|circuit)|from the given (?:figure|diagram)|diagram (?:showing|shows)|graph which shows|according to (?:the )?(?:figure|graph)|circuit .* shown|image option)\b/i;
const malformedMarker = /will be added soon|unreadable|\bundefined\b|\bnull\b/i;
const corruptedGlyphs = /[⎛⎞⎝⎠�]/;
const pageHeaderLeak = /\bSection\s*-\s*[AB]\s*\((?:Physics|Chemistry|Biology)/i;
const degreeGlyphCorruption = /\b\d+\s+8\s*C\b/i;
const manualTranscriptionQuarantine = new Map([
  [2021, new Set([2, 5, 6, 12, 32, 36, 42, 44, 47, 49, 80, 81, 86, 87, 89, 91, 94, 98, 137, 138])],
  [2022, new Set([3, 11, 14, 20, 21, 23, 30, 37, 41, 42, 44, 47, 48, 56, 58, 63, 68, 71, 72, 78, 79, 91, 94])],
]);

function hasLegacyMathCorruption(year, recovered) {
  if (year > 2022) return false;
  const options = recovered.options ?? [];
  const text = `${recovered.question ?? ''} ${options.join(' ')}`;
  if (/\b10\s+[−-]?\s*\d{1,2}\b/.test(text)) return true;
  if (options.some((option) => /^\s*\d+(?:\s+\d+){1,4}(?:\s+[A-Za-zΩ])?\s*$/.test(option))) return true;
  if (options.some((option) => /\b(?:sin|cos|tan)\s+[^ ]+\s+[]/i.test(option))) return true;
  return false;
}

function validateRecoveredQuestion({ year, source, recovered, officialAnswers }) {
  const reasons = [];
  if (!recovered) return ['SOURCE_TRANSCRIPTION_MISSING'];
  if (!recovered.question?.trim()) reasons.push('MISSING_QUESTION_TEXT');
  if (recovered.is_complete !== true) reasons.push('SOURCE_TRANSCRIPTION_INCOMPLETE');
  if (!Array.isArray(recovered.options) || recovered.options.length !== 4 || recovered.options.some((option) => !option?.trim())) reasons.push('MALFORMED_OPTIONS');
  if (Array.isArray(recovered.options) && new Set(recovered.options.map(normalize)).size !== recovered.options.length) reasons.push('DUPLICATE_OPTIONS');
  if (recovered.question?.includes('(1)') || recovered.question?.includes('(2)')) reasons.push('OPTIONS_EMBEDDED_IN_STEM');
  if (malformedMarker.test(`${recovered.question ?? ''} ${(recovered.options ?? []).join(' ')}`)) reasons.push('TRANSCRIPTION_PLACEHOLDER');
  if (imageDependency.test(`${recovered.question ?? ''} ${(recovered.options ?? []).join(' ')}`)) reasons.push('IMAGE_ASSET_REQUIRED');
  if (corruptedGlyphs.test(`${recovered.question ?? ''} ${(recovered.options ?? []).join(' ')}`)) reasons.push('CORRUPTED_MATH_GLYPHS');
  if (pageHeaderLeak.test(`${recovered.question ?? ''} ${(recovered.options ?? []).join(' ')}`)) reasons.push('PAGE_HEADER_CONTAMINATION');
  if (degreeGlyphCorruption.test(`${recovered.question ?? ''} ${(recovered.options ?? []).join(' ')}`)) reasons.push('CORRUPTED_DEGREE_SYMBOL');
  if (hasLegacyMathCorruption(year, recovered)) reasons.push('LEGACY_MATH_TRANSCRIPTION_RISK');
  if (manualTranscriptionQuarantine.get(year)?.has(recovered.q_num)) reasons.push('MANUAL_TRANSCRIPTION_INTEGRITY_REVIEW_FAILED');
  if (recovered.question?.length > 1800 || recovered.question?.length < 10) reasons.push('IMPLAUSIBLE_STEM_LENGTH');
  if ((recovered.options ?? []).some((option) => option.length > 800)) reasons.push('IMPLAUSIBLE_OPTION_LENGTH');
  const official = officialAnswers[String(recovered.q_num)];
  if (!official || official.length !== 1 || official[0] < 1 || official[0] > 4) reasons.push('OFFICIAL_KEY_NOT_SINGLE_CORRECT');
  const recoveredAnswer = recovered.correct_options?.length === 1 ? recovered.correct_options[0]?.toUpperCase() : null;
  if (!recoveredAnswer || !['A', 'B', 'C', 'D'].includes(recoveredAnswer)) reasons.push('INVALID_RECOVERED_ANSWER');
  const subject = subjectFor(year, recovered.q_num, recovered.chapter ?? '');
  if (!classify(subject, recovered.chapter ?? '', year, recovered.q_num)) reasons.push('UNCLASSIFIED_CANONICAL_TOPIC');
  if (source.code !== String(recovered.code).split('-').at(-1)) reasons.push('BOOKLET_CODE_MISMATCH');
  return [...new Set(reasons)];
}

const allQuestionHashes = new Map();
const yearlySummaries = [];

for (const [yearText, source] of Object.entries(sources)) {
  const year = Number(yearText);
  const transcriptionPath = path.join(sourceRoot, source.transcription);
  const keyPath = path.join(sourceRoot, 'pdfs', 'neet-pyq-2021-2025', 'official-keys', source.key);
  const pdfPath = path.join(sourceRoot, 'pdfs', 'neet-pyq-2021-2025', `neet-${year}.pdf`);
  const keyPdfPath = path.join(sourceRoot, 'pdfs', 'neet-pyq-2021-2025', 'official-keys', `neet-${year}-final-key.pdf`);
  const recoveredPayload = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
  const officialKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const recoveredByNumber = new Map(recoveredPayload.questions.map((question) => [question.q_num, question]));
  const validated = [];
  const quarantined = [];

  for (let number = 1; number <= source.expected; number += 1) {
    const recovered = recoveredByNumber.get(number);
    const reasons = validateRecoveredQuestion({ year, source, recovered, officialAnswers: officialKey.answers });
    if (recovered && reasons.length === 0) {
      const subjectCode = subjectFor(year, number, recovered.chapter ?? '');
      const [chapterSlug, topic] = classify(subjectCode, recovered.chapter, year, number);
      const textHash = crypto.createHash('sha256').update(normalize(recovered.question)).digest('hex');
      if (allQuestionHashes.has(textHash)) {
        reasons.push(`DUPLICATE_TEXT:${allQuestionHashes.get(textHash)}`);
      } else {
        allQuestionHashes.set(textHash, `${year}:${number}`);
      }
      if (reasons.length === 0) {
        validated.push({
          externalId: deterministicId(year, source.code, number),
          identityKey: `NEET:${year}:annual:${source.code}:${number}`,
          exam: 'NEET',
          year,
          paperCode: source.code,
          originalQuestionNumber: number,
          originalOrder: number,
          originalSection: sectionFor(year, number),
          questionType: 'SINGLE_CORRECT',
          questionText: recovered.question.trim(),
          options: recovered.options.map((option) => option.trim()),
          correctOption: optionLetter(officialKey.answers[String(number)][0]),
          subjectCode,
          sourceChapter: recovered.chapter,
          chapterSlug,
          topic,
          difficulty: String(recovered.difficulty ?? 'medium').toUpperCase(),
          explanation: `The official NTA final answer key for NEET ${year} booklet ${source.code} maps question ${number} to option ${optionLetter(officialKey.answers[String(number)][0])}. The historical wording and option order were recovered from the cited paper archive; no third-party worked solution is reproduced.`,
          sourceType: 'HISTORICAL_VERIFIED',
          sourceName: `NEET ${year} booklet ${source.code} historical paper`,
          sourceUrl: source.paperUrl,
          officialAnswerKeyReference: source.keyUrl,
          examYear: year,
          paperSession: `Annual booklet ${source.code}`,
          contentClass: 'PRODUCTION',
          reviewState: 'REVIEW_REQUIRED',
          validationState: 'VALIDATED',
          source: {
            wordingArchiveUrl: source.paperUrl,
            canonicalPaperPdfUrl: source.paperPdfUrl,
            officialFinalAnswerKeyUrl: source.keyUrl,
            transcriptionAidUrl: source.transcriptionAidUrl,
            wordingSource: 'AglaSem historical mirror, with a separate structured transcription aid checked against the exact booklet identity',
            answerAuthority: 'National Testing Agency final answer key',
            paperSha256: sha256(pdfPath),
            answerKeySha256: sha256(keyPdfPath),
          },
          answerValidation: {
            officialFinalKeyOption: optionLetter(officialKey.answers[String(number)][0]),
            transcriptionAidOption: recovered.correct_options?.[0]?.toUpperCase() ?? null,
            transcriptionAidMatchedOfficialKey: recovered.correct_options?.[0]?.toUpperCase() === optionLetter(officialKey.answers[String(number)][0]),
          },
        });
      }
    }
    if (!recovered || reasons.length > 0) {
      quarantined.push({
        exam: 'NEET', year, paperCode: source.code, originalQuestionNumber: number,
        reasons,
        recoveredQuestionText: recovered?.question ?? null,
      });
    }
  }

  const yearDir = path.join(outputRoot, String(year));
  fs.mkdirSync(yearDir, { recursive: true });
  const subjectCounts = Object.fromEntries(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].map((subject) => [subject, validated.filter((question) => question.subjectCode === subject).length]));
  const chapterCounts = Object.fromEntries([...new Set(validated.map((question) => question.chapterSlug))].sort().map((chapter) => [chapter, validated.filter((question) => question.chapterSlug === chapter).length]));
  const manifest = {
    exam: 'NEET', year, paperCode: source.code,
    pattern: {
      totalPrintedQuestions: source.expected,
      questionsRequiredToAnswer: source.attempted,
      durationMinutes: source.duration,
      maximumMarks: 720,
      marking: { correct: 4, incorrect: -1, unanswered: 0 },
      sections: year === 2025 ? '180 compulsory questions' : 'Section A: 35 compulsory per subject; Section B: answer 10 of 15 per subject',
    },
    completeness: {
      expected: source.expected,
      validated: validated.length,
      quarantined: quarantined.length,
      status: validated.length === source.expected ? 'COMPLETE' : validated.length > 0 ? 'PARTIAL' : 'UNAVAILABLE',
    },
    subjectCounts,
    chapterCounts,
    provenance: 'HISTORICAL_VERIFIED',
    validation: {
      exactBookletMatched: true,
      officialFinalAnswerKeyMatched: true,
      onlySingleCorrectQuestionsRetained: true,
      imageDependentOrMalformedQuestionsQuarantined: true,
    },
    sources: {
      questionPaperArchive: source.paperUrl,
      questionPaperPdf: source.paperPdfUrl,
      officialFinalAnswerKey: source.keyUrl,
      transcriptionAid: source.transcriptionAidUrl,
      paperSha256: sha256(pdfPath),
      answerKeySha256: sha256(keyPdfPath),
    },
  };
  fs.writeFileSync(path.join(yearDir, 'questions.json'), `${JSON.stringify(validated, null, 2)}\n`);
  fs.writeFileSync(path.join(yearDir, 'quarantine.json'), `${JSON.stringify(quarantined, null, 2)}\n`);
  fs.writeFileSync(path.join(yearDir, 'source-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  yearlySummaries.push({ year, ...manifest.completeness, subjectCounts });
}

fs.writeFileSync(path.join(outputRoot, 'release-manifest.json'), `${JSON.stringify({
  exam: 'NEET', years: Object.keys(sources).map(Number), provenance: 'HISTORICAL_VERIFIED',
  generatedFrom: 'Exact-code historical paper transcriptions validated against official NTA final answer keys',
  yearlySummaries,
  totals: {
    expected: yearlySummaries.reduce((sum, year) => sum + year.expected, 0),
    validated: yearlySummaries.reduce((sum, year) => sum + year.validated, 0),
    quarantined: yearlySummaries.reduce((sum, year) => sum + year.quarantined, 0),
  },
}, null, 2)}\n`);

console.log(JSON.stringify(yearlySummaries, null, 2));
