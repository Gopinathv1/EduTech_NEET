import {test,expect,type Locator} from '@playwright/test';
import {loadEnvConfig} from '@next/env';
import {PrismaClient} from '@prisma/client';
import {randomBytes,randomInt,randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import {signSession} from '../lib/auth/jwt';
import {hashResetToken} from '../lib/auth/password-reset';
loadEnvConfig(process.cwd());for(const key of ['DATABASE_URL','DIRECT_URL']){const u=new URL(process.env[key]!);if(u.hostname!=='127.0.0.1'||u.port!=='5433'||u.pathname!=='/sivora_sanity_staging')throw Error('Isolated staging required');}
const db=new PrismaClient();const fixtures=JSON.parse(fs.readFileSync('tmp/sanity-fixtures.json','utf8'));
test.afterAll(()=>db.$disconnect());
test.use({actionTimeout:10000});
async function unobscured(target:Locator){await target.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await expect.poll(()=>target.evaluate(e=>{const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return top===e||e.contains(top);})).toBe(true);}
test('bottom dock and contact/legal corrections at both viewports',async({page})=>{
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});for(const route of ['/register','/contact','/forgot-password']){await page.goto(route);const submit=page.locator('main form button[type=submit],main form button').last();await unobscured(submit);await page.screenshot({path:`reports/sanity-evidence/dock-${width}-${route.slice(1)}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto('/contact');await expect(page.getByText('support@neetsmartpractice.in',{exact:true})).toHaveCount(0);await expect(page.getByText('+91 90000 00000',{exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'+919750837020',exact:true})).toHaveAttribute('href',/^https:\/\/wa.me\/919750837020/);
 await page.goto('/terms');await expect(page.locator('main')).toContainText('NEET and JEE Main');await expect(page.locator('main')).not.toContainText('currently active exam category');}
});
test('registration, local OTP verification, login, logout and role redirect',async({page})=>{
 const mobile='9'+String(Date.now()).slice(-9),email=`auth-${randomUUID()}@example.test`,password=randomBytes(24).toString('hex');
 await page.goto('/register?callbackUrl=%2Fstudent');await page.getByLabel('Full name',{exact:true}).fill('Staging registration');await page.getByLabel('Mobile number',{exact:true}).fill(mobile);await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm password',{exact:true}).fill(password);
 const registered=page.waitForResponse(r=>r.url().includes('/api/auth/register'));await page.getByRole('button',{name:'Create account',exact:true}).click();expect((await registered).status()).toBe(502);await expect(page).toHaveURL(/\/verify-email\?/);
 const student=await db.student.findUniqueOrThrow({where:{email}});expect(student.isEmailVerified).toBe(false);
 const signedIn=await page.request.post('/api/auth/login',{data:{mobile,password}});expect(signedIn.status()).toBe(200);expect((await db.student.findUniqueOrThrow({where:{id:student.id}})).isEmailVerified).toBe(false);
 // Explicit local provider fixture: no email is sent and no token is logged.
 const otp=String(randomInt(100000,999999));await db.otpToken.updateMany({where:{mobile:student.mobile!,purpose:'EMAIL_VERIFICATION'},data:{consumedAt:new Date()}});await db.otpToken.create({data:{mobile:student.mobile!,email,purpose:'EMAIL_VERIFICATION',channel:'EMAIL',otpHash:await bcrypt.hash(otp,8),expiresAt:new Date(Date.now()+300000)}});
 await page.getByLabel('Verification code',{exact:true}).fill(otp);await page.getByRole('button',{name:'Verify',exact:true}).click();await expect(page).toHaveURL('/student');expect((await db.student.findUniqueOrThrow({where:{id:student.id}})).isEmailVerified).toBe(true);
 expect((await page.request.post('/api/auth/email-verification/verify',{data:{email,mobile,otp}})).status()).toBe(400);
 await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page).toHaveURL('/');await page.goto('/student');await expect(page).toHaveURL(/\/login/);
 await page.getByLabel('Mobile number',{exact:true}).fill(mobile);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL('/student');await page.goto('/admin/students');await expect(page).not.toHaveURL('/admin/students');
});
test('password reset token lifecycle and incomplete-profile submission',async({page,context})=>{
 const password=randomBytes(24).toString('hex');const mobile='+919'+String(Date.now()).slice(-9);const student=await db.student.create({data:{name:'Local reset fixture',email:`reset-${randomUUID()}@example.test`,mobile,isEmailVerified:true,passwordHash:await bcrypt.hash(password,10)}});
 await page.goto('/forgot-password');await page.getByLabel('Registered email *',{exact:true}).fill(student.email!);await page.getByLabel('Registered mobile number *',{exact:true}).fill(mobile);await page.getByRole('button',{name:'Send Reset Link',exact:true}).click();await expect(page.getByText(/If the details match an account/)).toBeVisible();expect(await db.passwordResetToken.count({where:{studentId:student.id}})).toBe(1);
 const token=randomBytes(32).toString('base64url');await db.passwordResetToken.create({data:{studentId:student.id,tokenHash:hashResetToken(token),expiresAt:new Date(Date.now()+3600000)}});const nextPassword=randomBytes(24).toString('hex');await page.goto(`/reset-password?token=${token}`);await page.getByLabel('New password *',{exact:true}).fill(nextPassword);await page.getByLabel('Confirm password *',{exact:true}).fill(nextPassword);await page.getByRole('button',{name:'Reset Password',exact:true}).click();await expect(page).toHaveURL('/login');expect(await bcrypt.compare(nextPassword,(await db.student.findUniqueOrThrow({where:{id:student.id}})).passwordHash!)).toBe(true);expect((await page.request.post('/api/auth/reset-password',{data:{token,password:nextPassword,confirmPassword:nextPassword}})).status()).toBe(400);
 const incomplete=await db.student.create({data:{name:'Local incomplete profile',email:`complete-${randomUUID()}@example.test`,isEmailVerified:true}});await context.addCookies([{name:'session',value:await signSession({sub:incomplete.id,kind:'student',role:'STUDENT',name:incomplete.name}),url:'http://localhost:3010'}]);await page.goto('/complete-profile?callbackUrl=%2Fstudent');await expect(page.getByRole('heading',{name:'Complete your profile',exact:true})).toBeVisible();await page.getByLabel('Mobile number',{exact:true}).fill('9'+String(Date.now()+2).slice(-9));await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page).toHaveURL('/student');
});
test('student and partner profile saves, admin search/clear and CSV export',async({page,context})=>{
 await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);await page.setViewportSize({width:390,height:844});await page.goto('/student/profile');await page.getByLabel('School name',{exact:true}).fill('Isolated staging school');const save=page.getByRole('button',{name:'Save changes',exact:true});await unobscured(save);await save.click();await expect(page.getByText(/Profile updated/)).toBeVisible();await page.reload();await expect(page.getByLabel('School name',{exact:true})).toHaveValue('Isolated staging school');
 await context.addCookies([{name:'session',value:await signSession({sub:fixtures.partner.id,kind:'partner',role:'PARTNER',agencyId:fixtures.partner.agencyId,name:'Sanity Partner'}),url:'http://localhost:3010'}]);await page.goto('/partner/profile');await page.getByLabel('City',{exact:true}).fill('Chennai');await unobscured(page.getByRole('button',{name:'Save profile',exact:true}));await page.getByRole('button',{name:'Save profile',exact:true}).click();await expect(page.getByText('Agency profile updated.',{exact:true})).toBeVisible();
 await context.addCookies([{name:'session',value:await signSession({sub:fixtures.admin.id,kind:'admin',role:'SUPER_ADMIN',name:'Sanity Admin'}),url:'http://localhost:3010'}]);await page.goto('/admin/students');await page.getByPlaceholder('Name / mobile / school…').fill('Sanity Review');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page).toHaveURL(/q=Sanity/);await expect(page.getByText('Sanity Review',{exact:true})).toBeVisible();await expect(page.locator('main')).not.toContainText('+91 +91');const download=page.waitForEvent('download');await page.getByRole('link',{name:'Export Student Data',exact:true}).click();const file=await(await download).path();expect(fs.readFileSync(file!,'utf8')).toContain('Sanity Review');await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page).toHaveURL('/admin/students');
});

test('free exam rejects legacy orders and disabled retry orders without a payment record',async({page,context})=>{
 await context.addCookies([{name:'session',value:await signSession({sub:fixtures.student.id,kind:'student',role:'STUDENT',name:'Sanity Review'}),url:'http://localhost:3010'}]);
 const before=await db.payment.count();
 const order=await page.request.post('/api/payments/create-order',{data:{testId:'sivora-neet-full-mock-1'}});
 expect(order.status()).toBe(409);expect((await order.json()).error).toBe('paymentNotRequired');
 const retry=await page.request.post('/api/payments/retry-order',{data:{testId:'sivora-neet-full-mock-1'}});
 expect(retry.status()).toBe(403);expect((await retry.json()).error).toBe('paidRetriesDisabled');expect(await db.payment.count()).toBe(before);
});

test('Hindi and Tamil selectors persist; dock home/back/forward controls navigate',async({page})=>{
 await page.goto('/login');
 for(const [label,code] of [['हिन्दी','hi'],['தமிழ்','ta'],['English','en']]){
  const button=page.getByRole('button',{name:label,exact:true});
  if(await button.count())await button.click();else await page.locator('select').first().selectOption(code);
  await expect(page.locator('html')).toHaveAttribute('lang',code);await page.reload();await expect(page.locator('html')).toHaveAttribute('lang',code);
 }
 await page.goto('/');await page.getByRole('link',{name:'Contact',exact:true}).first().click();await expect(page).toHaveURL('/contact');
 await page.getByRole('button',{name:'Go back',exact:true}).click();await expect(page).toHaveURL('/');await page.getByRole('button',{name:'Go forward',exact:true}).click();await expect(page).toHaveURL('/contact');await page.getByRole('button',{name:'Home',exact:true}).click();await expect(page).toHaveURL('/');
});
