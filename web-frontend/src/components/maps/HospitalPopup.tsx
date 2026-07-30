import React from 'react';
import { Hospital } from '../../services/hospitalService';

interface HospitalPopupProps {
  hospital: Hospital;
}

export default function HospitalPopup({ hospital }: HospitalPopupProps) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`;

  return (
    <div style={{ padding: '6px', minWidth: '220px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{
          background: 'rgba(30, 136, 229, 0.12)',
          color: '#1E88E5',
          fontSize: '0.65rem',
          fontWeight: 800,
          padding: '2px 6px',
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}>
          {hospital.category}
        </span>
        {hospital.isEmergency && (
          <span style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#DC2626',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            🚨 24/7 Emergency
          </span>
        )}
      </div>

      <strong style={{ display: 'block', fontSize: '0.98rem', color: '#1E293B', lineHeight: '1.3' }}>
        🏥 {hospital.name}
      </strong>

      {hospital.address ? (
        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 8px' }}>
          📍 {hospital.address}
        </p>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E88E5' }}>
          📍 Distance: {hospital.distanceFormatted}
        </span>
        {hospital.rating && hospital.rating > 0 ? (
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B' }}>
            ⭐ {hospital.rating} / 5.0
          </span>
        ) : null}
      </div>

      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '10px' }}>
        Coordinates: {hospital.lat.toFixed(4)}, {hospital.lon.toFixed(4)}
      </div>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          padding: '8px',
          background: '#1E88E5',
          color: '#FFFFFF',
          textAlign: 'center',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 800,
          textDecoration: 'none'
        }}
      >
        🗺️ Navigate (Google Maps)
      </a>
    </div>
  );
}
