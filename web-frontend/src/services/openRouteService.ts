import axios from 'axios';

export const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM0ZGZjYTcxYmUzNjQ1MWU5MzFiYzU4NzQzOTYyODRlIiwiaCI6Im11cm11cjY0In0=';
export const ORS_BASE_URL = 'https://api.openrouteservice.org';

export interface RouteTelemetry {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet Polyline
  distanceKm: number;
  drivingTimeMins: number;
  walkingTimeMins: number;
  snapped: boolean;
}

// In-memory cache for directions route calculations
const routeCache = new Map<string, RouteTelemetry>();

// Helper to snap off-road coordinates to nearest drivable road
async function snapToNearestRoad(lat: number, lng: number): Promise<[number, number]> {
  try {
    const res = await axios.post(
      `${ORS_BASE_URL}/v2/snap/driving-car`,
      {
        locations: [[lng, lat]],
        radius: 500, // 500 meter search radius for nearest road
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const snappedLoc = res.data?.locations?.[0]?.location;
    if (snappedLoc && Array.isArray(snappedLoc)) {
      return [snappedLoc[1], snappedLoc[0]]; // Return [snappedLat, snappedLng]
    }
  } catch {
    // Return original if snap endpoint fails
  }
  return [lat, lng];
}

export async function fetchORSRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteTelemetry> {
  const cacheKey = `${startLat.toFixed(4)}_${startLng.toFixed(4)}_${endLat.toFixed(4)}_${endLng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  let destLat = endLat;
  let destLng = endLng;
  let isSnapped = false;

  try {
    // 1. Primary Request: Fetch Driving Route from OpenRouteService
    const drivingRes = await axios.post(
      `${ORS_BASE_URL}/v2/directions/driving-car/geojson`,
      {
        coordinates: [
          [startLng, startLat],
          [endLng, endLat],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    const feature = drivingRes.data?.features?.[0];
    const rawCoords: [number, number][] = feature?.geometry?.coordinates || [];
    const summary = feature?.properties?.summary || {};

    const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);
    const distanceMeters = summary.distance || 0;
    const durationSeconds = summary.duration || 0;

    const distanceKm = Number((distanceMeters / 1000).toFixed(1));
    const drivingTimeMins = Math.max(1, Math.round(durationSeconds / 60));
    const walkingTimeMins = Math.max(1, Math.round(drivingTimeMins * 4.2));

    const telemetry: RouteTelemetry = {
      coordinates: leafletCoords,
      distanceKm,
      drivingTimeMins,
      walkingTimeMins,
      snapped: false,
    };

    routeCache.set(cacheKey, telemetry);
    return telemetry;
  } catch (error) {
    console.warn('Initial ORS routing failed, attempting road snapping:', error);

    // 2. Fallback: Snap destination to nearest road coordinate and retry
    try {
      const [snappedLat, snappedLng] = await snapToNearestRoad(endLat, endLng);
      destLat = snappedLat;
      destLng = snappedLng;
      isSnapped = true;

      const retryRes = await axios.post(
        `${ORS_BASE_URL}/v2/directions/driving-car/geojson`,
        {
          coordinates: [
            [startLng, startLat],
            [destLng, destLat],
          ],
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const feature = retryRes.data?.features?.[0];
      const rawCoords: [number, number][] = feature?.geometry?.coordinates || [];
      const summary = feature?.properties?.summary || {};

      const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);
      const distanceMeters = summary.distance || 0;
      const durationSeconds = summary.duration || 0;

      const distanceKm = Number((distanceMeters / 1000).toFixed(1));
      const drivingTimeMins = Math.max(1, Math.round(durationSeconds / 60));

      const telemetry: RouteTelemetry = {
        coordinates: leafletCoords,
        distanceKm,
        drivingTimeMins,
        walkingTimeMins: Math.max(1, Math.round(drivingTimeMins * 4)),
        snapped: true,
      };

      routeCache.set(cacheKey, telemetry);
      return telemetry;
    } catch (retryErr) {
      console.error('ORS Road Snap routing error:', retryErr);

      // Emergency Geodesic Path fallback if road routing service unavailable
      const R = 6371; // Earth radius km
      const dLat = ((endLat - startLat) * Math.PI) / 180;
      const dLon = ((endLng - startLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startLat * Math.PI) / 180) *
          Math.cos((endLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const roadEstimateKm = Number((R * c * 1.3).toFixed(1)); // Apply 1.3x road detour factor

      return {
        coordinates: [
          [startLat, startLng],
          [endLat, endLng],
        ],
        distanceKm: roadEstimateKm,
        drivingTimeMins: Math.max(2, Math.round(roadEstimateKm * 2.2)),
        walkingTimeMins: Math.max(5, Math.round(roadEstimateKm * 12)),
        snapped: isSnapped,
      };
    }
  }
}
