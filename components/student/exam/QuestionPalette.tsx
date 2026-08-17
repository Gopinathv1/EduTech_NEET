'use client';

import { useTranslations } from 'next-intl';
import { paletteStatus, type AnswerState, type PaletteStatus } from '@/lib/attempts/examState';

/**
 * The question palette: a grid of numbered cells coloured by state (not visited /
 * unanswered / answered / marked for review) with jump navigation, plus a legend.
 */

const STATUS_CLASS: Record<PaletteStatus, string> = {
  answered: 'bg-green-600 text-white border-green-600',
  marked: 'bg-amber-500 text-white border-amber-500',
  unanswered: 'bg-white text-slate-700 border-slate-300',
  not_visited: 'bg-slate-100 text-slate-400 border-slate-200',
};

export default function QuestionPalette({
  questionIds,
  answers,
  currentIndex,
  onJump,
}: {
  questionIds: string[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  const t = useTranslations('exam.ui');

  const legend: { status: PaletteStatus; label: string }[] = [
    { status: 'answered', label: t('legendAnswered') },
    { status: 'unanswered', label: t('legendUnanswered') },
    { status: 'marked', label: t('legendMarked') },
    { status: 'not_visited', label: t('legendNotVisited') },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">{t('palette')}</h2>
      <ul className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-5">
        {questionIds.map((id, index) => {
          const status = paletteStatus(answers[id]);
          const isCurrent = index === currentIndex;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-current={isCurrent ? 'true' : undefined}
                className={`flex h-10 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${STATUS_CLASS[status]} ${
                  isCurrent ? 'ring-2 ring-brand ring-offset-1' : ''
                }`}
              >
                {index + 1}
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="mt-4 space-y-1.5">
        {legend.map((l) => (
          <li key={l.status} className="flex items-center gap-2 text-xs text-slate-600">
            <span className={`inline-block h-4 w-4 rounded border ${STATUS_CLASS[l.status]}`} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
