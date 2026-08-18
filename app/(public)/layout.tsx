import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import WhatsAppButton from '@/components/contact/WhatsAppButton';

/**
 * Shared chrome for the public marketing site: sticky header + footer wrap
 * every page in the (public) route group. Auth pages (/login, /register, ...)
 * also live in this group but render their own AuthShell inside the <main>,
 * which is fine — they simply sit below the shared header.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <WhatsAppButton />
      <PublicFooter />
    </div>
  );
}
