'use client';

import { useState } from 'react';
import { Badge } from '@/components/admin/ui';
import { budgetLabelEn } from '@/lib/admission/config';
import LeadDrawer from './LeadDrawer';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  IN_PROGRESS: 'In progress',
  CONVERTED: 'Converted',
  CLOSED: 'Closed',
};
const STATUS_BADGE: Record<string, string> = {
  NEW: 'blue',
  CONTACTED: 'amber',
  IN_PROGRESS: 'amber',
  CONVERTED: 'green',
  CLOSED: 'slate',
};

export type LeadRow = {
  id: string;
  studentName: string;
  mobile: string;
  country: string;
  budget: string | null;
  neetScore: number | null;
  status: string;
  assignedTo: string | null;
  createdAt: string; // ISO
};

export default function LeadsTable({ leads, admins }: { leads: LeadRow[]; admins: { id: string; name: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-3 py-3 font-medium">Country</th>
              <th className="px-3 py-3 font-medium">Score</th>
              <th className="px-3 py-3 font-medium">Budget</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No leads match these filters.
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setOpenId(l.id)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{l.studentName}</p>
                    <p className="text-xs text-slate-500">+91 {l.mobile}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{l.country || '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{l.neetScore ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{budgetLabelEn(l.budget)}</td>
                  <td className="px-3 py-3">
                    <Badge color={STATUS_BADGE[l.status] ?? 'slate'}>{STATUS_LABEL[l.status] ?? l.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{l.assignedTo ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeadDrawer leadId={openId} admins={admins} onClose={() => setOpenId(null)} />
    </>
  );
}
