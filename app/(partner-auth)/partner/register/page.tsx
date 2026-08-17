import AuthShell from '@/components/auth/AuthShell';
import PartnerRegisterForm from '@/components/partner/forms/PartnerRegisterForm';

export default function PartnerRegisterPage() {
  return (
    <AuthShell>
      <PartnerRegisterForm />
    </AuthShell>
  );
}
