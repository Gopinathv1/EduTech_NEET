import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from './icons';

/**
 * Presentational building blocks shared across the public marketing pages.
 * All server components (zero client JS). Mobile-first spacing.
 */

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Section({
  children,
  id,
  tinted = false,
  lazy = false,
  className = '',
}: {
  children: ReactNode;
  id?: string;
  tinted?: boolean;
  lazy?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`py-14 sm:py-20 ${tinted ? 'bg-brand-soft' : ''} ${lazy ? 'cv-auto' : ''} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-2xl`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Circular tinted badge that holds an icon. */
export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
      {children}
    </span>
  );
}

const linkBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export function PrimaryLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${linkBase} bg-brand text-white hover:bg-brand-dark ${className}`}>
      {children}
    </Link>
  );
}

export function SecondaryLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${linkBase} border border-brand text-brand hover:bg-brand-soft ${className}`}
    >
      {children}
    </Link>
  );
}

/** A subtle "Learn more →" text link. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );
}
