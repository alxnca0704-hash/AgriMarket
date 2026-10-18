import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Evidence uploads are not configured.' }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a photo or video.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Use a JPG, PNG, WebP, MP4, MOV, or WebM file.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Each file must be 5 MB or smaller.' }, { status: 400 });

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  try {
    const bytes = await file.arrayBuffer();
    const dataUri = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'agri-market/refund-evidence',
      resource_type: 'auto',
      ...(file.type.startsWith('image/') ? { transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] } : {}),
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary refund evidence upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
