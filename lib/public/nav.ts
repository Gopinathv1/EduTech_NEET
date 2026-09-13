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
      { href: '/admissions', key: 'mbbsAbroad' },
      { href: '/admissions', key: 'internationalEducation' },
      { href: '/admissions', key: 'applicationGuidance' },
      { href: '/admission-journey', key: 'admissionJourney' },
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
      { href: '/courses#ai-future-skills', key: 'aiFutureSkills' },
      { href: '/courses/astrology', key: 'astrologyLearning' },
    ],
  },
  {
    key: 'marketplaceMenu',
    links: [
      { href: '/marketplace', key: 'marketplace' },
      { href: '/marketplace#listings', key: 'marketplaceListings' },
      { href: '/marketplace?category=astrology', key: 'astrologyBooks' },
      { href: '/marketplace?category=yoga', key: 'yogaLearning' },
      { href: '/marketplace/sell', key: 'sellBooks' },
    ],
  },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/admissions', key: 'admissionsMenu' },
  { href: '/admissions', key: 'countries' },
  { href: '/mock-tests', key: 'questionBank' },
  { href: '/marketplace', key: 'marketplace' },
  { href: '/exam-preparation/neet', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];
