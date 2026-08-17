import { requireAdminPage } from '@/lib/auth/admin';
import { ComingSoon } from '@/components/admin/ui';

// Super-admin-only (middleware guards /admin/super/*; re-checked here).
export default async function SuperAdminPage() {
  await requireAdminPage({ superOnly: true });
  return (
    <ComingSoon
      title="System Configuration"
      description="Super-admin-only area for managing admins, access logs and system settings. Coming in a later phase."
    />
  );
}
