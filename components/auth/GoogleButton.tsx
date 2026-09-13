'use client';

import { signIn } from 'next-auth/react';

export default function GoogleButton({ label }: { label: string }) {
  function startGoogle() {
    void signIn('google', {
      callbackUrl: '/api/auth/google/finish',
    });
  }

  return (
    <button
      type="button"
      onClick={startGoogle}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surfaceElevated px-4 py-2.5 text-base font-semibold text-textPrimary transition-colors hover:border-brand hover:text-brand"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
        G
      </span>
      {label}
    </button>
  );
}
