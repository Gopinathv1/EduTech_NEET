'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  setFontScale,
  setContrast,
  type FontScale,
  type Contrast,
} from '@/lib/a11y';

/**
 * Accessibility menu: Large Font + High Contrast toggles. Mirrors the
 * LanguageSwitcher pattern — a server action writes the cookie, then a refresh
 * re-renders the tree so the root layout re-stamps <html> with the new
 * data-attributes (which drive the CSS in globals.css). Persists per device for
 * a year.
 *
 * The current state is read from the <html data-font-scale/data-contrast>
 * attributes the root layout already stamps, so this works whether it is
 * rendered by a server header (StudentHeader) or a client header (PublicHeader)
 * — no need to thread props through client boundaries. The optional props seed
 * the initial render to avoid any flash when they are available server-side.
 */
export default function AccessibilityMenu({
  fontScale: initialFont,
  contrast: initialContrast,
}: {
  fontScale?: FontScale;
  contrast?: Contrast;
} = {}) {
  const t = useTranslations('a11y');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fontScale, setFont] = useState<FontScale>(initialFont ?? 'normal');
  const [contrast, setContrastState] = useState<Contrast>(initialContrast ?? 'normal');
  const ref = useRef<HTMLDivElement>(null);

  // Sync from the attributes the root layout stamps on <html> (covers client
  // headers with no props, and keeps state correct after a refresh).
  useEffect(() => {
    const el = document.documentElement;
    setFont(el.dataset.fontScale === 'large' ? 'large' : 'normal');
    setContrastState(el.dataset.contrast === 'high' ? 'high' : 'normal');
  }, []);

  // Close on outside click / Escape (keyboard-friendly).
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const largeOn = fontScale === 'large';
  const contrastOn = contrast === 'high';

  function toggleFont() {
    const next: FontScale = largeOn ? 'normal' : 'large';
    setFont(next);
    // Apply immediately for instant feedback; the refresh re-confirms from cookie.
    document.documentElement.dataset.fontScale = next;
    startTransition(async () => {
      await setFontScale(next);
      router.refresh();
    });
  }
  function toggleContrast() {
    const next: Contrast = contrastOn ? 'normal' : 'high';
    setContrastState(next);
    document.documentElement.dataset.contrast = next;
    startTransition(async () => {
      await setContrast(next);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('menuLabel')}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {/* Universal-access glyph (decorative; button is labelled). */}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
          <path d="M12 2a2 2 0 110 4 2 2 0 010-4zm8 5.5a1 1 0 01-.7 1.22L15 9.9V22a1 1 0 11-2 0v-5h-2v5a1 1 0 11-2 0V9.9L4.7 8.72A1 1 0 015.2 6.8L9.8 8h4.4l4.6-1.2a1 1 0 011.2.7z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('menuLabel')}
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('menuLabel')}
          </p>
          <ToggleRow
            label={t('largeFont')}
            hint={t('largeFontHint')}
            on={largeOn}
            disabled={isPending}
            onToggle={toggleFont}
          />
          <ToggleRow
            label={t('highContrast')}
            hint={t('highContrastHint')}
            on={contrastOn}
            disabled={isPending}
            onToggle={toggleContrast}
          />
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-3 rounded-lg px-1 py-2 text-left hover:bg-slate-50 disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          on ? 'bg-brand' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
