/**
 * Lightweight loading skeletons used by route-level `loading.tsx` files. These
 * stream instantly (server-render, no data) while the real page does its DB
 * work, so low-bandwidth users see structured placeholders rather than a blank
 * screen. Purely decorative — hidden from assistive tech.
 */

export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

/** A header bar + a stack of content blocks — the shape shared by student pages. */
export function StudentPageSkeleton({
  blocks = 3,
  maxWidth = 'max-w-5xl',
}: {
  blocks?: number;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50" aria-hidden="true">
      {/* Header placeholder */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <SkeletonBar className="h-5 w-28" />
          <div className="flex gap-2">
            <SkeletonBar className="h-8 w-8 rounded-full" />
            <SkeletonBar className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className={`mx-auto ${maxWidth} px-4 py-8 sm:px-6`}>
        <SkeletonBar className="h-7 w-48" />
        <SkeletonBar className="mt-2 h-4 w-64" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: blocks }).map((_, i) => (
            <SkeletonBar key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
