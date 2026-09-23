export const OFFICIAL_SOURCE_HOSTS = [
  'neet.nta.nic.in',
  'jeemain.nta.nic.in',
  'nta.ac.in',
  'www.nta.ac.in',
  'cdnbbsr.s3waas.gov.in',
] as const;

export const REFERENCE_SOURCE_HOSTS = ['nmc.org.in', 'www.nmc.org.in'] as const;

export const OFFICIAL_EXAM_SOURCES = {
  NEET_2026_BULLETIN:
    'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602081576322299.pdf',
  NEET_2026_SYLLABUS:
    'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/01/202601081066816297.pdf',
  JEE_MAIN_2026_BULLETIN:
    'https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/10/202510311145384616.pdf',
  JEE_MAIN_2026_SYLLABUS:
    'https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/10/202510311323551056.pdf',
} as const;

export function isAllowedOfficialSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (OFFICIAL_SOURCE_HOSTS as readonly string[]).includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function assertAllowedOfficialSource(value: string): URL {
  if (!isAllowedOfficialSource(value)) throw new Error('Exam-content source URL is not on the NTA/NIC allowlist');
  return new URL(value);
}
