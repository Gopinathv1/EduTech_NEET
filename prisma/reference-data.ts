/**
 * Reference data shared by the full dev seed (`seed.ts`) and the production
 * reference-only seed (`seed-reference.ts`): the 4 NEET subjects, their chapters
 * (with weightage — drives the generator), and the 8 admission countries.
 *
 * This file has NO side effects (no Prisma client, no writes), so it is safe to
 * import from either seed script.
 */
export type Lang = { en: string; ta: string };

// Chapter definitions (5 per subject) keyed by a stable slug.
export const CHAPTERS: Record<
  string,
  Record<string, { name: Lang; class: number; weightage: number }>
> = {
  PHYSICS: {
    mechanics: { name: { en: 'Laws of Motion', ta: 'இயக்க விதிகள்' }, class: 11, weightage: 12 },
    thermodynamics: { name: { en: 'Thermodynamics', ta: 'வெப்ப இயக்கவியல்' }, class: 11, weightage: 9 },
    electrostatics: { name: { en: 'Electrostatics', ta: 'நிலைமின்னியல்' }, class: 12, weightage: 10 },
    currentElectricity: { name: { en: 'Current Electricity', ta: 'மின்னோட்டவியல்' }, class: 12, weightage: 8 },
    modernPhysics: { name: { en: 'Modern Physics', ta: 'நவீன இயற்பியல்' }, class: 12, weightage: 11 },
  },
  CHEMISTRY: {
    basicConcepts: { name: { en: 'Some Basic Concepts of Chemistry', ta: 'வேதியியலின் அடிப்படைக் கருத்துகள்' }, class: 11, weightage: 8 },
    chemicalBonding: { name: { en: 'Chemical Bonding', ta: 'வேதிப் பிணைப்பு' }, class: 11, weightage: 11 },
    equilibrium: { name: { en: 'Equilibrium', ta: 'சமநிலை' }, class: 11, weightage: 9 },
    organic: { name: { en: 'Basic Organic Chemistry', ta: 'அடிப்படை கரிம வேதியியல்' }, class: 11, weightage: 12 },
    coordination: { name: { en: 'Coordination Compounds', ta: 'ஒருங்கிணைப்பு சேர்மங்கள்' }, class: 12, weightage: 9 },
  },
  BOTANY: {
    cellBiology: { name: { en: 'Cell: The Unit of Life', ta: 'செல்: உயிரின் அலகு' }, class: 11, weightage: 10 },
    plantPhysiology: { name: { en: 'Plant Physiology', ta: 'தாவர வளர்சிதை மாற்றம்' }, class: 11, weightage: 11 },
    morphology: { name: { en: 'Morphology of Flowering Plants', ta: 'பூக்கும் தாவரங்களின் உருவவியல்' }, class: 11, weightage: 9 },
    genetics: { name: { en: 'Principles of Inheritance and Variation', ta: 'மரபுரிமை மற்றும் மாறுபாட்டின் கோட்பாடுகள்' }, class: 12, weightage: 14 },
    ecology: { name: { en: 'Ecology and Environment', ta: 'சூழ்நிலையியல் மற்றும் சுற்றுச்சூழல்' }, class: 12, weightage: 12 },
  },
  ZOOLOGY: {
    animalKingdom: { name: { en: 'Animal Kingdom', ta: 'விலங்கு உலகம்' }, class: 11, weightage: 10 },
    digestion: { name: { en: 'Digestion and Absorption', ta: 'செரிமானம் மற்றும் உட்கிரகித்தல்' }, class: 11, weightage: 8 },
    bodyFluids: { name: { en: 'Body Fluids and Circulation', ta: 'உடல் திரவங்கள் மற்றும் சுற்றோட்டம்' }, class: 11, weightage: 10 },
    reproduction: { name: { en: 'Human Reproduction', ta: 'மனித இனப்பெருக்கம்' }, class: 12, weightage: 12 },
    evolution: { name: { en: 'Evolution', ta: 'பரிணாமம்' }, class: 12, weightage: 11 },
  },
};

export const SUBJECTS: { code: string; name: Lang; order: number }[] = [
  { code: 'PHYSICS', name: { en: 'Physics', ta: 'இயற்பியல்' }, order: 1 },
  { code: 'CHEMISTRY', name: { en: 'Chemistry', ta: 'வேதியியல்' }, order: 2 },
  { code: 'BOTANY', name: { en: 'Botany', ta: 'தாவரவியல்' }, order: 3 },
  { code: 'ZOOLOGY', name: { en: 'Zoology', ta: 'விலங்கியல்' }, order: 4 },
];

export const COUNTRIES: { code: string; name: Lang; description: Lang; order: number }[] = [
  { code: 'RU', name: { en: 'Russia', ta: 'ரஷ்யா' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 1 },
  { code: 'GE', name: { en: 'Georgia', ta: 'ஜார்ஜியா' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 2 },
  { code: 'VN', name: { en: 'Vietnam', ta: 'வியட்நாம்' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 3 },
  { code: 'AM', name: { en: 'Armenia', ta: 'ஆர்மேனியா' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 4 },
  { code: 'UZ', name: { en: 'Uzbekistan', ta: 'உஸ்பெகிஸ்தான்' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 5 },
  { code: 'KG', name: { en: 'Kyrgyzstan', ta: 'கிர்கிஸ்தான்' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 6 },
  { code: 'TJ', name: { en: 'Tajikistan', ta: 'தஜிகிஸ்தான்' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 7 },
  { code: 'KZ', name: { en: 'Kazakhstan', ta: 'கஜகஸ்தான்' }, description: { en: 'Current MBBS-abroad destination option for admission counselling.', ta: 'சேர்க்கை கவுன்செல்லிங்கிற்கான தற்போதைய MBBS-abroad destination option.' }, order: 8 },
];
