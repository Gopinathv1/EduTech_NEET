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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff5a36]">{eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#171717]">
            {title}
          </h2>
          {subtitle ? <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b6b67]">{subtitle}</p> : null}
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
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff5a36]">{eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#171717]">
          {title}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.href} className="rounded-md border border-[#deded9] bg-white p-5">
            <h3 className="text-lg font-semibold leading-tight text-[#171613]">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#6e685f]">{item.body}</p>
            <div className="mt-5">
              <ArrowLink href={item.href}>{item.cta}</ArrowLink>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
