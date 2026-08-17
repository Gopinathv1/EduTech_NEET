/**
 * Public site navigation. `key` maps to the `publicNav.<key>` message.
 * Used by the header (all links) and footer (grouped subsets).
 */
export type NavLink = { href: string; key: string };
export type NavGroup = { key: string; links: NavLink[] };

export const NAV_LINKS: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/countries', key: 'countries' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'admissionsMenu',
    links: [
      { href: '/admission-guidance', key: 'mbbsIndia' },
      { href: '/countries', key: 'mbbsAbroad' },
      { href: '/admission-guidance', key: 'medicalAdmissions' },
      { href: '/contact', key: 'otherPrograms' },
    ],
  },
  {
    key: 'examPrepMenu',
    links: [
      { href: '/#question-bank', key: 'neet' },
      { href: '/#question-bank', key: 'questionBank' },
      { href: '/#previous-year-papers', key: 'previousYear' },
      { href: '/mock-tests', key: 'mockTests' },
    ],
  },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/admission-guidance', key: 'admission' },
  { href: '/countries', key: 'countries' },
  { href: '/#question-bank', key: 'questionBank' },
  { href: '/#previous-year-papers', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];
