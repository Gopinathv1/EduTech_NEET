import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import QuestionBankTabs from '@/components/admin/QuestionBankTabs';
import ChapterManager, { type ChapterRow } from '@/components/admin/ChapterManager';

export default async function SubjectsChaptersPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: { chapters: { orderBy: { order: 'asc' } } },
  });

  return (
    <div>
      <AdminPageHeader
        title="Subjects & Chapters"
        description="Manage the four NEET subjects and their chapters. Each subject's chapter weightages should total 100% for the random generator."
      />
      <QuestionBankTabs />

      <div className="space-y-6">
        {subjects.map((s) => {
          const rows: ChapterRow[] = s.chapters.map((c) => ({
            id: c.id,
            nameEn: localizedName(c.name, 'en'),
            nameTa: localizedName(c.name, 'ta'),
            class: c.class,
            weightage: c.weightage,
          }));
          return (
            <ChapterManager
              key={s.id}
              subjectId={s.id}
              subjectName={localizedName(s.name, 'en') || s.code}
              initialChapters={rows}
            />
          );
        })}
      </div>
    </div>
  );
}
