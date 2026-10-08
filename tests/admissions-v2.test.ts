import { buildAdmissionsEnquiryWhere } from '@/lib/admission/enquiries-filter';
import { describe, it, expect } from 'vitest';
import { ADMISSION_COUNTRY_PROFILES, ADMISSION_COUNTRIES, discoverAdmissionCountries, getAdmissionCountryProfile, getAdmissionCountryProfiles, matchesAdmissionRegion } from '@/lib/data/admissions/countries';
import { ADMISSION_UNIVERSITIES } from '@/lib/data/admissions/universities';
import { COUNTRY_FLAG, COUNTRY_CODES } from '@/lib/public/countries';
import { admissionsEnquirySchema } from '@/lib/validation/admissions-enquiry';
import { admissionLeadSchema } from '@/lib/validation/admission';

describe('Admissions geography and discovery', () => {
  it('shows Russia under Asia and describes both continents', () => {
    const russia = getAdmissionCountryProfile('russia')!;
    expect(matchesAdmissionRegion(russia, 'asia')).toBe(true);
    expect(matchesAdmissionRegion(russia, 'europe')).toBe(false);
    expect(russia.geography).toMatch(/transcontinental.*Europe and Asia/);
    expect(russia.universities).toContain('Omsk State Medical University');
  });
  it('treats Kazakhstan and Caucasus consistently without changing institution associations', () => {
    expect(getAdmissionCountryProfile('kazakhstan')!.geography).toContain('transcontinental');
    for (const slug of ['kazakhstan', 'georgia', 'armenia']) expect(matchesAdmissionRegion(getAdmissionCountryProfile(slug)!, 'asia')).toBe(true);
    expect(getAdmissionCountryProfile('georgia')!.geography).toContain('convention');
    expect(discoverAdmissionCountries({ region: 'asia' })).toHaveLength(8);
    expect(discoverAdmissionCountries({ region: 'europe' })).toHaveLength(0);
    expect(discoverAdmissionCountries({ region: 'central-asia' })).toHaveLength(4);
    expect(discoverAdmissionCountries({ region: 'caucasus' })).toHaveLength(2);
  });
  it('keeps flags, ISO country and currency codes consistent for every destination', () => {
    const expected = { russia: ['RU', 'RUB'], georgia: ['GE', 'GEL'], vietnam: ['VN', 'VND'], armenia: ['AM', 'AMD'], uzbekistan: ['UZ', 'UZS'], kyrgyzstan: ['KG', 'KGS'], tajikistan: ['TJ', 'TJS'], kazakhstan: ['KZ', 'KZT'] };
    for (const country of ADMISSION_COUNTRY_PROFILES) {
      expect([country.countryCode, country.currencyCode]).toEqual(expected[country.slug as keyof typeof expected]);
      const code = country.countryCode.toLowerCase() as keyof typeof COUNTRY_FLAG;
      expect(COUNTRY_CODES).toContain(code); expect(COUNTRY_FLAG[code]).toBe(country.flag);
      const flag = [...country.countryCode].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('');
      expect(country.flag).toBe(flag);
    }
  });
  it('supports trimmed case-insensitive country, code and university search with sorting', () => {
    expect(discoverAdmissionCountries({ query: '  oMsK  ' }).map((country) => country.slug)).toEqual(['russia']);
    expect(discoverAdmissionCountries({ query: 'KZ' }).map((country) => country.slug)).toEqual(['kazakhstan']);
    expect(discoverAdmissionCountries({ query: 'missing-university' })).toHaveLength(0);
    expect(discoverAdmissionCountries({ sort: 'name' })[0].slug).toBe('armenia');
    expect(getAdmissionCountryProfiles(['russia', 'russia', 'missing', 'georgia'])).toHaveLength(2);
  });
});

