import { NextResponse } from 'next/server';
import { getCurrentIdentity } from '@/lib/auth';

type NominatimPlace = { display_name: string; lat: string; lon: string; name?: string; address?: Record<string, string> };

export async function GET(request: Request) {
  if (!await getCurrentIdentity()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 3 || query.length > 120) return NextResponse.json({ places: [] });
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', `${query}, La Réunion`); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('addressdetails', '1'); url.searchParams.set('limit', '5'); url.searchParams.set('countrycodes', 're');
  const response = await fetch(url, { headers: { 'User-Agent': 'VolleyPei/3.1 (contact: kevin@digit-ark.com)', 'Accept-Language': 'fr' }, next: { revalidate: 86400 } });
  if (!response.ok) return NextResponse.json({ places: [] });
  const data = await response.json() as NominatimPlace[];
  return NextResponse.json({ places: data.map((place) => ({ display_name: place.display_name, name: place.name ?? place.display_name.split(',')[0], address: place.display_name, city: place.address?.city ?? place.address?.town ?? place.address?.village ?? place.address?.municipality ?? '', latitude: Number(place.lat), longitude: Number(place.lon) })) });
}
