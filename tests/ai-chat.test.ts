import { describe, expect, it } from 'vitest';
import { AI_SUGGESTIONS, getMockAiResponse } from '@/lib/ai/mock-assistant';

describe('mock AI assistant layer', () => {
  it('exposes the requested initial suggestions', () => {
    expect(AI_SUGGESTIONS).toEqual([
      'NEET Preparation',
      'Admissions',
      'MBBS Abroad',
      'Mock Tests',
      'Counselling',
      'Contact Support',
    ]);
  });

  it('answers NEET and admissions prompts without making guarantees', () => {
    expect(getMockAiResponse('NEET Preparation')).toContain('mock tests');
    const admissions = getMockAiResponse('Admissions');
    expect(admissions).toContain('guidance');
    expect(admissions).not.toMatch(/guarantee|guaranteed/i);
  });
});
