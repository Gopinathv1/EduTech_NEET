import { describe, expect, it } from 'vitest';
import {
  buildGeneralWhatsAppMessage,
  buildDefaultWhatsAppMessage,
  buildPartnerWhatsAppMessage,
  buildStudentWhatsAppMessage,
  isWhatsAppButtonHiddenPath,
} from '@/lib/contact/whatsapp-enquiry';

describe('floating WhatsApp enquiry helpers', () => {
  it('hides only on active mock-test attempt pages', () => {
    expect(isWhatsAppButtonHiddenPath('/student/tests/test-1/attempt')).toBe(true);
  });

  it('shows on public and non-exam student pages', () => {
    expect(isWhatsAppButtonHiddenPath('/')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/admin')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/admin/students')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/partner')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/partner/profile')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/partners')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/student')).toBe(false);
    expect(isWhatsAppButtonHiddenPath('/student/tests/test-1')).toBe(false);
  });

  it('builds a student/parent message without sensitive data', () => {
    const message = buildStudentWhatsAppMessage('NEET Preparation', '/mock-tests');
    expect(message).toContain('NEET Preparation');
    expect(message).toContain('Current page: /mock-tests');
    expect(message).not.toMatch(/password|otp|jwt|database|payment id/i);
  });

  it('builds a B2B partner message with placeholders', () => {
    const message = buildPartnerWhatsAppMessage('School', '/partners');
    expect(message).toContain('SIVORA Partner Team');
    expect(message).toContain('Organisation type: School.');
    expect(message).toContain('Organisation: ____.');
  });

  it('builds a general enquiry message', () => {
    expect(buildGeneralWhatsAppMessage('/contact')).toContain('general enquiry');
  });

  it('builds the default direct WhatsApp message requested by the client', () => {
    const message = buildDefaultWhatsAppMessage('/contact');
    expect(message).toContain('education, competitive exam preparation and admission guidance services');
    expect(message).toContain('Current page: /contact');
  });
});
