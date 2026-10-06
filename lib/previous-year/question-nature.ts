import { z } from 'zod';

export const QUESTION_NATURES = ['CONCEPTUAL_THEORY', 'NUMERICAL_PROBLEM_SOLVING'] as const;
export const questionNatureSchema = z.enum(QUESTION_NATURES);
export type QuestionNature = z.infer<typeof questionNatureSchema>;
export const QUESTION_NATURE_LABELS: Record<QuestionNature, string> = {
  CONCEPTUAL_THEORY: 'Conceptual / Theory',
  NUMERICAL_PROBLEM_SOLVING: 'Numerical / Problem-solving',
};

export function natureStartUrl(testId: string, nature?: QuestionNature | null) {
  return `/student/tests/${testId}/start${nature ? `?nature=${nature}` : ''}`;
}
