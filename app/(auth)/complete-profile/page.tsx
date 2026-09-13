import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export default async function CompleteProfilePage() {
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login');

  const student = await prisma.student.findUnique({
    where: { id: session.sub },
    select: { mobile: true },
  });
  if (!student) redirect('/login');
  if (student.mobile) redirect('/student');

  return (
    <AuthShell>
      <CompleteProfileForm />
    </AuthShell>
  );
}
