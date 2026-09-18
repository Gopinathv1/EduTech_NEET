'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { buildDefaultWhatsAppMessage } from '@/lib/contact/whatsapp-enquiry';
import {
  getAiClearMessage,
  getAiWelcomeMessage,
  getLocalizedAiSuggestions,
  getMockAiResponse,
  hasGroundedAiAnswer,
} from '@/lib/ai/mock-assistant';
import { isFloatingContactHiddenPath } from '@/lib/contact/whatsapp-enquiry';
import { getWhatsAppUrl } from '@/lib/whatsapp';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
  needsHandoff?: boolean;
};

export default function AIChatButton() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('aiChat');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: getAiWelcomeMessage(locale),
    },
  ]);

  if (isFloatingContactHiddenPath(pathname)) return null;

  const suggestions = getLocalizedAiSuggestions(locale);
  const whatsapp = getWhatsAppUrl(buildDefaultWhatsAppMessage(pathname));

  function ask(topic: string) {
    const question = topic.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      {
        role: 'assistant',
        text: getMockAiResponse(question, locale),
        needsHandoff: !hasGroundedAiAnswer(question),
      },
    ]);
    setInput('');
  }

  function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex h-[min(38rem,calc(100vh-7rem))] w-[min(calc(100vw-2rem),25rem)] flex-col overflow-hidden rounded-3xl border border-[#2b2b2b] bg-[#111111] shadow-2xl shadow-black/55">
          <div className="flex items-start justify-between gap-3 border-b border-[#2b2b2b] bg-[#050505] p-4">
            <div>
              <p className="text-sm font-black text-white">{t('title')}</p>
              <p className="mt-1 text-xs leading-5 text-[#d1d1d1]">{t('subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-sm font-bold text-[#d1d1d1] hover:bg-white/10"
              aria-label={t('close')}
            >
              X
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'mr-5 bg-[#1a1a1a] text-[#f5f5f5]'
                    : 'ml-5 bg-[#315f9f] text-white'
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                {message.needsHandoff ? <HumanHandoff whatsappUrl={whatsapp.available ? whatsapp.url : null} /> : null}
              </div>
            ))}
          </div>

          <div className="border-t border-[#2b2b2b] p-3">
            <form onSubmit={submitQuestion} className="mb-3 flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-[#d2c9bd] bg-[#f5f1e9] px-3 py-2 text-sm text-[#171613] outline-none placeholder:text-[#6e685f]/70 focus:border-[#315f9f]"
                placeholder={t('placeholder')}
                aria-label={t('inputLabel')}
              />
              <button
                type="submit"
                className="rounded-md bg-[#17191c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#315f9f]"
              >
                {t('ask')}
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => ask(topic)}
                  className="rounded-md border border-[#d2c9bd] bg-[#f5f1e9] px-3 py-2 text-xs font-semibold text-[#171613] transition hover:border-[#315f9f] hover:bg-[#e6edf7]"
                >
                  {topic}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    role: 'assistant',
                    text: getAiClearMessage(locale),
                  },
                ])
              }
              className="mt-3 w-full rounded-2xl px-3 py-2 text-xs font-bold text-[#d1d1d1] hover:bg-white/5"
            >
              {t('clear')}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-[#315f9f] bg-[#17191c] text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#315f9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={open ? t('closeFloating') : t('openFloating')}
        aria-expanded={open}
        title={t('tooltip')}
      >
        <span className="absolute inset-0 rounded-full bg-[#315f9f]/15 motion-safe:animate-ping" aria-hidden="true" />
        <RobotIcon className="relative h-7 w-7" />
        <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111111] px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-black/30 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          {t('tooltip')}
        </span>
      </button>
    </div>
  );
}

function HumanHandoff({ whatsappUrl }: { whatsappUrl: string | null }) {
  const t = useTranslations('aiChat.handoff');

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-white">{t('title')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-black text-white">
            {t('whatsapp')}
          </a>
        ) : null}
        <Link href="/counselling" className="rounded-full bg-[#D71920] px-3 py-1.5 text-xs font-black text-white">
          {t('counselling')}
        </Link>
        <Link href="/contact" className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-black text-white">
          {t('contact')}
        </Link>
      </div>
    </div>
  );
}

function RobotIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.5v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 8.2h9.6a3.2 3.2 0 0 1 3.2 3.2v4.2a4.9 4.9 0 0 1-4.9 4.9H8.9A4.9 4.9 0 0 1 4 15.6v-4.2a3.2 3.2 0 0 1 3.2-3.2Z" fill="#315f9f" />
      <path d="M7.2 8.2h9.6a3.2 3.2 0 0 1 3.2 3.2v4.2a4.9 4.9 0 0 1-4.9 4.9H8.9A4.9 4.9 0 0 1 4 15.6v-4.2a3.2 3.2 0 0 1 3.2-3.2Z" stroke="white" strokeWidth="1.2" />
      <circle cx="9" cy="13.2" r="1.2" fill="white" />
      <circle cx="15" cy="13.2" r="1.2" fill="white" />
      <path d="M9.4 16.5c1.7 1 3.5 1 5.2 0" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 5.7h8" stroke="#8fb1da" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
