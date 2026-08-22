import type { Locale } from '@/i18n/config';

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
  'NEET Preparation',
  'Mock Tests',
  'MBBS Abroad',
  'Admission Guidance',
  'Counselling',
  'Partner With Us',
  'Talk on WhatsApp',
];

const LOCALIZED_SUGGESTIONS: Record<SupportedLocale, string[]> = {
  en: AI_SUGGESTIONS,
  ta: ['NEET தயாரிப்பு', 'Mock Tests', 'MBBS Abroad', 'சேர்க்கை வழிகாட்டுதல்', 'Counselling', 'Partner With Us', 'WhatsApp-ல் பேசுங்கள்'],
  hi: ['NEET तैयारी', 'Mock Tests', 'MBBS Abroad', 'एडमिशन गाइडेंस', 'काउंसलिंग', 'Partner With Us', 'WhatsApp पर बात करें'],
};

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'neet',
    keywords: ['neet', 'prepare', 'preparation', 'physics', 'chemistry', 'biology', 'chapter', 'question bank', 'pyq', 'previous year', 'தயாரிப்பு', 'प्रैक्टिस', 'तैयारी'],
    href: '/mock-tests',
    label: { en: 'Start NEET Preparation', ta: 'NEET தயாரிப்பை தொடங்குங்கள்', hi: 'NEET तैयारी शुरू करें' },
    answer: {
      en: 'SIVORA UP↑RISING supports NEET preparation through Question Bank practice, chapter-wise practice, previous-year practice, full-length mock tests, answers, explanations and performance analytics. NEET is the active exam focus today.',
      ta: 'SIVORA UP↑RISING NEET தயாரிப்புக்கு Question Bank, chapter-wise practice, previous-year practice, முழு நீள mock tests, பதில்கள், விளக்கங்கள் மற்றும் performance analytics வழங்குகிறது. இப்போது செயலில் உள்ள தேர்வு NEET.',
      hi: 'SIVORA UP↑RISING NEET तैयारी के लिए Question Bank practice, chapter-wise practice, previous-year practice, full-length mock tests, answers, explanations और performance analytics देता है. अभी सक्रिय परीक्षा NEET है.',
    },
  },
  {
    id: 'mock-tests',
    keywords: ['mock', 'test', 'price', '30', 'purchase', 'payment', 'result', 'score', 'analytics', 'exam', 'attempt', '₹', 'ரூ', 'மதிப்பெண்', 'टेस्ट', 'रिजल्ट'],
    href: '/mock-tests',
    label: { en: 'View Mock Tests', ta: 'Mock Tests பார்க்க', hi: 'Mock Tests देखें' },
    answer: {
      en: 'Mock tests are available as a digital learning product. The public site highlights Rs.30 per mock test, English + Tamil support, full-length tests, previous-year practice and performance analytics. After a test, students can review scores, answers and weak areas.',
      ta: 'Mock tests ஒரு digital learning product ஆக கிடைக்கின்றன. Public site-ல் ஒரு mock test Rs.30, English + Tamil support, full-length tests, previous-year practice மற்றும் performance analytics குறிப்பிடப்பட்டுள்ளது. Test முடிந்த பின் score, answers, weak areas பார்க்கலாம்.',
      hi: 'Mock tests digital learning product के रूप में उपलब्ध हैं. Public site में Rs.30 per mock test, English + Tamil support, full-length tests, previous-year practice और performance analytics बताया गया है. Test के बाद student score, answers और weak areas review कर सकता है.',
    },
  },
  {
    id: 'admissions',
    keywords: ['admission', 'mbbs', 'abroad', 'india', 'country', 'countries', 'college', 'university', 'course', 'counselling', 'guidance', 'medical', 'சேர்க்கை', 'வெளிநாடு', 'काउंसलिंग', 'एडमिशन'],
    href: '/admission-guidance',
    label: { en: 'Request Counselling', ta: 'Counselling கேட்க', hi: 'Counselling Request करें' },
    answer: {
      en: 'SIVORA UP↑RISING provides education and admission guidance for medical education, MBBS Abroad, country and university selection, course selection, application guidance and counselling. For India, the site positions the service as MBBS counselling and guidance only, so final choices should be verified with the counselling team.',
      ta: 'SIVORA UP↑RISING medical education, MBBS Abroad, country and university selection, course selection, application guidance மற்றும் counselling-க்கு வழிகாட்டுகிறது. India-க்கு இது MBBS counselling and guidance ஆக மட்டுமே குறிப்பிடப்படுகிறது; இறுதி முடிவுகளை counselling team உடன் verify செய்ய வேண்டும்.',
      hi: 'SIVORA UP↑RISING medical education, MBBS Abroad, country and university selection, course selection, application guidance और counselling में मार्गदर्शन देता है. India के लिए service केवल MBBS counselling and guidance है, इसलिए final options counselling team से verify करने चाहिए.',
    },
  },
  {
    id: 'partners',
    keywords: ['partner', 'b2b', 'agency', 'school', 'consultant', 'institution', 'பார்ட்னர்', 'साझेदार', 'पार्टनर'],
    href: '/partners',
    label: { en: 'Partner With Us', ta: 'Partner With Us', hi: 'Partner With Us' },
    answer: {
      en: 'SIVORA UP↑RISING has a Partner With Us pathway for schools, colleges, coaching centres, education consultants and overseas admission partners. Use the partner page or WhatsApp to speak with the partner team.',
      ta: 'SIVORA UP↑RISING schools, colleges, coaching centres, education consultants மற்றும் overseas admission partners-க்கு Partner With Us வழி வைத்துள்ளது. Partner page அல்லது WhatsApp மூலம் partner team-ஐ தொடர்பு கொள்ளலாம்.',
      hi: 'SIVORA UP↑RISING schools, colleges, coaching centres, education consultants और overseas admission partners के लिए Partner With Us pathway देता है. Partner page या WhatsApp से partner team से बात कर सकते हैं.',
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
    keywords: ['contact', 'support', 'help', 'faq', 'whatsapp', 'counsellor', 'team', 'தொடர்பு', 'உதவி', 'सपोर्ट', 'संपर्क'],
    href: '/contact',
    label: { en: 'Contact Us', ta: 'Contact Us', hi: 'Contact Us' },
    answer: {
      en: 'For human help, use WhatsApp, the contact form or counselling request. The team can guide you on NEET preparation, mock tests, admissions and partner enquiries.',
      ta: 'மனித உதவிக்கு WhatsApp, contact form அல்லது counselling request பயன்படுத்துங்கள். NEET preparation, mock tests, admissions மற்றும் partner enquiries-க்கு team வழிகாட்டும்.',
      hi: 'Human help के लिए WhatsApp, contact form या counselling request इस्तेमाल करें. Team NEET preparation, mock tests, admissions और partner enquiries पर guide कर सकती है.',
    },
  },
];

