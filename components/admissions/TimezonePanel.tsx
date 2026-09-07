'use client';

import { useEffect, useMemo, useState } from 'react';

function getTimeParts(timeZone: string) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);

  return {
    time: parts
      .filter((part) => part.type === 'hour' || part.type === 'minute' || part.type === 'dayPeriod' || part.type === 'literal')
      .map((part) => part.value)
      .join('')
      .trim(),
    zone: parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone,
  };
}

function offsetMinutes(timeZone: string) {
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

function differenceText(destinationName: string, destinationTimeZone: string) {
  const diff = offsetMinutes(destinationTimeZone) - offsetMinutes('Asia/Kolkata');
  if (diff === 0) return `${destinationName} matches IST`;

  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const chunks = [hours ? `${hours}h` : '', minutes ? `${minutes}m` : ''].filter(Boolean).join(' ');
  return `${destinationName} is ${chunks} ${diff > 0 ? 'ahead of' : 'behind'} IST`;
}

export default function TimezonePanel({
  destinationName,
  destinationTimeZone,
  labelCity,
  note,
}: {
  destinationName: string;
  destinationTimeZone: string;
  labelCity: string;
  note?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const india = useMemo(() => getTimeParts('Asia/Kolkata'), [tick]);
  const destination = useMemo(() => getTimeParts(destinationTimeZone), [destinationTimeZone, tick]);
  const diff = useMemo(() => differenceText(destinationName, destinationTimeZone), [destinationName, destinationTimeZone, tick]);

  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">India</p>
          <p className="mt-3 text-2xl font-black text-white">{india.time}</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">{india.zone}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{labelCity}</p>
          <p className="mt-3 text-2xl font-black text-white">{destination.time}</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D1D1D1]">{destination.zone}</p>
        </div>
      </div>
      <p className="mt-5 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
        {diff}
      </p>
      {note ? <p className="mt-3 text-xs leading-5 text-[#D1D1D1]">{note}</p> : null}
    </div>
  );
}
