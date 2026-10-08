import Link from 'next/link';
import { Section } from '@/components/public/ui';
import UniversityExplorer from '@/components/admissions/UniversityExplorer';
import { ADMISSION_UNIVERSITIES } from '@/lib/data/admissions/universities';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({ title: 'Explore universities and compare programmes', description: 'Compare sourced institution information and confirm programme-specific requirements before applying.', path: '/admissions/universities' });
export default function UniversitiesPage() {
  return <Section><nav aria-label="Breadcrumb" className="mb-6 text-sm"><Link href="/admissions" className="underline">Admissions</Link> / <span aria-current="page">Universities</span></nav><h1 className="mb-6 text-3xl font-semibold text-[#171717]">Explore universities and compare programmes</h1><UniversityExplorer universities={ADMISSION_UNIVERSITIES} /></Section>;
}
