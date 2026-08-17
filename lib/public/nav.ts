/**
 * Public site navigation. `key` maps to the `publicNav.<key>` message.
 * Used by the header (all links) and footer (grouped subsets).
 */
export type NavLink = { href: string; key: string };

export const NAV_LINKS: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
  { href: '/why-choose-us', key: 'whyUs' },
  { href: '/services', key: 'services' },
  { href: '/mock-tests', key: 'mockTests' },
  { href: '/admission-guidance', key: 'admission' },
  { href: '/countries', key: 'countries' },
  { href: '/testimonials', key: 'testimonials' },
  { href: '/faq', key: 'faq' },
  { href: '/contact', key: 'contact' },
];

// Footer column groupings.
export const FOOTER_EXPLORE: NavLink[] = [
  { href: '/mock-tests', key: 'mockTests' },
  { href: '/admission-guidance', key: 'admission' },
  { href: '/countries', key: 'countries' },
  { href: '/services', key: 'services' },
];

export const FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/why-choose-us', key: 'whyUs' },
  { href: '/testimonials', key: 'testimonials' },
  { href: '/faq', key: 'faq' },
  { href: '/help', key: 'help' },
  { href: '/contact', key: 'contact' },
];
