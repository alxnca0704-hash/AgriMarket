import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function SellerCommissionsRedirect() {
  redirect(APP_ROUTES.sellerStallTab('platform'));
}
