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
  const el = document.createElement('div');
  el.className = 'custom-maplibre-marker';
  el.style.cursor = 'pointer';

  let markerColorClass = 'bg-emerald-500';
  let glowClass = 'glow-healthy';
  
  if (statusClass.includes('red') || statusClass.includes('rose') || statusClass.includes('critical')) {
    markerColorClass = 'bg-rose-500';
    glowClass = 'glow-critical';
  } else if (statusClass.includes('amber') || statusClass.includes('warning') || statusClass.includes('yellow')) {
    markerColorClass = 'bg-amber-500';
    glowClass = 'glow-warning';
  }

  if (isSelected) {
    // Pulsing target concentric rings
    el.innerHTML = `
      <div class="relative flex flex-col items-center justify-center">
        <span class="absolute inline-flex h-10 w-10 rounded-full bg-orange-500/20 animate-ring-pulse"></span>
        <span class="absolute inline-flex h-7 w-7 rounded-full bg-orange-500/35"></span>
        <div class="h-6 w-6 rounded-full border-4 border-white bg-slate-900 shadow-xl z-10 flex items-center justify-center">
          <div class="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        </div>
      </div>
    `;
  } else {
    // Regular marker
    el.innerHTML = `
      <div class="relative flex flex-col items-center">
        <span class="absolute inline-flex h-7 w-7 rounded-full opacity-35 animate-ring-pulse ${markerColorClass} ${glowClass}"></span>
        <div class="h-4.5 w-4.5 rounded-full border-2 border-white shadow-lg ${markerColorClass} ${glowClass}"></div>
      </div>
    `;
  }

  // Label below marker
  const label = document.createElement('div');
  label.textContent = station.name;
  label.className = isSelected
    ? 'mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-tight shadow-md border border-orange-500 bg-orange-500 text-white select-none whitespace-nowrap'
    : 'mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-tight shadow-sm border border-slate-200 bg-white text-slate-700 select-none whitespace-nowrap';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col items-center justify-center';
  wrapper.appendChild(el);
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
      center: [72.887, 19.076],
      zoom: 10.3,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const bounds = new maplibregl.LngLatBounds();
    stations.forEach((station) => bounds.extend([station.lng, station.lat]));

    map.on('load', () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 11 });
      }

      // Order stations for red route connecting them CSMT -> Dadar -> Andheri -> Kurla -> Ghatkopar -> Thane
      const redRouteOrder = ['st_cst', 'st_dadar', 'st_andheri', 'st_kurla', 'st_ghatkopar', 'st_thane'];
      const redLineCoords = redRouteOrder
        .map(id => stations.find(s => s.id === id))
        .filter((s): s is TransitMapStation => !!s)
        .map(s => [s.lng, s.lat]);

      // Blue route connects Andheri -> Kurla -> Ghatkopar
      const blueRouteOrder = ['st_andheri', 'st_kurla', 'st_ghatkopar'];
      const blueLineCoords = blueRouteOrder
        .map(id => stations.find(s => s.id === id))
        .filter((s): s is TransitMapStation => !!s)
        .map(s => [s.lng, s.lat]);

      // Add Red Route Source
      if (redLineCoords.length > 1) {
        map.addSource('red-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: redLineCoords
            }
          }
        });

        // Casing (white outline)
        map.addLayer({
          id: 'red-line-bg',
          type: 'line',
          source: 'red-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 6.5
          }
        });

        // Glow Layer
        map.addLayer({
          id: 'red-line-glow',
          type: 'line',
          source: 'red-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ff6b00',
            'line-width': 8,
            'line-opacity': 0.2
          }
        });

        // Main line
        map.addLayer({
          id: 'red-line-main',
          type: 'line',
          source: 'red-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ff6b00',
            'line-width': 3.5
          }
        });
      }

      // Add Blue Route Source
      if (blueLineCoords.length > 1) {
        map.addSource('blue-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: blueLineCoords
            }
          }
        });

        // Casing (white outline)
        map.addLayer({
          id: 'blue-line-bg',
          type: 'line',
          source: 'blue-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 6.5
          }
        });

        // Glow Layer
        map.addLayer({
          id: 'blue-line-glow',
          type: 'line',
          source: 'blue-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ea580c',
            'line-width': 8,
            'line-opacity': 0.2
          }
        });

        // Main line
        map.addLayer({
          id: 'blue-line-main',
          type: 'line',
          source: 'blue-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ea580c',
            'line-width': 3.5
          }
        });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
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
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      renderMarkers();
    } else {
      map.on('load', renderMarkers);
    }
  }, [stations, selectedStationId, onStationClick, getStationStatusColor]);

  // Handle resizing on selected hub/panel toggle
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.resize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedStationId]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Mumbai Transit Network Map"
    />
  );
}
