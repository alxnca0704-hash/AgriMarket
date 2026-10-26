import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function SellerSalesRedirect() {
  redirect(APP_ROUTES.sellerStallTab('sales'));
}
