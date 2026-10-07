import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, Card } from '@/components/public/ui';
import ContactForm from '@/components/public/ContactForm';
import { PhoneIcon, MapPinIcon, ClockIcon } from '@/components/public/icons';
import { getConfiguredWhatsAppNumber, getWhatsAppUrl } from '@/lib/whatsapp';

export async function generateMetadata() {
  const t = await getTranslations('seo.contact');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/contact' });
}

export default function ContactPage() {
  const t = useTranslations('contact');

  const number = getConfiguredWhatsAppNumber();
  const support = getWhatsAppUrl('Hello SIVORA, I have a general enquiry.');
  const rows = [
    ...(number ? [{ Icon: PhoneIcon, label: 'WhatsApp', value: `+${number}`, href: support.url }] : []),
    { Icon: MapPinIcon, label: t('info.addressLabel'), value: t('info.address') },
    { Icon: ClockIcon, label: t('info.hoursLabel'), value: t('info.hours') },
  ];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr,1.3fr]">
          {/* Info */}
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">{t('infoTitle')}</h2>
            <ul className="mt-5 space-y-4">
              {rows.map((r) => (
                <li key={r.label} className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <r.Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-textSecondary">{r.label}</p>
                    {'href' in r && r.href ? <a className="text-brand underline" href={r.href} target="_blank" rel="noopener noreferrer">{r.value}</a> : <p className="text-textPrimary">{r.value}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-textPrimary">{t('formTitle')}</h2>
            <p className="mt-1 text-sm text-textSecondary">{t('formSubtitle')}</p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
