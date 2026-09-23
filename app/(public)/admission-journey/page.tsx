import Image from 'next/image';
import JourneyExperience from '@/components/public/JourneyExperience';
import styles from '@/components/public/RouteExperience.module.css';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { admissionJourneySteps } from '@/data/admission-journey';
import { pageMetadata } from '@/lib/seo';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { Container, Section } from '@/components/public/ui';
import ExploreSivora from '@/components/public/ExploreSivora';

export async function generateMetadata() {
  const t = await getTranslations('seo.admissionJourney');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/admission-journey',
  });
}

export default function AdmissionJourneyPage() {
  const t = useTranslations('admissionJourney');
  const intro = t.raw('intro') as string[];

  return (
    <div className={`${styles.page} ${styles.compactPage}`}>
      <section className="border-b border-[#deded9] bg-[#f7f7f5] py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-[1280px]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">
              {t('eyebrow')}
            </p>
            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,6vw,7rem)] font-semibold uppercase leading-[0.9] text-[#171717]">
              {t('heroTitle')}
            </h1>
            <div className="mt-7 max-w-4xl space-y-4 text-base leading-8 text-[#6b6b67] sm:text-lg">
              {intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section><JourneyExperience /></Section>
      <Section lazy>
        <div className="mx-auto max-w-[1280px] divide-y divide-[#dce0e2]">
          {admissionJourneySteps.map((step) => (
            <section
              key={step.id}
              id={step.id}
              className="scroll-mt-28 grid gap-8 py-8 md:grid-cols-[0.8fr_1.2fr]"
            >
              {step.image ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-[#050505]">
                  <Image
                    src={step.image.src}
                    alt={t(`steps.${step.id}.alt`)}
                    fill
                    sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="p-5 sm:p-6">
                <p className="text-sm font-black text-brand-light">{step.number}</p>
                <h2 className="mt-3 text-2xl font-black uppercase leading-tight text-[#171717]">
                  {t(`steps.${step.id}.title`)}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#565c60]">{t(`steps.${step.id}.description`)}</p>
                {step.id === 'visa-guidance' ? (
                  <p className="mt-4 border-l border-[#315f9f]/40 bg-[#e6edf7] p-3 text-xs leading-6 text-[#6e685f]">
                    {t('visaDisclosure')}
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="mx-auto max-w-[1280px] rounded-md border border-[#dce0e2] bg-white p-6 sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-light">{t('cta.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#171717] sm:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#565c60]">
              {t('cta.body')}
            </p>
            <p className="mt-5 border-l border-[#315f9f]/40 bg-[#e6edf7] p-4 text-xs leading-6 text-[#6e685f]">
              {t('cta.disclaimer')}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href="/counselling"
              className="inline-flex items-center justify-center rounded-md bg-[#17191c] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#315f9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f9f]"
            >
              {t('cta.primary')}
            </Link>
            <WhatsAppLink
              label={t('cta.whatsappLabel')}
              message={t('cta.whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#171717] transition hover:-translate-y-0.5 hover:bg-[#25D366]/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('cta.whatsapp')}
            </WhatsAppLink>
          </div>
        </div>
      </Section>

      <ExploreSivora exclude={['admissions']} />
    </div>
  );
}
