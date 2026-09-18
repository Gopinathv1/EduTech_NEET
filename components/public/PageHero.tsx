import type { ReactNode } from 'react';
import { Container, Eyebrow } from './ui';

/** Compact hero for inner pages: eyebrow + H1 + optional subtitle. */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-[#d2c9bd] bg-[#f5f1e9] text-[#171613]">
      <Container className="py-24 sm:py-32 lg:py-40">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="sivora-editorial-heading max-w-5xl text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.92] text-[#171613]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6e685f] sm:text-xl">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </section>
  );
}
