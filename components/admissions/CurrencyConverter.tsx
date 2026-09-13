'use client';

import { useMemo, useState } from 'react';
import type { FxRate } from '@/lib/admission/fx';

export default function CurrencyConverter({
  currencyCode,
  fxRate,
  labels,
}: {
  currencyCode: string;
  fxRate?: FxRate;
  labels: {
    amountLabel: string;
    unavailable: string;
    indicative: string;
    source: string;
    lastUpdated: string;
  };
}) {
  const [amount, setAmount] = useState('100000');
  const numericAmount = Number(amount.replace(/,/g, ''));
  const canConvert = Number.isFinite(numericAmount) && numericAmount >= 0 && Boolean(fxRate?.inrToQuote);

  const converted = useMemo(() => {
    if (!canConvert || !fxRate?.inrToQuote) return labels.unavailable;
    return `${Math.round(numericAmount * fxRate.inrToQuote).toLocaleString('en-IN')} ${currencyCode}`;
  }, [canConvert, currencyCode, fxRate?.inrToQuote, labels.unavailable, numericAmount]);
  const hasRate = Boolean(fxRate?.inrToQuote);

  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labels.indicative}</p>
      <label htmlFor={`fx-${currencyCode}`} className="mt-5 block text-xs font-black uppercase tracking-[0.16em] text-[#D1D1D1]">
        {labels.amountLabel}
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id={`fx-${currencyCode}`}
          type="number"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-base font-bold text-white outline-none transition focus:border-brand"
        />
        <div className="min-h-12 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-base font-black text-white sm:min-w-56">
          {converted}
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-[#D1D1D1]">
        {hasRate
          ? `${labels.source}: ${fxRate?.providerName}. ${labels.lastUpdated}: ${fxRate?.lastUpdated}.`
          : labels.unavailable}
      </p>
    </div>
  );
}
