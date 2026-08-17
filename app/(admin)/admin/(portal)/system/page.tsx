import { requireAdminPage } from '@/lib/auth/admin';
import { getSettings } from '@/lib/settings/service';
import { AdminPageHeader } from '@/components/admin/ui';
import SystemConfig from '@/components/admin/system/SystemConfig';

export default async function SystemConfigPage() {
  await requireAdminPage({ superOnly: true });
  const settings = await getSettings();
  return (
    <div>
      <AdminPageHeader title="System Configuration" description="Platform-wide settings. Changes take effect immediately." />
      <SystemConfig initial={settings} />
    </div>
  );
}
