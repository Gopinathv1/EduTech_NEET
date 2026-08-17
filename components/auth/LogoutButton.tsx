'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';

/** Clears the session then returns to the public home page. */
export default function LogoutButton() {
  const t = useTranslations('nav');
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await apiPost('/api/auth/logout');
    window.location.href = '/';
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
    >
      {t('logout')}
    </button>
  );
}
