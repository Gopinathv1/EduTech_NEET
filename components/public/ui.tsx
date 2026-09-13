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
      className={`sivora-section-sheen border-t border-[#2B2B2B] py-20 sm:py-28 lg:py-32 ${tinted ? 'bg-[#111111]/86' : 'bg-background/74'} ${lazy ? 'cv-auto' : ''} ${className}`}
    >
      <Container className="relative z-10">{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-black uppercase tracking-[0.32em] text-brand">{children}</p>
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
      <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-textPrimary sm:text-6xl lg:text-7xl">{title}</h2>
      {subtitle ? <p className="mt-5 max-w-2xl text-base leading-8 text-textSecondary sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sivora-premium-card group rounded-2xl border border-[#2B2B2B] bg-[#111111] shadow-xl shadow-black/5 transition duration-300 hover:-translate-y-1 hover:border-brand/35 hover:shadow-2xl hover:shadow-black/10 ${className}`}>
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
  'group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

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
    <Link href={href} className={`${linkBase} sivora-premium-link bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 ${className}`}>
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
      className={`${linkBase} border border-[#2B2B2B] bg-white/90 text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_32px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:border-brand/45 hover:bg-[#111111] hover:text-white ${className}`}
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
      className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand transition hover:text-brand-dark"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
    </Link>
  );
}
