'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';
import TypeBadge from '@/components/ui/TypeBadge';
import type { Tournament } from '@/lib/supabase';

// Fix icônes Leaflet
const icon = L.divIcon({
  className: 'volley-pin',
  html: `
    <div style="
      position: relative;
      width: 36px; height: 36px;
      transform: translate(-50%, -100%);
    ">
      <div style="
        width: 36px; height: 36px;
        background: #09090B;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      "></div>
      <div style="
        position: absolute; top: 9px; left: 50%;
        transform: translateX(-50%);
        width: 14px; height: 14px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Centre par défaut : Réunion
const REUNION_CENTER: [number, number] = [-21.115141, 55.536384];

function FitBounds({ markers }: { markers: Tournament[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = markers
      .filter((m) => m.latitude && m.longitude)
      .map((m) => [m.latitude!, m.longitude!] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 12);
    } else {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
}

export default function MapView({ tournaments }: { tournaments: Tournament[] }) {
  const withCoords = tournaments.filter((t) => t.latitude && t.longitude);

  return (
    <MapContainer
      center={REUNION_CENTER}
      zoom={10}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={withCoords} />
      {withCoords.map((t) => (
        <Marker key={t.id} position={[t.latitude!, t.longitude!]} icon={icon}>
          <Popup>
            <Link
              href={`/tournoi/${t.id}`}
              className="block bg-white overflow-hidden rounded-xl group"
            >
              <div className="aspect-[16/9] bg-ink-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.poster_url}
                  alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <TypeBadge type={t.type} size="sm" />
                <h3 className="font-display font-semibold text-ink-900 text-sm mt-2 line-clamp-2">
                  {t.name}
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  {formatDate(t.date, { day: 'numeric', month: 'short' })} · {formatTime(t.time)}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">{t.city}</p>
                <span className="text-xs font-medium text-ink-900 mt-2 inline-block">
                  Voir la fiche →
                </span>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
