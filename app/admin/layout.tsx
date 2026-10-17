import React from 'react';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { ADMIN_EMAIL, ADMIN_ROLE } from '@/constants/roles';
import { APP_ROUTES } from '@/constants/routes';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect(APP_ROUTES.signIn);

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
  const emailIsVerified = user.primaryEmailAddress?.verification?.status === 'verified';
  if (email !== ADMIN_EMAIL || !emailIsVerified || user.publicMetadata.role !== ADMIN_ROLE) {
    redirect(APP_ROUTES.landing);
  }

  return <AdminShell>{children}</AdminShell>;
}
