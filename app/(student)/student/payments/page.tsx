import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import StudentHeader from '@/components/student/StudentHeader';
import { DownloadIcon } from '@/components/admin/icons';

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'bg-green-950/40 text-green-200',
  CREATED: 'bg-surfaceElevated text-textSecondary',
  FAILED: 'bg-red-950/40 text-red-200',
  REFUNDED: 'bg-amber-100 text-amber-100',
};

export default async function StudentPaymentsPage() {
  const session = await getSession();
  const locale = (await getLocale()) as 'en' | 'ta';
  const t = await getTranslations('payments.history');

  const payments = session
    ? await prisma.payment.findMany({
        where: { studentId: session.sub },
        orderBy: { createdAt: 'desc' },
        include: { test: { select: { id: true, title: true } } },
      })
    : [];

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-textPrimary">{t('title')}</h1>
        <p className="mt-1 text-textSecondary">{t('subtitle')}</p>

        {payments.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border bg-surfaceElevated p-10 text-center text-textSecondary">
            {t('empty')}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
                  <th className="px-4 py-3 font-medium">{t('colTest')}</th>
                  <th className="px-3 py-3 font-medium">{t('colDate')}</th>
                  <th className="px-3 py-3 font-medium">{t('colAmount')}</th>
                  <th className="px-3 py-3 font-medium">{t('colStatus')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('colInvoice')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {localizedName(p.test.title, locale) || localizedName(p.test.title, 'en')}
                    </td>
                    <td className="px-3 py-3 text-textSecondary">
                      {p.createdAt.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-3 text-textSecondary">₹{p.amount}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? STATUS_COLOR.CREATED}`}
                      >
                        {t(`status.${p.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'SUCCESS' && p.invoiceNumber ? (
                        <a
                          href={`/api/payments/${p.id}/invoice`}
                          className="inline-flex items-center gap-1 text-brand hover:text-red-200"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          {t('download')}
                        </a>
                      ) : p.status === 'FAILED' ? (
                        <Link
                          href={`/student/tests/${p.test.id}/checkout`}
                          className="text-brand hover:text-red-200"
                        >
                          {t('retry')}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
