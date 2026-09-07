import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Section } from '@/components/public/ui';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/catalog';

export async function generateMetadata() {
  const t = await getTranslations('seo.marketplaceSell');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/marketplace/sell' });
}

export default async function MarketplaceSellPage() {
  const t = await getTranslations('marketplace');
  const steps = t.raw('sellerFlow.steps') as string[];

  return (
    <>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('sellerFlow.eyebrow')}</p>
            <h1 className="mt-5 text-[clamp(2.8rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('sellerFlow.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('sellerFlow.subtitle')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5">
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('postForm.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('postForm.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#D1D1D1]">{t('postForm.note')}</p>
          </div>
          <form className="grid gap-4 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5" aria-label={t('postForm.title')}>
            <Field label={t('postForm.productTitle')} />
            <label>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-brand">{t('postForm.category')}</span>
              <select className="mt-2 h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm text-white">
                {MARKETPLACE_CATEGORIES.map((category) => (
                  <option key={category.slug}>{t(`categories.${category.labelKey}`)}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('author')} />
              <Field label={t('publisher')} />
              <Field label={t('postForm.edition')} />
              <Field label={t('condition')} />
              <Field label={t('postForm.price')} type="number" />
              <Field label={t('postForm.quantity')} type="number" />
              <Field label={t('location')} />
              <Field label={t('delivery')} />
            </div>
            <label>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-brand">{t('postForm.description')}</span>
              <textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 py-3 text-sm text-white" />
            </label>
            <p className="rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm leading-6 text-white">
              {t('postForm.disabledNotice')}
            </p>
          </form>
        </div>
      </Section>
    </>
  );
}

function Field({ label, type = 'text' }: { label: string; type?: string }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-brand">{label}</span>
      <input type={type} className="mt-2 h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm text-white" />
    </label>
  );
}
