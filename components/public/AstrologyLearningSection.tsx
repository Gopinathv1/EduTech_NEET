import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PrimaryLink, SecondaryLink, Section } from '@/components/public/ui';
import {
  ASTROLOGY_LEARNING_AREAS,
  ASTROLOGY_LEARNING_PATH,
  ASTROLOGY_RELATED_AREAS,
} from '@/data/courses';

export default function AstrologyLearningSection({ standalone = false }: { standalone?: boolean }) {
  const t = useTranslations('courses');

  return (
    <Section id="astrology" tinted={!standalone} lazy={!standalone}>
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('astrology.eyebrow')}</p>
          <h2 className="mt-5 text-[clamp(2.35rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
            {t('astrology.streamTitle')}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('astrology.streamSubtitle')}</p>
          <div className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-white">{t('astrology.positioningTitle')}</p>
            <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{t('astrology.positioningBody')}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/marketplace?category=astrology-traditional-learning">
              {t('astrology.marketplaceCta')}
            </PrimaryLink>
            <SecondaryLink href="/counselling">{t('astrology.notifyCta')}</SecondaryLink>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ASTROLOGY_LEARNING_AREAS.map((area) => (
              <Link
                key={area.key}
                href={area.href}
                className="min-h-44 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black uppercase leading-5 tracking-[0.08em] text-white">
                    {t(`astrology.areas.${area.key}.title`)}
                  </p>
                  <span className="shrink-0 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-brand">
                    {t(`statuses.${area.status}`)}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-brand">
                  {t('astrology.learningArea')} · {t(`levels.${area.level}`)}
                </p>
                <p className="mt-3 text-xs leading-6 text-[#D1D1D1]">{t(`astrology.areas.${area.key}.body`)}</p>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">{t('astrology.pathEyebrow')}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ASTROLOGY_LEARNING_PATH.map((step) => (
                <span key={step} className="rounded-full border border-[#2B2B2B] bg-[#111111] px-3 py-1.5 text-xs font-black uppercase text-white">
                  {t(`astrology.path.${step}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">{t('astrology.relatedEyebrow')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ASTROLOGY_RELATED_AREAS.map((area) => (
                <span key={area} className="rounded-full border border-[#2B2B2B] bg-[#111111] px-3 py-1.5 text-xs font-bold uppercase text-[#D1D1D1]">
                  {t(`astrology.related.${area}`)}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[#D1D1D1]">{t('astrology.astronomyNote')}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
