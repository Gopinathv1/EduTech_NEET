'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
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
              <p className="text-sm font-black text-white">Ask SIVORA UPRISING - AI Assistant</p>
              <p className="mt-1 text-xs leading-5 text-[#d1d1d1]">Get instant answers in your language.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-sm font-bold text-[#d1d1d1] hover:bg-white/10"
              aria-label="Close AI assistant"
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
                    : 'ml-5 bg-[#D71920] text-white'
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
                className="min-w-0 flex-1 rounded-2xl border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-sm text-white outline-none placeholder:text-[#d1d1d1]/55 focus:border-[#D71920]"
                placeholder="Ask about NEET, admissions, tests..."
                aria-label="Ask SIVORA UPRISING AI a question"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[#D71920] px-4 py-2 text-xs font-black text-white transition hover:bg-[#FF2B32]"
              >
                Ask
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => ask(topic)}
                  className="rounded-2xl border border-[#2b2b2b] bg-[#050505] px-3 py-2 text-xs font-bold text-white transition hover:border-[#D71920] hover:bg-[#1a1a1a]"
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
              Clear Chat
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-[#FF2B32]/80 bg-[#050505] text-white shadow-[0_0_0_1px_rgba(255,43,50,0.25),0_0_34px_rgba(215,25,32,0.45)] transition hover:-translate-y-0.5 hover:border-[#FF2B32] hover:bg-[#130708] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={open ? 'Close Ask SIVORA UPRISING AI assistant' : 'Open Ask SIVORA UPRISING AI assistant'}
        aria-expanded={open}
        title="Ask SIVORA UPRISING AI"
      >
        <span className="absolute inset-0 rounded-full bg-[#D71920]/18 motion-safe:animate-ping" aria-hidden="true" />
        <RobotIcon className="relative h-7 w-7" />
        <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111111] px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-black/30 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          Ask SIVORA UPRISING AI
        </span>
      </button>
    </div>
  );
}

function HumanHandoff({ whatsappUrl }: { whatsappUrl: string | null }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-white">Talk to our team</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-black text-white">
            WhatsApp Us
          </a>
        ) : null}
        <Link href="/#callback" className="rounded-full bg-[#D71920] px-3 py-1.5 text-xs font-black text-white">
          Request Counselling
        </Link>
        <Link href="/contact" className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-black text-white">
          Contact Us
        </Link>
      </div>
    </div>
  );
}

function RobotIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.5v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 8.2h9.6a3.2 3.2 0 0 1 3.2 3.2v4.2a4.9 4.9 0 0 1-4.9 4.9H8.9A4.9 4.9 0 0 1 4 15.6v-4.2a3.2 3.2 0 0 1 3.2-3.2Z" fill="#D71920" />
      <path d="M7.2 8.2h9.6a3.2 3.2 0 0 1 3.2 3.2v4.2a4.9 4.9 0 0 1-4.9 4.9H8.9A4.9 4.9 0 0 1 4 15.6v-4.2a3.2 3.2 0 0 1 3.2-3.2Z" stroke="white" strokeWidth="1.2" />
      <circle cx="9" cy="13.2" r="1.2" fill="white" />
      <circle cx="15" cy="13.2" r="1.2" fill="white" />
      <path d="M9.4 16.5c1.7 1 3.5 1 5.2 0" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 5.7h8" stroke="#FF2B32" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
