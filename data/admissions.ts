export type AdmissionCountry = {
  slug: string;
  name: string;
  universities: readonly string[];
};

export const ADMISSION_COUNTRIES: AdmissionCountry[] = [
  {
    slug: 'russia',
    name: 'Russia',
    universities: [
      'Omsk State Medical University',
      'Orenburg State Medical University',
      'Perm State Medical University',
      'Mari State University Medical Faculty',
      'Tver State Medical University',
    ],
  },
  {
    slug: 'georgia',
    name: 'Georgia',
    universities: [
      'Tbilisi State Medical University Faculty of Medicine',
      'Batumi Shota Rustaveli State University',
      'BAU International University Faculty of Medicine',
      'Caucasus International University Faculty of Medicine',
      'David Tvildiani Medical University / AIETI Medical School',
    ],
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    universities: [
      'Hong Bang International University Faculty of Medicine',
      'Phan Chau Trinh University (PCTU)',
      'Buon Ma Thuot Medical University',
      'Can Tho University of Medicine',
      'Nam Can Tho University',
    ],
  },
  {
    slug: 'armenia',
    name: 'Armenia',
    universities: [
      'Yerevan State Medical University Named for Mkhitar Heratsi',
      'Armenian Medical Institute Faculty of Medicine',
      'Erebuni Medical Academy Foundation',
      'Yerevan Haybusak University Faculty of Medicine',
      'Yerevan University of Traditional Medicine',
    ],
  },
  {
    slug: 'uzbekistan',
    name: 'Uzbekistan',
    universities: [
      'Tashkent Medical Academy',
      'Bukhara State Medical Institute',
      'Samarkand State Medical University',
      'Fergana Medical Institute of Public Health',
      'Andijan State Medical Institute',
    ],
  },
  {
    slug: 'kyrgyzstan',
    name: 'Kyrgyzstan',
    universities: [
      'Bishkek International Medical Institute',
      'Avicenna International Medical University',
      'Osh State University Medical Faculty',
      'Osh International Medical University',
      'Jalal-Abad International University Medical Faculty',
    ],
  },
  {
    slug: 'tajikistan',
    name: 'Tajikistan',
    universities: [
      'Avicenna Tajik State Medical University',
      'Tajik National University Faculty of Medicine',
      'Stalinabad Medical Institute',
    ],
  },
  {
    slug: 'kazakhstan',
    name: 'Kazakhstan',
    universities: [
      'Al-Farabi Kazakh National University Faculty of Medicine and Health Care',
      'Asfendiyarov Kazakh National Medical University',
    ],
  },
] as const;

export function getAdmissionCountry(slug: string) {
  return ADMISSION_COUNTRIES.find((country) => country.slug === slug);
}
