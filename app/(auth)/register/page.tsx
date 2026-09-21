import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';
import { safeAuthReturnPath } from '@/lib/auth/redirect';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[]; next?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.callbackUrl ?? params.next;
  const callbackUrl = safeAuthReturnPath(Array.isArray(raw) ? raw[0] : raw);
  return (
    <AuthShell>
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
