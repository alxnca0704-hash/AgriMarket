import { NamedLocation, COMPLETE_PH_REGIONS } from '@/constants/phLocations';
import { API_ROUTES } from '@/constants/routes';

interface LocationRecord {
  name?: string;
  code?: string;
}

async function fetchLocations(type: string, code?: string): Promise<NamedLocation[]> {
  const params = new URLSearchParams({ type });
  if (code) params.set('code', code);
  try {
    const res = await fetch(`${API_ROUTES.locations}?${params.toString()}`);
    const json = await res.json();
    if (Array.isArray(json.data)) {
      return json.data.map((item: LocationRecord) => ({
        name: item.name ?? '',
        code: item.code ?? '',
      })).filter((item: NamedLocation) => item.name);
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchProvinces(regionName: string): Promise<NamedLocation[]> {
  const region = COMPLETE_PH_REGIONS.find((r) => r.name === regionName);
  if (!region) return [];
  return fetchLocations('provinces', region.code);
}

export async function fetchCities(province: NamedLocation | undefined): Promise<NamedLocation[]> {
  if (!province?.code) return [];
  return fetchLocations('cities', province.code);
}

export async function fetchBarangays(city: NamedLocation | undefined): Promise<NamedLocation[]> {
  if (!city?.code) return [];
  return fetchLocations('barangays', city.code);
}