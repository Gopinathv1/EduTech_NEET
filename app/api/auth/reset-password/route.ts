import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { hashResetToken } from '@/lib/auth/password-reset';
import { ok, fail, readJson } from '@/lib/http';
export async function POST(req: Request) {
 const parsed=resetPasswordSchema.safeParse(await readJson(req)); if(!parsed.success)return fail('validation',400);
 const token=await prisma.passwordResetToken.findUnique({where:{tokenHash:hashResetToken(parsed.data.token)}});
 if(!token||token.consumedAt||token.expiresAt<=new Date()) return fail('invalidResetToken',400);
 await prisma.$transaction([prisma.student.update({where:{id:token.studentId},data:{passwordHash:await hashPassword(parsed.data.password)}}),prisma.passwordResetToken.update({where:{id:token.id},data:{consumedAt:new Date()}})]);
 return ok({redirect:'/login'});
}
