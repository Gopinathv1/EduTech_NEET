'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiPatch } from '@/lib/client/api';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnPrimary, btnSecondary, Badge } from '@/components/admin/ui';

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

export default function AdminManager({ admins, currentAdminId }: { admins: AdminRow[]; currentAdminId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function create() {
    setBusy(true);
    setMsg(null);
    const res = await apiPost('/api/admin/admins', form);
    setBusy(false);
    if (res.ok) {
      setForm({ name: '', email: '', password: '', role: 'ADMIN' });
      setMsg({ kind: 'ok', text: 'Admin created.' });
      router.refresh();
    } else {
      setMsg({ kind: 'err', text: res.error === 'emailTaken' ? 'That email is already in use.' : 'Could not create admin.' });
    }
  }

  async function setRole(id: string, role: string) {
    const res = await apiPatch(`/api/admin/admins/${id}`, { role });
    if (res.ok) router.refresh();
    else setMsg({ kind: 'err', text: 'Could not change role.' });
  }
  async function setActive(id: string, isActive: boolean) {
    const res = await apiPatch(`/api/admin/admins/${id}`, { isActive });
    if (res.ok) router.refresh();
    else setMsg({ kind: 'err', text: 'Could not update status.' });
  }
  async function resetPassword(id: string, name: string) {
    const password = window.prompt(`New password for ${name} (min 8 characters):`);
    if (!password) return;
    const res = await apiPost(`/api/admin/admins/${id}/reset-password`, { password });
    setMsg(res.ok ? { kind: 'ok', text: `Password reset for ${name}.` } : { kind: 'err', text: 'Password must be at least 8 characters.' });
  }

  const canSubmit = form.name.trim() && form.email.trim() && form.password.length >= 8;

  return (
    <div>
      {/* Create */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Add an admin</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={`${inputClass} !mt-0 text-sm`} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={`${inputClass} !mt-0 text-sm`} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={`${inputClass} !mt-0 text-sm`} type="password" placeholder="Password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className={`${selectClass} !mt-0 text-sm`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        {msg ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>
        ) : null}
        <button type="button" className={`${btnPrimary} mt-4`} onClick={create} disabled={busy || !canSubmit}>
          {busy ? 'Creating…' : 'Create admin'}
        </button>
      </div>

      {/* List */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === currentAdminId;
              return (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {a.name}
                      {isSelf ? <span className="ml-2 text-xs text-slate-400">(you)</span> : null}
                    </p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className={`${selectClass} !mt-0 py-1 text-xs`}
                      value={a.role}
                      onChange={(e) => setRole(a.id, e.target.value)}
                      disabled={isSelf}
                      aria-label="Role"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    {a.isActive ? <Badge color="green">Active</Badge> : <Badge color="red">Inactive</Badge>}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={`${btnSecondary} !px-2 !py-1 text-xs`} onClick={() => resetPassword(a.id, a.name)}>
                        Reset password
                      </button>
                      {a.isActive ? (
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                          onClick={() => setActive(a.id, false)}
                          disabled={isSelf}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg border border-green-300 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                          onClick={() => setActive(a.id, true)}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
