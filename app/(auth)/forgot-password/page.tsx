import AuthShell from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/PasswordResetForms';

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Reset your password</h1>
          <p className="mt-1 text-sm text-textSecondary">Enter both details exactly as registered.</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}
