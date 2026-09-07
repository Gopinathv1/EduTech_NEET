import Link from 'next/link';
import { useTranslations } from 'next-intl';

type ProductKey = 'admissions' | 'counselling' | 'examPreparation' | 'courses';

const PRODUCTS: { key: ProductKey; href: string }[] = [
  { key: 'admissions', href: '/admissions' },
  { key: 'counselling', href: '/counselling' },
  { key: 'examPreparation', href: '/exam-preparation' },
  { key: 'courses', href: '/courses' },
];

export default function ExploreSivora({ exclude = [] }: { exclude?: ProductKey[] }) {
  const t = useTranslations('exploreSivora');
  const visibleProducts = PRODUCTS.filter((product) => !exclude.includes(product.key));

  return (
    <section className="border-t border-[#2B2B2B] bg-background/74 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)]">
        <div className="rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/88 p-6 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
                {t('eyebrow')}
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                {t('title')}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#D1D1D1] sm:text-base">
              {t('subtitle')}
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <Link
                key={product.key}
                href={product.href}
                className="group rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5 transition hover:-translate-y-0.5 hover:border-brand/35"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">
                  {t(`items.${product.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">
                  {t(`items.${product.key}.body`)}
                </p>
                <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                  {t('cta')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
