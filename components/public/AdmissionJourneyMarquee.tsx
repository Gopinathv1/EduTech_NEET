import Link from 'next/link';
import { admissionJourneySteps } from '@/data/admission-journey';

function JourneyTrack() {
  return (
    <div className="flex w-max items-center whitespace-nowrap">
      {admissionJourneySteps.map((step, index) => (
        <div key={step.id} className="flex shrink-0 items-center">
          <Link
            href={step.href}
            className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-brand-soft hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {step.shortTitle}
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
  return (
    <div className="mt-10">
      <div className="mb-4">
        <h3 className="text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
          Your Admission Journey
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#D1D1D1] sm:text-base">
          See how we guide students from the first counselling session to university admission, departure and continued
          support abroad.
        </p>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] border border-[#2B2B2B] bg-[#050505]/76 p-3 backdrop-blur-sm [scrollbar-width:thin]">
        <JourneyTrack />
      </div>
    </div>
  );
}
