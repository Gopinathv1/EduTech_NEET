import type { Locale } from '@/i18n/config';
import { AI_COURSE_TOPICS, ENGINEERING_STUDY_AREAS, LIVE_COURSE_AREAS } from '@/data/courses';
import { EUROPE_STUDY_DESTINATIONS } from '@/data/study-destinations';

type SupportedLocale = Extract<Locale, 'en' | 'ta' | 'hi'>;

type KnowledgeEntry = {
  id: string;
  keywords: string[];
  href: string;
  label: Record<SupportedLocale, string>;
  answer: Record<SupportedLocale, string>;
};

const DEFAULT_LOCALE: SupportedLocale = 'en';

export const AI_SUGGESTIONS = [
  'Exam Preparation',
  'Study Abroad',
  'Courses',
  'Counselling',
  'Admission Journey',
];

const LOCALIZED_SUGGESTIONS: Record<SupportedLocale, string[]> = {
  en: AI_SUGGESTIONS,
  ta: [
    'Exam Preparation',
    'Study Abroad',
    'Courses',
    'Counselling',
    'Admission Journey',
  ],
  hi: [
    'Exam Preparation',
    'Study Abroad',
    'Courses',
    'Counselling',
    'Admission Journey',
  ],
};

const europeDestinations = EUROPE_STUDY_DESTINATIONS.join(', ');
const engineeringAreas = ENGINEERING_STUDY_AREAS.join(', ');
const liveCourses = LIVE_COURSE_AREAS.join(', ');
const aiTopics = AI_COURSE_TOPICS.join(', ');

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'neet',
    keywords: ['neet', 'prepare', 'preparation', 'physics', 'chemistry', 'biology', 'chapter', 'question bank', 'pyq', 'previous year', 'தயாரிப்பு', 'प्रैक्टिस', 'तैयारी'],
    href: '/exam-preparation/neet',
    label: { en: 'Start NEET Preparation', ta: 'NEET தயாரிப்பை தொடங்குங்கள்', hi: 'NEET तैयारी शुरू करें' },
    answer: {
      en: 'SIVORA UP↑RISING supports NEET preparation through Question Bank practice, chapter-wise practice, previous-pattern practice, full-length mock tests, answers, explanations, scoring and performance analytics with English/Tamil support where implemented.',
      ta: 'SIVORA UP↑RISING NEET தயாரிப்புக்கு Question Bank, chapter-wise practice, previous-pattern practice, முழு நீள mock tests, பதில்கள், விளக்கங்கள், scoring மற்றும் performance analytics வழங்குகிறது. செயல்படுத்தப்பட்ட இடங்களில் English/Tamil support கிடைக்கும்.',
      hi: 'SIVORA UP↑RISING NEET तैयारी के लिए Question Bank practice, chapter-wise practice, previous-pattern practice, full-length mock tests, answers, explanations, scoring और performance analytics देता है. जहां लागू है वहां English/Tamil support उपलब्ध है.',
    },
  },
  {
    id: 'exam-preparation',
    keywords: ['exam preparation', 'competitive exam', 'prepare for exam'],
    href: '/exam-preparation',
    label: { en: 'Explore Exam Preparation', ta: 'Exam Preparation பார்க்க', hi: 'Exam Preparation देखें' },
    answer: {
      en: 'SIVORA UP↑RISING organizes exam preparation as a hub. You can choose NEET, JEE or future exam categories, then continue to structured practice, question banks, mock tests and performance insights.',
      ta: 'SIVORA UP↑RISING exam preparation-ஐ ஒரு hub ஆக அமைத்துள்ளது. NEET, JEE அல்லது future exam categories தேர்வு செய்து structured practice, question banks, mock tests மற்றும் performance insights பார்க்கலாம்.',
      hi: 'SIVORA UP↑RISING exam preparation को hub के रूप में रखता है. आप NEET, JEE या future exam categories चुनकर structured practice, question banks, mock tests और performance insights देख सकते हैं.',
    },
  },
  {
    id: 'jee',
    keywords: ['jee preparation', 'jee', 'engineering entrance', 'mathematics', 'maths', 'iit', 'main', 'advanced', 'जेईई', 'கணிதம்'],
    href: '/exam-preparation/jee',
    label: { en: 'Ask About JEE Preparation', ta: 'JEE தயாரிப்பு பற்றி கேளுங்கள்', hi: 'JEE तैयारी के बारे में पूछें' },
    answer: {
      en: 'SIVORA UP↑RISING includes JEE Preparation as a service area: structured practice, concept reinforcement, chapter-wise tests and mock assessments for engineering entrance preparation across Physics, Chemistry and Mathematics. No official NTA affiliation is claimed.',
      ta: 'SIVORA UP↑RISING JEE Preparation-ஐ ஒரு service area ஆக வழங்குகிறது: Physics, Chemistry, Mathematics-க்கு structured practice, concept reinforcement, chapter-wise tests மற்றும் mock assessments. Official NTA affiliation என்று எதையும் claim செய்யவில்லை.',
      hi: 'SIVORA UP↑RISING JEE Preparation को service area के रूप में शामिल करता है: Physics, Chemistry और Mathematics के लिए structured practice, concept reinforcement, chapter-wise tests और mock assessments. Official NTA affiliation का दावा नहीं किया जाता.',
    },
  },
  {
    id: 'mock-tests',
    keywords: ['mock', 'test', 'price', '30', 'purchase', 'payment', 'result', 'score', 'analytics', 'exam', 'attempt', '₹', 'ரூ', 'மதிப்பெண்', 'टेस्ट', 'रिजल्ट'],
    href: '/exam-preparation',
    label: { en: 'View Mock Tests', ta: 'Mock Tests பார்க்க', hi: 'Mock Tests देखें' },
    answer: {
      en: 'Mock tests are available as a digital learning product. The public site highlights Rs.30 per mock test, English + Tamil support, full-length tests, previous-pattern practice and performance analytics. After a test, students can review scores, answers and weak areas.',
      ta: 'Mock tests ஒரு digital learning product ஆக கிடைக்கின்றன. Public site-ல் ஒரு mock test Rs.30, English + Tamil support, full-length tests, previous-pattern practice மற்றும் performance analytics குறிப்பிடப்பட்டுள்ளது. Test முடிந்த பின் score, answers, weak areas பார்க்கலாம்.',
      hi: 'Mock tests digital learning product के रूप में उपलब्ध हैं. Public site में Rs.30 per mock test, English + Tamil support, full-length tests, previous-pattern practice और performance analytics बताया गया है. Test के बाद student score, answers और weak areas review कर सकता है.',
    },
  },
  {
    id: 'admissions',
    keywords: ['study abroad', 'admission', 'mbbs', 'abroad', 'india', 'country', 'countries', 'college', 'university', 'course', 'counselling', 'guidance', 'medical', 'visa', 'documentation', 'arrival', 'pre-departure', 'சேர்க்கை', 'வெளிநாடு', 'काउंसलिंग', 'एडमिशन'],
    href: '/study-abroad',
    label: { en: 'Request Counselling', ta: 'Counselling கேட்க', hi: 'Counselling Request करें' },
    answer: {
      en: 'SIVORA UP↑RISING provides education and admission guidance for MBBS abroad, engineering abroad, higher education, country and university selection, course selection, application pathways, documentation, budgeting, visa guidance, pre-departure, arrival and continued support. Outcomes depend on eligibility, university criteria and applicable regulations.',
      ta: 'SIVORA UP↑RISING MBBS abroad, engineering abroad, higher education, country/university selection, course selection, application pathways, documentation, budgeting, visa guidance, pre-departure, arrival மற்றும் continued support குறித்து வழிகாட்டுகிறது. முடிவுகள் eligibility, university criteria மற்றும் regulations அடிப்படையில் இருக்கும்.',
      hi: 'SIVORA UP↑RISING MBBS abroad, engineering abroad, higher education, country/university selection, course selection, application pathways, documentation, budgeting, visa guidance, pre-departure, arrival और continued support में guidance देता है. Outcomes eligibility, university criteria और regulations पर निर्भर करते हैं.',
    },
  },
  {
    id: 'admission-journey',
    keywords: ['admission journey', 'student journey', 'real students', 'arrival support'],
    href: '/admission-journey',
    label: { en: 'View Admission Journey', ta: 'Admission Journey பார்க்க', hi: 'Admission Journey देखें' },
    answer: {
      en: 'The admission journey page explains how SIVORA UP↑RISING guides students from counselling and profile assessment to course selection, applications, documentation, visa guidance, departure, arrival and continued support.',
      ta: 'Admission journey page counselling, profile assessment, course selection, applications, documentation, visa guidance, departure, arrival மற்றும் continued support வரை SIVORA UP↑RISING எப்படி வழிகாட்டுகிறது என்பதை விளக்குகிறது.',
      hi: 'Admission journey page बताता है कि SIVORA UP↑RISING counselling और profile assessment से course selection, applications, documentation, visa guidance, departure, arrival और continued support तक कैसे guide करता है.',
    },
  },
  {
    id: 'study-europe',
    keywords: ['europe', 'germany', 'france', 'italy', 'poland', 'hungary', 'czech', 'lithuania', 'latvia', 'romania', 'bulgaria', 'ireland', 'eu', 'ஜெர்மனி', 'यूरोप'],
    href: '/study-abroad',
    label: { en: 'Explore Europe', ta: 'Europe options பார்க்க', hi: 'Europe options देखें' },
    answer: {
      en: `SIVORA UP↑RISING can guide students exploring selected European destinations such as ${europeDestinations}. Guidance depends on course availability, eligibility, language requirements, budget, student preference and university criteria. Admission is not guaranteed, and no official university partnership is claimed.`,
      ta: `SIVORA UP↑RISING ${europeDestinations} போன்ற selected European destinations குறித்து guidance வழங்க முடியும். Course availability, eligibility, language requirements, budget, student preference மற்றும் university criteria அடிப்படையில் guidance இருக்கும். Admission guarantee இல்லை; official university partnership claim செய்யப்படவில்லை.`,
      hi: `SIVORA UP↑RISING ${europeDestinations} जैसे selected European destinations पर guidance दे सकता है. Guidance course availability, eligibility, language requirements, budget, student preference और university criteria पर निर्भर करती है. Admission guarantee नहीं है, और official university partnership का दावा नहीं है.`,
    },
  },
  {
    id: 'engineering-abroad',
    keywords: ['engineering abroad', 'technology abroad', 'computer science', 'artificial intelligence', 'data science', 'cybersecurity', 'mechanical', 'civil', 'electrical', 'electronics', 'robotics', 'biotechnology', 'information technology', 'engineering in germany', 'इंजीनियरिंग', 'பொறியியல்'],
    href: '/study-abroad',
    label: { en: 'Explore Engineering Abroad', ta: 'Engineering Abroad பார்க்க', hi: 'Engineering Abroad देखें' },
    answer: {
      en: `SIVORA UP↑RISING can guide students on international engineering and technology pathways including ${engineeringAreas}. University and course recommendations are based on interests, academic background, eligibility, destination options and budget. Admission is not guaranteed.`,
      ta: `SIVORA UP↑RISING ${engineeringAreas} போன்ற international engineering and technology pathways குறித்து வழிகாட்ட முடியும். Recommendations interests, academic background, eligibility, destination options மற்றும் budget அடிப்படையில் இருக்கும். Admission guarantee இல்லை.`,
      hi: `SIVORA UP↑RISING ${engineeringAreas} जैसे international engineering and technology pathways पर guidance दे सकता है. Recommendations interests, academic background, eligibility, destination options और budget पर आधारित होते हैं. Admission guarantee नहीं है.`,
    },
  },
  {
    id: 'courses',
    keywords: ['live course', 'live courses', 'python', 'data science', 'machine learning', 'generative ai', 'coding', 'programming', 'future skills', 'skill', 'கோர்ஸ்', 'कोर्स'],
    href: '/courses',
    label: { en: 'View Courses', ta: 'Courses பார்க்க', hi: 'Courses देखें' },
    answer: {
      en: `SIVORA UP↑RISING can offer guided learning programs in competitive exam preparation and future skills such as ${liveCourses}. Schedules and prices should be confirmed with the team before enrolling.`,
      ta: `SIVORA UP↑RISING competitive exam preparation மற்றும் future skills-ல் guided learning programs வழங்க முடியும்: ${liveCourses}. Schedule மற்றும் price-ஐ enrol செய்வதற்கு முன் team உடன் confirm செய்ய வேண்டும்.`,
      hi: `SIVORA UP↑RISING competitive exam preparation और future skills में guided learning programs दे सकता है: ${liveCourses}. Schedule और price enrollment से पहले team से confirm करें.`,
    },
  },
  {
    id: 'ai-courses',
    keywords: ['ai course', 'ai', 'artificial intelligence', 'prompt', 'rag', 'llm', 'python for ai', 'teach ai', 'do you teach ai', 'ஏஐ', 'एआई'],
    href: '/courses',
    label: { en: 'Explore AI Courses', ta: 'AI Courses பார்க்க', hi: 'AI Courses देखें' },
    answer: {
      en: `SIVORA UP↑RISING can guide learners through AI and future technology topics such as ${aiTopics}. Certification, placement or accreditation is not claimed unless verified.`,
      ta: `SIVORA UP↑RISING ${aiTopics} போன்ற AI and future technology topics-ல் learners-க்கு guidance வழங்க முடியும். Verified அல்லாத certification, placement அல்லது accreditation claim செய்யப்படவில்லை.`,
      hi: `SIVORA UP↑RISING ${aiTopics} जैसे AI and future technology topics में learners को guide कर सकता है. Verified न होने पर certification, placement या accreditation का दावा नहीं किया जाता.`,
    },
  },
  {
    id: 'student-life',
    keywords: ['part-time', 'part time', 'job', 'work', 'salary', 'student life', 'working hours', 'abroad work', 'வேலை', 'नौकरी', 'काम'],
    href: '/study-abroad',
    label: { en: 'Ask About Student Life', ta: 'Student Life பற்றி கேளுங்கள்', hi: 'Student Life के बारे में पूछें' },
    answer: {
      en: "SIVORA UP↑RISING can guide students with practical information about student life abroad, local rules, permitted work options where applicable, budgeting and adapting to a new country. Part-time work eligibility and permitted working hours depend on the student's visa type, country-specific regulations and university policies. We do not promise jobs, salary or work hours.",
      ta: 'SIVORA UP↑RISING student life abroad, local rules, permitted work options where applicable, budgeting மற்றும் புதிய நாட்டுக்கு adapt ஆகுவது குறித்து practical guidance வழங்க முடியும். Part-time work eligibility மற்றும் allowed hours visa type, country rules மற்றும் university policies அடிப்படையில் இருக்கும். Jobs, salary அல்லது work hours guarantee செய்யப்படவில்லை.',
      hi: 'SIVORA UP↑RISING student life abroad, local rules, जहां लागू हो permitted work options, budgeting और नए देश में adjust होने पर practical guidance दे सकता है. Part-time work eligibility और permitted hours visa type, country rules और university policies पर निर्भर करते हैं. Jobs, salary या work hours promise नहीं किए जाते.',
    },
  },
  {
    id: 'partners',
    keywords: ['partner', 'b2b', 'agency', 'school', 'consultant', 'institution', 'college', 'coaching centre', 'பார்ட்னர்', 'साझेदार', 'पार्टनर'],
    href: '/partners',
    label: { en: 'Partner With Us', ta: 'Partner With Us', hi: 'Partner With Us' },
    answer: {
      en: 'SIVORA UP↑RISING has a B2B pathway for schools, colleges, coaching centres, education consultants and overseas admission partners. Use the partner page or WhatsApp to speak with the partner team.',
      ta: 'SIVORA UP↑RISING schools, colleges, coaching centres, education consultants மற்றும் overseas admission partners-க்கு B2B pathway வைத்துள்ளது. Partner page அல்லது WhatsApp மூலம் partner team-ஐ தொடர்பு கொள்ளலாம்.',
      hi: 'SIVORA UP↑RISING schools, colleges, coaching centres, education consultants और overseas admission partners के लिए B2B pathway देता है. Partner page या WhatsApp से partner team से बात कर सकते हैं.',
    },
  },
  {
    id: 'auth',
    keywords: ['register', 'login', 'otp', 'mobile', 'account', 'sign in', 'passwordless', 'பதிவு', 'लॉगिन', 'रजिस्टर'],
    href: '/register',
    label: { en: 'Register or Login', ta: 'Register / Login', hi: 'Register / Login' },
    answer: {
      en: 'Students register with profile details and use passwordless mobile OTP login. OTP is used for verification and login, and the platform keeps authentication in secure sessions.',
      ta: 'Students profile details மூலம் register செய்து passwordless mobile OTP login பயன்படுத்துகிறார்கள். OTP verification மற்றும் login-க்கு பயன்படும்; authentication secure sessions-ல் இருக்கும்.',
      hi: 'Students profile details से register करते हैं और passwordless mobile OTP login इस्तेमाल करते हैं. OTP verification और login के लिए है, और authentication secure sessions में रहता है.',
    },
  },
  {
    id: 'support',
    keywords: ['contact', 'support', 'help', 'faq', 'whatsapp', 'counsellor', 'team', 'talk to counsellor', 'தொடர்பு', 'உதவி', 'सपोर्ट', 'संपर्क'],
    href: '/counselling',
    label: { en: 'Contact Us', ta: 'Contact Us', hi: 'Contact Us' },
    answer: {
      en: 'For human help, use WhatsApp, the contact form or counselling request. The team can guide you on NEET, JEE, mock tests, MBBS abroad, engineering abroad, Study in Europe, courses, student life abroad and partner enquiries.',
      ta: 'மனித உதவிக்கு WhatsApp, contact form அல்லது counselling request பயன்படுத்துங்கள். NEET, JEE, mock tests, MBBS abroad, engineering abroad, Study in Europe, courses, student life abroad மற்றும் partner enquiries-க்கு team வழிகாட்டும்.',
      hi: 'Human help के लिए WhatsApp, contact form या counselling request इस्तेमाल करें. Team NEET, JEE, mock tests, MBBS abroad, engineering abroad, Study in Europe, courses, student life abroad और partner enquiries पर guide कर सकती है.',
    },
  },
];

