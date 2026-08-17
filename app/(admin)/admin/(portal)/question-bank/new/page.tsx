import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import QuestionForm from '@/components/admin/QuestionForm';

export default async function NewQuestionPage() {
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
      <AdminPageHeader title="New question" description="Add a question to the bank." />
      <QuestionForm subjects={subjectOptions} />
    </div>
  );
}
