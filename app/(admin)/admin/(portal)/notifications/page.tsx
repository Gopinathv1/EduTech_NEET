import { prisma } from '@/lib/prisma';
import { requireAdminPage } from '@/lib/auth/admin';
import { localizedName } from '@/lib/admin/format';
import { notificationStyle } from '@/lib/notifications/types';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import NotificationComposer from '@/components/admin/notifications/NotificationComposer';

const TYPE_LABEL: Record<string, string> = {
  NEW_MOCK_TEST: 'New mock test',
  RESULT: 'Result',
  OFFER: 'Offer',
  COUNSELLING: 'Counselling',
  ADMISSION_ALERT: 'Admission alert',
  PAYMENT_CONFIRMATION: 'Payment',
};

function audienceLabel(n: { targetClass: string | null; targetDistrict: string | null; targetBoard: string | null }): string {
  if (n.targetClass) return `Class ${n.targetClass}`;
  if (n.targetDistrict) return n.targetDistrict;
  if (n.targetBoard) return n.targetBoard;
  return 'All students';
}

export default async function AdminNotificationsPage() {
  await requireAdminPage();

  const history = await prisma.notification.findMany({
    where: { studentId: null, targetAudience: { in: ['ALL', 'STUDENTS'] } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      targetClass: true,
      targetDistrict: true,
      targetBoard: true,
      deliveredCount: true,
      createdByName: true,
      createdAt: true,
      _count: { select: { reads: true } },
    },
  });

  return (
    <div>
      <AdminPageHeader title="Notifications" description="Compose bilingual notifications for students and review what you've sent." />

      <NotificationComposer />

      <section className="mt-8">
        <h2 className="text-base font-semibold text-slate-900">Sent history</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Notification</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Audience</th>
                <th className="px-3 py-3 font-medium">Delivered</th>
                <th className="px-3 py-3 font-medium">Read</th>
                <th className="px-3 py-3 font-medium">Sent by</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No notifications sent yet.
                  </td>
                </tr>
              ) : (
                history.map((n) => {
                  const delivered = n.deliveredCount ?? 0;
                  const read = n._count.reads;
                  const pct = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
                  return (
                    <tr key={n.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span aria-hidden="true">{notificationStyle(n.type).icon}</span>
                          <span className="font-medium text-slate-900">{localizedName(n.title, 'en')}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge color="slate">{TYPE_LABEL[n.type] ?? n.type}</Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{audienceLabel(n)}</td>
                      <td className="px-3 py-3 text-slate-700">{delivered}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {read} <span className="text-xs text-slate-400">· {pct}%</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{n.createdByName ?? <span className="text-slate-400">System</span>}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {n.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
