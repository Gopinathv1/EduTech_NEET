import { prisma } from '@/lib/prisma';
import { profileUpdateSchema } from '@/lib/validation/auth';
import { getSession, createSession } from '@/lib/auth/session';
import { setUserLocale } from '@/lib/locale';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// PATCH /api/auth/profile — a logged-in student updates their own profile.
// Changing preferredLanguage also updates the UI locale cookie for future
// sessions and refreshes the session's cached name.
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') {
    return fail('unauthorized', 401);
  }

  const parsed = profileUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  await prisma.student.update({
    where: { id: session.sub },
    data: {
      name: d.name,
      schoolName: d.schoolName,
      class: d.class,
      board: d.board,
      preferredLanguage: d.preferredLanguage,
    },
  });

  await setUserLocale(d.preferredLanguage);
  await createSession({ sub: session.sub, kind: 'student', role: 'STUDENT', name: d.name });

  return ok({ locale: d.preferredLanguage });
}
