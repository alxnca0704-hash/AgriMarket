import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function SellerEarningsRedirect() {
  redirect(APP_ROUTES.sellerStallTab('payouts'));
}
