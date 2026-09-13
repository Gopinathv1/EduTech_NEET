import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';
import { safeReturnPath } from '@/lib/auth/redirect';

type Props = {
  searchParams: Promise<{ error?: string | string[]; callbackUrl?: string | string[]; next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const rawReturnTo = params.callbackUrl ?? params.next;
  const callbackUrl = safeReturnPath(Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo);

  return (
    <AuthShell>
      <LoginForm authError={error} callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
