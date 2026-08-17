import { getTranslations } from 'next-intl/server';
import { localizedName } from '@/lib/admin/format';
import { LEAD_STUDENT_STEPS, leadStudentStepIndex, type BudgetRange } from '@/lib/admission/config';
import type { ExamLanguage } from '@/lib/attempts/examState';
import type { StudentLeadView } from '@/lib/admission/leads';

/** The student's read-only view of their admission request: a 3-step tracker plus
 *  the details they submitted. Bilingual. */
export default async function LeadStatusCard({ lead, locale }: { lead: StudentLeadView; locale: ExamLanguage }) {
  const t = await getTranslations('consultancy');
  const currentStep = leadStudentStepIndex(lead.status);
  const closed = lead.status === 'CLOSED';

  const dateStr = lead.createdAt.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const details: { label: string; value: string }[] = [
    { label: t('status.neetScore'), value: lead.neetScore != null ? String(lead.neetScore) : t('status.notProvided') },
    { label: t('status.marks'), value: lead.marks != null ? String(lead.marks) : t('status.notProvided') },
    { label: t('status.category'), value: lead.category ?? t('status.notProvided') },
    { label: t('status.budget'), value: lead.budget ? t(`budgets.${lead.budget as BudgetRange}`) : t('status.notProvided') },
    {
      label: t('status.countries'),
      value:
        lead.countries.map((c) => localizedName(c.name, locale) || localizedName(c.name, 'en')).join(', ') ||
        t('status.notProvided'),
    },
    { label: t('status.parentContact'), value: lead.parentContact ? `+91 ${lead.parentContact}` : t('status.notProvided') },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{t('status.heading')}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            lead.status === 'CONVERTED'
              ? 'bg-green-100 text-green-700'
              : closed
                ? 'bg-slate-100 text-slate-500'
                : 'bg-brand-soft text-brand'
          }`}
        >
          {t(`status.statusLabel.${lead.status}`)}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{t('status.submittedOn', { date: dateStr })}</p>

      {/* 3-step tracker */}
      <ol className="mt-5 flex items-center">
        {LEAD_STUDENT_STEPS.map((step, i) => {
          const reached = i <= currentStep && !closed;
          const isLast = i === LEAD_STUDENT_STEPS.length - 1;
          return (
            <li key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    reached ? 'bg-brand text-white' : 'border border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`mt-1 text-[11px] ${reached ? 'font-semibold text-brand' : 'text-slate-400'}`}>
                  {t(`status.steps.${step}`)}
                </span>
              </div>
              {!isLast ? <span className={`mx-2 h-0.5 flex-1 ${i < currentStep && !closed ? 'bg-brand' : 'bg-slate-200'}`} /> : null}
            </li>
          );
        })}
      </ol>

      {/* Submitted details */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">{t('status.detailsHeading')}</h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-sm text-slate-500">{d.label}</dt>
              <dd className="text-sm font-medium text-slate-800">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-5 rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-xs text-brand">
        {t('status.contactNote')}
      </p>
    </section>
  );
}
