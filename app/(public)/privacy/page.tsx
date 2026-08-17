import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container } from '@/components/public/ui';

export async function generateMetadata() {
  const t = await getTranslations('seo.privacy');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/privacy' });
}

export default function PrivacyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">VV Overseas</p>
        <h1 className="mt-3 text-3xl font-extrabold text-textPrimary">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-textSecondary">
          <p>
            VV Overseas collects account details such as name, email, mobile number, school information,
            preferred language and test activity to provide registration, OTP login, practice, results
            and support workflows.
          </p>
          <p>
            Secrets such as OTP provider keys, database credentials and JWT signing keys are handled
            server-side and are not exposed to the browser.
          </p>
          <p>
            We use student activity to show attempts, scores and progress. We do not publish personal
            performance information publicly.
          </p>
        </div>
      </div>
    </Container>
  );
}
