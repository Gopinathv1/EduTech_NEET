'use client';

import { useEffect, useState } from 'react';

export type TimezoneLabels = {
  india: string;
  indiaZone: string;
  destinationFallback: string;
  matchesIst: string;
  aheadOfIst: string;
  behindIst: string;
  loading: string;
};

export function getTimeParts(timeZone: string) {
  const date = new Date();
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);

  return {
    time: time.replace(/\s?(am|pm)$/i, (period) => period.toUpperCase()),
    date: formattedDate.replace(/(\w{3}) (\d{2})-(\w{3})/, '$1, $2 $3'),
    zone: timeZone,
  };
}

export function offsetMinutes(timeZone: string) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function differenceText(destinationName: string, destinationTimeZone: string, labels: TimezoneLabels) {
  const diff = offsetMinutes(destinationTimeZone) - offsetMinutes('Asia/Kolkata');
  if (diff === 0) return `${destinationName} ${labels.matchesIst}`;

  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const chunks = [hours ? `${hours}h` : '', minutes ? `${minutes}m` : ''].filter(Boolean).join(' ');
  return `${destinationName} ${chunks} ${diff > 0 ? labels.aheadOfIst : labels.behindIst}`;
}

export default function TimezonePanel({
  destinationName,
  destinationTimeZone,
  labelCity,
  note,
  labels,
}: {
  destinationName: string;
  destinationTimeZone: string;
  labelCity: string;
  note?: string;
  labels: TimezoneLabels;
}) {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {[labels.india, labelCity].map((label) => (
            <div key={label}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{label}</p>
              <p className="mt-3 text-2xl font-black text-white">{labels.loading}</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">{labels.destinationFallback}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const india = getTimeParts('Asia/Kolkata');
  const destination = getTimeParts(destinationTimeZone);
  const diff = differenceText(destinationName, destinationTimeZone, labels);
  const destinationTimeLabel = `${labelCity.toUpperCase()} LOCAL TIME`;

  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labels.india}</p>
          <p className="mt-3 text-2xl font-black text-white">{india.time}</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">{labels.indiaZone} · {india.date}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labelCity}</p>
          <p className="mt-3 text-2xl font-black text-white">{destination.time}</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">{destinationTimeLabel} · {destination.date}</p>
        </div>
      </div>
      <p className="mt-5 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
        {diff}
      </p>
      {note ? <p className="mt-3 text-xs leading-5 text-[#D1D1D1]">{note}</p> : null}
    </div>
  );
}
