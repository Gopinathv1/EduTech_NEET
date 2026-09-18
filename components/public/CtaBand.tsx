import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Container } from './ui';

/** Deep-blue call-to-action band reused at the bottom of most pages. */
export default function CtaBand() {
  const t = useTranslations('site.cta');
  return (
    <section className="border-y border-[#d2c9bd] bg-[#17191c]">
      <Container className="py-12 text-center sm:py-16">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t('title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[#b8b5af]">{t('subtitle')}</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="w-full rounded-md bg-[#f5f1e9] px-6 py-3 text-center text-sm font-semibold text-[#171613] transition-colors hover:bg-[#e6edf7] sm:w-auto"
          >
            {t('register')}
          </Link>
          <Link
            href="/contact"
            className="w-full rounded-lg border border-white/70 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-surfaceElevated/10 sm:w-auto"
          >
            {t('contact')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
