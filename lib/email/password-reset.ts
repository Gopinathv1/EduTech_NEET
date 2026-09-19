export async function sendPasswordResetEmail(email: string, token: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return false;
  const base = (process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://www.sivora-uprising.com').replace(/\/$/, '');
  const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: 'Reset your SIVORA password', html: `<h2>SIVORA UP↑RISING</h2><p>Use the link below to reset your password. It expires in one hour.</p><p><a href="${url}">Reset Password</a></p>` }) });
  return res.ok;
}
