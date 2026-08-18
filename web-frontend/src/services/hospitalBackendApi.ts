import axios from 'axios';
import { Hospital, calculateDistance } from './hospitalService';
import { fetchNearbyOverpassHospitals, convertOverpassNodesToHospitals } from './overpassService';

const getBackendBase = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/hospitals`;
  }
  return 'http://localhost:8085/api/v1/hospitals';
};

const getRootApiBase = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:8085/api/v1';
};

export interface RouteResponse {
  hospitalId: string;
  distanceKm: number;
  distanceFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  polylineCoordinates: [number, number][]; // [lat, lon]
  navigationSteps: string[];
  routeAvailable: boolean;
  navigationUrl: string;
  distance?: string;
  duration?: string;
}

export interface GeocodeResponse {
  lat: number;
  lon: number;
  displayName: string;
  cityName: string;
  latitude?: number;
  longitude?: number;
}

export async function fetchHospitalsFromBackend(
  lat: number,
  lon: number,
  radiusMeters: number = 35000,
  query?: string,
  category?: string
): Promise<Hospital[]> {
  const BACKEND_API_BASE = getBackendBase();
  let resultHospitals: Hospital[] = [];

  try {
    const isSortOption = category && (
      category.toLowerCase().includes('nearest') ||
      category.toLowerCase().includes('highest') ||
      category.toLowerCase().includes('rated') ||
      category.toLowerCase().includes('rating') ||
      category.toLowerCase().includes('open') ||
      category.toLowerCase().includes('distance') ||
      category.toLowerCase() === 'all'
    );
    const validCategory = isSortOption ? undefined : category;
    const validQuery = (query && query.toLowerCase() !== 'all') ? query : undefined;

    console.log(`[Hospital Backend API] Fetching from Spring Boot Geoapify service: Lat ${lat}, Lon ${lon}, Radius ${radiusMeters}m`);
    
    let response;
    try {
      response = await axios.get(`${BACKEND_API_BASE}/nearby`, {
        params: { lat, lon, radius: radiusMeters, query: validQuery, category: validCategory },
        timeout: 6000,
      });
    } catch (errNearby) {
      try {
        response = await axios.get(`${BACKEND_API_BASE}/search`, {
          params: { lat, lon, radius: radiusMeters, query: validQuery, category: validCategory },
          timeout: 6000,
        });
      } catch (errSearch) {
        console.warn('[Hospital Backend API] Spring Boot endpoints unavailable, falling back to live Overpass API');
      }
    }

    if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`[Hospital Backend API] Spring Boot returned ${response.data.length} verified hospitals from Geoapify`);
      resultHospitals = response.data;
    }
  } catch (error) {
    console.warn('[Hospital Backend API] Backend Geoapify endpoint error:', error);
  }

  // Fallback to Live Overpass API if backend returned 0 results
  if (resultHospitals.length === 0) {
    try {
      console.log(`[Hospital Backend API] Querying Overpass API directly for live hospitals around Lat ${lat}, Lon ${lon}`);
      const rawNodes = await fetchNearbyOverpassHospitals(lat, lon, Math.max(radiusMeters, 35000));
      resultHospitals = convertOverpassNodesToHospitals(rawNodes, lat, lon);
    } catch (errOverpass) {
      console.warn('[Hospital Backend API] Overpass API fallback failed:', errOverpass);
    }
  }

  // Ensure Saveetha Medical College Hospital is always included if user is within 60km (Chennai / Kanchipuram / Sriperumbudur region)
  const saveethaLat = 13.0246229;
  const saveethaLon = 80.0173334;
  const distToSaveetha = calculateDistance(lat, lon, saveethaLat, saveethaLon);

  if (distToSaveetha <= 60 && !resultHospitals.some((h) => h.name.toLowerCase().includes('saveetha'))) {
    resultHospitals.push({
      id: 'saveetha-medical-college-hospital',
      name: 'Saveetha Medical College Hospital',
      rating: 4.8,
      distanceKm: distToSaveetha,
      distanceFormatted: `${distToSaveetha} km`,
      lat: saveethaLat,
      lon: saveethaLon,
      address: 'Saveetha Medical College Hospital, Campus Road, Thandalam, Sriperumbudur, Kanchipuram, Tamil Nadu 602105',
      phone: '+91 44 6672 6672',
      category: 'Medical College',
      specialization: 'Multi-Specialty & Tertiary Healthcare Research',
      isEmergency: true,
      isOpen24Hours: true,
      facilities: ['24/7 Emergency & ICU', 'Super Specialty Trauma Center', 'Diagnostic Laboratory', 'Blood Bank'],
    });
    resultHospitals.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return resultHospitals;
}

const formatRouteData = (data: any): RouteResponse => ({
  ...data,
  distance: data.distanceFormatted || `${data.distanceKm} km`,
  duration: data.durationFormatted || `${data.durationMinutes} mins`,
});

export async function calculateDrivingRouteFromBackend(
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number,
  hospitalId: string
): Promise<RouteResponse | null> {
  const BACKEND_API_BASE = getBackendBase();
  const ROOT_API_BASE = getRootApiBase();
  console.log(`[Hospital Backend API] Requesting driving route from Spring Boot OpenRouteService to hospital: ${hospitalId}`);

  try {
    const response = await axios.post(`${BACKEND_API_BASE}/route`, {
      originLat,
      originLon,
      destinationLat,
      destinationLon,
      hospitalId,
    }, { timeout: 10000 });

    if (response.data && response.data.routeAvailable) {
      return formatRouteData(response.data);
    }
  } catch (errPost) {
    try {
      const response = await axios.get(`${BACKEND_API_BASE}/route`, {
        params: { originLat, originLon, destinationLat, destinationLon, hospitalId },
        timeout: 10000,
      });
      if (response.data && response.data.routeAvailable) {
        return formatRouteData(response.data);
      }
    } catch (errGet) {
      try {
        const response = await axios.get(`${ROOT_API_BASE}/routes`, {
          params: { originLat, originLon, destinationLat, destinationLon, hospitalId },
          timeout: 10000,
        });
        if (response.data && response.data.routeAvailable) {
          return formatRouteData(response.data);
        }
      } catch (errRoutes) {
        console.warn('[Hospital Backend API] OpenRouteService route calculation failed:', errRoutes);
      }
    }
  }

  return null;
}

export async function geocodeLocationFromBackend(
  country?: string,
  state?: string,
  district?: string,
  city?: string,
  customLocation?: string
): Promise<GeocodeResponse | null> {
  const rootBase = getRootApiBase();
  try {
    const response = await axios.get(`${rootBase}/location/geocode`, {
      params: { country, state, district, city, customLocation },
      timeout: 8000,
    });
    if (response.data && response.data.lat && response.data.lon) {
      return {
        ...response.data,
        latitude: response.data.lat,
        longitude: response.data.lon,
      };
    }
  } catch (error) {
    console.warn('[Hospital Backend API] Geoapify Geocoding API request error:', error);
  }
  return null;
}

export const fetchGeocodeFromBackend = geocodeLocationFromBackend;
