/**
 * Pure state model for the exam UI. Kept free of React so the core invariants —
 * especially that switching language never disturbs the answers, palette, or the
 * current question — can be unit-tested directly.
 */

export type ExamLanguage = 'en' | 'ta' | 'hi';
export type ExamOption = 'A' | 'B' | 'C' | 'D';

/** Per-question local state, keyed by questionId in the reducer. */
export type AnswerState = {
  selectedOption: ExamOption | null;
  numericResponse?: number | null;
  markedForReview: boolean;
  visited: boolean;
};

export type ExamState = {
  lang: ExamLanguage;
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

export type ExamAction =
  | { type: 'SET_LANGUAGE'; lang: ExamLanguage }
  | { type: 'NAVIGATE'; index: number }
  | { type: 'VISIT'; questionId: string }
  | { type: 'SELECT_OPTION'; questionId: string; option: ExamOption }
  | { type: 'SET_NUMERIC_RESPONSE'; questionId: string; value: number }
  | { type: 'CLEAR'; questionId: string }
  | { type: 'TOGGLE_MARK'; questionId: string };

/** The four palette states a question can be in. */
export type PaletteStatus = 'not_visited' | 'unanswered' | 'answered' | 'marked' | 'answered_marked';

const EMPTY_ANSWER: AnswerState = { selectedOption: null, numericResponse: null, markedForReview: false, visited: false };

export function emptyAnswer(): AnswerState {
  return { ...EMPTY_ANSWER };
}

function withAnswer(
  state: ExamState,
  questionId: string,
  patch: Partial<AnswerState>,
): ExamState {
  const prev = state.answers[questionId] ?? emptyAnswer();
  return {
    ...state,
    answers: { ...state.answers, [questionId]: { ...prev, ...patch } },
  };
}

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    // Language is purely a rendering concern: it must not touch answers, the
    // palette, or which question is on screen.
    case 'SET_LANGUAGE':
      return state.lang === action.lang ? state : { ...state, lang: action.lang };

    case 'NAVIGATE':
      return state.currentIndex === action.index ? state : { ...state, currentIndex: action.index };

    case 'VISIT': {
      const prev = state.answers[action.questionId];
      if (prev?.visited) return state;
      return withAnswer(state, action.questionId, { visited: true });
    }

    case 'SELECT_OPTION':
      return withAnswer(state, action.questionId, { selectedOption: action.option, visited: true });

    case 'SET_NUMERIC_RESPONSE':
      return withAnswer(state, action.questionId, { selectedOption: null, numericResponse: action.value, visited: true });

    case 'CLEAR':
      return withAnswer(state, action.questionId, { selectedOption: null, numericResponse: null, visited: true });

    case 'TOGGLE_MARK': {
      const prev = state.answers[action.questionId] ?? emptyAnswer();
      return withAnswer(state, action.questionId, { markedForReview: !prev.markedForReview, visited: true });
    }

    default:
      return state;
  }
}

/** Map a question's answer state to its palette status. */
export function paletteStatus(a: AnswerState | undefined): PaletteStatus {
  if (!a || !a.visited) return 'not_visited';
  const answered = a.selectedOption != null || a.numericResponse != null;
  if (a.markedForReview) return answered ? 'answered_marked' : 'marked';
  if (answered) return 'answered';
  return 'unanswered';
}

export type PaletteCounts = {
  answered: number;
  unanswered: number;
  marked: number;
  notVisited: number;
};

/** Summary counts used by the palette legend and the submit confirmation dialog. */
export function summarize(questionIds: string[], answers: Record<string, AnswerState>): PaletteCounts {
  const counts: PaletteCounts = { answered: 0, unanswered: 0, marked: 0, notVisited: 0 };
  for (const id of questionIds) {
    switch (paletteStatus(answers[id])) {
      case 'answered':
        counts.answered++;
        break;
      case 'answered_marked':
        counts.answered++;
        counts.marked++;
        break;
      case 'marked':
        counts.marked++;
        break;
      case 'unanswered':
        counts.unanswered++;
        break;
      case 'not_visited':
        counts.notVisited++;
        break;
    }
  }
  return counts;
}
