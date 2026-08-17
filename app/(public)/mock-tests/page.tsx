import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card, IconBadge, PrimaryLink } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import { ClockIcon, BookIcon, ChartIcon, CheckIcon } from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.mockTests');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/mock-tests' });
}

const TYPE_ICONS = [ClockIcon, BookIcon, ChartIcon];
type TitleBody = { title: string; body: string };

export default function MockTestsPage() {
  const t = useTranslations('mockTests');
  const types = t.raw('types') as TitleBody[];
  const features = t.raw('features') as string[];
  const pricingPoints = t.raw('pricing.points') as string[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      {/* Test types */}
      <Section>
        <SectionHeading center title={t('typesTitle')} subtitle={t('typesSubtitle')} />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {types.map((ty, i) => {
            const Icon = TYPE_ICONS[i] ?? BookIcon;
            return (
              <Card key={ty.title}>
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <h3 className="mt-4 text-lg font-semibold text-textPrimary">{ty.title}</h3>
                <p className="mt-2 text-sm text-textSecondary">{ty.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Features + pricing */}
      <Section tinted lazy>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading title={t('featuresTitle')} />
            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <span className="text-textSecondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="border-brand/20">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              {t('pricing.title')}
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-textPrimary">{t('pricing.price')}</span>
              <span className="text-textSecondary">{t('pricing.per')}</span>
            </p>
            <ul className="mt-5 space-y-2">
              {pricingPoints.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-textSecondary">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <PrimaryLink href="/register" className="w-full">
                {t('pricing.cta')}
              </PrimaryLink>
            </div>
            <p className="mt-3 text-center text-xs text-textSecondary">{t('pricing.note')}</p>
          </Card>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
