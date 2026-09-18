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
    <section className="public-editorial-hero border-b border-[#deded9] bg-[#f7f7f5] text-[#171717]">
      <Container className="py-24 sm:py-32 lg:py-40">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="sivora-editorial-heading max-w-5xl text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.92] text-[#171717]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6b6b67] sm:text-xl">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </section>
  );
}
