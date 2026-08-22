import Image from 'next/image';
import Link from 'next/link';
import { admissionGuidancePoints, studentJourneys, studentJourneySteps } from '@/data/student-journeys';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { Section } from './ui';

const WHATSAPP_MESSAGE =
  'Hello SIVORA UP↑RISING, I would like to know more about MBBS opportunities, eligibility, universities, admission procedures and my next steps.';

export default function StudentJourneys() {
  return (
    <Section id="student-success" tinted lazy className="relative overflow-hidden">
      <div className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
              SIVORA UP↑RISING • STUDENT SUCCESS
            </p>
            <h2 className="mt-5 text-[clamp(2.7rem,5.8vw,6.4rem)] font-black uppercase leading-[0.9] text-white">
              Real Students. Real Journeys.
            </h2>
          </div>
          <div className="max-w-3xl">
            <h3 className="text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              From Admission to Arrival.
            </h3>
            <p className="mt-5 text-base leading-8 text-[#D1D1D1] sm:text-lg">
              Helping aspiring medical students move from counselling and university selection to admission and the
              beginning of their international education journey.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {studentJourneys.map((item, index) => (
            <article
              key={item.image}
              className={`group overflow-hidden rounded-[1.5rem] border border-[#f6a623]/20 bg-[#111111]/88 shadow-[0_0_0_1px_rgba(215,25,32,0.12),0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#f6a623]/36 ${
                index === 0 ? 'lg:col-span-7 lg:row-span-2' : 'lg:col-span-5'
              }`}
            >
              <div
                className={`relative overflow-hidden bg-[#050505] ${
                  index === 0 ? 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-[1.45/1]' : 'aspect-[4/3] sm:aspect-[16/9]'
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes={index === 0 ? '(min-width: 1024px) 58vw, 100vw' : '(min-width: 1024px) 42vw, 100vw'}
                  className="object-cover transition duration-700 group-hover:scale-[1.025]"
                  loading="lazy"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand/35 bg-brand-soft px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-brand-light">
                    {item.category}
                  </span>
                  <span className="rounded-full border border-[#f6a623]/25 bg-[#f6a623]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#f6d58a]">
                    {item.country}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black uppercase leading-tight text-white">{item.title}</h3>
                {item.university ? (
                  <p className="mt-2 text-sm font-bold text-[#f6d58a]">{item.university}</p>
                ) : null}
                <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{item.description}</p>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-brand-light">{item.tag}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/88 p-6 shadow-2xl shadow-black/12 backdrop-blur-sm sm:p-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-light">
              University & Course Matching
            </p>
            <h3 className="mt-4 text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              How We Help Students Build Their Future Abroad
            </h3>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[#D1D1D1] sm:text-base sm:leading-8">
              <p>
                Our admission process starts by understanding each student&apos;s goals, academic profile, interests,
                skills, preferred course, country preference and financial situation.
              </p>
              <p>
                Based on this, we guide students toward suitable universities and courses that align with their academic
                background, career interests and budget.
              </p>
              <p>
                Our support continues through application, documentation, admission, visa guidance, pre-departure
                preparation and transition support.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {admissionGuidancePoints.map((point) => (
              <div key={point} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                <p className="text-sm font-bold leading-6 text-white">{point}</p>
              </div>
            ))}
          </div>
          <p className="border-l border-[#f6a623]/40 bg-[#050505]/64 p-4 text-xs leading-6 text-[#D1D1D1] lg:col-span-2">
            Admission is subject to university eligibility requirements, applicable regulations, documentation and
            availability.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#2B2B2B] bg-[#050505]/76 p-4 backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:text-left">
            {studentJourneySteps.map((step, index) => (
              <div key={step} className="flex flex-col items-center gap-3 sm:flex-row">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-white">{step}</span>
                {index < studentJourneySteps.length - 1 ? (
                  <span className="hidden text-brand-light sm:inline" aria-hidden="true">
                    -&gt;
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/90 p-6 shadow-2xl shadow-black/12 backdrop-blur-sm sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <h3 className="text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              Your Global Education Journey Could Be Next.
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#D1D1D1]">
              Talk to our counselling team to understand suitable countries, universities, courses, eligibility and
              expected costs based on your profile and goals.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href="#callback"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              GET FREE COUNSELLING
            </Link>
            <WhatsAppLink
              label="Chat with SIVORA UP↑RISING on WhatsApp"
              message={WHATSAPP_MESSAGE}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              CHAT ON WHATSAPP
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
