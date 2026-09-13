import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// Payment is dormant for Exam Preparation right now. Keep the route around for
// future Razorpay use, but send students to the free-attempt start flow.
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    select: { id: true, isPublished: true },
  });
  if (!test || !test.isPublished) notFound();

  redirect(`/student/tests/${id}/start`);
}
