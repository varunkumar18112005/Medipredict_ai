import axios from 'axios';
import { API_URL } from './api';

const MOBILE_API_BASE = API_URL || 'http://localhost:8085/api/v1';

export interface MobileHospital {
  id: string;
  placeId: string;
  name: string;
  hospitalName: string;
  lat: number;
  latitude: number;
  lon: number;
  longitude: number;
  address: string;
  phone: string;
  website: string;
  rating: number;
  totalRatings: number;
  category: string;
  specialization: string;
  isEmergency: boolean;
  isOpen24Hours: boolean;
  openNow: boolean;
  distanceKm: number;
  distanceFormatted: string;
  facilities: string[];
  types: string[];
}

export interface MobileGeocodeResponse {
  latitude: number;
  longitude: number;
}

export interface MobileRouteResponse {
  hospitalId: string;
  distance: string;
  distanceKm: number;
  distanceMeters: number;
  distanceFormatted: string;
  duration: string;
  durationMinutes: number;
  durationSeconds: number;
  durationFormatted: string;
  encodedPolyline: string;
  polylineCoordinates: [number, number][];
  navigationSteps: string[];
  routeAvailable: boolean;
  navigationUrl: string;
}

export async function fetchMobileGeocode(
  country?: string,
  state?: string,
  district?: string
): Promise<MobileGeocodeResponse | null> {
  try {
    const res = await axios.get(`${MOBILE_API_BASE}/location/geocode`, {
      params: { country, state, district },
      timeout: 10000,
    });
    if (res.data && res.data.latitude && res.data.longitude) {
      return res.data;
    }
  } catch (err) {
    console.warn('[Mobile Hospital API] Geocode failed:', err);
  }
  return null;
}

export async function fetchMobileHospitals(
  lat: number,
  lon: number,
  radiusMeters: number = 25000,
  speciality?: string,
  sortBy?: string
): Promise<MobileHospital[]> {
  try {
    const res = await axios.get(`${MOBILE_API_BASE}/hospitals/nearby`, {
      params: {
        latitude: lat,
        lat,
        longitude: lon,
        lon,
        radius: radiusMeters,
        speciality,
        query: speciality,
        sortBy,
      },
      timeout: 10000,
    });
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((h: any) => ({
        id: h.placeId || h.id,
        placeId: h.placeId || h.id,
        name: h.hospitalName || h.name,
        hospitalName: h.hospitalName || h.name,
        lat: h.latitude || h.lat,
        latitude: h.latitude || h.lat,
        lon: h.longitude || h.lon,
        longitude: h.longitude || h.lon,
        address: h.address || '',
        phone: h.phone || '',
        website: h.website || '',
        rating: h.rating || 0,
        totalRatings: h.totalRatings || h.userRatingsTotal || 0,
        category: h.category || 'Speciality Hospital',
        specialization: h.specialization || speciality || 'General Medicine',
        isEmergency: h.isEmergency !== undefined ? h.isEmergency : true,
        isOpen24Hours: h.isOpen24Hours !== undefined ? h.isOpen24Hours : true,
        openNow: h.openNow !== undefined ? h.openNow : true,
        distanceKm: h.distanceKm || 0,
        distanceFormatted: h.distanceFormatted || `${h.distanceKm || 0} km`,
        facilities: h.facilities || [],
        types: h.types || [],
      }));
    }
  } catch (err) {
    console.warn('[Mobile Hospital API] Request failed:', err);
  }
  return [];
}

export async function fetchMobileDrivingRoute(
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number,
  hospitalId: string = ''
): Promise<MobileRouteResponse | null> {
  try {
    const res = await axios.post(`${MOBILE_API_BASE}/routes`, {
      originLat,
      originLng: originLon,
      destinationLat,
      destinationLng: destinationLon,
      hospitalId,
    }, { timeout: 10000 });

    if (res.data && res.data.routeAvailable) {
      return res.data;
    }
  } catch (err) {
    console.warn('[Mobile Hospital API] Route request failed:', err);
    try {
      const res = await axios.get(`${MOBILE_API_BASE}/hospitals/route`, {
        params: {
          originLat,
          originLon,
          destinationLat,
          destinationLon,
          hospitalId,
        },
        timeout: 8000,
      });
      if (res.data && res.data.routeAvailable) {
        return res.data;
      }
    } catch (fallbackErr) {
      console.warn('[Mobile Hospital API] GET route fallback failed:', fallbackErr);
    }
  }
  return null;
}
