import axios from 'axios';

export interface RawHospitalNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  phone: string;
  emergency: boolean;
  type: string;
  tags: Record<string, string>;
}

export async function fetchNearbyOverpassHospitals(
  lat: number,
  lon: number,
  radiusMeters: number = 25000
): Promise<RawHospitalNode[]> {
  // Use a generous 25km-30km perimeter to capture at least 15-30 real hospitals for the district
  const searchRadius = Math.max(radiusMeters, 25000);

  const overpassQuery = `[out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|doctors|health_post"](around:${searchRadius},${lat},${lon});
      way["amenity"~"hospital|clinic|doctors|health_post"](around:${searchRadius},${lat},${lon});
      relation["amenity"~"hospital|clinic|doctors"](around:${searchRadius},${lat},${lon});
      node["healthcare"~"hospital|clinic|doctor|centre"](around:${searchRadius},${lat},${lon});
      way["healthcare"~"hospital|clinic|doctor|centre"](around:${searchRadius},${lat},${lon});
      node["building"="hospital"](around:${searchRadius},${lat},${lon});
      way["building"="hospital"](around:${searchRadius},${lat},${lon});
    );
    out center 150;`;

  try {
    console.log(`[Overpass Service] Requesting all real hospitals around Lat: ${lat}, Lon: ${lon}, Radius: ${searchRadius}m`);
    const res = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 12000,
    });

    if (res.data && Array.isArray(res.data.elements)) {
      const elements = res.data.elements.filter((el: any) => el.tags && (el.tags.name || el.tags['name:en']));
      
      const hospitals: RawHospitalNode[] = elements.map((el: any) => {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'];
        const nodeLat = el.lat || el.center?.lat || lat;
        const nodeLon = el.lon || el.center?.lon || lon;

        const street = tags['addr:street'] || tags['addr:suburb'] || tags['addr:district'] || '';
        const city = tags['addr:city'] || '';
        const fullAddr = tags['addr:full'] || [street, city].filter(Boolean).join(', ');

        const phone = tags.phone || tags['contact:phone'] || '';
        const isEmergency = tags.emergency === 'yes' || tags.emergency === '24/7';
        const amenityType = tags.amenity || tags.healthcare || 'hospital';

        return {
          id: `overpass-${el.id}`,
          name,
          lat: nodeLat,
          lon: nodeLon,
          address: fullAddr,
          phone,
          emergency: isEmergency,
          type: amenityType,
          tags,
        };
      });

      console.log(`[Overpass Service] Successfully returned ${hospitals.length} real hospitals`);
      return hospitals;
    }
  } catch (error) {
    console.warn('[Overpass Service] Overpass API query error:', error);
  }

  return [];
}
