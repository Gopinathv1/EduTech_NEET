import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from './icons';

/**
 * Presentational building blocks shared across the public marketing pages.
 * All server components (zero client JS). Mobile-first spacing.
 */

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1600px] px-[clamp(1rem,3vw,3rem)] ${className}`}>{children}</div>;
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
      className={`border-t border-[#deded9] py-16 sm:py-24 lg:py-28 ${tinted ? 'bg-[#f0f0ed]' : 'bg-[#f7f7f5]'} ${lazy ? 'cv-auto' : ''} ${className}`}
    >
      <Container className="relative z-10">{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#2774e6]">{children}</p>
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
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-3xl`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-[#171717] sm:text-6xl lg:text-7xl">{title}</h2>
      {subtitle ? <p className="mt-5 max-w-2xl text-base leading-8 text-textSecondary sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`group rounded-md border border-[#d9dee5] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#2774e6] ${className}`}>
      {children}
    </div>
  );
}

/** Circular tinted badge that holds an icon. */
export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand-soft text-brand shadow-lg shadow-brand/10">
      {children}
    </span>
  );
}

const linkBase =
  'group inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

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
    <Link href={href} className={`${linkBase} bg-[#10151c] text-white hover:-translate-y-0.5 hover:bg-[#2774e6] ${className}`}>
      {children}
      <span className="transition group-hover:translate-x-1">-&gt;</span>
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
      className={`${linkBase} border border-[#d9dee5] bg-transparent text-[#10151c] hover:-translate-y-0.5 hover:border-[#2774e6] hover:text-[#2774e6] ${className}`}
    >
      {children}
      <span className="transition group-hover:translate-x-1">-&gt;</span>
    </Link>
  );
}

/** A subtle "Learn more →" text link. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm font-semibold text-[#2774e6] transition hover:text-[#135bc2]"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
    </Link>
  );
}