describe('Institution inventory and programme evidence', () => {
  it('removes a historical duplicate and corrects the Tashkent institution name', () => {
    expect(ADMISSION_UNIVERSITIES).toHaveLength(34);
    expect(ADMISSION_UNIVERSITIES.some((item) => item.name === 'Stalinabad Medical Institute')).toBe(false);
    expect(ADMISSION_UNIVERSITIES.some((item) => item.name === 'Tashkent State Medical University')).toBe(true);
  });
  it('retains country associations and scoped official identity evidence', () => {
    expect(new Set(ADMISSION_UNIVERSITIES.map((item) => item.id)).size).toBe(34);
    for (const university of ADMISSION_UNIVERSITIES) {
      expect(ADMISSION_COUNTRIES.find((country) => country.slug === university.countrySlug)?.universities).toContain(university.name);
      if (university.programme) expect(university.programme.sourceUrl).toMatch(/^https:/);
    }
    expect(ADMISSION_UNIVERSITIES.every((item) => item.sourceUrl && item.reviewedAt)).toBe(true);
    expect(ADMISSION_UNIVERSITIES.find((item) => item.name === 'Orenburg State Medical University')?.sourceUrl).toBe('https://new.orgma.ru/en/');
    const armenian = ADMISSION_UNIVERSITIES.find((item) => item.name === 'Armenian Medical Institute');
    expect(armenian?.id).toBe('armenia-2');
    expect(armenian?.sourceUrl).toBe('https://armedin.am/en/');
    expect(armenian?.reviewNote).toContain('Current accreditation validity requires confirmation');
    expect(ADMISSION_UNIVERSITIES.find((item) => item.countrySlug === 'kyrgyzstan' && item.programme)?.programme?.duration).toContain('Multiple published tracks');
    for (const country of ADMISSION_COUNTRY_PROFILES) { expect(country.budget).toEqual({}); expect(country.program).toEqual({}); }
    expect(ADMISSION_UNIVERSITIES.find((item) => item.name === 'Perm State Medical University')?.city).toBe('Perm');
  });
});

describe('Admissions enquiries', () => {
  const valid = { name: 'Isolated Test', mobile: '9000000001', email: 'student@example.invalid', studyPath: 'Engineering', programme: 'Mechanical engineering', destination: 'russia', contactPreference: 'Email', consent: true };
  it('accepts non-medical paths and validates destination, preference and explicit consent', () => {
    expect(admissionsEnquirySchema.safeParse(valid).success).toBe(true);
    for (const patch of [{ consent: false }, { destination: 'invented-country' }, { contactPreference: 'SMS' }, { studyPath: 'invented-path' }, { mobile: '123' }]) expect(admissionsEnquirySchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it('allows undecided and other destinations and bounds free text', () => {
    for (const destination of ['', 'other']) expect(admissionsEnquirySchema.safeParse({ ...valid, destination }).success).toBe(true);
    expect(admissionsEnquirySchema.safeParse({ ...valid, programme: 'a'.repeat(121) }).success).toBe(false);
  });
  it('uses canonical university IDs and rejects stale names, countries and unknown IDs', () => {
    for (const universityId of ['russia-1', 'russia-3']) {
      const university = ADMISSION_UNIVERSITIES.find((item) => item.id === universityId)!;
      const selected = { ...valid, universityId, programme: university.name };
      expect(admissionsEnquirySchema.parse(selected).universityId).toBe(universityId);
      for (const patch of [{ programme: 'Wrong university' }, { destination: 'georgia' }, { universityId: 'missing' }, { universityId: '' }, { universityId: undefined }, { consent: false }]) {
        expect(admissionsEnquirySchema.safeParse({ ...selected, ...patch }).success).toBe(false);
      }
    }
  });
  it('normalises duplicate destination ids and rejects booleans masquerading as scores', () => {
    const lead = { neetScore: '', marks: '', category: 'General', budget: 'UNSURE', interestedCountryIds: ['c1', 'c1'], parentContact: '9000000001', consent: true };
    const parsed = admissionLeadSchema.parse(lead);
    expect(parsed.interestedCountryIds).toEqual(['c1']);
    expect(admissionLeadSchema.safeParse({ ...lead, neetScore: true }).success).toBe(false);
  });
});

describe('Admissions inbox filtering', () => {
  it('combines status with enquiry/reference search and ignores unknown statuses', () => {
    const where = buildAdmissionsEnquiryWhere('NEW', ' SIV-ABC123 ');
    expect(where.status).toBe('NEW'); expect(JSON.stringify(where)).toContain('ABC123');
    expect(buildAdmissionsEnquiryWhere('invalid', '').status).toBeUndefined();
    expect(buildAdmissionsEnquiryWhere()).toEqual({});
  });
});
