import Image from 'next/image';
import OpportunityVisual from '@/components/public/OpportunityVisual';
import styles from '@/components/public/RouteExperience.module.css';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import HomeLeadForm from '@/components/public/HomeLeadForm';
import CompareTray from '@/components/admissions/CompareTray';
import { ADMISSION_COUNTRY_PROFILES } from '@/lib/data/admissions/countries';
import { ProductFaqSection, RelatedServicesSection } from '@/components/public/ProductPageBlocks';

const REGION_FILTERS = ['all', 'apac', 'europe', 'central-asia', 'eastern-europe', 'southeast-asia'] as const;

type RegionFilter = (typeof REGION_FILTERS)[number];

type AdmissionsPageProps = {
  searchParams?: Promise<{ region?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations('seo.admissions');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/admissions' });
}

function normalizeRegionFilter(region?: string): RegionFilter {
  return REGION_FILTERS.includes(region as RegionFilter) ? (region as RegionFilter) : 'all';
}

function matchesRegion(country: (typeof ADMISSION_COUNTRY_PROFILES)[number], region: RegionFilter) {
  if (region === 'all') return true;
  if (region === 'apac') return country.region === 'APAC';
  if (region === 'europe') return country.region === 'EUROPE';
  if (region === 'central-asia') return country.region === 'CENTRAL_ASIA';
  return country.subregion.toLowerCase().replace(/\s+/g, '-') === region;
}

export default async function AdmissionsPage({ searchParams }: AdmissionsPageProps) {
  const params = await searchParams;
  const activeRegion = normalizeRegionFilter(params?.region);
  const t = await getTranslations('admissions');
  const journey = t.raw('simplifiedJourney.items') as string[];
  const chooseItems = t.raw('choose.items') as { title: string; body: string }[];
  const faqItems = t.raw('faq.items') as { q: string; a: string }[];
  const relatedItems = t.raw('related.items') as { title: string; body: string; href: string; cta: string }[];
  const regions = t.raw('regions.items') as { key: RegionFilter | 'other'; title: string; body: string; cta: string }[];
  const studyPaths = t.raw('studyPaths.items') as { title: string; body: string }[];
  const featuredCountries = ADMISSION_COUNTRY_PROFILES.filter((country) => country.featured && country.detailAvailable);
  const visibleCountries = featuredCountries.filter((country) => matchesRegion(country, activeRegion));

  return (
    <div className={styles.page}>
      <section className="public-editorial-hero relative overflow-hidden border-b border-[#deded9] bg-[#f7f7f5]">
        <div className="relative mx-auto grid min-h-[580px] w-full max-w-[1280px] gap-8 px-[clamp(1rem,3vw,3rem)] py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
          <div className="pb-2">
            <p className="text-xs font-bold tracking-[0.2em] text-brand">SIVORA ADMISSIONS</p>
            <h1 className="mt-5 max-w-5xl text-[clamp(3.5rem,6.5vw,7rem)] font-semibold leading-[0.84] tracking-[-.075em] text-[#10151c]">
              Your admission journey, with clarity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f6975]">SIVORA helps students and families explore education opportunities, compare realistic options and move through the admission process with structured guidance.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/contact">Talk to SIVORA</PrimaryLink>
              <Link
                href="#destinations"
                className="inline-flex items-center justify-center rounded-lg border border-[#dce0e2] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#171717] transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                Explore destinations
              </Link>
            </div>
          </div>
          <OpportunityVisual kind="admissions" />
        </div>
      </section>

      <Section lazy>
        <div className="grid gap-10 lg:grid-cols-[.55fr_1.45fr]">
          <div><p className="text-xs font-bold tracking-[.2em] text-brand">STUDENTS & PARENTS</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[.88] tracking-[-.07em] text-[#10151c]">A practical path through a significant decision.</h2></div>
          <div className="border-t border-[#d9dee5]">{[['UNDERSTAND YOUR GOAL', 'Education goals, course and programme exploration, university or institution exploration, and destination considerations.'], ['CHECK REALISTIC OPTIONS', 'Eligibility guidance, requirements and practical pathways based on the programme and institution being explored.'], ['PREPARE THE PROCESS', 'Application planning, documentation guidance, application support and admission-process guidance.'], ['PLAN THE NEXT STEP', 'Pre-departure guidance where applicable, or a route to Counselling when a student needs more clarity first.']].map(([title, body], index) => <article key={title} className="grid gap-4 border-b border-[#d9dee5] py-7 sm:grid-cols-[48px_.65fr_1.35fr] sm:gap-7"><span className="text-xs text-[#7a8795]">0{index + 1}</span><h3 className="text-2xl font-semibold tracking-[-.045em] text-[#10151c]">{title}</h3><p className="text-sm leading-7 text-[#5f6975]">{body}</p></article>)}</div>
        </div>
      </Section>

      <Section lazy>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('regions.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,4.6rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('regions.title')}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#565c60]">{t('regions.subtitle')}</p>
        </div>
        <div className={styles.rows}>
          {regions.map((region) => {
            const href =
              region.key === 'other'
                ? '/counselling?interest=global-admissions'
                : `/admissions?region=${region.key}#destinations`;

            return (
              <Link
                key={region.key}
                href={href}
                className="group flex min-h-44 flex-col rounded-2xl border border-[#dce0e2] bg-white p-5 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <h3 className="text-xl font-black uppercase text-[#171717]">{region.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#565c60]">{region.body}</p>
                <span className="mt-auto pt-5 text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                  {region.cta}
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section id="destinations">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('destinations.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('destinations.title')}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#565c60]">{t('destinations.subtitle')}</p>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {REGION_FILTERS.map((region) => (
            <Link
              key={region}
              href={region === 'all' ? '/admissions#destinations' : `/admissions?region=${region}#destinations`}
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${
                activeRegion === region
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-[#dce0e2] bg-white text-[#565c60] hover:border-brand/45'
              }`}
            >
              {t(`regions.filters.${region}`)}
            </Link>
          ))}
        </div>
        {visibleCountries.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {visibleCountries.map((country) => (
            <div
              key={country.slug}
              className="group overflow-hidden rounded-md border border-[#dce0e2] bg-white transition hover:-translate-y-1 hover:border-[#315f9f]"
            >
              <div className="relative h-40 bg-[#050505]">
                {country.landmark.imagePath ? (
                  <Image
                    src={country.landmark.imagePath}
                    alt={t(`landmarks.${country.landmark.altKey}`)}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#171717,#050505)] p-5 text-center text-xs font-black uppercase tracking-[0.18em] text-brand">
                    {country.landmark.subject}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent" />
                <span className="absolute bottom-4 left-4 text-4xl" aria-hidden="true">{country.flag}</span>
              </div>
              <div className="flex min-h-72 flex-col p-5">
                <h3 className="text-2xl font-black uppercase text-[#171717]">{country.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#565c60]">{t(`countries.${country.slug}.short`)}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#565c60]">
                  {country.subregion} · {country.currencyCode}
                </p>
                <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
                  <Link
                    href={`/admissions/${country.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#17191c] px-3 py-2.5 text-xs font-semibold text-white"
                  >
                    {t('destinations.cta')}
                  </Link>
                  <Link
                    href={`/admissions/compare?countries=${country.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dce0e2] bg-[#050505] px-3 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#565c60] transition hover:border-brand/45"
                  >
                    {t('destinations.compareCta')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="rounded-2xl border border-[#dce0e2] bg-white p-6">
            <h3 className="text-2xl font-black uppercase text-[#171717]">{t('regions.emptyTitle')}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#565c60]">{t('regions.emptyBody')}</p>
            <div className="mt-5">
              <PrimaryLink href="/counselling?interest=global-admissions">{t('regions.emptyCta')}</PrimaryLink>
            </div>
          </div>
        )}
      </Section>

      <Section tinted lazy>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('studyPaths.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,4.6rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('studyPaths.title')}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#565c60]">{t('studyPaths.subtitle')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {studyPaths.map((pathway) => (
            <div key={pathway.title} className="rounded-2xl border border-[#dce0e2] bg-white p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#171717]">{pathway.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#565c60]">{pathway.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('choose.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('choose.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#565c60]">{t('choose.subtitle')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chooseItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#dce0e2] bg-white p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#171717]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#565c60]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('compare.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('whyCompare.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#565c60]">{t('whyCompare.subtitle')}</p>
          </div>
          <CompareTray
            countries={ADMISSION_COUNTRY_PROFILES}
            labels={{
              add: t('compare.add'),
              remove: t('compare.remove'),
              compare: t('compare.cta'),
              helper: t('compare.helper'),
            }}
          />
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('simplifiedJourney.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('simplifiedJourney.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {journey.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#dce0e2] bg-white p-4">
                <p className="text-xs font-black text-brand">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-3 text-sm font-black uppercase leading-5 tracking-[0.08em] text-[#171717]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="rounded-md border border-[#dce0e2] bg-white p-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('cta.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-[#171717] sm:text-5xl">{t('cta.simpleTitle')}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#565c60]">{t('cta.simpleBody')}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="/counselling">{t('cta.primary')}</PrimaryLink>
            <WhatsAppLink
              label={t('cta.whatsappLabel')}
              message={t('cta.whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#171717] transition hover:-translate-y-0.5 hover:bg-[#25D366]/24"
            >
              {t('cta.whatsapp')}
            </WhatsAppLink>
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
          <div><p className="text-xs font-bold tracking-[.2em] text-brand">ADMISSION JOURNEY</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[.88] tracking-[-.07em] text-[#10151c]">See the whole path before you begin.</h2><p className="mt-6 max-w-sm text-[#5f6975]">From the first question to the next practical step, the detailed journey remains available when you are ready to explore it.</p><Link href="/admission-journey" className="mt-7 inline-block border-b border-current pb-1 text-sm font-semibold text-brand">Explore the admission journey →</Link></div>
          <div className="border-l border-brand pl-6"><ol className="grid gap-4 text-lg font-semibold tracking-[-.03em] text-[#10151c]">{['Understand your goal', 'Explore courses and destinations', 'Shortlist realistic options', 'Review eligibility and requirements', 'Prepare applications and documents', 'Submit and track the admission process', 'Prepare for the next steps'].map((item, index) => <li key={item} className="flex gap-4 border-b border-[#d9dee5] pb-4"><span className="text-xs font-bold tracking-[.12em] text-brand">0{index + 1}</span>{item}</li>)}</ol></div>
        </div>
      </Section>

      <section className="bg-[#07111f] px-5 py-20 text-[#edf6ff] sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1280px]"><div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]"><div><p className="text-xs font-bold tracking-[.2em] text-[#75aaff]">PARTNER WITH SIVORA</p><h2 className="mt-5 text-[clamp(3rem,5vw,5.8rem)] font-semibold leading-[.88] tracking-[-.07em]">Support candidates, together.</h2></div><p className="max-w-2xl text-lg leading-8 text-[#b8c5d4]">Education consultants, counsellors, coaching centres, institutes, educators and suitable education organisations may eventually work with SIVORA to support candidates through an admission journey.</p></div><div className="mt-12 border-t border-white/20"><div className="grid gap-4 border-b border-white/20 py-7 sm:grid-cols-[48px_.6fr_1.4fr] sm:gap-7"><span className="text-xs text-[#8fa2ba]">01</span><h3 className="text-2xl font-semibold tracking-[-.045em]">CANDIDATE REFERRALS</h3><p className="text-sm leading-7 text-[#b8c5d4]">A partner may identify or refer a candidate; SIVORA may then support that candidate&apos;s admission journey.</p></div><div className="grid gap-4 border-b border-white/20 py-7 sm:grid-cols-[48px_.6fr_1.4fr] sm:gap-7"><span className="text-xs text-[#8fa2ba]">02</span><h3 className="text-2xl font-semibold tracking-[-.045em]">FUTURE TRACKING</h3><p className="text-sm leading-7 text-[#b8c5d4]">Approved partners may eventually track referrals through a future Partner Portal. Partner onboarding and the portal are Coming Soon.</p></div></div><div className="mt-9 border border-white/20 bg-white/5 p-6 text-sm leading-7 text-[#b8c5d4]">This is a future business proposition only. No partner account, dashboard, commission or payout system is currently operational.</div></div></section>

      <Section id="enquiry" tinted lazy>
        <div className="grid gap-10 border border-[#d9dee5] bg-white p-6 sm:p-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold tracking-[.2em] text-brand">START YOUR ADMISSION ENQUIRY</p><h2 className="mt-5 text-[clamp(2.8rem,5vw,5.5rem)] font-semibold leading-[.9] tracking-[-.065em] text-[#10151c]">Discuss your options with SIVORA.</h2><p className="mt-6 max-w-md text-[#5f6975]">If you are unsure about the right course, career direction or destination, start with Counselling & Career Guidance.</p><Link href="/counselling" className="mt-7 inline-block border-b border-current pb-1 text-sm font-semibold text-brand">Talk to SIVORA Counselling →</Link><WhatsAppLink label="Discuss your admission options" message="Hello SIVORA, I would like to discuss admission options." className="mt-6 flex w-fit items-center justify-center border border-[#25D366]/50 bg-[#25D366]/10 px-5 py-3 text-sm font-semibold text-[#176537]">Discuss your options</WhatsAppLink></div><div className={styles.form}><HomeLeadForm /></div></div>
      </Section>

      <Section lazy>
        <p className="mx-auto max-w-4xl border-l-2 border-brand bg-[#edf1f5] px-5 py-4 text-sm leading-7 text-[#5f6975]">SIVORA provides guidance and support. Eligibility and admission decisions are made by the relevant institutions; examination, recognition, visa and immigration requirements remain subject to the relevant authorities. Students should verify current official requirements.</p>
      </Section>

      <ProductFaqSection
        eyebrow={t('faq.eyebrow')}
        title={t('faq.title')}
        items={faqItems}
        tinted
      />

      <RelatedServicesSection
        eyebrow={t('related.eyebrow')}
        title={t('related.title')}
        items={relatedItems}
      />
    </div>
  );
}