const WELCOME: Record<SupportedLocale, string> = {
  en: "Hi! I'm Ask SIVORA UP↑RISING AI. I can help with NEET/JEE preparation, MBBS abroad, engineering abroad, Study in Europe, AI courses, live courses, student life abroad, admissions and B2B enquiries. What would you like to know?",
  ta: 'வணக்கம்! நான் Ask SIVORA UP↑RISING AI. NEET/JEE தயாரிப்பு, MBBS abroad, engineering abroad, Study in Europe, AI courses, live courses, student life abroad, admissions மற்றும் B2B enquiries பற்றி உதவ முடியும். என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?',
  hi: 'नमस्ते! मैं Ask SIVORA UP↑RISING AI हूं. मैं NEET/JEE तैयारी, MBBS abroad, engineering abroad, Study in Europe, AI courses, live courses, student life abroad, admissions और B2B enquiries में मदद कर सकता हूं. आप क्या जानना चाहते हैं?',
};

const FALLBACK: Record<SupportedLocale, string> = {
  en: "I don't have enough verified information to answer that accurately. Would you like to speak with our counselling team?",
  ta: 'அதற்கு துல்லியமாக பதில் அளிக்க போதுமான verified information இல்லை. எங்கள் counselling team உடன் பேச விரும்புகிறீர்களா?',
  hi: 'इसका सटीक जवाब देने के लिए मेरे पास पर्याप्त verified information नहीं है. क्या आप हमारी counselling team से बात करना चाहेंगे?',
};

