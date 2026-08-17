import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import TestForm from '@/components/admin/TestForm';

export default async function NewTestPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: { chapters: { orderBy: { order: 'asc' } } },
  });
  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: localizedName(s.name) || s.code,
    chapters: s.chapters.map((c) => ({ id: c.id, name: localizedName(c.name) })),
  }));

  return (
    <div>
      <AdminPageHeader title="New test" description="Build a fixed or random test." />
      <TestForm subjects={subjectOptions} />
    </div>
  );
}
