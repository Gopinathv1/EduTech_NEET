// Site-wide constants for the public marketing website.
export const SITE_NAME = 'VV Overseas';

// Absolute base URL, used for canonical + Open Graph URLs. Override in prod via
// NEXT_PUBLIC_SITE_URL (e.g. https://neetsmartpractice.com).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
