import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import HomeLeadForm from '@/components/public/HomeLeadForm';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';

const HELP_CARDS = [
  'Personalized Guidance',
  'India & Global Education',
  'Career & Counselling',
  'Exam Preparation',
];

const WHATSAPP_MESSAGE =
  'Hello SIVORA UP↑RISING, I would like free counselling to plan my next education step.';

export const metadata = pageMetadata({
  title: 'Counselling',
  description: 'Request counselling from SIVORA UP↑RISING for exams, study abroad, courses and education planning.',
  path: '/counselling',
});

export default function CounsellingPage() {
  return (
    <>
      <PageHero
        eyebrow="Counselling"
        title="Plan your next education step."
        subtitle="Share your goal and our team can guide you on exam preparation, study abroad, courses and counselling pathways."
      />
      <Section id="callback">
        <div className="grid gap-10 rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-2xl shadow-black/8 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">Request Callback</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              Tell us what you&apos;re looking for.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">
              Use one form for counselling, study abroad, exam preparation or learning programs.
            </p>
          </div>
          <HomeLeadForm />
        </div>
      </Section>
      <Section tinted lazy>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HELP_CARDS.map((card) => (
            <div key={card} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
              <h2 className="text-lg font-black uppercase text-white">{card}</h2>
            </div>
          ))}
        </div>
      </Section>
      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">Ready to plan your next step?</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">Speak with SIVORA UP↑RISING.</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="#callback">Get Free Counselling</PrimaryLink>
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
