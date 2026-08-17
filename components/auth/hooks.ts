'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Returns a function that maps an API/validation error CODE to localised text. */
export function useErrorText() {
  const t = useTranslations('auth.errors');
  return useCallback(
    (code?: string) => t(code && code.length ? code : 'generic'),
    [t],
  );
}

/** A simple seconds countdown, used to throttle the "Resend OTP" button. */
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((from: number) => {
    setSeconds(from);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return { seconds, start };
}
