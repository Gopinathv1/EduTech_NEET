import { ADMISSION_COUNTRY_PROFILES } from '@/lib/data/admissions/countries';

// Country codes and flags share the canonical Admissions profile source.
export type CountryCode = 'ru' | 'ge' | 'vn' | 'am' | 'uz' | 'kg' | 'tj' | 'kz';
export const COUNTRY_CODES = ADMISSION_COUNTRY_PROFILES.map((country) => country.countryCode.toLowerCase() as CountryCode);
export const COUNTRY_FLAG = Object.fromEntries(ADMISSION_COUNTRY_PROFILES.map((country) => [country.countryCode.toLowerCase(), country.flag])) as Record<CountryCode, string>;
