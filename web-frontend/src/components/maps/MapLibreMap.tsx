"use client";

import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Hospital } from '../../services/hospitalService';

interface MapLibreMapProps {
  centerLat: number;
  centerLon: number;
  zoom?: number;
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (h: Hospital) => void;
  onRequestRoute?: (h: Hospital) => void;
  routePolyline?: [number, number][]; // [lat, lon] array
}

const RASTER_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function MapLibreMap({
  centerLat,
  centerLon,
  zoom = 13,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  onRequestRoute,
  routePolyline,
}: MapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize MapLibre GL Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: RASTER_MAP_STYLE,
      center: [centerLon, centerLat],
      zoom: zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Center & Zoom when not routing
  useEffect(() => {
    if (mapRef.current && (!routePolyline || routePolyline.length === 0)) {
      mapRef.current.flyTo({
        center: [centerLon, centerLat],
        zoom: zoom,
        essential: true,
      });
    }
  }, [centerLat, centerLon, zoom, routePolyline]);

  // Render User Location & Hospital Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add User Starting Location Pin
    const centerEl = document.createElement('div');
    centerEl.className = 'center-location-pin';
    centerEl.style.cursor = 'pointer';
    centerEl.innerHTML = `
      <div style="
        position: relative; width: 40px; height: 40px; border-radius: 50%;
        background: #2563EB; border: 3px solid #FFFFFF;
        box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3), 0 8px 20px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        color: #FFF; font-size: 18px; animation: pulse-ring 2s infinite;
      ">📍</div>
    `;

    const centerPopupHtml = document.createElement('div');
    centerPopupHtml.style.padding = '8px';
    centerPopupHtml.style.color = '#0F172A';
    centerPopupHtml.innerHTML = `
      <div style="font-size: 0.75rem; color: #2563EB; font-weight: 800; text-transform: uppercase;">STARTING POINT</div>
      <strong style="display: block; font-size: 0.95rem; color: #0F172A; margin-top: 2px;">Your Search / GPS Location</strong>
      <div style="font-size: 0.8rem; color: #64748B; margin-top: 4px;">Lat: ${centerLat.toFixed(4)}, Lon: ${centerLon.toFixed(4)}</div>
      <div style="font-size: 0.78rem; color: #059669; font-weight: 700; margin-top: 6px;">📍 Origin point for hospital distances & driving routes</div>
    `;

    const centerPopup = new maplibregl.Popup({ offset: 25 }).setDOMContent(centerPopupHtml);

    const centerMarker = new maplibregl.Marker({ element: centerEl })
      .setLngLat([centerLon, centerLat])
      .setPopup(centerPopup)
      .addTo(map);

    markersRef.current.push(centerMarker);

    // Add Hospital Markers
    hospitals.forEach((h) => {
      const isSelected = h.id === selectedHospitalId;
      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '42px' : '34px'};
          height: ${isSelected ? '42px' : '34px'};
          border-radius: 50%;
          background: ${isSelected ? '#DC2626' : '#10B981'};
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          color: #FFF; font-size: ${isSelected ? '18px' : '15px'}; font-weight: bold;
          transition: all 0.2s ease;
        ">🏥</div>
      `;

      const popupHtml = document.createElement('div');
      popupHtml.style.padding = '8px';
      popupHtml.style.color = '#1E293B';
      popupHtml.innerHTML = `
        <div style="font-size: 0.7rem; color: #3B82F6; font-weight: 800; text-transform: uppercase;">${h.category || 'Hospital'}</div>
        <strong style="display: block; font-size: 0.95rem; color: #0F172A; margin-top: 2px;">${h.name}</strong>
        <div style="font-size: 0.8rem; color: #64748B; margin-top: 4px;">📍 ${h.address}</div>
        ${h.phone ? `<div style="font-size: 0.8rem; color: #64748B; margin-top: 2px;">📞 ${h.phone}</div>` : ''}
        <div style="font-size: 0.85rem; font-weight: 800; color: #10B981; margin-top: 6px;">Distance: ${h.distanceFormatted || h.distanceKm + ' km'}</div>
        <button id="btn-route-${h.id}" style="
          margin-top: 8px; width: 100%; padding: 8px 12px;
          background: #2563EB; color: #FFFFFF; border: none;
          border-radius: 8px; font-weight: 700; font-size: 0.82rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
        ">🧭 View Driving Route</button>
      `;

      popupHtml.querySelector(`#btn-route-${h.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectHospital(h);
        if (onRequestRoute) onRequestRoute(h);
      });

      const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lon, h.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectHospital(h);
        // Fit camera to encompass starting point & destination hospital
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([centerLon, centerLat]);
        bounds.extend([h.lon, h.lat]);
        map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
      });

      markersRef.current.push(marker);
    });
  }, [hospitals, selectedHospitalId, centerLat, centerLon]);

  // Render OpenRouteService Polyline & Auto-Fit Camera from Start Point -> Destination
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = 'route-source';
    const layerId = 'route-layer';

    const updateRouteLayer = () => {
      if (!map.isStyleLoaded()) return;

      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (routePolyline && routePolyline.length > 0) {
        // MapLibre expects GeoJSON [lon, lat]
        const coordinates = routePolyline.map(([lat, lon]) => [lon, lat]);

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#2563EB',
            'line-width': 6,
            'line-opacity': 0.9,
          },
        });

        // Fit map bounds to show Start Point -> Destination
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([centerLon, centerLat]);
        coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    };

    if (map.isStyleLoaded()) {
      updateRouteLayer();
    } else {
      map.once('load', updateRouteLayer);
    }
  }, [routePolyline, centerLat, centerLon]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}
    />
  );
}
