"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import LocationSearch from './LocationSearch';
import HospitalFilters, { CategoryFilter, SortOption } from './HospitalFilters';
import HospitalCard from './HospitalCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorState from './ErrorState';
import { Hospital } from '../../services/hospitalService';
import {
  fetchHospitalsFromBackend,
  calculateDrivingRouteFromBackend,
  fetchGeocodeFromBackend,
  RouteResponse
} from '../../services/hospitalBackendApi';

// Dynamic import for React Leaflet components (SSR disabled)
const DynamicLeafletMap = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      const { MapContainer, TileLayer, Polyline } = mod;
      return function LeafletMapWrapper({
        centerLat,
        centerLon,
        hospitals,
        selectedHospitalId,
        onSelectHospital,
        routePolyline,
      }: {
        centerLat: number;
        centerLon: number;
        hospitals: Hospital[];
        selectedHospitalId: string | null;
        onSelectHospital: (h: Hospital) => void;
        routePolyline?: [number, number][];
      }) {
        const MapControls = require('./MapControls').default;
        const HospitalMarker = require('./HospitalMarker').default;

        const MapInvalidator = () => {
          const map = mod.useMap();
          useEffect(() => {
            if (map) {
              const timer = setTimeout(() => {
                map.invalidateSize();
              }, 200);
              return () => clearTimeout(timer);
            }
          }, [map]);
          return null;
        };

        return (
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 1 }}
          >
            <MapInvalidator />
            <MapControls lat={centerLat} lon={centerLon} zoom={13} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routePolyline && routePolyline.length > 0 && (
              <Polyline
                positions={routePolyline}
                pathOptions={{ color: '#1E88E5', weight: 6, opacity: 0.85 }}
              />
            )}
            {hospitals.map((h) => (
              <HospitalMarker
                key={h.id}
                hospital={h}
                isSelected={selectedHospitalId === h.id}
                onSelect={onSelectHospital}
              />
            ))}
          </MapContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <LoadingSpinner message="Initializing Hospital Map..." />,
  }
);

