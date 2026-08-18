export const AI_SUGGESTIONS = [
  'NEET Preparation',
  'Admissions',
  'MBBS Abroad',
  'Mock Tests',
  'Counselling',
  'Contact Support',
];

export function getMockAiResponse(topic: string): string {
  const normalized = topic.trim().toLowerCase();
  if (normalized.includes('neet')) {
    return 'VV Overseas supports NEET preparation with mock tests, previous-year practice, question-bank access, chapter-wise practice and performance analytics.';
  }
  if (normalized.includes('mock')) {
    return 'Mock tests help you practise exam timing, review answers and identify weak areas. You can explore available tests from the Mock Tests page.';
  }
  if (normalized.includes('admission') || normalized.includes('mbbs')) {
    return 'VV Overseas provides education and admission guidance. Admission rules and eligibility can change, so our counselling team can help you verify current options.';
  }
  if (normalized.includes('counselling')) {
    return 'You can request counselling for NEET preparation, medical education, college choices or international study options through the callback form.';
  }
  if (normalized.includes('support') || normalized.includes('contact')) {
    return 'For immediate human help, use the WhatsApp button or submit the contact form. The team can guide you based on your enquiry.';
  }
  return 'I can help with NEET preparation, admissions, MBBS abroad, mock tests and counselling. For verified current details, please speak with the VV Overseas team.';
}
