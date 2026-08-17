import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { parseRange, dateKey, parsePage, totalPages } from '@/lib/admin/reports/util';
import ReportScaffold, { ReportTable } from '@/components/admin/reports/ReportScaffold';
import NavSelect from '@/components/admin/reports/NavSelect';
import Pager from '@/components/admin/Pager';
import { Badge } from '@/components/admin/ui';
import type { PaymentStatus } from '@prisma/client';

type SP = Record<string, string | string[] | undefined>;

const STATUS_BADGE: Record<string, string> = { SUCCESS: 'green', CREATED: 'slate', FAILED: 'red', REFUNDED: 'amber' };
const STATUSES = ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'];

export default async function PaymentReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };
  const status = STATUSES.includes(g('status')) ? g('status') : '';
  const { page, skip, take, perPage } = parsePage(g('page'), 25);

  const where = {
    createdAt: { gte: range.from, lte: range.to },
    ...(status ? { status: status as PaymentStatus } : {}),
  };
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { student: { select: { name: true, mobile: true } }, test: { select: { title: true } } },
    }),
    prisma.payment.count({ where }),
  ]);

  const baseQuery = new URLSearchParams({ from: initial.from, to: initial.to, ...(status ? { status } : {}) }).toString();

  return (
    <ReportScaffold
      title="Payment Report"
      description="Every transaction with its status."
      basePath="/admin/reports/payments"
      exportPath="/api/admin/reports/payments"
      initial={initial}
      extra={status ? { status } : {}}
      filterSlot={
        <NavSelect
          basePath="/admin/reports/payments"
          param="status"
          value={status}
          preserve={{ from: initial.from, to: initial.to }}
          ariaLabel="Status"
          options={[
            { value: '', label: 'All statuses' },
            { value: 'CREATED', label: 'Pending' },
            { value: 'SUCCESS', label: 'Paid' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'REFUNDED', label: 'Refunded' },
          ]}
        />
      }
    >
      <ReportTable
        columns={[
          { label: 'Date' },
          { label: 'Student' },
          { label: 'Test' },
          { label: 'Amount', align: 'right' },
          { label: 'Status' },
          { label: 'Invoice' },
        ]}
        rows={payments.map((p) => [
          p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          <span key="s">
            <span className="block font-medium text-slate-900">{p.student.name}</span>
            <span className="block text-xs text-slate-500">+91 {p.student.mobile}</span>
          </span>,
          localizedName(p.test.title, 'en'),
          `₹${p.amount}`,
          <Badge key="b" color={STATUS_BADGE[p.status] ?? 'slate'}>
            {p.status}
          </Badge>,
          p.invoiceNumber ?? '—',
        ])}
      />
      <Pager basePath="/admin/reports/payments" baseQuery={baseQuery} page={page} totalPages={totalPages(total, perPage)} total={total} />
    </ReportScaffold>
  );
}
