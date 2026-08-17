import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card, IconBadge } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import { ShieldIcon, GlobeIcon, RupeeIcon, UsersIcon } from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.about');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/about' });
}

const VALUE_ICONS = [RupeeIcon, ShieldIcon, GlobeIcon, UsersIcon];
type TitleBody = { title: string; body: string };

export default function AboutPage() {
  const t = useTranslations('about');
  const story = t.raw('story') as string[];
  const values = t.raw('values') as TitleBody[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-brand">{t('missionTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('mission')}</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-brand">{t('visionTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('vision')}</p>
          </Card>
        </div>
      </Section>

      <Section tinted lazy>
        <SectionHeading title={t('storyTitle')} />
        <div className="mt-6 max-w-3xl space-y-4">
          {story.map((para, i) => (
            <p key={i} className="text-slate-700">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section lazy>
        <SectionHeading center title={t('valuesTitle')} />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i] ?? ShieldIcon;
            return (
              <Card key={v.title}>
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{v.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
