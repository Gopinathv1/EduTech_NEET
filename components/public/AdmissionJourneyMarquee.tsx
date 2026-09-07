import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { admissionJourneySteps } from '@/data/admission-journey';

type JourneyItemsProps = {
  copyIndex: number;
  inert?: boolean;
};

function JourneyItems({ copyIndex, inert = false }: JourneyItemsProps) {
  const t = useTranslations('admissionJourney.steps');

  return (
    <div
      className="flex shrink-0 items-center whitespace-nowrap pr-4"
      aria-hidden={inert ? 'true' : undefined}
    >
      {admissionJourneySteps.map((step, index) => (
        <div key={`${step.id}-${copyIndex}-${index}`} className="flex shrink-0 items-center">
          <Link
            href={step.href}
            tabIndex={inert ? -1 : undefined}
            className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-brand-soft hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t(`${step.id}.shortTitle`)}
          </Link>
          <span className="mx-2 text-sm font-black text-[#f6d58a]" aria-hidden="true">
            -&gt;
          </span>
        </div>
      ))}
    </div>
  );
}

function JourneyTrack() {
  return (
    <div className="sivora-journey-marquee flex w-max items-center">
      <JourneyItems copyIndex={0} />
      <JourneyItems copyIndex={1} inert />
    </div>
  );
}

function JourneyStaticList() {
  const t = useTranslations('admissionJourney.steps');

  return (
    <div className="sivora-journey-marquee-static hidden flex-wrap items-center gap-y-2">
      {admissionJourneySteps.map((step, index) => (
        <div key={`${step.id}-static-${index}`} className="flex min-w-0 items-center">
          <Link
            href={step.href}
            className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-brand-soft hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t(`${step.id}.shortTitle`)}
          </Link>
          {index < admissionJourneySteps.length - 1 ? (
            <span className="mx-2 text-sm font-black text-[#f6d58a]" aria-hidden="true">
              -&gt;
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AdmissionJourneyMarquee() {
  const t = useTranslations('admissionJourney.marquee');

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h3 className="text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
          {t('title')}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#D1D1D1] sm:text-base">
          {t('subtitle')}
        </p>
      </div>
      <div className="sivora-journey-marquee-shell overflow-hidden rounded-[1.5rem] border border-[#2B2B2B] bg-[#050505]/76 p-3 backdrop-blur-sm">
        <JourneyTrack />
        <JourneyStaticList />
      </div>
    </div>
  );
}
