/**
 * Public site navigation. `key` maps to the `publicNav.<key>` message.
 * Used by the header (all links) and footer (grouped subsets).
 */
export type NavLink = { href: string; key: string };

export const NAV_LINKS: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/#question-bank', key: 'questionBank' },
  { href: '/#previous-year-papers', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
  { href: '/login', key: 'resultsProgress' },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/#question-bank', key: 'questionBank' },
  { href: '/#previous-year-papers', key: 'previousYear' },
  { href: '/mock-tests', key: 'mockTests' },
  { href: '/login', key: 'resultsProgress' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];
