import Link from 'next/link';
import { useTranslations } from 'next-intl';

type ProductKey = 'admissions' | 'counselling' | 'examPreparation' | 'courses' | 'marketplace';
const PRODUCTS: { key: ProductKey; href: string }[] = [
  { key: 'admissions', href: '/admissions' }, { key: 'counselling', href: '/counselling' },
  { key: 'examPreparation', href: '/exam-preparation' }, { key: 'courses', href: '/courses' }, { key: 'marketplace', href: '/marketplace' },
];
export default function ExploreSivora({ exclude = [] }: { exclude?: ProductKey[] }) {
  const t = useTranslations('exploreSivora');
  return <section id="explore-sivora" className="border-t border-white/10 bg-[#11110f] py-24 text-[#f5f1e9] sm:py-32"><div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)]"><p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{t('eyebrow')}</p><h2 className="sivora-editorial-heading mt-5 max-w-3xl text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.88]">{t('title')}</h2><div className="mt-16 divide-y divide-white/10 border-y border-white/10">{PRODUCTS.filter((item) => !exclude.includes(item.key)).map((item, index) => <Link key={item.key} href={item.href} className="group grid gap-4 py-7 md:grid-cols-[4rem_1fr_1fr_auto] md:items-center"><span className="text-sm text-[#8e897f]">0{index + 1}</span><h3 className="text-2xl font-medium transition group-hover:text-brand sm:text-4xl">{t(`items.${item.key}.title`)}</h3><p className="text-sm leading-7 text-[#b8b2a8]">{t(`items.${item.key}.body`)}</p><span className="text-2xl text-[#8e897f] transition group-hover:translate-x-2">→</span></Link>)}</div></div></section>;
}
