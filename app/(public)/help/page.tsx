import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, Card, PrimaryLink } from '@/components/public/ui';

export async function generateMetadata() {
  const t = await getTranslations('seo.help');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/help' });
}

type HelpSection = {
  id: string;
  title: string;
  intro: string;
  steps: string[];
  shot: string;
};

/**
 * Help & Support — simple, step-by-step guides (register → buy → take → results
 * → consultancy). Fully bilingual (content from the `help` namespace, read with
 * t.raw). Screenshots are placeholder frames for now — swap the caption boxes
 * for real images later without touching the copy.
 */
export default function HelpPage() {
  const t = useTranslations('help');
  const sections = t.raw('sections') as HelpSection[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Quick jump list */}
          <nav aria-label={t('eyebrow')} className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-textSecondary hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {s.title}
              </a>
            ))}
          </nav>

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-textPrimary sm:text-2xl">{s.title}</h2>
              <p className="mt-2 text-textSecondary">{s.intro}</p>

              <ol className="mt-4 space-y-3">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-textPrimary">
                      <span className="sr-only">
                        {t('stepLabel')} {i + 1}:{' '}
                      </span>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Screenshot placeholder — labelled frame until real images land. */}
              <figure className="mt-5">
                <div className="flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-6 text-center">
                  <span className="text-sm text-textSecondary">
                    <span className="mb-1 block font-semibold uppercase tracking-wide text-slate-400">
                      {t('screenshotLabel')}
                    </span>
                    {s.shot}
                  </span>
                </div>
              </figure>
            </section>
          ))}

          {/* Still need help? */}
          <Card className="text-center">
            <h2 className="text-lg font-bold text-textPrimary">{t('moreTitle')}</h2>
            <p className="mt-2 text-textSecondary">{t('moreText')}</p>
            <div className="mt-4 flex justify-center">
              <PrimaryLink href="/contact">{t('moreCta')}</PrimaryLink>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
