import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Container } from './ui';

/** Deep-blue call-to-action band reused at the bottom of most pages. */
export default function CtaBand() {
  const t = useTranslations('site.cta');
  return (
    <section className="bg-brand">
      <Container className="py-12 text-center sm:py-16">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t('title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-100">{t('subtitle')}</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="w-full rounded-lg bg-white px-6 py-3 text-center text-sm font-semibold text-brand transition-colors hover:bg-blue-50 sm:w-auto"
          >
            {t('register')}
          </Link>
          <Link
            href="/contact"
            className="w-full rounded-lg border border-white/70 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            {t('contact')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
