import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function AdminReceivablesPage() {
  redirect(APP_ROUTES.adminStalls);
}
