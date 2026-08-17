import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import Faq, { type FaqItem } from '@/components/public/Faq';

export async function generateMetadata() {
  const t = await getTranslations('seo.faq');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/faq' });
}

export default function FaqPage() {
  const t = useTranslations('faq');
  const items = t.raw('items') as FaqItem[];

  // FAQPage structured data — helps search engines surface answers.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="mx-auto max-w-3xl">
          <Faq items={items} />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
