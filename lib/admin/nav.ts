/**
 * Admin sidebar navigation. The admin portal is English-only for now, so labels
 * live here (not in the i18n message files). `superOnly` items are only rendered
 * for SUPER_ADMIN (and their routes are also guarded in middleware + the page).
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: string; // key into the icon map in AdminNav
  functional?: boolean;
  superOnly?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'grid', functional: true },
  { href: '/admin/question-bank', label: 'Question Bank', icon: 'book', functional: true },
  { href: '/admin/tests', label: 'Tests', icon: 'file', functional: true },
  { href: '/admin/students', label: 'Students', icon: 'users', functional: true },
  { href: '/admin/payments', label: 'Payments', icon: 'card', functional: true },
  { href: '/admin/leads', label: 'Leads', icon: 'target', functional: true },
  { href: '/admin/notifications', label: 'Notifications', icon: 'bell', functional: true },
  { href: '/admin/reports', label: 'Reports', icon: 'chart', functional: true },
  // Super-admin only.
  { href: '/admin/manage-admins', label: 'Manage Admins', icon: 'users', functional: true, superOnly: true },
  { href: '/admin/financials', label: 'Financials', icon: 'card', functional: true, superOnly: true },
  { href: '/admin/access-logs', label: 'Access Logs', icon: 'chart', functional: true, superOnly: true },
  { href: '/admin/system', label: 'System', icon: 'settings', functional: true, superOnly: true },
];

/** The paths that require SUPER_ADMIN — shared by middleware for edge guarding. */
export const SUPER_ADMIN_PATHS = ADMIN_NAV.filter((i) => i.superOnly).map((i) => i.href);
