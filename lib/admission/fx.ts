export type FxRate = {
  base: 'INR';
  quote: string;
  inrToQuote: number | null;
  quoteToInr: number | null;
  source: 'provider' | 'development_fallback' | 'unavailable';
  providerName: string;
  lastUpdated: string;
  stale: boolean;
};

const FALLBACK_RATES: Record<string, number> = {
  RUB: 0.94,
  GEL: 0.031,
  VND: 290.1,
  AMD: 4.56,
  UZS: 146.8,
  KGS: 1.03,
  TJS: 0.11,
  KZT: 6.34,
};

export async function getIndicativeFxRates(currencyCodes: string[]): Promise<Record<string, FxRate>> {
  const uniqueCodes = Array.from(new Set(currencyCodes.filter((code) => code !== 'INR')));
  const now = new Date().toISOString();

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        result?: string;
        provider?: string;
        time_last_update_utc?: string;
        rates?: Record<string, number>;
      };
      if (data.result === 'success' && data.rates) {
        return Object.fromEntries(
          uniqueCodes.map((code) => {
            const inrToQuote = data.rates?.[code] ?? null;
            return [
              code,
              {
                base: 'INR',
                quote: code,
                inrToQuote,
                quoteToInr: inrToQuote ? 1 / inrToQuote : null,
                source: inrToQuote ? 'provider' : 'unavailable',
                providerName: data.provider ?? 'open.er-api.com',
                lastUpdated: data.time_last_update_utc ?? now,
                stale: !inrToQuote,
              },
            ];
          }),
        );
      }
    }
  } catch {
    // Development and static-build fallback below.
  }

  return Object.fromEntries(
    uniqueCodes.map((code) => {
      const inrToQuote = FALLBACK_RATES[code] ?? null;
      return [
        code,
        {
          base: 'INR',
          quote: code,
          inrToQuote,
          quoteToInr: inrToQuote ? 1 / inrToQuote : null,
          source: inrToQuote ? 'development_fallback' : 'unavailable',
          providerName: inrToQuote ? 'Static development fallback' : 'No FX provider configured',
          lastUpdated: now,
          stale: true,
        },
      ];
    }),
  );
}

export function formatFx(rate: FxRate | undefined) {
  if (!rate?.quoteToInr || !rate.inrToQuote) {
    return {
      oneUnitInr: 'Not currently available',
      oneLakh: 'Not currently available',
    };
  }

  return {
    oneUnitInr: `1 ${rate.quote} ≈ ₹${rate.quoteToInr.toLocaleString('en-IN', {
      maximumFractionDigits: rate.quoteToInr < 1 ? 4 : 2,
    })}`,
    oneLakh: `₹1,00,000 ≈ ${Math.round(100000 * rate.inrToQuote).toLocaleString('en-IN')} ${rate.quote}`,
  };
}
