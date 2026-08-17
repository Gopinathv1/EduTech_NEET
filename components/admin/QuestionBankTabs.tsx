'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/question-bank', label: 'Questions' },
  { href: '/admin/question-bank/subjects', label: 'Subjects & Chapters' },
  { href: '/admin/question-bank/bulk-upload', label: 'Bulk upload' },
];

export default function QuestionBankTabs() {
  const pathname = usePathname();
  const isSubjects = pathname.startsWith('/admin/question-bank/subjects');
  const isBulk = pathname.startsWith('/admin/question-bank/bulk-upload');

  function active(href: string) {
    if (href.endsWith('/subjects')) return isSubjects;
    if (href.endsWith('/bulk-upload')) return isBulk;
    return !isSubjects && !isBulk; // Questions (list/new/edit)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            active(t.href)
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
