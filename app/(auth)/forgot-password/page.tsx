import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Reset your password</h1>
          <p className="mt-1 text-sm text-textSecondary">
            Secure email password reset tokens are supported in the database, but email sending is not configured yet.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surfaceElevated px-3 py-2 text-sm text-textSecondary">
          Ask the SIVORA team to configure an email provider before enabling password-reset links.
        </div>
        <Link href="/login" className="block text-center font-semibold text-brand hover:text-accent">
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