const CLEAR_MESSAGE: Record<SupportedLocale, string> = {
  en: 'Chat cleared. Ask a question or choose a topic to continue.',
  ta: 'Chat clear செய்யப்பட்டது. கேள்வி கேளுங்கள் அல்லது ஒரு topic தேர்வு செய்யுங்கள்.',
  hi: 'Chat clear हो गया. सवाल पूछें या कोई topic चुनें.',
};

function normalizeLocale(locale: string | undefined): SupportedLocale {
  return locale === 'ta' || locale === 'hi' ? locale : DEFAULT_LOCALE;
}

function retrieveKnowledge(query: string): KnowledgeEntry | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  let best: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.keywords.reduce((total, keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      if (!normalized.includes(normalizedKeyword)) return total;
      return total + normalizedKeyword.length;
    }, 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  return best?.entry ?? null;
}

export function getAiWelcomeMessage(locale?: string): string {
  return WELCOME[normalizeLocale(locale)];
}

export function getAiClearMessage(locale?: string): string {
  return CLEAR_MESSAGE[normalizeLocale(locale)];
}

export function getLocalizedAiSuggestions(locale?: string): string[] {
  return LOCALIZED_SUGGESTIONS[normalizeLocale(locale)];
}

export function getMockAiResponse(topic: string, locale?: string): string {
  const activeLocale = normalizeLocale(locale);
  const result = retrieveKnowledge(topic);
  if (!result) return FALLBACK[activeLocale];
  return `${result.answer[activeLocale]}\n\n${result.label[activeLocale]}: ${result.href}`;
}

export function hasGroundedAiAnswer(topic: string): boolean {
  return retrieveKnowledge(topic) !== null;
}
