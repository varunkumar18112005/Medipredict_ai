"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Hospital } from '@/services/hospitalService';

const MapLibreMap = dynamic(() => import('./maps/MapLibreMap'), {
  ssr: false,
});

interface HospitalMapComponentProps {
  currentLoc: { lat: number; lng: number };
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  routeCoordinates: [number, number][];
  onSelectHospital: (hospital: Hospital) => void;
  onRecenter: () => void;
}

export default function HospitalMapComponent({
  currentLoc,
  hospitals,
  selectedHospital,
  routeCoordinates,
  onSelectHospital,
  onRecenter,
}: HospitalMapComponentProps) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800" style={{ minHeight: '480px' }}>
      <MapLibreMap
        centerLat={currentLoc.lat}
        centerLon={currentLoc.lng}
        zoom={13}
        hospitals={hospitals}
        selectedHospitalId={selectedHospital ? selectedHospital.id : null}
        onSelectHospital={onSelectHospital}
        routePolyline={routeCoordinates}
      />

      <button
        onClick={onRecenter}
        title="Recenter to Location"
        className="absolute bottom-6 right-6 z-10 bg-slate-900 hover:bg-slate-800 text-blue-400 p-3.5 rounded-full shadow-2xl border border-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        📍
      </button>
    </div>
  );
}