const WELCOME: Record<SupportedLocale, string> = {
  en: "Hi! I'm Ask SIVORA UP↑RISING AI. I can help you with NEET preparation, admissions, mock tests, counselling and SIVORA UP↑RISING services. What would you like to know?",
  ta: 'வணக்கம்! நான் Ask SIVORA UP↑RISING AI. NEET தயாரிப்பு, சேர்க்கை வழிகாட்டுதல், Mock Tests, Counselling மற்றும் SIVORA UP↑RISING சேவைகள் குறித்து உங்களுக்கு உதவ முடியும். என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?',
  hi: 'नमस्ते! मैं Ask SIVORA UP↑RISING AI हूं. मैं NEET तैयारी, एडमिशन, मॉक टेस्ट, काउंसलिंग और SIVORA UP↑RISING सेवाओं के बारे में आपकी मदद कर सकता हूं. आप क्या जानना चाहते हैं?',
};

const FALLBACK: Record<SupportedLocale, string> = {
  en: 'I do not have enough verified SIVORA UP↑RISING information to answer that confidently. Please talk to our team for current, confirmed guidance.',
  ta: 'அதற்கு நம்பிக்கையுடன் பதில் அளிக்க போதுமான verified SIVORA UP↑RISING தகவல் இல்லை. தற்போதைய உறுதியான வழிகாட்டலுக்கு எங்கள் team-ஐ தொடர்பு கொள்ளுங்கள்.',
  hi: 'इसका भरोसेमंद जवाब देने के लिए मेरे पास पर्याप्त verified SIVORA UP↑RISING जानकारी नहीं है. Current और confirmed guidance के लिए हमारी team से बात करें.',
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
  return (
    KNOWLEDGE_BASE.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
    ) ?? null
  );
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
