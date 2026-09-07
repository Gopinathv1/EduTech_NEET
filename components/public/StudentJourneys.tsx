'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { studentJourneys } from '@/data/student-journeys';
import AdmissionJourneyMarquee from '@/components/public/AdmissionJourneyMarquee';
import { Section } from './ui';

export default function StudentJourneys() {
  const t = useTranslations('studentJourneys');

  return (
    <Section id="student-success" tinted lazy className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-end lg:gap-12 xl:gap-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
              {t('eyebrow')}
            </p>
            <h2 className="mt-5 text-[clamp(2.7rem,5vw,5.8rem)] font-black uppercase leading-[0.9] text-white">
              {t('title')}
            </h2>
          </div>
          <div className="max-w-3xl">
            <h3 className="text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              {t('subtitleTitle')}
            </h3>
            <p className="mt-5 text-base leading-8 text-[#D1D1D1] sm:text-lg">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="sivora-student-photo-marquee mt-12 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="sivora-student-photo-marquee__track flex w-max gap-5 pr-5 xl:gap-6 xl:pr-6">
            {[...studentJourneys, ...studentJourneys].map((item, index) => (
              <StudentJourneyCard
                key={`${item.image}-${index}`}
                item={item}
                duplicate={index >= studentJourneys.length}
                t={t}
              />
            ))}
          </div>
        </div>

        <AdmissionJourneyMarquee />

        <div className="mt-10 rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/90 p-6 shadow-2xl shadow-black/12 backdrop-blur-sm sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <h3 className="text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              {t('cta.title')}
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#D1D1D1]">
              {t('cta.body')}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href="/admission-journey"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t('cta.primary')}
            </Link>
            <Link
              href="/counselling"
              className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-white/80 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-textPrimary transition hover:-translate-y-0.5 hover:border-brand/45 hover:bg-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

function StudentJourneyCard({
  item,
  duplicate = false,
  t,
}: {
  item: (typeof studentJourneys)[number];
  duplicate?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article
      aria-hidden={duplicate ? true : undefined}
      className="group flex h-[39rem] w-[min(78vw,18.75rem)] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#f6a623]/20 bg-[#111111]/88 shadow-[0_0_0_1px_rgba(215,25,32,0.12),0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#f6a623]/36 hover:shadow-[0_0_0_1px_rgba(246,166,35,0.22),0_28px_80px_rgba(0,0,0,0.42)] sm:w-[19rem] md:w-[20rem] lg:w-[21.25rem] xl:w-[22.5rem]"
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-[#050505]">
        {imageFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-[#050505] px-5 text-center text-xs font-black uppercase tracking-[0.16em] text-[#f6d58a]">
            {t('imageUnavailable')}
          </div>
        ) : (
          <Image
            src={item.image}
            alt={duplicate ? '' : t(`items.${item.key}.alt`)}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 1024px) 340px, (min-width: 768px) 320px, 300px"
            className="object-cover transition duration-700 group-hover:scale-[1.025]"
            style={{ objectPosition: item.imagePosition ?? 'center' }}
            loading="eager"
            onError={() => {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[student-journey] image failed: ${item.image}`);
              }
              setImageFailed(true);
            }}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand/35 bg-brand-soft px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-brand-light">
            {t(`items.${item.key}.category`)}
          </span>
          <span className="rounded-full border border-[#f6a623]/25 bg-[#f6a623]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#f6d58a]">
            {t(`items.${item.key}.country`)}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-black uppercase leading-tight text-white">
          {t(`items.${item.key}.title`)}
        </h3>
        {t.has(`items.${item.key}.university`) ? (
          <p className="mt-2 text-sm font-bold text-[#f6d58a]">{t(`items.${item.key}.university`)}</p>
        ) : null}
        <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{t(`items.${item.key}.description`)}</p>
        <p className="mt-auto pt-5 text-xs font-black uppercase tracking-[0.16em] text-brand-light">
          {t(`items.${item.key}.tag`)}
        </p>
      </div>
    </article>
  );
}
