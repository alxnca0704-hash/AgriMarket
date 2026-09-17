import { NextRequest, NextResponse } from 'next/server';
import philAddress from 'phil-address';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'regions';
    const code = searchParams.get('code');

    if (type === 'regions') {
      const data = await philAddress.regions();
      return NextResponse.json({
        data: (data || []).map((r: any) => ({
          name: r.name,
          code: r.code || r.psgcCode,
        })),
      });
    }

    if (type === 'provinces') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.provinces(code);
      return NextResponse.json({
        data: (data || []).map((p: any) => ({
          name: p.name,
          code: p.code || p.id,
        })),
      });
    }

    if (type === 'cities') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.cities(code);
      return NextResponse.json({
        data: (data || []).map((c: any) => ({
          name: c.name,
          code: c.code || c.id,
        })),
      });
    }

    if (type === 'barangays') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.barangays(code);
      return NextResponse.json({
        data: (data || []).map((b: any) => ({
          name: b.name,
          code: b.code || b.id,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid location type' }, { status: 400 });
  } catch (err: any) {
    console.error('Error fetching location data:', err);
    return NextResponse.json(
      { error: 'Failed to load Philippine address data', details: err?.message },
      { status: 500 }
    );
  }
}
