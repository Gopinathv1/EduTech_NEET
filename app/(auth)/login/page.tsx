import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <AuthShell>
      <LoginForm authError={error} />
    </AuthShell>
  );
}
