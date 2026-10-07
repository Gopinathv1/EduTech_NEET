'use client';
import { usePathname } from 'next/navigation';
import { isActiveTestPath } from '@/lib/navigation/global-controls';

export default function QuickControls({children}:{children:React.ReactNode}) {
  const pathname=usePathname();
  // The exam has its own navigation and fixed action area.
  if(isActiveTestPath(pathname))return null;
  return <div aria-label="Quick controls" className="quick-controls fixed inset-x-0 bottom-0 z-[70] flex h-[calc(5rem+env(safe-area-inset-bottom))] items-center justify-between border-t border-[#d9dee5] bg-white px-4 pb-[env(safe-area-inset-bottom)] sm:px-6">{children}</div>;
}
