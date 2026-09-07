import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRightIcon,
  BookIcon,
  CompassIcon,
  CpuIcon,
  GlobeIcon,
  StoreIcon,
  TargetIcon,
} from './icons';

type ProductKey = 'admissions' | 'counselling' | 'examPreparation' | 'courses' | 'marketplace';

const PRODUCTS = [
  { key: 'admissions', href: '/admissions', icon: GlobeIcon },
  { key: 'counselling', href: '/counselling', icon: CompassIcon },
  { key: 'examPreparation', href: '/exam-preparation', icon: TargetIcon },
  { key: 'courses', href: '/courses', icon: CpuIcon },
  { key: 'marketplace', href: '/marketplace', icon: StoreIcon },
] satisfies { key: ProductKey; href: string; icon: typeof BookIcon }[];

const PRODUCT_ACCENTS: Record<ProductKey, string> = {
  admissions: 'from-[#d71920]/24 via-[#f6a623]/12 to-transparent',
  counselling: 'from-[#f6a623]/20 via-[#d71920]/12 to-transparent',
  examPreparation: 'from-[#d71920]/22 via-white/8 to-transparent',
  courses: 'from-[#0b1736]/60 via-[#d71920]/12 to-transparent',
  marketplace: 'from-[#f6a623]/18 via-[#0b1736]/48 to-transparent',
};

const PRODUCT_LAYOUT: Record<ProductKey, string> = {
  admissions: 'lg:col-span-2',
  counselling: 'lg:col-span-2',
  examPreparation: 'lg:col-span-2',
  courses: 'lg:col-span-3',
  marketplace: 'lg:col-span-3',
};

const PRODUCT_TAGS: Record<ProductKey, string[]> = {
  admissions: ['tagOne', 'tagTwo', 'tagThree'],
  counselling: ['tagOne', 'tagTwo', 'tagThree'],
  examPreparation: ['tagOne', 'tagTwo', 'tagThree'],
  courses: ['tagOne', 'tagTwo', 'tagThree'],
  marketplace: ['tagOne', 'tagTwo', 'tagThree'],
};

export default function ExploreSivora({ exclude = [] }: { exclude?: ProductKey[] }) {
  const t = useTranslations('exploreSivora');
  const visibleProducts = PRODUCTS.filter((product) => !exclude.includes(product.key));

  return (
    <section id="explore-sivora" className="border-t border-[#2B2B2B] bg-background/74 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
              {t('eyebrow')}
            </p>
            <h2 className="mt-5 max-w-5xl text-[clamp(2.7rem,6vw,6.6rem)] font-black uppercase leading-[0.9] text-white">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#D1D1D1]">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {visibleProducts.map((product, index) => {
            const Icon = product.icon;

            return (
              <Link
                key={product.key}
                href={product.href}
                className={`group relative min-h-[320px] overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6 shadow-2xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-brand/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${PRODUCT_LAYOUT[product.key]}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${PRODUCT_ACCENTS[product.key]} opacity-90`} />
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#f6a623]/20" />
                <div className="absolute -bottom-20 right-10 h-48 w-48 rounded-full border border-brand/20" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-[#f6a623]/25 bg-[#050505]/72 text-[#f6d58a]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#f6d58a]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mt-9">
                    <h3 className="max-w-[15rem] text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
                      {t(`items.${product.key}.title`)}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[#D1D1D1] sm:text-base">
                      {t(`items.${product.key}.body`)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {PRODUCT_TAGS[product.key].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#2B2B2B] bg-[#050505]/64 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#D1D1D1]"
                      >
                        {t(`items.${product.key}.tags.${tag}`)}
                      </span>
                    ))}
                  </div>

                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                    {t(`items.${product.key}.cta`)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