export default function HospitalLocator() {
  const [centerLat, setCenterLat] = useState<number>(13.6288);
  const [centerLon, setCenterLon] = useState<number>(79.4192);
  const [cityName, setCityName] = useState<string>('Current Location');

  const [radiusMeters, setRadiusMeters] = useState<number>(20000);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGeoInitialized, setHasGeoInitialized] = useState<boolean>(false);

  // Pure Renderer Hospital Fetcher (Calls Spring Boot GET /api/v1/hospitals/nearby exclusively)
  const loadHospitalsForCoordinates = useCallback(
    async (lat: number, lon: number, radius: number, speciality?: string, sortOrder?: SortOption) => {
      setLoading(true);
      setError(null);
      setSelectedHospitalId(null);
      setActiveRoute(null);

      console.log(`[Hospital Locator] Searching hospitals via backend at Lat ${lat}, Lon ${lon}, Radius ${radius}m, Speciality ${speciality}`);

      try {
        const specQuery = speciality !== 'ALL' ? speciality : undefined;
        const backendHospitals = await fetchHospitalsFromBackend(lat, lon, radius, specQuery, sortOrder);
        if (backendHospitals && backendHospitals.length > 0) {
          setHospitals(backendHospitals);
        } else {
          setHospitals([]);
        }
      } catch (err) {
        console.error('[Hospital Locator] API error fetching hospitals:', err);
        setHospitals([]);
        setError('Unable to fetch nearby hospitals.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle Location Search (Country -> State -> District)
  const handleLocationSearch = async (
    country: string,
    state: string,
    district: string,
    lat?: number,
    lon?: number
  ) => {
    setError(null);
    setActiveRoute(null);

    let targetLat = lat;
    let targetLon = lon;

    if (!targetLat || !targetLon) {
      setLoading(true);
      const geocoded = await fetchGeocodeFromBackend(country, state, district);
      if (geocoded) {
        targetLat = geocoded.latitude;
        targetLon = geocoded.longitude;
      }
    }

    if (targetLat && targetLon) {
      setCenterLat(targetLat);
      setCenterLon(targetLon);
      setCityName(district || 'Selected Location');
      await loadHospitalsForCoordinates(targetLat, targetLon, radiusMeters, selectedCategory, sortBy);
    } else {
      setError('Unable to locate hospitals.');
      setHospitals([]);
      setLoading(false);
    }
  };

  // Handle Use Current Location (Browser GPS)
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      loadHospitalsForCoordinates(centerLat, centerLon, radiusMeters, selectedCategory, sortBy);
      return;
    }

    setLoading(true);
    setError(null);
    setActiveRoute(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log(`[Hospital Locator] GPS Geolocation success: Lat ${latitude}, Lon ${longitude}`);
        setCenterLat(latitude);
        setCenterLon(longitude);
        setCityName('Current Location');
        setHasGeoInitialized(true);
        await loadHospitalsForCoordinates(latitude, longitude, radiusMeters, selectedCategory, sortBy);
      },
      async (err) => {
        console.warn('[Hospital Locator] Geolocation error:', err);
        let errorMsg = 'GPS location permission was blocked or unavailable.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission was blocked by your browser. Please allow location access, or select your State and District manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS location is unavailable on this device.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'GPS location request timed out.';
        }
        setError(errorMsg);
        setHasGeoInitialized(true);
        await loadHospitalsForCoordinates(centerLat, centerLon, radiusMeters, selectedCategory, sortBy);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [centerLat, centerLon, radiusMeters, selectedCategory, sortBy, loadHospitalsForCoordinates]);

  // Initial load on mount: automatically trigger browser GPS location request
  useEffect(() => {
    if (!hasGeoInitialized) {
      handleUseCurrentLocation();
    }
  }, [hasGeoInitialized, handleUseCurrentLocation]);

  // Reload when search parameters change (radius, category, sort order)
  useEffect(() => {
    if (hasGeoInitialized) {
      loadHospitalsForCoordinates(centerLat, centerLon, radiusMeters, selectedCategory, sortBy);
    }
  }, [radiusMeters, selectedCategory, sortBy]);

  // View Driving Route Handler (POST /api/v1/routes)
  const handleViewRoute = async (hospital: Hospital) => {
    setSelectedHospitalId(hospital.id);
    setCenterLat(hospital.lat);
    setCenterLon(hospital.lon);

    const route = await calculateDrivingRouteFromBackend(
      centerLat,
      centerLon,
      hospital.lat,
      hospital.lon,
      hospital.id
    );

    if (route && route.routeAvailable) {
      setActiveRoute(route);
    } else {
      setActiveRoute(null);
      setError('Unable to fetch route for this hospital.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px' }}>
      {/* 1. Location Hierarchy Search */}
      <LocationSearch
        onSearch={handleLocationSearch}
        onUseCurrentLocation={handleUseCurrentLocation}
        isSearching={loading}
      />

      {/* 2. Category & Radius Filters */}
      <HospitalFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        radiusMeters={radiusMeters}
        onRadiusChange={setRadiusMeters}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {error && <ErrorState title="Notice" message={error} />}

      {/* Driving Route Banner (if active) */}
      {activeRoute && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
              🚗 Live Driving Route Active
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
              Distance: <strong>{activeRoute.distance || activeRoute.distanceFormatted}</strong> | ETA: <strong>{activeRoute.duration || activeRoute.durationFormatted}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={activeRoute.navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: '#FFFFFF',
                color: '#1E88E5',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              🗺️ Open in Google Maps ➔
            </a>
            <button
              onClick={() => setActiveRoute(null)}
              style={{
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Clear Route ✖
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Split View: Map & Nearby Hospital Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Nearby Hospital Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              🏥 Nearby Hospitals around {cityName} ({hospitals.length})
            </h3>
          </div>

          {loading ? (
            <LoadingSpinner message={`Searching hospitals near ${cityName}...`} />
          ) : hospitals.length === 0 ? (
            <ErrorState
              title="No hospitals found nearby."
              message="No hospitals found nearby."
            />
          ) : (
            hospitals.map((h) => (
              <HospitalCard
                key={h.id}
                hospital={h}
                isSelected={selectedHospitalId === h.id}
                onViewOnMap={(selected) => {
                  setSelectedHospitalId(selected.id);
                  setCenterLat(selected.lat);
                  setCenterLon(selected.lon);
                }}
                onViewRoute={handleViewRoute}
              />
            ))
          )}
        </div>

        {/* Right Column: Leaflet Map */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="card-3d" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                🗺️ Google / OpenStreetMap Locator
              </h4>
            </div>

            <div style={{ height: '540px', width: '100%', position: 'relative' }}>
              <DynamicLeafletMap
                centerLat={centerLat}
                centerLon={centerLon}
                hospitals={hospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={(h) => setSelectedHospitalId(h.id)}
                routePolyline={activeRoute ? activeRoute.polylineCoordinates : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
