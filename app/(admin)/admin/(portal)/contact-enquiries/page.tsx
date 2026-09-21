import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { AdminCard, AdminPageHeader, Badge } from '@/components/admin/ui';
import ContactStatusSelect from '@/components/admin/ContactStatusSelect';
import { getWhatsAppUrl } from '@/lib/whatsapp';

const statuses = ['ALL', 'NEW', 'RESPONDED', 'CLOSED'] as const;

export default async function ContactEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage();
  const requested = (await searchParams).status;
  const status = statuses.includes(requested as typeof statuses[number]) ? requested : 'ALL';
  const enquiries = await prisma.contactEnquiry.findMany({ where: status !== 'ALL' ? { status: status as 'NEW' | 'RESPONDED' | 'CLOSED' } : undefined, orderBy: { createdAt: 'desc' }, take: 200 });
  return <div><AdminPageHeader title="Lead Inbox" description="Callback and contact enquiries requiring follow-up." /><div className="mb-5 flex flex-wrap gap-2">{statuses.map((item) => <a key={item} href={item === 'ALL' ? '/admin/contact-enquiries' : `/admin/contact-enquiries?status=${item}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${status === item ? 'border-brand bg-brand text-white' : 'border-border text-textSecondary'}`}>{item === 'ALL' ? 'All' : item}</a>)}</div><div className="space-y-3">{enquiries.map((lead) => { const whatsapp = getWhatsAppUrl(`Hello SIVORA, I am following up on enquiry from ${lead.name}.`); return <AdminCard key={lead.id} className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-textPrimary">{lead.name}</p><p className="text-sm text-textSecondary">{lead.mobile}{lead.email ? ` · ${lead.email}` : ''}</p><p className="mt-2 whitespace-pre-wrap text-sm text-textSecondary">{lead.message}</p></div><div className="flex shrink-0 flex-col items-start gap-2 sm:items-end"><Badge color={lead.status === 'NEW' ? 'blue' : lead.status === 'CLOSED' ? 'slate' : 'green'}>{lead.status}</Badge><ContactStatusSelect id={lead.id} initial={lead.status} /><time className="text-xs text-textSecondary" dateTime={lead.createdAt.toISOString()}>{lead.createdAt.toLocaleString('en-IN')}</time><div className="flex gap-2 text-xs"><a className="text-brand underline" href={`tel:${lead.mobile}`}>Call</a>{whatsapp.url ? <a className="text-brand underline" href={whatsapp.url} target="_blank" rel="noreferrer">WhatsApp</a> : null}</div></div></div></AdminCard>; })}{enquiries.length === 0 ? <AdminCard><p className="text-sm text-textSecondary">No enquiries in this view.</p></AdminCard> : null}</div></div>;
}
