import { notFound, redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import StudentHeader from '@/components/student/StudentHeader';
import CheckoutClient from '@/components/student/CheckoutClient';

// Buy flow. Amount is read from the server-side test record; the client never
// sets the price.
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as 'en' | 'ta';
  const session = await getSession();

  const test = await prisma.test.findUnique({
    where: { id },
    select: { id: true, price: true, isPublished: true, title: true },
  });
  if (!test || !test.isPublished) notFound();

  if (session) {
    const owned = await prisma.testEntitlement.count({ where: { studentId: session.sub, testId: id } });
    if (owned > 0) redirect(`/student/tests/${id}/start`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <CheckoutClient
          testId={id}
          price={test.price}
          title={localizedName(test.title, locale) || localizedName(test.title, 'en')}
        />
      </main>
    </div>
  );
}
