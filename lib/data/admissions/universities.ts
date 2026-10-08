import { ADMISSION_COUNTRIES } from '@/lib/data/admissions/countries';

export type AdmissionUniversity = {
  id: string; name: string; countrySlug: string; countryName: string;
  city?: string; sourceUrl?: string; reviewedAt?: string; reviewNote?: string;
  programme?: { title: string; duration?: string; language?: string; sourceUrl: string; reviewedAt: string };
};
// Sources confirm identity only unless a programme-specific record below says otherwise.
const EVIDENCE: Record<string, { city?: string; sourceUrl: string; reviewNote?: string }> = {
  'Orenburg State Medical University': { city: 'Orenburg', sourceUrl: 'https://new.orgma.ru/en/' },
  'Armenian Medical Institute': { sourceUrl: 'https://armedin.am/en/', reviewNote: 'Institution identity confirmed. Current accreditation validity requires confirmation with ANQA; the older published register entry is not evidence of current validity.' },
  "Fergana Medical Institute of Public Health": { sourceUrl: 'https://fjsti.uz/' },
  "Al-Farabi Kazakh National University Faculty of Medicine and Health Care": { sourceUrl: 'https://welcome.kaznu.kz/en/19688/' },
  "Asfendiyarov Kazakh National Medical University": { city: 'Almaty', sourceUrl: 'https://kaznmu.edu.kz/en/history-of-university/' },
  "Omsk State Medical University": {
    "city": "Omsk",
    "sourceUrl": "https://omsk-osma.ru/en/contacts"
  },
  "Perm State Medical University": {
    "city": "Perm",
    "sourceUrl": "https://www.psma.ru/en/"
  },
  "Mari State University — Institute of Medicine": {
    "city": "Yoshkar-Ola",
    "sourceUrl": "https://marsu.ru/en/Schools/facultiesInstitutes/Schools/Medicine/"
  },
  "Tver State Medical University": {
    "city": "Tver",
    "sourceUrl": "https://www.wipo.int/tisc/en/search/details.jsp?id=11482"
  },
  "Tbilisi State Medical University Faculty of Medicine": {
    "city": "Tbilisi",
    "sourceUrl": "https://tsmu.edu/ts/content.php?aid=55&bid=33&cid=336&did=0&eid=0&id=3&lang=en"
  },
  "Batumi Shota Rustaveli State University": {
    "city": "Batumi",
    "sourceUrl": "https://bsu.edu.ge/sub-14/program/5/index.html?lang=en"
  },
  "BAU International University Batumi": {
    "city": "Batumi",
    "sourceUrl": "https://bauinternational.edu.ge/en/"
  },
  "Caucasus International University Faculty of Medicine": {
    "city": "Tbilisi",
    "sourceUrl": "https://www.ciu.edu.ge/?lang=en"
  },
  "David Tvildiani Medical University / AIETI Medical School": {
    "city": "Tbilisi",
    "sourceUrl": "https://old2.dtmu.ge/index.php?Cat=contact&lang=1"
  },
  "Hong Bang International University Faculty of Medicine": {
    "sourceUrl": "https://xethocbong.hiu.vn/en/"
  },
  "Phan Chau Trinh University (PCTU)": {
    "sourceUrl": "https://conference.pctu.edu.vn/home-english/"
  },
  "Buon Ma Thuot University of Medicine and Pharmacy": {
    "sourceUrl": "https://www.bmtu.edu.vn/"
  },
  "Can Tho University of Medicine and Pharmacy": {
    "city": "Can Tho",
    "sourceUrl": "https://engtdhydct.ctump.edu.vn/contact-location.html"
  },
  "Nam Can Tho University": {
    "city": "Can Tho",
    "sourceUrl": "https://nctu.edu.vn/eng/international-programs/international-medicine"
  },
  "Yerevan State Medical University Named for Mkhitar Heratsi": {
    "sourceUrl": "https://ysmu.am/v2/wp-content/uploads/2023/05/7d738bbf.pdf"
  },
  "Erebuni Medical Academy Foundation": {
    "sourceUrl": "https://erebuniacademy.am/en/education/"
  },
  "Yerevan Haybusak University Faculty of Medicine": {
    "sourceUrl": "https://haybusak.am/applicant-transfer/fees/"
  },
  "Yerevan University of Traditional Medicine": {
    "sourceUrl": "https://utm.am/category/for-applicants"
  },
  "Tashkent State Medical University": {
    "sourceUrl": "https://tma.uz/en/ru-2/"
  },
  "Bukhara State Medical Institute": {
    "sourceUrl": "https://bsmi.uz/en/custom-home/"
  },
  "Samarkand State Medical University": {
    "sourceUrl": "https://www.sammu.uz/en/pages/admission_procedure_int"
  },
  "Andijan State Medical Institute": {
    "sourceUrl": "https://adti.uz/en/announcements/112-andijon-davlat-tibbiyot-institutida-qabul-boshlandi.html"
  },
  "Bishkek International Medical Institute": {
    "sourceUrl": "https://bimi.edu.kg/kg/"
  },
  "Avicenna International Medical University": {
    "sourceUrl": "https://aimu.edu.kg/"
  },
  "Osh State University — International Medical Faculty": {
    "city": "Osh",
    "sourceUrl": "https://www.oshsu.kg/en/page/174"
  },
  "Osh International Medical University": {
    "city": "Osh",
    "sourceUrl": "https://www.oimu.kg/en"
  },
  "Jalal-Abad International University Medical Faculty": {
    "city": "Jalal-Abad",
    "sourceUrl": "https://jaiu.kg/en/faculties/medical-faculty/"
  },
  "Avicenna Tajik State Medical University": {
    "sourceUrl": "https://www.tajmedun.tj/en/university/history/"
  },
  "Tajik National University Faculty of Medicine": {
    "sourceUrl": "https://medical.tnu.tj/en/about-faculty/"
  }
};
const PROGRAMMES: Record<string, NonNullable<AdmissionUniversity['programme']>> = {
  'Batumi Shota Rustaveli State University': { title: 'Medical doctor', language: 'English', sourceUrl: 'https://www.bsu.edu.ge/text_files/en_file_307_1.pdf', reviewedAt: '2026-10-08' },
  'Nam Can Tho University': { title: 'General Medicine (international programme)', sourceUrl: 'https://nctu.edu.vn/eng/international-programs/international-medicine', reviewedAt: '2026-10-08' },
  'Jalal-Abad International University Medical Faculty': { title: 'General Medicine', duration: 'Multiple published tracks; confirm applicant-specific duration and internship', sourceUrl: 'https://jaiu.kg/en/faculties/medical-faculty/', reviewedAt: '2026-10-08' },
};
export const ADMISSION_UNIVERSITIES: AdmissionUniversity[] = ADMISSION_COUNTRIES.flatMap((country) => country.universities.map((name, index) => ({
  id: `${country.slug}-${index + 1}`, name, countrySlug: country.slug, countryName: country.name,
  ...EVIDENCE[name], reviewedAt: EVIDENCE[name] ? '2026-10-08' : undefined,
  programme: PROGRAMMES[name],
})));
export function getCountryUniversities(slug: string) { return ADMISSION_UNIVERSITIES.filter((university) => university.countrySlug === slug); }
