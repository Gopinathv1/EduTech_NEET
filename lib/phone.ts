export function indianMobileNational(mobile: string | null | undefined): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function formatIndianMobile(mobile: string | null | undefined): string {
  const national = indianMobileNational(mobile);
  return national ? `+91 ${national}` : '-';
}

export function razorpayContact(mobile: string | null | undefined): string | undefined {
  const national = indianMobileNational(mobile);
  return national ? `91${national}` : undefined;
}
