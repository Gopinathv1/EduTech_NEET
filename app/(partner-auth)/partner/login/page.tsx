import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import PartnerLoginForm from '@/components/partner/forms/PartnerLoginForm';

export const dynamic = 'force-dynamic';

export default function PartnerLoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <PartnerLoginForm />
      </Suspense>
    </AuthShell>
  );
}
