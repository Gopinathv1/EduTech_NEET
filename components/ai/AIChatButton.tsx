'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AI_SUGGESTIONS, getMockAiResponse } from '@/lib/ai/mock-assistant';
import { isFloatingContactHiddenPath } from '@/lib/contact/whatsapp-enquiry';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

export default function AIChatButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi, I am Ask VV, an AI assistant preview. Choose a topic to get quick guidance from approved VV Overseas website information.',
    },
  ]);

  if (isFloatingContactHiddenPath(pathname)) return null;

  function ask(topic: string) {
    setMessages((current) => [
      ...current,
      { role: 'user', text: topic },
      { role: 'assistant', text: getMockAiResponse(topic) },
    ]);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex h-[min(34rem,calc(100vh-7rem))] w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-3xl border border-[#2b2b2b] bg-[#111111] shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-3 border-b border-[#2b2b2b] bg-[#050505] p-4">
            <div>
              <p className="text-sm font-black text-white">Ask VV - AI Assistant</p>
              <p className="mt-1 text-xs leading-5 text-[#d1d1d1]">Preview guidance. For final decisions, speak with our team.</p>
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
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-[#2b2b2b] p-3">
            <div className="grid grid-cols-2 gap-2">
              {AI_SUGGESTIONS.map((topic) => (
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
                    text: 'Chat cleared. Choose a topic to continue.',
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
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#D71920] text-white shadow-2xl shadow-black/40 transition hover:-translate-y-0.5 hover:bg-[#FF2B32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={open ? 'Close Ask VV AI assistant' : 'Open Ask VV AI assistant'}
        aria-expanded={open}
      >
        <ChatIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

function ChatIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H6l-4 3 1.4-5.1A8 8 0 1 1 21 12Z" />
      <path d="M8 11h8M8 15h5" />
      <path d="M10 7h4" />
    </svg>
  );
}
