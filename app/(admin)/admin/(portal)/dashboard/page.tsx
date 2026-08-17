import { redirect } from 'next/navigation';

// The admin dashboard now lives at /admin; keep this path working for old links.
export default function AdminDashboardRedirect() {
  redirect('/admin');
}
