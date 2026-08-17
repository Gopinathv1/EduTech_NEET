import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { generateInvoicePdf } from '@/lib/payments/invoice';
import type { InvoiceData } from '@/lib/payments/service';
import { fail } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/payments/[id]/invoice — download the PDF invoice (owner only).
export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { studentId: true, status: true, invoiceData: true, invoiceNumber: true },
  });
  if (!payment || payment.studentId !== session.sub) return fail('notFound', 404);
  if (payment.status !== 'SUCCESS' || !payment.invoiceData) return fail('noInvoice', 404);

  const pdf = await generateInvoicePdf(payment.invoiceData as unknown as InvoiceData);

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${payment.invoiceNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
