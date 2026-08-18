import { describe, expect, it } from 'vitest';
import {
  AI_SUGGESTIONS,
  getAiWelcomeMessage,
  getLocalizedAiSuggestions,
  getMockAiResponse,
  hasGroundedAiAnswer,
} from '@/lib/ai/mock-assistant';

describe('mock AI assistant layer', () => {
  it('exposes the requested initial suggestions', () => {
    expect(AI_SUGGESTIONS).toEqual([
      'NEET Preparation',
      'Mock Tests',
      'MBBS Abroad',
      'Admission Guidance',
      'Counselling',
      'Partner With Us',
      'Talk on WhatsApp',
    ]);
  });

  it('answers NEET and admissions prompts without making guarantees', () => {
    expect(getMockAiResponse('NEET Preparation')).toContain('mock tests');
    const admissions = getMockAiResponse('Admissions');
    expect(admissions).toContain('guidance');
    expect(admissions).not.toMatch(/guarantee|guaranteed/i);
  });

  it('returns localized welcome/suggestions and grounded fallback behavior', () => {
    expect(getAiWelcomeMessage('ta')).toContain('வணக்கம்');
    expect(getLocalizedAiSuggestions('hi')).toContain('NEET तैयारी');
    expect(hasGroundedAiAnswer('scholarship deadline')).toBe(false);
    expect(getMockAiResponse('scholarship deadline')).toContain('not have enough verified');
  });
});
