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

const FX_PROVIDER_URL =
  process.env.SIVORA_FX_PROVIDER_URL ??
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.min.json';

function unavailableRate(code: string, now: string): FxRate {
  return {
    base: 'INR',
    quote: code,
    inrToQuote: null,
    quoteToInr: null,
    source: 'unavailable',
    providerName: 'FX provider unavailable',
    lastUpdated: now,
    stale: true,
  };
}

export async function getIndicativeFxRates(currencyCodes: string[]): Promise<Record<string, FxRate>> {
  const uniqueCodes = Array.from(new Set(currencyCodes.filter((code) => code !== 'INR')));
  const now = new Date().toISOString();

  try {
    const res = await fetch(FX_PROVIDER_URL, {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        date?: string;
        inr?: Record<string, number>;
      };
      if (data.inr) {
        return Object.fromEntries(
          uniqueCodes.map((code) => {
            const inrToQuote = data.inr?.[code.toLowerCase()] ?? null;
            return [
              code,
              inrToQuote
                ? {
                    base: 'INR',
                    quote: code,
                    inrToQuote,
                    quoteToInr: 1 / inrToQuote,
                    source: 'provider',
                    providerName: 'fawazahmed0 currency-api via jsDelivr',
                    lastUpdated: data.date ?? now,
                    stale: false,
                  }
                : unavailableRate(code, now),
            ];
          }),
        );
      }
    }
  } catch {
    // Development and static-build fallback below.
  }

  return Object.fromEntries(uniqueCodes.map((code) => [code, unavailableRate(code, now)]));
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
