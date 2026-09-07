import { ADMISSION_COUNTRIES } from '@/data/admissions';

export type Provenance = {
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
};

export type VerifiedValue<T> = {
  value: T;
  source: Provenance;
};

export type AdmissionCountryProfile = {
  slug: string;
  name: string;
  flag: string;
  capital: VerifiedValue<string>;
  currency: VerifiedValue<string>;
  currencyCode: string;
  timezone: {
    iana: string;
    labelCity: string;
    note?: string;
    source: Provenance;
  };
  languages: VerifiedValue<string[]>;
  climate: VerifiedValue<string>;
  majorStudentCities: string[];
  landmark: {
    subject: string;
    imagePath?: string;
    placeholderPath: string;
    altKey: string;
  };
  travel: {
    distanceFromIndia: string;
    typicalDuration: string;
    source: Provenance;
  };
  program: {
    duration?: VerifiedValue<string>;
    intake?: VerifiedValue<string>;
    medium?: VerifiedValue<string>;
  };
  budget: {
    tuitionRange?: VerifiedValue<string>;
    livingCost?: VerifiedValue<string>;
    overall?: VerifiedValue<string>;
  };
  universities: readonly string[];
  lastVerified: string;
};

const verifiedAt = '2026-09-07';

const cia = (slug: string): Provenance => ({
  sourceName: 'CIA World Factbook archive',
  sourceUrl: `https://archive.govglance.org/factbook/${slug}`,
  verifiedAt,
});

const worldFactbook = (slug: string): Provenance => ({
  sourceName: 'World Factbook mirror',
  sourceUrl: `https://www.worldfactbook.co/country.php?slug=${slug}`,
  verifiedAt,
});

const iana: Provenance = {
  sourceName: 'IANA Time Zone Database',
  sourceUrl: 'https://www.iana.org/time-zones',
  verifiedAt,
};

const travelSource: Provenance = {
  sourceName: 'SIVORA admissions operations estimate',
  sourceUrl: '/admissions',
  verifiedAt,
};

const countryBySlug = new Map(ADMISSION_COUNTRIES.map((country) => [country.slug, country]));

