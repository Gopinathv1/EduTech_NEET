import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, Card, IconBadge } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import {
  BookIcon,
  ChartIcon,
  GlobeIcon,
  RupeeIcon,
  ClockIcon,
  ShieldIcon,
} from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.services');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/services' });
}

const ICONS = [BookIcon, RupeeIcon, ChartIcon, ClockIcon, GlobeIcon, ShieldIcon];
type TitleBody = { title: string; body: string };

export default function ServicesPage() {
  const t = useTranslations('services');
  const items = t.raw('items') as TitleBody[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {items.map((s, i) => {
            const Icon = ICONS[i] ?? BookIcon;
            return (
              <Card key={s.title} className="flex gap-4">
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary">{s.title}</h3>
                  <p className="mt-1 text-sm text-textSecondary">{s.body}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
