import { redirect } from 'next/navigation';

// The dashboard now lives at /student; keep this path working for old links.
export default function StudentDashboardRedirect() {
  redirect('/student');
}
