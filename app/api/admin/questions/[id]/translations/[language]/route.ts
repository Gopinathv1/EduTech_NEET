import { getAdminSession } from '@/lib/auth/admin';
import { fail, ok, readJson } from '@/lib/http';
import { mutateTranslation, reviewTranslationSchema, saveTranslationSchema, TranslationWorkflowError } from '@/lib/question-translations/workflow';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; language: string }> };
async function mutate(req: Request, context: Context, mode: 'save' | 'review') {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id, language } = await context.params;
  if (language !== 'ta' && language !== 'hi') return fail('translationLanguage', 400);
  const body = await readJson(req);
  try {
    if (mode === 'save') {
      const parsed = saveTranslationSchema.safeParse(body);
      if (!parsed.success) return fail('validation', 400);
      return ok(await mutateTranslation(id, language, admin, { save: parsed.data }));
    }
    const parsed = reviewTranslationSchema.safeParse(body);
    if (!parsed.success) return fail('validation', 400);
    return ok(await mutateTranslation(id, language, admin, { review: parsed.data }));
  } catch (error) {
    if (error instanceof TranslationWorkflowError) return fail(error.code, error.status, { issues: error.issues });
    throw error;
  }
}
export const PATCH = (req: Request, context: Context) => mutate(req, context, 'save');
export const POST = (req: Request, context: Context) => mutate(req, context, 'review');
