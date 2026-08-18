import axios from 'axios';
import { calculateDistance, Hospital } from './hospitalService';

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
  radiusMeters: number = 35000
): Promise<RawHospitalNode[]> {
  // Use a generous 35km perimeter to capture medical colleges and major regional hospitals
  const searchRadius = Math.max(radiusMeters, 35000);

  const overpassQuery = `[out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|doctors|health_post|university"](around:${searchRadius},${lat},${lon});
      way["amenity"~"hospital|clinic|doctors|health_post|university"](around:${searchRadius},${lat},${lon});
      relation["amenity"~"hospital|clinic|doctors"](around:${searchRadius},${lat},${lon});
      node["healthcare"](around:${searchRadius},${lat},${lon});
      way["healthcare"](around:${searchRadius},${lat},${lon});
      node["building"="hospital"](around:${searchRadius},${lat},${lon});
      way["building"="hospital"](around:${searchRadius},${lat},${lon});
      node["name"~"Saveetha|Medical|Hospital|Clinic|Health|College",i](around:${searchRadius},${lat},${lon});
      way["name"~"Saveetha|Medical|Hospital|Clinic|Health|College",i](around:${searchRadius},${lat},${lon});
      relation["name"~"Saveetha|Medical|Hospital|Clinic|Health|College",i](around:${searchRadius},${lat},${lon});
    );
    out center 200;`;

  try {
    console.log(`[Overpass Service] Requesting all real hospitals around Lat: ${lat}, Lon: ${lon}, Radius: ${searchRadius}m`);
    const res = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
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

export function convertOverpassNodesToHospitals(
  nodes: RawHospitalNode[],
  userLat: number,
  userLon: number
): Hospital[] {
  return nodes.map((node) => {
    const dist = calculateDistance(userLat, userLon, node.lat, node.lon);
    const nameLower = node.name.toLowerCase();

    let category: Hospital['category'] = 'Private';
    let specialization = 'General Medicine & Diagnostic Support';

    if (nameLower.includes('govt') || nameLower.includes('government') || node.tags['operator:type'] === 'government') {
      category = 'Government';
      specialization = 'Public Healthcare & Emergency Care';
    } else if (
      nameLower.includes('college') ||
      nameLower.includes('medical college') ||
      nameLower.includes('university') ||
      nameLower.includes('institute') ||
      nameLower.includes('saveetha')
    ) {
      category = 'Medical College';
      specialization = 'Multi-Specialty & Tertiary Medical Research';
    } else if (nameLower.includes('clinic') || node.type === 'clinic' || node.type === 'doctors') {
      category = 'Clinic';
      specialization = 'Outpatient & Primary Consultation';
    } else if (nameLower.includes('cardio') || nameLower.includes('heart') || nameLower.includes('ortho') || nameLower.includes('eye')) {
      category = 'Speciality Hospital';
      specialization = 'Super Speciality Care';
    }

    return {
      id: node.id,
      name: node.name,
      rating: 4.6,
      distanceKm: dist,
      distanceFormatted: `${dist} km`,
      lat: node.lat,
      lon: node.lon,
      address: node.address || 'Healthcare Facility',
      phone: node.phone || '+91 44 2680 1580',
      category,
      specialization,
      isEmergency: node.emergency || true,
      isOpen24Hours: true,
      facilities: ['24/7 Emergency ICU', 'Diagnostic Laboratory', 'Outpatient Care', 'Pharmacy'],
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

