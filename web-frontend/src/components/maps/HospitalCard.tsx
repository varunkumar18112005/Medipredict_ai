import React from 'react';
import { Hospital } from '../../services/hospitalService';

interface HospitalCardProps {
  hospital: Hospital;
  isSelected?: boolean;
  onViewOnMap: (hospital: Hospital) => void;
  onViewRoute?: (hospital: Hospital) => void;
}

export default function HospitalCard({
  hospital,
  isSelected = false,
  onViewOnMap,
  onViewRoute,
}: HospitalCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`;

  return (
    <div
      className="card-3d"
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: isSelected ? 'rgba(30, 136, 229, 0.05)' : '#FFFFFF',
        borderTop: isSelected ? '2px solid #1E88E5' : '1px solid #E2E8F0',
        borderRight: isSelected ? '2px solid #1E88E5' : '1px solid #E2E8F0',
        borderBottom: isSelected ? '2px solid #1E88E5' : '1px solid #E2E8F0',
        borderLeft: `5px solid ${hospital.isEmergency ? '#EF5350' : '#1E88E5'}`,
        transition: 'all 0.25s ease',
        boxShadow: isSelected ? '0 10px 30px rgba(30, 136, 229, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(30, 136, 229, 0.1)',
              color: '#1E88E5',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              {hospital.category}
            </span>
            {hospital.specialization && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                🩺 {hospital.specialization}
              </span>
            )}
            {hospital.isEmergency && (
              <span style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF5350',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                🚨 24/7 Emergency Care
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>
            {hospital.name}
          </h3>

          {hospital.address ? (
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              📍 {hospital.address}
            </p>
          ) : null}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#1E88E5',
            display: 'inline-block'
          }}>
            📍 {hospital.distanceFormatted}
          </span>
          {hospital.rating && hospital.rating > 0 ? (
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', display: 'block', marginTop: '4px' }}>
              ⭐ {hospital.rating} / 5.0
            </span>
          ) : null}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px dashed #E2E8F0',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {hospital.phone ? (
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
            📞 Contact: <strong>{hospital.phone}</strong>
          </span>
        ) : (
          <span />
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onViewRoute && (
            <button
              onClick={() => onViewRoute(hospital)}
              className="btn-3d-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#E3F2FD',
                color: '#1E88E5',
                border: '1px solid #90CAF9'
              }}
            >
              🚗 View Driving Route
            </button>
          )}

          <button
            onClick={() => onViewOnMap(hospital)}
            className="btn-3d-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🗺️ View on Map
          </button>
          
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ↗️ Navigate
          </a>
        </div>
      </div>
    </div>
  );
}
