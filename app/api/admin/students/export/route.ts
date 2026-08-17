import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { buildStudentWhere } from '@/lib/admin/students-filter';
import { logAudit } from '@/lib/audit';
import { toCsv, csvResponse } from '@/lib/admin/csv';
import { fail } from '@/lib/http';

export const runtime = 'nodejs';

// GET /api/admin/students/export — CSV of students matching the current filters.
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const url = new URL(req.url);
  const g = (k: string) => url.searchParams.get(k) ?? undefined;
  const where = buildStudentWhere({
    q: g('q'),
    district: g('district'),
    board: g('board'),
    klass: g('class'),
    from: g('from'),
    to: g('to'),
  });

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      mobile: true,
      email: true,
      state: true,
      district: true,
      schoolName: true,
      board: true,
      class: true,
      isMobileVerified: true,
      createdAt: true,
      _count: { select: { attempts: true, payments: true } },
    },
  });

  const headers = [
    'name',
    'mobile',
    'email',
    'state',
    'district',
    'school',
    'board',
    'class',
    'mobileVerified',
    'registeredAt',
    'attempts',
    'payments',
  ];
  const rows = students.map((s) => [
    s.name,
    s.mobile,
    s.email ?? '',
    s.state ?? '',
    s.district ?? '',
    s.schoolName ?? '',
    s.board ?? '',
    s.class ?? '',
    s.isMobileVerified ? 'yes' : 'no',
    s.createdAt.toISOString(),
    s._count.attempts,
    s._count.payments,
  ]);

  await logAudit(admin, { action: 'student.export', entityType: 'Student', entityId: null, details: { count: students.length } });
  return csvResponse(toCsv(headers, rows), `students-${new Date().toISOString().slice(0, 10)}.csv`);
}
