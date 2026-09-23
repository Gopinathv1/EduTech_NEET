import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getSession } from '@/lib/auth/session';
import { publicFont } from '@/lib/public/font';

/**
 * Shared chrome for the public marketing site: sticky header + footer wrap
 * every page in the (public) route group. Auth pages (/login, /register, ...)
 * also live in this group but render their own AuthShell inside the <main>,
 * which is fine — they simply sit below the shared header.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className={`${publicFont.className} public-site flex min-h-screen flex-col`}>
      <PublicHeader studentAuthenticated={session?.kind === 'student'} />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
