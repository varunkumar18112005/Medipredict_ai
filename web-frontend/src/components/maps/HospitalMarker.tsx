import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Hospital } from '../../services/hospitalService';
import HospitalPopup from './HospitalPopup';

interface HospitalMarkerProps {
  hospital: Hospital;
  isSelected?: boolean;
  onSelect?: (hospital: Hospital) => void;
}

const createCategoryIcon = (category: string, isSelected: boolean = false) => {
  let bgGradient = 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)';
  let emoji = '🏥';

  if (category === 'Government') {
    bgGradient = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
    emoji = '🏛️';
  } else if (category === 'Clinic') {
    bgGradient = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    emoji = '🩺';
  } else if (category === 'Medical College') {
    bgGradient = 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)';
    emoji = '🎓';
  } else if (category === 'Speciality Hospital') {
    bgGradient = 'linear-gradient(135deg, #EF5350 0%, #DC2626 100%)';
    emoji = '🔬';
  }

  const border = isSelected ? '4px solid #F59E0B' : '2.5px solid #FFFFFF';
  const transform = isSelected ? 'scale(1.25)' : 'scale(1)';
  const shadow = isSelected
    ? '0 0 20px rgba(245, 158, 11, 0.8)'
    : '0 6px 18px rgba(0, 0, 0, 0.25)';

  return L.divIcon({
    className: 'custom-hospital-marker-icon',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${bgGradient};
        border: ${border};
        border-radius: 50%;
        box-shadow: ${shadow};
        transform: ${transform};
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 17px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function HospitalMarker({ hospital, isSelected = false, onSelect }: HospitalMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const icon = createCategoryIcon(hospital.category, isSelected);

  return (
    <Marker
      ref={markerRef}
      position={[hospital.lat, hospital.lon]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect && onSelect(hospital),
      }}
    >
      <Popup>
        <HospitalPopup hospital={hospital} />
      </Popup>
    </Marker>
  );
}
