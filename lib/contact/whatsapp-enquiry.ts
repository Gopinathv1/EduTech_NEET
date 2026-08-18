export const STUDENT_WHATSAPP_CATEGORIES = [
  'NEET Preparation',
  'Mock Tests',
  'Question Bank',
  'MBBS Abroad',
  'Admission Counselling',
  'Course Guidance',
  'Payment Support',
  'Technical Support',
  'Other',
];

export const PARTNER_WHATSAPP_TYPES = [
  'School',
  'College',
  'Coaching Centre',
  'Education Consultant',
  'Overseas Admission Partner',
  'Other Institution',
];

export function isWhatsAppButtonHiddenPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/partner' ||
    pathname.startsWith('/partner/') ||
    /\/student\/tests\/[^/]+\/attempt/.test(pathname)
  );
}

export function buildStudentWhatsAppMessage(category: string, pathname: string) {
  return [
    `Hello VV Overseas, I would like information about ${category}. Please guide me.`,
    pathname ? `Current page: ${pathname}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPartnerWhatsAppMessage(type: string, pathname: string) {
  return [
    'Hello VV Overseas Partner Team, I am interested in discussing a B2B partnership.',
    `Organisation type: ${type}.`,
    'Organisation: ____.',
    'Partnership interest: ____.',
    'Please contact me.',
    pathname ? `Current page: ${pathname}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildGeneralWhatsAppMessage(pathname: string) {
  return [
    'Hello VV Overseas, I have a general enquiry. Please guide me.',
    pathname ? `Current page: ${pathname}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}
