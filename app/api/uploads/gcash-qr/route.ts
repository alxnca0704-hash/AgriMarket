import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { ADMIN_EMAIL, ADMIN_ROLE } from '@/constants/roles';
import { GCASH_QR_IMAGE } from '@/constants/admin';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
  const isVerified = user.primaryEmailAddress?.verification?.status === 'verified';
  if (email !== ADMIN_EMAIL || !isVerified || user.publicMetadata.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Image uploads are not configured.' }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Choose a valid image file.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 });
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  try {
    const dataUri = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'agri-market/admin',
      resource_type: 'image',
      transformation: [{
        width: GCASH_QR_IMAGE.width,
        height: GCASH_QR_IMAGE.height,
        crop: 'pad',
        background: 'white',
        quality: 'auto',
        fetch_format: 'auto',
      }],
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary GCash QR upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
