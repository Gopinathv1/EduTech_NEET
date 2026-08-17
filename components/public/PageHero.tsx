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
    <section className="border-b border-slate-100 bg-brand-soft">
      <Container className="py-12 sm:py-16">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </section>
  );
}
