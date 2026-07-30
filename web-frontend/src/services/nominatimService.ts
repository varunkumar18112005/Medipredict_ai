import axios from 'axios';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  cityName: string;
}

const geocodeCache = new Map<string, GeocodeResult>();

// Fallback coordinate dictionary for instant offline resolution
const KNOWN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'coimbatore, tamil nadu, india': { lat: 11.0168, lon: 76.9558 },
  'chennai, tamil nadu, india': { lat: 13.0827, lon: 80.2707 },
  'madurai, tamil nadu, india': { lat: 9.9252, lon: 78.1198 },
  'kanchipuram, tamil nadu, india': { lat: 13.0284, lon: 80.0152 },
  'tirupati, andhra pradesh, india': { lat: 13.6288, lon: 79.4192 },
  'visakhapatnam, andhra pradesh, india': { lat: 17.6868, lon: 83.2185 },
  'vijayawada, andhra pradesh, india': { lat: 16.5062, lon: 80.6480 },
  'guntur, andhra pradesh, india': { lat: 16.3067, lon: 80.4365 },
  'anantapur, andhra pradesh, india': { lat: 14.6819, lon: 77.6006 },
  'hyderabad, telangana, india': { lat: 17.3850, lon: 78.4867 },
  'warangal, telangana, india': { lat: 17.9689, lon: 79.5941 },
  'bengaluru, karnataka, india': { lat: 12.9716, lon: 77.5946 },
  'mysuru, karnataka, india': { lat: 12.2958, lon: 76.6394 },
  'mumbai, maharashtra, india': { lat: 19.0760, lon: 72.8777 },
  'pune, maharashtra, india': { lat: 18.5204, lon: 73.8567 },
};

export async function geocodeLocation(
  country: string,
  state: string,
  district: string
): Promise<GeocodeResult | null> {
  const query = [district, state, country].filter(Boolean).join(', ');
  const key = query.toLowerCase();
  const cacheKey = `geo_${key.replace(/\s+/g, '_')}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Check known offline coordinates dictionary first
  if (KNOWN_COORDINATES[key]) {
    const known = KNOWN_COORDINATES[key];
    const result: GeocodeResult = {
      lat: known.lat,
      lon: known.lon,
      displayName: query,
      cityName: district,
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1,
        addressdetails: 1,
      },
      headers: {
        'Accept-Language': 'en',
      },
      timeout: 8000,
    });

    if (response.data && response.data.length > 0) {
      const match = response.data[0];
      const result: GeocodeResult = {
        lat: parseFloat(match.lat),
        lon: parseFloat(match.lon),
        displayName: match.display_name,
        cityName: district || match.display_name.split(',')[0],
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.warn('[Nominatim Service] Geocoding request failed, checking partial matches:', error);
  }

  // Partial match fallback on city name
  const distKey = district.toLowerCase();
  for (const [k, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (k.includes(distKey)) {
      const result: GeocodeResult = {
        lat: coords.lat,
        lon: coords.lon,
        displayName: query,
        cityName: district,
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
  }

  return null;
}
