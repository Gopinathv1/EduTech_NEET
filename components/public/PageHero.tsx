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
    <section className="sivora-ambient border-b border-white/10 bg-[#0a0a09]">
      <Container className="py-24 sm:py-32 lg:py-40">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="sivora-editorial-heading max-w-5xl text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.9] text-textPrimary">
          {title}
        </h1>
        {subtitle ? (
          <p className="sivora-editorial-copy mt-7 max-w-2xl text-lg sm:text-xl">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </section>
  );
}
