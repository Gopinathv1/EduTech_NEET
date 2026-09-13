import Faq, { type FaqItem } from './Faq';
import { ArrowLink, Section } from './ui';

type RelatedService = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function ProductFaqSection({
  eyebrow,
  title,
  subtitle,
  items,
  tinted = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  items: FaqItem[];
  tinted?: boolean;
}) {
  return (
    <Section tinted={tinted} lazy>
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
            {title}
          </h2>
          {subtitle ? <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D1D1D1]">{subtitle}</p> : null}
        </div>
        <Faq items={items} />
      </div>
    </Section>
  );
}

export function RelatedServicesSection({
  eyebrow,
  title,
  items,
  tinted = false,
}: {
  eyebrow: string;
  title: string;
  items: RelatedService[];
  tinted?: boolean;
}) {
  return (
    <Section tinted={tinted} lazy>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4vw,4rem)] font-black uppercase leading-[0.95] text-white">
          {title}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.href} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5">
            <h3 className="text-lg font-black uppercase leading-tight text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{item.body}</p>
            <div className="mt-5">
              <ArrowLink href={item.href}>{item.cta}</ArrowLink>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
