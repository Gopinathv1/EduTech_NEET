import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { getSession } from '@/lib/auth/session';
import { safeReturnPath } from '@/lib/auth/redirect';
import { prisma } from '@/lib/prisma';

type Props = {
  searchParams: Promise<{ callbackUrl?: string | string[]; next?: string | string[] }>;
};

export default async function CompleteProfilePage({ searchParams }: Props) {
  const params = await searchParams;
  const rawReturnTo = params.callbackUrl ?? params.next;
  const returnTo = safeReturnPath(Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo);
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login');

  const student = await prisma.student.findUnique({
    where: { id: session.sub },
    select: { mobile: true },
  });
  if (!student) redirect('/login');
  if (student.mobile) redirect(returnTo);

  return (
    <AuthShell>
      <CompleteProfileForm callbackUrl={returnTo} />
    </AuthShell>
  );
}
