'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, MapPin } from 'lucide-react';

type Place = { display_name: string; name: string; address: string; city: string; latitude: number; longitude: number };

export default function AddressAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3 || selected?.display_name === query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const payload = await response.json() as { places?: Place[] };
        setResults(payload.places ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setResults([]);
      } finally { setLoading(false); }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selected?.display_name]);

  function choose(place: Place) { setSelected(place); setQuery(place.display_name); setResults([]); }

  return <div className="relative sm:col-span-2">
    <label className="block text-sm font-medium">Rechercher le lieu ou l’adresse
      <div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-ink-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); setResults([]); }} required placeholder="Ex. Cap Homard, Saint-Paul" autoComplete="off" className="w-full rounded-xl border border-ink-200 py-3 pl-10 pr-10" />{loading && <LoaderCircle className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-ink-400" />}</div>
    </label>
    {results.length > 0 && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-ink-200 bg-white p-1 shadow-lift">{results.map((place) => <button key={`${place.latitude}-${place.longitude}`} type="button" onClick={() => choose(place)} className="block w-full rounded-xl px-3 py-3 text-left text-sm hover:bg-ink-50"><strong className="block">{place.name}</strong><span className="mt-0.5 block text-xs text-ink-500">{place.display_name}</span></button>)}</div>}
    <input type="hidden" name="location" value={selected?.name ?? ''} /><input type="hidden" name="address" value={selected?.address ?? ''} /><input type="hidden" name="city" value={selected?.city ?? ''} /><input type="hidden" name="latitude" value={selected?.latitude ?? ''} /><input type="hidden" name="longitude" value={selected?.longitude ?? ''} />
    <p className="mt-2 text-xs text-ink-400">Résultats OpenStreetMap · sélectionne une proposition pour enregistrer les coordonnées.</p>
  </div>;
}
