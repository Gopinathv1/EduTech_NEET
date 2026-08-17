const MIN_WHATSAPP_DIGITS = 10;
const MAX_WHATSAPP_DIGITS = 15;

export type WhatsAppUrlResult =
  | { available: true; url: string; number: string }
  | { available: false; url: null; number: null };

export function sanitizeWhatsAppNumber(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  if (digits.length < MIN_WHATSAPP_DIGITS || digits.length > MAX_WHATSAPP_DIGITS) return null;
  return digits;
}

export function getConfiguredWhatsAppNumber(): string | null {
  return sanitizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
}

export function getWhatsAppUrl(message: string, number = getConfiguredWhatsAppNumber()): WhatsAppUrlResult {
  const sanitized = sanitizeWhatsAppNumber(number);
  if (!sanitized) return { available: false, url: null, number: null };

  const url = new URL(`https://wa.me/${sanitized}`);
  const trimmed = message.trim();
  if (trimmed) url.searchParams.set('text', trimmed);

  return { available: true, url: url.toString(), number: sanitized };
}
