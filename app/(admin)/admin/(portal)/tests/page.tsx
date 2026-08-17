import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader, Badge, PrimaryButtonLink } from '@/components/admin/ui';
import TestPublishButton from '@/components/admin/TestPublishButton';
import { EditIcon } from '@/components/admin/icons';

const TYPE_LABEL: Record<string, string> = {
  FULL_TEST: 'Full',
  MINI_TEST: 'Mini',
  CHAPTER_TEST: 'Chapter',
  SUBJECT_TEST: 'Subject',
  YEAR_PATTERN: 'Year',
};

export default async function TestsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <div>
      <AdminPageHeader
        title="Tests"
        description="Create and manage mock tests. Published tests appear in the student catalogue."
        actions={<PrimaryButtonLink href="/admin/tests/new">New test</PrimaryButtonLink>}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Mode</th>
              <th className="px-3 py-3 font-medium">Qs</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-textSecondary">
                  No tests yet. Create your first test.
                </td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={t.id} className="border-b border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-textPrimary">{localizedName(t.title) || '(untitled)'}</p>
                    {t.availableLanguages.length > 1 ? (
                      <p className="text-xs text-textSecondary">EN · TA</p>
                    ) : (
                      <p className="text-xs text-textSecondary">EN</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-textSecondary">{TYPE_LABEL[t.testType] ?? t.testType}</td>
                  <td className="px-3 py-3 text-textSecondary">{t.isRandom ? 'Random' : 'Fixed'}</td>
                  <td className="px-3 py-3 text-textSecondary">{t.totalQuestions}</td>
                  <td className="px-3 py-3 text-textSecondary">₹{t.price}</td>
                  <td className="px-3 py-3">
                    {t.isPublished ? <Badge color="green">Published</Badge> : <Badge color="slate">Draft</Badge>}
                  </td>
                  <td className="px-3 py-3 text-textSecondary">{t._count.attempts}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start justify-end gap-3">
                      <Link
                        href={`/admin/tests/${t.id}`}
                        className="inline-flex items-center gap-1 pt-2 text-brand hover:text-red-200"
                      >
                        <EditIcon className="h-4 w-4" />
                        Edit
                      </Link>
                      <TestPublishButton id={t.id} isPublished={t.isPublished} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
