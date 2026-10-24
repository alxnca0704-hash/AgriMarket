import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function AdminSalesPage() {
  redirect(APP_ROUTES.adminStalls);
}