export const ADMISSION_COUNTRY_PROFILES: AdmissionCountryProfile[] = [
  {
    slug: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    capital: { value: 'Moscow', source: cia('russia') },
    currency: { value: 'Russian ruble', source: worldFactbook('russia') },
    currencyCode: 'RUB',
    timezone: {
      iana: 'Europe/Moscow',
      labelCity: 'Moscow',
      note: 'Russia has multiple time zones; this page shows Moscow time for the capital context.',
      source: iana,
    },
    languages: { value: ['Russian'], source: worldFactbook('russia') },
    climate: {
      value: 'Varies widely, from humid continental in much of European Russia to subarctic and tundra climates farther north and east.',
      source: worldFactbook('russia'),
    },
    majorStudentCities: ['Moscow', 'Omsk', 'Orenburg', 'Perm', 'Tver', 'Yoshkar-Ola'],
    landmark: {
      subject: "Moscow skyline / St. Basil's Cathedral",
      imagePath: '/admissions/russia.jpg',
      placeholderPath: '/admissions/countries/russia/landmark-placeholder.svg',
      altKey: 'russia',
    },
    travel: { distanceFromIndia: 'Approx. 4,300-5,000 km from Delhi to Moscow', typicalDuration: 'Approx. 6-9 hours with routing changes', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('russia')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'georgia',
    name: 'Georgia',
    flag: '🇬🇪',
    capital: { value: 'Tbilisi', source: cia('georgia') },
    currency: { value: 'Georgian lari', source: worldFactbook('georgia') },
    currencyCode: 'GEL',
    timezone: { iana: 'Asia/Tbilisi', labelCity: 'Tbilisi', source: iana },
    languages: { value: ['Georgian'], source: cia('georgia') },
    climate: { value: 'Warm and pleasant in many lowland areas, with mountain climates in higher regions.', source: cia('georgia') },
    majorStudentCities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi'],
    landmark: {
      subject: 'Tbilisi skyline / Old Tbilisi',
      imagePath: '/admissions/georgia.jpg',
      placeholderPath: '/admissions/countries/georgia/landmark-placeholder.svg',
      altKey: 'georgia',
    },
    travel: { distanceFromIndia: 'Approx. 3,200-4,000 km from Delhi to Tbilisi', typicalDuration: 'Approx. 7-11 hours with common connections', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('georgia')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    flag: '🇻🇳',
    capital: { value: 'Hanoi', source: cia('vietnam') },
    currency: { value: 'Vietnamese dong', source: worldFactbook('vietnam') },
    currencyCode: 'VND',
    timezone: { iana: 'Asia/Ho_Chi_Minh', labelCity: 'Hanoi / Ho Chi Minh City', source: iana },
    languages: { value: ['Vietnamese'], source: worldFactbook('vietnam') },
    climate: { value: 'Tropical in the south; monsoonal in the north with hot, rainy seasons and cooler dry periods.', source: worldFactbook('vietnam') },
    majorStudentCities: ['Hanoi', 'Ho Chi Minh City', 'Can Tho', 'Da Nang'],
    landmark: {
      subject: 'Hanoi / Ho Chi Minh City landmark imagery',
      placeholderPath: '/admissions/countries/vietnam/landmark-placeholder.svg',
      altKey: 'vietnam',
    },
    travel: { distanceFromIndia: 'Approx. 3,000-3,800 km from Kolkata/Delhi to Vietnam gateways', typicalDuration: 'Approx. 5-9 hours depending on city and connection', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('vietnam')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'armenia',
    name: 'Armenia',
    flag: '🇦🇲',
    capital: { value: 'Yerevan', source: cia('armenia') },
    currency: { value: 'Armenian dram', source: worldFactbook('armenia') },
    currencyCode: 'AMD',
    timezone: { iana: 'Asia/Yerevan', labelCity: 'Yerevan', source: iana },
    languages: { value: ['Armenian'], source: worldFactbook('armenia') },
    climate: { value: 'Highland continental climate with hot summers and cold winters.', source: worldFactbook('armenia') },
    majorStudentCities: ['Yerevan'],
    landmark: {
      subject: 'Yerevan / Mount Ararat contextual imagery',
      placeholderPath: '/admissions/countries/armenia/landmark-placeholder.svg',
      altKey: 'armenia',
    },
    travel: { distanceFromIndia: 'Approx. 3,200-4,100 km from Delhi to Yerevan', typicalDuration: 'Approx. 7-12 hours with common connections', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('armenia')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'uzbekistan',
    name: 'Uzbekistan',
    flag: '🇺🇿',
    capital: { value: 'Tashkent', source: worldFactbook('uzbekistan') },
    currency: { value: 'Uzbekistani som', source: worldFactbook('uzbekistan') },
    currencyCode: 'UZS',
    timezone: { iana: 'Asia/Tashkent', labelCity: 'Tashkent', source: iana },
    languages: { value: ['Uzbek', 'Russian', 'Tajik'], source: worldFactbook('uzbekistan') },
    climate: { value: 'Mostly mid-latitude desert with long hot summers and mild winters; semiarid grassland in the east.', source: worldFactbook('uzbekistan') },
    majorStudentCities: ['Tashkent', 'Bukhara', 'Samarkand', 'Fergana', 'Andijan'],
    landmark: {
      subject: 'Registan / Samarkand',
      imagePath: '/admissions/andijan-students-01.jpg',
      placeholderPath: '/admissions/countries/uzbekistan/landmark-placeholder.svg',
      altKey: 'uzbekistan',
    },
    travel: { distanceFromIndia: 'Approx. 1,600-2,300 km from Delhi to Tashkent', typicalDuration: 'Approx. 3-7 hours depending on route', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('uzbekistan')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'kyrgyzstan',
    name: 'Kyrgyzstan',
    flag: '🇰🇬',
    capital: { value: 'Bishkek', source: worldFactbook('kyrgyzstan') },
    currency: { value: 'Kyrgyzstani som', source: worldFactbook('kyrgyzstan') },
    currencyCode: 'KGS',
    timezone: { iana: 'Asia/Bishkek', labelCity: 'Bishkek', source: iana },
    languages: { value: ['Kyrgyz', 'Russian', 'Uzbek'], source: worldFactbook('kyrgyzstan') },
    climate: { value: 'Dry continental to polar in the high Tien Shan Mountains, with temperate northern foothills.', source: worldFactbook('kyrgyzstan') },
    majorStudentCities: ['Bishkek', 'Osh', 'Jalal-Abad'],
    landmark: {
      subject: 'Bishkek / Ala-Too / mountain landscape',
      placeholderPath: '/admissions/countries/kyrgyzstan/landmark-placeholder.svg',
      altKey: 'kyrgyzstan',
    },
    travel: { distanceFromIndia: 'Approx. 1,600-2,400 km from Delhi to Bishkek', typicalDuration: 'Approx. 4-8 hours with common connections', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('kyrgyzstan')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'tajikistan',
    name: 'Tajikistan',
    flag: '🇹🇯',
    capital: { value: 'Dushanbe', source: worldFactbook('tajikistan') },
    currency: { value: 'Tajikistani somoni', source: worldFactbook('tajikistan') },
    currencyCode: 'TJS',
    timezone: { iana: 'Asia/Dushanbe', labelCity: 'Dushanbe', source: iana },
    languages: { value: ['Tajik', 'Uzbek', 'Russian'], source: worldFactbook('tajikistan') },
    climate: { value: 'Mid-latitude continental climate with hot summers and mild winters; semiarid to polar in the Pamir Mountains.', source: worldFactbook('tajikistan') },
    majorStudentCities: ['Dushanbe', 'Khujand'],
    landmark: {
      subject: 'Dushanbe / Ismoil Somoni monument / mountain landscape',
      placeholderPath: '/admissions/countries/tajikistan/landmark-placeholder.svg',
      altKey: 'tajikistan',
    },
    travel: { distanceFromIndia: 'Approx. 1,350-2,000 km from Delhi to Dushanbe', typicalDuration: 'Approx. 4-8 hours with common connections', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('tajikistan')?.universities ?? [],
    lastVerified: verifiedAt,
  },
  {
    slug: 'kazakhstan',
    name: 'Kazakhstan',
    flag: '🇰🇿',
    capital: { value: 'Astana', source: worldFactbook('kazakhstan') },
    currency: { value: 'Kazakhstani tenge', source: worldFactbook('kazakhstan') },
    currencyCode: 'KZT',
    timezone: {
      iana: 'Asia/Almaty',
      labelCity: 'Astana',
      note: 'Kazakhstan moved to one time zone in March 2024; this page uses the current country/capital context.',
      source: iana,
    },
    languages: { value: ['Kazakh', 'Russian', 'English'], source: worldFactbook('kazakhstan') },
    climate: { value: 'Continental, with cold winters and hot summers; arid and semiarid areas.', source: worldFactbook('kazakhstan') },
    majorStudentCities: ['Astana', 'Almaty'],
    landmark: {
      subject: 'Astana skyline / Baiterek Tower',
      placeholderPath: '/admissions/countries/kazakhstan/landmark-placeholder.svg',
      altKey: 'kazakhstan',
    },
    travel: { distanceFromIndia: 'Approx. 1,600-2,500 km from Delhi to Astana/Almaty', typicalDuration: 'Approx. 4-9 hours depending on destination city', source: travelSource },
    program: {},
    budget: {},
    universities: countryBySlug.get('kazakhstan')?.universities ?? [],
    lastVerified: verifiedAt,
  },
];

export function getAdmissionCountryProfile(slug: string) {
  return ADMISSION_COUNTRY_PROFILES.find((country) => country.slug === slug);
}

export function getAdmissionCountryProfiles(slugs: string[]) {
  const selected = slugs
    .map((slug) => getAdmissionCountryProfile(slug))
    .filter((country): country is AdmissionCountryProfile => Boolean(country));
  return Array.from(new Map(selected.map((country) => [country.slug, country])).values());
}
