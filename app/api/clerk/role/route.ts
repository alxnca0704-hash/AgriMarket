import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ROLES, UserRole } from '@/constants/roles';

const VALID_ROLES: UserRole[] = [ROLES.BUYER, ROLES.SELLER];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const role = (body as { role?: string } | null)?.role;
  if (!role || !VALID_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });

  return NextResponse.json({ ok: true });
}