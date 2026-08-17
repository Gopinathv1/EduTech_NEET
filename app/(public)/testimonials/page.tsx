import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import Testimonials, { type Testimonial } from '@/components/public/Testimonials';
import { QuoteIcon } from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.testimonials');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/testimonials' });
}

export default function TestimonialsPage() {
  const t = useTranslations('testimonials');
  const items = t.raw('items') as Testimonial[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <Testimonials items={items} />
      </Section>

      {/* Static grid — every testimonial in the SSR HTML. */}
      <Section tinted lazy>
        <SectionHeading center title={t('allTitle')} />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.name}>
              <QuoteIcon className="h-7 w-7 text-brand/30" />
              <p className="mt-3 text-sm leading-relaxed text-textSecondary">{item.quote}</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-textPrimary">{item.name}</p>
                <p className="text-xs text-textSecondary">{item.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
