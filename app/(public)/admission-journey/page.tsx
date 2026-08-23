import Image from 'next/image';
import Link from 'next/link';
import { admissionJourneySteps } from '@/data/admission-journey';
import { pageMetadata } from '@/lib/seo';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { Container, Section } from '@/components/public/ui';

const WHATSAPP_MESSAGE =
  'Hello SIVORA UP↑RISING, I would like to start my admission journey and understand suitable countries, universities, courses, eligibility and expected costs.';

export function generateMetadata() {
  return pageMetadata({
    title: 'Admission Journey',
    description:
      'Understand the SIVORA UP↑RISING student admission journey from counselling and university selection to admission, departure and continued support abroad.',
    path: '/admission-journey',
  });
}

export default function AdmissionJourneyPage() {
  return (
    <>
      <section className="border-b border-[#2B2B2B] bg-[#050505]/78 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-[1280px]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
              Your Admission Journey With SIVORA UP↑RISING
            </p>
            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,6vw,7rem)] font-black uppercase leading-[0.9] text-white">
              From Dream to Destination.
            </h1>
            <div className="mt-7 max-w-4xl space-y-4 text-base leading-8 text-[#D1D1D1] sm:text-lg">
              <p>
                Every student&apos;s journey is different. We begin by understanding the student&apos;s academic
                profile, interests, career goals, preferred course, destination preferences and financial considerations.
              </p>
              <p>
                From there, we help students and families understand suitable education pathways and support them through
                the admission journey.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Section lazy>
        <div className="mx-auto grid max-w-[1280px] gap-5 md:grid-cols-2 xl:gap-6">
          {admissionJourneySteps.map((step) => (
            <section
              key={step.id}
              id={step.id}
              className="scroll-mt-28 overflow-hidden rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111]/88 shadow-xl shadow-black/10 backdrop-blur-sm"
            >
              {step.image ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-[#050505]">
                  <Image
                    src={step.image.src}
                    alt={step.image.alt}
                    fill
                    sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="p-5 sm:p-6">
                <p className="text-sm font-black text-brand-light">{step.number}</p>
                <h2 className="mt-3 text-2xl font-black uppercase leading-tight text-white">{step.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{step.description}</p>
                {step.id === 'visa-guidance' ? (
                  <p className="mt-4 border-l border-[#f6a623]/40 bg-[#050505]/64 p-3 text-xs leading-6 text-[#D1D1D1]">
                    SIVORA UP↑RISING provides guidance on visa and document requirements. Visa approval is subject to
                    the applicable authorities and regulations.
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="mx-auto max-w-[1280px] rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/90 p-6 shadow-2xl shadow-black/12 backdrop-blur-sm sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-light">Next Steps</p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#D1D1D1]">
              Tell us about your academic goals, preferred course and budget. Our counselling team can help you
              understand the next suitable steps.
            </p>
            <p className="mt-5 border-l border-[#f6a623]/40 bg-[#050505]/64 p-4 text-xs leading-6 text-[#D1D1D1]">
              Admission is subject to university eligibility requirements, applicable regulations, documentation and
              availability.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href="/#callback"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              START FREE COUNSELLING
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
      </Section>
    </>
  );
}
