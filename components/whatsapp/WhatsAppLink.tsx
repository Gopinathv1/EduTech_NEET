import type { ReactNode } from 'react';
import { getWhatsAppUrl } from '@/lib/whatsapp';

type WhatsAppLinkProps = {
  label: string;
  message: string;
  className?: string;
  children?: ReactNode;
};

export default function WhatsAppLink({ label, message, className = '', children }: WhatsAppLinkProps) {
  const result = getWhatsAppUrl(message);
  if (!result.available) return null;

  return (
    <a href={result.url} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children ?? label}
    </a>
  );
}
