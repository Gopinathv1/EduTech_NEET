import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { admissionJourneySteps } from '@/data/admission-journey';
import { EUROPE_STUDY_DESTINATIONS } from '@/data/study-destinations';

const DESTINATIONS = ['Europe', 'Uzbekistan', 'Kyrgyzstan', 'Kazakhstan', 'Georgia', 'Russia', 'Other verified destinations'];
const STUDY_OPTIONS = [
  {
    title: 'MBBS Abroad',
    body: 'Explore overseas medical education pathways with country, university, course, application and documentation guidance.',
  },
  {
    title: 'Engineering & Technology',
    body: 'Explore international engineering and technology programs based on interests, eligibility, destination options and budget.',
  },
  {
    title: 'International Higher Education',
    body: 'Review broader higher-education pathways across selected international destinations.',
  },
];

const SUPPORT_STEPS = ['Counselling', 'University & Course Selection', 'Application', 'Documentation', 'Visa Guidance', 'Pre-Departure', 'Arrival Support'];
const WHATSAPP_MESSAGE =
  'Hello SIVORA UP↑RISING, I would like to explore suitable study abroad options, destinations, courses, eligibility and expected costs.';

export const metadata = pageMetadata({
  title: 'Study Abroad',
  description: 'Study abroad and education guidance for MBBS, engineering, higher education, destinations, applications and student-life preparation.',
  path: '/study-abroad',
});

export default function StudyAbroadPage() {
  return (
    <>
      <PageHero
        eyebrow="Study Abroad & Education Guidance"
        title="Explore your study abroad options."
        subtitle="Clear guidance for medical, engineering, technology and higher-education pathways across selected international destinations."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">What Do You Want To Study?</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              Start with your course direction.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {STUDY_OPTIONS.map((option) => (
              <div key={option.title} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
                <h3 className="text-xl font-black uppercase text-white">{option.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{option.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">Where Do You Want To Study?</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              Destinations in one place.
            </h2>
          </div>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {DESTINATIONS.map((destination) => (
                <span key={destination} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-4 py-2 text-sm font-black uppercase text-white">
                  {destination}
                </span>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111]/88 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand">Europe</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EUROPE_STUDY_DESTINATIONS.map((destination) => (
                  <span key={destination} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-3 py-1.5 text-xs font-bold text-white">
                    {destination}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-[#D1D1D1]">
                Destination guidance depends on course availability, eligibility, budget, language requirements and student preferences.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">How We Support You</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              One clear admission journey.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORT_STEPS.map((step, index) => (
              <a
                key={step}
                href={admissionJourneySteps[index]?.href ?? '/admission-journey'}
                className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">{step}</p>
              </a>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/88 p-6 shadow-2xl shadow-black/12">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">Student Life Abroad</p>
          <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">Prepare for life after admission.</h2>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#D1D1D1] sm:text-base sm:leading-8">
            We guide students with practical information about budgeting, accommodation, adapting to a new country, local rules and permitted part-time work options where legally applicable. Part-time work eligibility and hours depend on visa type, country-specific regulations and university policies.
          </p>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">Explore Your Study Abroad Options</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">Talk to our counselling team.</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="/counselling">Get Free Counselling</PrimaryLink>
            <WhatsAppLink
              label="Chat with SIVORA UP↑RISING on WhatsApp"
              message={WHATSAPP_MESSAGE}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24"
            >
              Chat On WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </Section>
    </>
  );
}
