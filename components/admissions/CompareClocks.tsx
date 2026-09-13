'use client';

import { useEffect, useState } from 'react';
import type { AdmissionCountryProfile } from '@/lib/data/admissions/countries';
import { differenceText, getTimeParts, type TimezoneLabels } from './TimezonePanel';

export default function CompareClocks({
  countries,
  labels,
}: {
  countries: AdmissionCountryProfile[];
  labels: TimezoneLabels & {
    title: string;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labels.title}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ClockCard
          name={labels.india}
          zone="Asia/Kolkata"
          label={labels.indiaZone}
          zoneLabel={labels.indiaZone}
          mounted={mounted}
          loading={labels.loading}
        />
        {countries.map((country) => (
          <ClockCard
            key={country.slug}
            name={`${country.name} - ${country.timezone.labelCity}`}
            zone={country.timezone.iana}
            label={mounted ? differenceText(country.timezone.labelCity, country.timezone.iana, labels) : country.timezone.labelCity}
            zoneLabel={`${country.timezone.labelCity.toUpperCase()} LOCAL TIME`}
            mounted={mounted}
            loading={labels.loading}
          />
        ))}
      </div>
    </div>
  );
}

function ClockCard({
  name,
  zone,
  label,
  zoneLabel,
  mounted,
  loading,
}: {
  name: string;
  zone: string;
  label: string;
  zoneLabel?: string;
  mounted: boolean;
  loading: string;
}) {
  const time = mounted ? getTimeParts(zone) : null;

  return (
    <div className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{name}</p>
      <p className="mt-3 text-2xl font-black text-white">{time?.time ?? loading}</p>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#D1D1D1]">
        {time ? `${zoneLabel ?? zone} · ${time.date}` : label}
      </p>
      {mounted ? <p className="mt-3 text-xs font-bold leading-5 text-[#D1D1D1]">{label}</p> : null}
    </div>
  );
}
