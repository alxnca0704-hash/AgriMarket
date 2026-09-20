import { NextRequest, NextResponse } from 'next/server';
import philAddress from 'phil-address';

interface LocationRecord {
  name?: string;
  code?: string;
  psgcCode?: string;
  id?: string;
}

const toNamed = (item: LocationRecord) => ({
  name: item.name ?? '',
  code: item.code ?? item.psgcCode ?? item.id ?? '',
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'regions';
    const code = searchParams.get('code');

    if (type === 'regions') {
      const data = await philAddress.regions();
      return NextResponse.json({
        data: (data || []).map(toNamed),
      });
    }

    if (type === 'provinces') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.provinces(code);
      return NextResponse.json({
        data: (data || []).map(toNamed),
      });
    }

    if (type === 'cities') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.cities(code);
      return NextResponse.json({
        data: (data || []).map(toNamed),
      });
    }

    if (type === 'barangays') {
      if (!code) {
        return NextResponse.json({ data: [] });
      }
      const data = await philAddress.barangays(code);
      return NextResponse.json({
        data: (data || []).map(toNamed),
      });
    }

    return NextResponse.json({ error: 'Invalid location type' }, { status: 400 });
  } catch (err) {
    console.error('Error fetching location data:', err);
    return NextResponse.json(
      { error: 'Failed to load Philippine address data', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
