/**
 * Public site navigation. `key` maps to the `publicNav.<key>` message.
 * Used by the header (all links) and footer (grouped subsets).
 */
export type NavLink = { href: string; key: string };
export type NavGroup = { key: string; links: NavLink[] };

export const NAV_LINKS: NavLink[] = [
  { href: '/partners', key: 'partnerWithUs' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'studyAbroadMenu',
    links: [
      { href: '/study-abroad', key: 'mbbsAbroad' },
      { href: '/study-abroad', key: 'studyEurope' },
      { href: '/study-abroad', key: 'internationalEducation' },
      { href: '/study-abroad', key: 'applicationGuidance' },
    ],
  },
  {
    key: 'examPrepMenu',
    links: [
      { href: '/exam-preparation', key: 'examPrepMenu' },
      { href: '/exam-preparation/neet', key: 'neet' },
      { href: '/exam-preparation/jee', key: 'jee' },
      { href: '/mock-tests', key: 'questionBank' },
    ],
  },
  {
    key: 'counsellingMenu',
    links: [
      { href: '/counselling', key: 'mbbsCounsellingIndia' },
      { href: '/counselling', key: 'collegeGuidance' },
      { href: '/counselling', key: 'careerGuidance' },
    ],
  },
  {
    key: 'coursesMenu',
    links: [
      { href: '/courses', key: 'coursesLearning' },
      { href: '/courses', key: 'trainingPrograms' },
    ],
  },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/study-abroad', key: 'admission' },
  { href: '/study-abroad', key: 'countries' },
  { href: '/mock-tests', key: 'questionBank' },
  { href: '/exam-preparation/neet', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];
