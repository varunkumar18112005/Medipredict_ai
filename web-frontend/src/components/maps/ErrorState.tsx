import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ title = 'Notice', message, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.06)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '20px auto'
    }}>
      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>⚠️</span>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: "#DC2626", margin: '0 0 6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '14px',
            padding: '8px 16px',
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
