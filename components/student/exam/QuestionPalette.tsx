'use client';

import { useTranslations } from 'next-intl';
import { paletteStatus, type AnswerState, type PaletteStatus } from '@/lib/attempts/examState';

/**
 * The question palette: a grid of numbered cells coloured by state (not visited /
 * unanswered / answered / marked for review) with jump navigation, plus a legend.
 */

const STATUS_ICON: Record<PaletteStatus, string> = { answered: '✓', marked: '⚑', answered_marked: '✓⚑', unanswered: '–', not_visited: '·' };

const STATUS_CLASS: Record<PaletteStatus, string> = {
  answered: 'bg-green-600 text-white border-green-600',
  marked: 'bg-purple-800 text-white border-purple-400',
  answered_marked: 'bg-purple-800 text-white border-green-400 border-2',
  unanswered: 'bg-orange-950 text-orange-100 border-orange-500',
  not_visited: 'bg-surfaceElevated text-slate-400 border-border',
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
    { status: 'answered_marked', label: t('legendAnsweredMarked') },
    { status: 'not_visited', label: t('legendNotVisited') },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-textPrimary">{t('palette')}</h2>
      <ul className="mt-3 grid max-h-[45vh] grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-5">
        {questionIds.map((id, index) => {
          const status = paletteStatus(answers[id]);
          const isCurrent = index === currentIndex;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-label={`${index + 1}: ${legend.find(l => l.status === status)?.label}`}
                title={legend.find(l => l.status === status)?.label}
                aria-current={isCurrent ? 'true' : undefined}
                className={`flex h-10 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${STATUS_CLASS[status]} ${
                  isCurrent ? 'ring-2 ring-brand ring-offset-1' : ''
                }`}
              >
                {index + 1}<span aria-hidden="true" className="ml-0.5 text-[10px]">{STATUS_ICON[status]}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="mt-4 space-y-1.5">
        {legend.map((l) => (
          <li key={l.status} className="flex items-center gap-2 text-xs text-textSecondary">
            <span aria-hidden="true" className={`inline-flex h-5 w-7 items-center justify-center rounded border text-[10px] ${STATUS_CLASS[l.status]}`}>{STATUS_ICON[l.status]}</span>
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
