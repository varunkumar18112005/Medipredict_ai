import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid #E2E8F0',
        borderTop: '3px solid #1E88E5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
        {message}
      </span>
    </div>
  );
}
