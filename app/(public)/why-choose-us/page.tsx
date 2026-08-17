import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, Card, IconBadge } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import {
  RupeeIcon,
  GlobeIcon,
  ChartIcon,
  ClockIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.whyChoose');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/why-choose-us' });
}

const ICONS = [RupeeIcon, GlobeIcon, ChartIcon, ClockIcon, ShieldIcon, UsersIcon];
type TitleBody = { title: string; body: string };

export default function WhyChooseUsPage() {
  const t = useTranslations('whyChoose');
  const points = t.raw('points') as TitleBody[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p, i) => {
            const Icon = ICONS[i] ?? ShieldIcon;
            return (
              <Card key={p.title}>
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
