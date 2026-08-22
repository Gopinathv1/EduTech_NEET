/**
 * Database seed for the SIVORA UPRISING competitive-exam preparation platform.
 *
 * Seeds: 4 NEET subjects, 5 chapters each (with weightage), 20 bilingual sample
 * questions (en + ta), the 6 admission countries, a super admin + an admin, and
 * 2 published tests (a random full test and a fixed Botany chapter test).
 *
 * Idempotent: existing seed data is cleared first, so it is safe to re-run.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CHAPTERS, SUBJECTS, COUNTRIES, type Lang } from './reference-data';

const prisma = new PrismaClient();

type Correct = 'A' | 'B' | 'C' | 'D';

// ---------------------------------------------------------------------------
// 20 sample questions (each with English + Tamil translation).
// `key` is a stable slug used to wire fixed questions into the chapter test.
// ---------------------------------------------------------------------------
type QSeed = {
  key: string;
  subject: string;
  chapter: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'SINGLE_CORRECT' | 'IMAGE_BASED' | 'ASSERTION_REASON';
  year?: number;
  tags: string[];
  imageUrl?: string;
  correct: Correct;
  en: { q: string; a: string; b: string; c: string; d: string; e: string };
  ta: { q: string; a: string; b: string; c: string; d: string; e: string };
};

const QUESTIONS: QSeed[] = [
  // ---- Physics ----
  {
    key: 'phy-1', subject: 'PHYSICS', chapter: 'mechanics', difficulty: 'EASY', type: 'SINGLE_CORRECT', year: 2021, tags: ['units', 'force'], correct: 'A',
    en: { q: 'What is the SI unit of force?', a: 'Newton', b: 'Joule', c: 'Pascal', d: 'Watt', e: 'Force is measured in newtons (kg·m/s²).' },
    ta: { q: 'விசையின் SI அலகு எது?', a: 'நியூட்டன்', b: 'ஜூல்', c: 'பாஸ்கல்', d: 'வாட்', e: 'விசை நியூட்டனில் (kg·m/s²) அளக்கப்படுகிறது.' },
  },
  {
    key: 'phy-2', subject: 'PHYSICS', chapter: 'mechanics', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2020, tags: ['momentum'], correct: 'B',
    en: { q: 'A body of mass 2 kg moves at 3 m/s. Its linear momentum is:', a: '5 kg·m/s', b: '6 kg·m/s', c: '1.5 kg·m/s', d: '9 kg·m/s', e: 'p = mv = 2 × 3 = 6 kg·m/s.' },
    ta: { q: '2 kg நிறை உள்ள பொருள் 3 m/s வேகத்தில் நகர்கிறது. அதன் நேர்கோட்டு உந்தம்:', a: '5 kg·m/s', b: '6 kg·m/s', c: '1.5 kg·m/s', d: '9 kg·m/s', e: 'p = mv = 2 × 3 = 6 kg·m/s.' },
  },
  {
    key: 'phy-3', subject: 'PHYSICS', chapter: 'electrostatics', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2019, tags: ['coulomb'], correct: 'A',
    en: { q: "Coulomb's force between two charges is directly proportional to:", a: 'the product of the charges', b: 'the sum of the charges', c: 'the difference of the charges', d: 'the distance between them', e: 'F ∝ q₁q₂ / r².' },
    ta: { q: 'இரு மின்னூட்டங்களுக்கு இடையேயான கூலூம் விசை எதற்கு நேர்விகிதத்தில் இருக்கும்?', a: 'மின்னூட்டங்களின் பெருக்கற்பலனுக்கு', b: 'மின்னூட்டங்களின் கூட்டுத்தொகைக்கு', c: 'மின்னூட்டங்களின் வித்தியாசத்திற்கு', d: 'அவற்றின் இடைத்தூரத்திற்கு', e: 'F ∝ q₁q₂ / r².' },
  },
  {
    key: 'phy-4', subject: 'PHYSICS', chapter: 'currentElectricity', difficulty: 'EASY', type: 'IMAGE_BASED', year: 2022, tags: ['ohms-law', 'circuit'], imageUrl: '/seed/images/circuit-ohms-law.png', correct: 'A',
    en: { q: 'For the resistor shown in the circuit, Ohm’s law states that V equals:', a: 'IR', b: 'I / R', c: 'R / I', d: 'I²R', e: 'Ohm’s law: V = IR.' },
    ta: { q: 'சுற்றில் காட்டப்பட்டுள்ள மின்தடைக்கு, ஓமின் விதிப்படி V சமம்:', a: 'IR', b: 'I / R', c: 'R / I', d: 'I²R', e: 'ஓமின் விதி: V = IR.' },
  },
  {
    key: 'phy-5', subject: 'PHYSICS', chapter: 'modernPhysics', difficulty: 'HARD', type: 'ASSERTION_REASON', year: 2018, tags: ['photon'], correct: 'B',
    en: { q: 'Assertion: A photon carries momentum. Reason: A photon has zero rest mass.', a: 'Both true and Reason is the correct explanation', b: 'Both true but Reason is not the correct explanation', c: 'Assertion true, Reason false', d: 'Assertion false, Reason true', e: 'Both statements are true, but zero rest mass is not why a photon has momentum (p = E/c = h/λ).' },
    ta: { q: 'கூற்று: ஒளியணு உந்தத்தைக் கொண்டுள்ளது. காரணம்: ஒளியணுவின் நிலை நிறை பூஜ்யம்.', a: 'இரண்டும் சரி, காரணம் சரியான விளக்கம்', b: 'இரண்டும் சரி, ஆனால் காரணம் சரியான விளக்கம் அல்ல', c: 'கூற்று சரி, காரணம் தவறு', d: 'கூற்று தவறு, காரணம் சரி', e: 'இரண்டும் சரி; ஆனால் நிலை நிறை பூஜ்யமாக இருப்பது உந்தத்திற்கான காரணம் அல்ல (p = E/c = h/λ).' },
  },
  // ---- Chemistry ----
  {
    key: 'chem-1', subject: 'CHEMISTRY', chapter: 'basicConcepts', difficulty: 'EASY', type: 'SINGLE_CORRECT', year: 2021, tags: ['mole'], correct: 'A',
    en: { q: 'The value of Avogadro’s number is approximately:', a: '6.022 × 10²³', b: '6.022 × 10⁻²³', c: '3.011 × 10²³', d: '1.66 × 10⁻²⁴', e: 'One mole contains 6.022 × 10²³ particles.' },
    ta: { q: 'அவகாட்ரோ எண்ணின் மதிப்பு தோராயமாக:', a: '6.022 × 10²³', b: '6.022 × 10⁻²³', c: '3.011 × 10²³', d: '1.66 × 10⁻²⁴', e: 'ஒரு மோலில் 6.022 × 10²³ துகள்கள் உள்ளன.' },
  },
  {
    key: 'chem-2', subject: 'CHEMISTRY', chapter: 'chemicalBonding', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2020, tags: ['bonding'], correct: 'A',
    en: { q: 'The bond present in sodium chloride (NaCl) is:', a: 'Ionic', b: 'Covalent', c: 'Metallic', d: 'Hydrogen', e: 'Na⁺ and Cl⁻ are held by ionic bonding.' },
    ta: { q: 'சோடியம் குளோரைடில் (NaCl) உள்ள பிணைப்பு:', a: 'அயனிப் பிணைப்பு', b: 'சகப்பிணைப்பு', c: 'உலோகப் பிணைப்பு', d: 'ஹைட்ரஜன் பிணைப்பு', e: 'Na⁺ மற்றும் Cl⁻ அயனிப் பிணைப்பால் இணைக்கப்பட்டுள்ளன.' },
  },
  {
    key: 'chem-3', subject: 'CHEMISTRY', chapter: 'equilibrium', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2019, tags: ['ph'], correct: 'B',
    en: { q: 'The pH of a neutral aqueous solution at 25 °C is:', a: '0', b: '7', c: '14', d: '1', e: 'At 25 °C, neutral water has pH = 7.' },
    ta: { q: '25 °C இல் நடுநிலை நீர்க்கரைசலின் pH மதிப்பு:', a: '0', b: '7', c: '14', d: '1', e: '25 °C இல் நடுநிலை நீரின் pH = 7.' },
  },
  {
    key: 'chem-4', subject: 'CHEMISTRY', chapter: 'organic', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2022, tags: ['alkane'], correct: 'A',
    en: { q: 'The general formula of an alkane is:', a: 'CₙH₂ₙ₊₂', b: 'CₙH₂ₙ', c: 'CₙH₂ₙ₋₂', d: 'CₙHₙ', e: 'Saturated alkanes follow CₙH₂ₙ₊₂.' },
    ta: { q: 'ஆல்கேனின் பொது வாய்ப்பாடு:', a: 'CₙH₂ₙ₊₂', b: 'CₙH₂ₙ', c: 'CₙH₂ₙ₋₂', d: 'CₙHₙ', e: 'நிறைவுற்ற ஆல்கேன்கள் CₙH₂ₙ₊₂ ஐப் பின்பற்றுகின்றன.' },
  },
  {
    key: 'chem-5', subject: 'CHEMISTRY', chapter: 'coordination', difficulty: 'HARD', type: 'SINGLE_CORRECT', year: 2018, tags: ['coordination-number'], correct: 'C',
    en: { q: 'The coordination number of iron in [Fe(CN)₆]³⁻ is:', a: '3', b: '4', c: '6', d: '2', e: 'Six CN⁻ ligands give a coordination number of 6.' },
    ta: { q: '[Fe(CN)₆]³⁻ இல் இரும்பின் ஒருங்கிணைப்பு எண்:', a: '3', b: '4', c: '6', d: '2', e: 'ஆறு CN⁻ இணைப்பிகள் ஒருங்கிணைப்பு எண் 6 ஐ தருகின்றன.' },
  },
  // ---- Botany (3 in genetics for the chapter test) ----
  {
    key: 'bot-gen-1', subject: 'BOTANY', chapter: 'genetics', difficulty: 'EASY', type: 'SINGLE_CORRECT', year: 2021, tags: ['mendel'], correct: 'A',
    en: { q: 'Who is regarded as the father of genetics?', a: 'Gregor Mendel', b: 'Charles Darwin', c: 'James Watson', d: 'Hugo de Vries', e: 'Mendel’s pea-plant experiments founded genetics.' },
    ta: { q: 'மரபியலின் தந்தை என்று கருதப்படுபவர் யார்?', a: 'கிரிகோர் மெண்டல்', b: 'சார்லஸ் டார்வின்', c: 'ஜேம்ஸ் வாட்சன்', d: 'ஹியூகோ டி வ்ரீஸ்', e: 'மெண்டலின் பட்டாணி பரிசோதனைகள் மரபியலை நிறுவின.' },
  },
  {
    key: 'bot-gen-2', subject: 'BOTANY', chapter: 'genetics', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2020, tags: ['segregation'], correct: 'A',
    en: { q: 'Mendel’s law of segregation is based on the separation of:', a: 'alleles during gamete formation', b: 'chromosomes during mitosis', c: 'genes during transcription', d: 'nucleotides during replication', e: 'Paired alleles separate so each gamete gets one.' },
    ta: { q: 'மெண்டலின் பிரிதல் விதி எதன் பிரிவின் அடிப்படையில் அமைந்துள்ளது?', a: 'இனச்செல் உருவாக்கத்தின்போது அலீல்கள்', b: 'இழைபிரிதலின்போது குரோமோசோம்கள்', c: 'படியெடுத்தலின்போது மரபணுக்கள்', d: 'நகலெடுத்தலின்போது நியூக்ளியோடைடுகள்', e: 'இணை அலீல்கள் பிரிவதால் ஒவ்வொரு இனச்செல்லும் ஒன்றைப் பெறுகிறது.' },
  },
  {
    key: 'bot-gen-3', subject: 'BOTANY', chapter: 'genetics', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2019, tags: ['test-cross'], correct: 'A',
    en: { q: 'A test cross is a cross between an F₁ individual and a:', a: 'homozygous recessive parent', b: 'homozygous dominant parent', c: 'heterozygous individual', d: 'F₂ individual', e: 'Crossing with a homozygous recessive reveals the genotype.' },
    ta: { q: 'சோதனைக் கலப்பு என்பது F₁ தனிநபருக்கும் எதற்கும் இடையேயான கலப்பாகும்?', a: 'ஒத்த ஒடுங்கு பெற்றோர்', b: 'ஒத்த ஓங்கு பெற்றோர்', c: 'மாறுபட்ட தனிநபர்', d: 'F₂ தனிநபர்', e: 'ஒத்த ஒடுங்குடன் கலப்பது மரபணு வகையை வெளிப்படுத்துகிறது.' },
  },
  {
    key: 'bot-4', subject: 'BOTANY', chapter: 'cellBiology', difficulty: 'EASY', type: 'SINGLE_CORRECT', year: 2022, tags: ['organelle'], correct: 'C',
    en: { q: 'Which organelle is known as the “powerhouse of the cell”?', a: 'Nucleus', b: 'Ribosome', c: 'Mitochondrion', d: 'Golgi apparatus', e: 'Mitochondria generate ATP via respiration.' },
    ta: { q: '“செல்லின் ஆற்றல் மையம்” என அறியப்படும் நுண்ணுறுப்பு எது?', a: 'உட்கரு', b: 'ரைபோசோம்', c: 'மைட்டோகாண்ட்ரியா', d: 'கோல்கை உறுப்பு', e: 'மைட்டோகாண்ட்ரியா சுவாசத்தின் மூலம் ATP ஐ உருவாக்குகிறது.' },
  },
  {
    key: 'bot-5', subject: 'BOTANY', chapter: 'ecology', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2018, tags: ['energy-flow'], correct: 'A',
    en: { q: 'The 10% law of energy transfer in a food chain was proposed by:', a: 'Lindeman', b: 'Odum', c: 'Tansley', d: 'Haeckel', e: 'Lindeman proposed the ten percent law (1942).' },
    ta: { q: 'உணவுச் சங்கிலியில் ஆற்றல் பரிமாற்றத்தின் 10% விதியை முன்மொழிந்தவர்:', a: 'லிண்டேமன்', b: 'ஓடம்', c: 'டான்ஸ்லி', d: 'ஹேக்கல்', e: 'லிண்டேமன் பத்து சதவீத விதியை (1942) முன்மொழிந்தார்.' },
  },
  // ---- Zoology ----
  {
    key: 'zoo-1', subject: 'ZOOLOGY', chapter: 'animalKingdom', difficulty: 'EASY', type: 'SINGLE_CORRECT', year: 2021, tags: ['thermoregulation'], correct: 'A',
    en: { q: 'Which of the following is a cold-blooded (poikilothermic) animal?', a: 'Frog', b: 'Dog', c: 'Human', d: 'Cow', e: 'Amphibians like frogs are poikilothermic.' },
    ta: { q: 'பின்வருவனவற்றுள் குளிர் இரத்த (பொய்கிலோதெர்மிக்) விலங்கு எது?', a: 'தவளை', b: 'நாய்', c: 'மனிதன்', d: 'பசு', e: 'தவளை போன்ற இருவாழ்விகள் பொய்கிலோதெர்மிக் ஆகும்.' },
  },
  {
    key: 'zoo-2', subject: 'ZOOLOGY', chapter: 'digestion', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2020, tags: ['enzyme'], correct: 'A',
    en: { q: 'The enzyme in saliva that begins starch digestion is:', a: 'Salivary amylase (ptyalin)', b: 'Pepsin', c: 'Trypsin', d: 'Lipase', e: 'Ptyalin hydrolyses starch to maltose in the mouth.' },
    ta: { q: 'எச்சிலில் மாவுச்சத்து செரிமானத்தைத் தொடங்கும் நொதி எது?', a: 'எச்சில் அமைலேஸ் (டையலின்)', b: 'பெப்சின்', c: 'டிரிப்சின்', d: 'லைபேஸ்', e: 'டையலின் வாயில் மாவுச்சத்தை மால்டோஸாக மாற்றுகிறது.' },
  },
  {
    key: 'zoo-3', subject: 'ZOOLOGY', chapter: 'bodyFluids', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2019, tags: ['blood-group'], correct: 'B',
    en: { q: 'Which blood group is known as the universal donor?', a: 'AB positive', b: 'O negative', c: 'A positive', d: 'B positive', e: 'O negative red cells lack A, B and Rh antigens.' },
    ta: { q: 'எந்த இரத்தப் பிரிவு பொது கொடையாளர் என அறியப்படுகிறது?', a: 'AB பாசிட்டிவ்', b: 'O நெகட்டிவ்', c: 'A பாசிட்டிவ்', d: 'B பாசிட்டிவ்', e: 'O நெகட்டிவ் சிவப்பணுக்களில் A, B, Rh ஆன்டிஜென்கள் இல்லை.' },
  },
  {
    key: 'zoo-4', subject: 'ZOOLOGY', chapter: 'reproduction', difficulty: 'MEDIUM', type: 'SINGLE_CORRECT', year: 2022, tags: ['fertilization'], correct: 'B',
    en: { q: 'In humans, fertilization normally occurs in the:', a: 'Uterus', b: 'Fallopian tube', c: 'Ovary', d: 'Vagina', e: 'The sperm meets the ovum in the ampulla of the fallopian tube.' },
    ta: { q: 'மனிதர்களில் கருவுறுதல் பொதுவாக எங்கு நிகழ்கிறது?', a: 'கருப்பை', b: 'பெண் அண்டக்குழாய்', c: 'சூலகம்', d: 'யோனி', e: 'விந்தணு அண்டத்தை அண்டக்குழாயின் ஆம்புல்லாவில் சந்திக்கிறது.' },
  },
  {
    key: 'zoo-5', subject: 'ZOOLOGY', chapter: 'evolution', difficulty: 'HARD', type: 'SINGLE_CORRECT', year: 2018, tags: ['natural-selection'], correct: 'A',
    en: { q: 'The phrase “survival of the fittest” is associated with:', a: 'Charles Darwin', b: 'Jean-Baptiste Lamarck', c: 'Gregor Mendel', d: 'Aristotle', e: 'Darwin’s theory of natural selection popularised the phrase.' },
    ta: { q: '“தகுதியானவை பிழைத்தல்” என்ற சொற்றொடர் யாருடன் தொடர்புடையது?', a: 'சார்லஸ் டார்வின்', b: 'லாமார்க்', c: 'கிரிகோர் மெண்டல்', d: 'அரிஸ்டாட்டில்', e: 'டார்வினின் இயற்கைத் தேர்வுக் கோட்பாடு இந்தச் சொற்றொடரைப் பரப்பியது.' },
  },
];

async function main() {
  console.log('🌱  Seeding database...');

  // 1. Clear existing data in dependency order (safe re-run).
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.result.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.admissionLead.deleteMany();
  await prisma.questionTranslation.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.country.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.student.deleteMany();

  // 2. Subjects + chapters. Track ids by slug for later wiring.
  const subjectId: Record<string, string> = {};
  const chapterId: Record<string, string> = {}; // key: `${subjectCode}.${chapterSlug}`

  for (const s of SUBJECTS) {
    const subject = await prisma.subject.create({
      data: { code: s.code, name: s.name, order: s.order },
    });
    subjectId[s.code] = subject.id;

    const chapters = CHAPTERS[s.code];
    let order = 1;
    for (const [slug, c] of Object.entries(chapters)) {
      const chapter = await prisma.chapter.create({
        data: {
          subjectId: subject.id,
          name: c.name,
          class: c.class,
          weightage: c.weightage,
          order: order++,
        },
      });
      chapterId[`${s.code}.${slug}`] = chapter.id;
    }
  }
  console.log(`   ✓ ${SUBJECTS.length} subjects, ${Object.keys(chapterId).length} chapters`);

  // 3. Questions with en + ta translations. Track ids by question key.
  const questionId: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const created = await prisma.question.create({
      data: {
        subjectId: subjectId[q.subject],
        chapterId: chapterId[`${q.subject}.${q.chapter}`],
        difficulty: q.difficulty,
        questionType: q.type,
        year: q.year,
        tags: q.tags,
        imageUrl: q.imageUrl,
        translations: {
          create: [
            {
              language: 'en',
              questionText: q.en.q,
              optionA: q.en.a,
              optionB: q.en.b,
              optionC: q.en.c,
              optionD: q.en.d,
              correctOption: q.correct,
              explanation: q.en.e,
              reviewed: true,
            },
            {
              language: 'ta',
              questionText: q.ta.q,
              optionA: q.ta.a,
              optionB: q.ta.b,
              optionC: q.ta.c,
              optionD: q.ta.d,
              correctOption: q.correct,
              explanation: q.ta.e,
              reviewed: true,
            },
          ],
        },
      },
    });
    questionId[q.key] = created.id;
  }
  console.log(`   ✓ ${QUESTIONS.length} questions (en + ta translations)`);

  // 4. Countries.
  for (const c of COUNTRIES) {
    await prisma.country.create({
      data: { code: c.code, name: c.name, description: c.description, order: c.order },
    });
  }
  console.log(`   ✓ ${COUNTRIES.length} countries`);

  // 5. Admins (super admin + admin).
  const superAdminPassword = 'SuperAdmin@123';
  const adminPassword = 'Admin@123';
  await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      passwordHash: await bcrypt.hash(superAdminPassword, 10),
      role: 'SUPER_ADMIN',
    },
  });
  await prisma.admin.create({
    data: {
      name: 'Content Admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });
  console.log('   ✓ 2 admins');

  // 6. Tests.
  // (a) Random full mock test — questions are generated per attempt (no fixed rows).
  await prisma.test.create({
    data: {
      title: { en: 'NEET Full Mock Test – 2024 Pattern', ta: 'நீட் முழு மாதிரித் தேர்வு – 2024 அமைப்பு' },
      description: {
        en: 'A full-length 180-question NEET simulation across Physics, Chemistry, Botany and Zoology.',
        ta: 'இயற்பியல், வேதியியல், தாவரவியல் மற்றும் விலங்கியல் முழுவதும் 180 வினாக்கள் கொண்ட முழு நீட் மாதிரித் தேர்வு.',
      },
      testType: 'FULL_TEST',
      year: 2024,
      totalQuestions: 180,
      durationMinutes: 180,
      price: 30,
      difficulty: 'MEDIUM',
      isRandom: true,
      isPublished: true,
      availableLanguages: ['en', 'ta'],
      rules: {
        difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 },
        random: { scope: 'FULL_SYLLABUS', subjectIds: [], chapterIds: [] },
      },
    },
  });

  // (b) Fixed Botany "Genetics" chapter test — wired to the seeded genetics questions.
  const geneticsKeys = QUESTIONS.filter((q) => q.subject === 'BOTANY' && q.chapter === 'genetics').map((q) => q.key);
  await prisma.test.create({
    data: {
      title: { en: 'Botany: Genetics Chapter Test', ta: 'தாவரவியல்: மரபியல் அத்தியாயத் தேர்வு' },
      description: {
        en: 'Focused practice on Principles of Inheritance and Variation.',
        ta: 'மரபுரிமை மற்றும் மாறுபாட்டின் கோட்பாடுகள் மீதான குவிந்த பயிற்சி.',
      },
      testType: 'CHAPTER_TEST',
      subjectId: subjectId['BOTANY'],
      chapterId: chapterId['BOTANY.genetics'],
      totalQuestions: geneticsKeys.length,
      durationMinutes: 15,
      price: 30,
      difficulty: 'MEDIUM',
      isRandom: false,
      isPublished: true,
      availableLanguages: ['en', 'ta'],
      testQuestions: {
        create: geneticsKeys.map((key, i) => ({
          questionId: questionId[key],
          order: i + 1,
        })),
      },
    },
  });
  console.log(`   ✓ 2 tests (1 random full test, 1 fixed chapter test with ${geneticsKeys.length} questions)`);

  // 7. One welcome notification (demonstrates the model; no reads yet).
  await prisma.notification.create({
    data: {
      title: { en: 'Welcome to SIVORA UPRISING!', ta: 'SIVORA UPRISING-க்கு வரவேற்கிறோம்!' },
      message: {
        en: 'New mock tests are now available for just ₹30. Start practising today.',
        ta: 'புதிய மாதிரித் தேர்வுகள் இப்போது ₹30க்கு கிடைக்கின்றன. இன்றே பயிற்சியைத் தொடங்குங்கள்.',
      },
      type: 'NEW_MOCK_TEST',
      targetAudience: 'STUDENTS',
      publishedAt: new Date(),
    },
  });
  console.log('   ✓ 1 notification');

  // 8. Invoice counter for the current year (payments allocate sequential numbers).
  const year = new Date().getFullYear();
  await prisma.invoiceCounter.upsert({
    where: { year },
    create: { year, lastSeq: 0 },
    update: {},
  });
  console.log(`   ✓ invoice counter (${year})`);

  console.log('\n✅  Seed complete.');
  console.log('    Super Admin:  superadmin@example.com  /  ' + superAdminPassword);
  console.log('    Admin:        admin@example.com       /  ' + adminPassword);
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
