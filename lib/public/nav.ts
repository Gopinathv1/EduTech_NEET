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
      { href: '/countries', key: 'mbbsAbroad' },
      { href: '/#destinations', key: 'studyEurope' },
      { href: '/countries', key: 'internationalEducation' },
      { href: '/admission-guidance', key: 'applicationGuidance' },
    ],
  },
  {
    key: 'examPrepMenu',
    links: [
      { href: '/#neet-preparation', key: 'neet' },
      { href: '/mock-tests', key: 'questionBank' },
      { href: '/#previous-year-papers', key: 'previousYear' },
      { href: '/mock-tests', key: 'mockTests' },
    ],
  },
  {
    key: 'counsellingMenu',
    links: [
      { href: '/admission-guidance', key: 'mbbsCounsellingIndia' },
      { href: '/admission-guidance', key: 'collegeGuidance' },
      { href: '/contact', key: 'careerGuidance' },
    ],
  },
  {
    key: 'coursesMenu',
    links: [
      { href: '/contact', key: 'coursesLearning' },
      { href: '/contact', key: 'trainingPrograms' },
    ],
  },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/admission-guidance', key: 'admission' },
  { href: '/countries', key: 'countries' },
  { href: '/mock-tests', key: 'questionBank' },
  { href: '/#previous-year-papers', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];
