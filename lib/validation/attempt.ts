import { z } from 'zod';

/** Zod schemas for the test-engine (attempt) API. Run on the server. */

export const attemptLanguageSchema = z.enum(['en', 'ta']);
export const answerOptionSchema = z.enum(['A', 'B', 'C', 'D']);

export const startAttemptSchema = z.object({
  testId: z.string().min(1),
  language: attemptLanguageSchema,
});

/**
 * A single autosave action against one question. `timeSpentDelta` is the seconds
 * spent on that question since the last save (added server-side, never trusted as
 * an absolute). Bounded to a sane range to reject a tampered client.
 */
export const answerActionSchema = z.object({
  questionId: z.string().min(1),
  action: z.enum(['answer', 'clear', 'mark', 'unmark', 'visit']),
  selectedOption: answerOptionSchema.optional(),
  timeSpentDelta: z.number().int().min(0).max(24 * 3600).optional(),
});

export const switchLanguageSchema = z.object({ language: attemptLanguageSchema });

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type AnswerActionInput = z.infer<typeof answerActionSchema>;
export type SwitchLanguageInput = z.infer<typeof switchLanguageSchema>;
