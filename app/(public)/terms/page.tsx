import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container } from '@/components/public/ui';

export async function generateMetadata() {
  const t = await getTranslations('seo.terms');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/terms' });
}

export default function TermsPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">SIVORA UP↑RISING</p>
        <h1 className="mt-3 text-3xl font-extrabold text-textPrimary">Terms & Conditions</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-textSecondary">
          <p>
            SIVORA UP↑RISING provides competitive-exam preparation tools including question practice, mock tests,
            explanations and progress review. NEET is the currently active exam category.
          </p>
          <p>
            Students are responsible for using the platform honestly and for keeping OTP-based account
            access secure. Test access, payments and result features are governed by the product flow
            shown at the time of use.
          </p>
          <p>
            Educational content is provided for practice and revision. SIVORA UP↑RISING does not guarantee exam
            ranks, admissions, selections or outcomes.
          </p>
        </div>
      </div>
    </Container>
  );
}
