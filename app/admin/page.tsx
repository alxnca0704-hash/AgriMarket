import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ADMIN_EMAIL, ADMIN_ROLE } from '@/constants/roles';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = { title: 'Admin | AgriMarket' };

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect(APP_ROUTES.signIn);

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
  const emailIsVerified = user.primaryEmailAddress?.verification?.status === 'verified';
  if (email !== ADMIN_EMAIL || !emailIsVerified || user.publicMetadata.role !== ADMIN_ROLE) {
    redirect(APP_ROUTES.landing);
  }

  return null;
}
