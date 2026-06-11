'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export interface TransitMapStation {
  id: string;
  name: string;
  lng: number;
  lat: number;
}

interface TransitMapProps {
  stations: TransitMapStation[];
  selectedStationId: string | null;
  onStationClick: (stationId: string) => void;
  getStationStatusColor: (stationId: string) => string;
}

const STATUS_HEX: Record<string, string> = {
  'bg-red-500': '#ef4444',
  'bg-amber-500': '#f59e0b',
  'bg-emerald-500': '#10b981',
};

function createStationMarkerElement(
  station: TransitMapStation,
  isSelected: boolean,
  statusClass: string,
  onStationClick: (stationId: string) => void,
): HTMLDivElement {
  const color = STATUS_HEX[statusClass] ?? '#10b981';

  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col items-center cursor-pointer';
  wrapper.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';
  wrapper.style.transition = 'transform 0.3s';

  const dot = document.createElement('div');
  dot.style.width = '16px';
  dot.style.height = '16px';
  dot.style.borderRadius = '9999px';
  dot.style.border = '2px solid white';
  dot.style.backgroundColor = color;
  dot.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

  const label = document.createElement('span');
  label.textContent = station.name;
  label.className = isSelected
    ? 'mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-sm border border-violet-500 bg-violet-600 text-white'
    : 'mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-sm border border-slate-700/50 bg-slate-950/80 text-slate-300';

  wrapper.appendChild(dot);
  wrapper.appendChild(label);

  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    onStationClick(station.id);
  });

  return wrapper;
}

export function TransitMap({
  stations,
  selectedStationId,
  onStationClick,
  getStationStatusColor,
}: TransitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [72.8777, 19.076],
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const bounds = new maplibregl.LngLatBounds();
    stations.forEach((station) => bounds.extend([station.lng, station.lat]));

    map.on('load', () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 11 });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Map initializes once; markers update in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      stations.forEach((station) => {
        const isSelected = selectedStationId === station.id;
        const statusClass = getStationStatusColor(station.id);
        const element = createStationMarkerElement(
          station,
          isSelected,
          statusClass,
          onStationClick,
        );

        const marker = new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([station.lng, station.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20, closeButton: false }).setText(station.name),
          )
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      renderMarkers();
    } else {
      map.once('load', renderMarkers);
    }
  }, [stations, selectedStationId, onStationClick, getStationStatusColor]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Mumbai Transit Network Map"
    />
  );
}
