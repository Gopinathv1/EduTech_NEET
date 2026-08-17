'use client';

import { useRouter } from 'next/navigation';
import { selectClass } from '@/components/ui/Form';

/** A select that navigates on change, preserving the given query params. Used for
 *  report sub-filters (e.g. payment status) alongside the date-range bar. */
export default function NavSelect({
  basePath,
  param,
  value,
  options,
  preserve = {},
  ariaLabel,
}: {
  basePath: string;
  param: string;
  value: string;
  options: { value: string; label: string }[];
  preserve?: Record<string, string>;
  ariaLabel?: string;
}) {
  const router = useRouter();
  function onChange(next: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preserve)) if (v) params.set(k, v);
    if (next) params.set(param, next);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }
  return (
    <select
      aria-label={ariaLabel ?? param}
      className={`${selectClass} !mt-0 py-1.5 text-sm`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
