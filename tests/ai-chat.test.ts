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
      'JEE Preparation',
      'MBBS Abroad',
      'Engineering Abroad',
      'Study in Europe',
      'AI Courses',
      'Live Courses',
      'Student Life Abroad',
      'Part-Time Work Rules',
      'Admission Guidance',
      'Talk to Counsellor',
    ]);
  });

  it('answers expanded service prompts without making guarantees', () => {
    expect(getMockAiResponse('NEET Preparation')).toContain('mock tests');
    expect(getMockAiResponse('JEE Preparation')).toContain('Mathematics');
    expect(getMockAiResponse('Can I study engineering in Germany?')).toContain('Admission is not guaranteed');
    expect(getMockAiResponse('Do you teach AI?')).toContain('AI Foundations');
    const admissions = getMockAiResponse('Admissions');
    expect(admissions).toContain('guidance');
    expect(admissions).not.toMatch(/guarantee|guaranteed/i);
    const work = getMockAiResponse('Can I work part-time while studying abroad?');
    expect(work).toContain('depend on');
    expect(work).not.toMatch(/guaranteed salary|guaranteed jobs/i);
  });

  it('returns localized welcome/suggestions and grounded fallback behavior', () => {
    expect(getAiWelcomeMessage('ta')).toContain('வணக்கம்');
    expect(getLocalizedAiSuggestions('hi')).toContain('NEET तैयारी');
    expect(hasGroundedAiAnswer('scholarship deadline')).toBe(false);
    expect(getMockAiResponse('scholarship deadline')).toContain("don't have enough verified");
    expect(getMockAiResponse('JEE Preparation', 'hi')).toContain('JEE Preparation');
  });
});
