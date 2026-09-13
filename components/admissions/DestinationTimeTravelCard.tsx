'use client';

import { useEffect, useState } from 'react';
import type { AdmissionCountryProfile } from '@/lib/data/admissions/countries';
import { differenceText, getTimeParts, type TimezoneLabels } from './TimezonePanel';

export default function DestinationTimeTravelCard({
  country,
  labels,
}: {
  country: AdmissionCountryProfile;
  labels: TimezoneLabels & {
    title: string;
    from: string;
    to: string;
    airport: string;
    approxTravel: string;
    route: string;
    details: string;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const india = mounted ? getTimeParts('Asia/Kolkata') : null;
  const destination = mounted ? getTimeParts(country.timezone.iana) : null;
  const diff = mounted ? differenceText(country.timezone.labelCity, country.timezone.iana, labels) : labels.loading;
  const destinationTimeLabel = `${country.timezone.labelCity.toUpperCase()} LOCAL TIME`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#111111] shadow-2xl shadow-black/10">
      <div className="grid gap-px bg-[#2B2B2B] md:grid-cols-2">
        <div className="bg-[#050505] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">{labels.india}</p>
          <p className="mt-3 text-4xl font-black text-white">{india?.time ?? labels.loading}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">
            {india ? `${labels.indiaZone} · ${india.date}` : labels.destinationFallback}
          </p>
        </div>
        <div className="bg-[#050505] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">{country.timezone.labelCity}</p>
          <p className="mt-3 text-4xl font-black text-white">{destination?.time ?? labels.loading}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">
            {destination ? `${destinationTimeLabel} · ${destination.date}` : labels.destinationFallback}
          </p>
        </div>
      </div>

      <div className="border-y border-[#2B2B2B] bg-brand-soft px-5 py-4 text-center">
        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{diff}</p>
        {country.timezone.note ? <p className="mt-2 text-xs leading-5 text-[#D1D1D1]">{country.timezone.note}</p> : null}
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labels.title}</p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A9A9A9]">{labels.from}</p>
              <p className="mt-1 text-lg font-black uppercase text-white">Delhi</p>
            </div>
            <span className="text-2xl text-brand" aria-hidden="true">-&gt;</span>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A9A9A9]">{labels.to}</p>
              <p className="mt-1 text-lg font-black uppercase text-white">{country.travel.mainAirport.city}</p>
            </div>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
            <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">{labels.airport}</dt>
            <dd className="mt-2 text-sm font-black uppercase leading-5 text-white">
              {country.travel.mainAirport.code} · {country.travel.mainAirport.name}
            </dd>
          </div>
          <div className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
            <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">{labels.approxTravel}</dt>
            <dd className="mt-2 text-sm font-black uppercase leading-5 text-white">{country.travel.typicalDuration}</dd>
          </div>
          <div className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
            <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">{labels.route}</dt>
            <dd className="mt-2 text-sm font-black uppercase leading-5 text-white">{country.travel.flightType}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
