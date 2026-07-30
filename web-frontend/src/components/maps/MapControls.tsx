import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControlsProps {
  lat: number;
  lon: number;
  zoom?: number;
}

export default function MapControls({ lat, lon, zoom = 13 }: MapControlsProps) {
  const map = useMap();

  useEffect(() => {
    if (map && lat && lon) {
      console.log(`[Map Controls] Recentering OpenStreetMap smoothly to Lat ${lat}, Lon ${lon}`);
      map.flyTo([lat, lon], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [map, lat, lon, zoom]);

  return null;
}
