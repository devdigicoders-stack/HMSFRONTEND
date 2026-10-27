import React from 'react';
import HospitalBrandLogo from './HospitalBrandLogo';

const LoadingSpinner = ({ text = 'Loading clinical data...', fullPage = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div style={{ position: 'relative', width: 48, height: 48, marginBottom: '0.85rem' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid var(--mint)',
            borderTopColor: 'var(--primary-green)',
            animation: 'spin 0.85s linear infinite'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <HospitalBrandLogo size={20} />
        </div>
      </div>
      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {text}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '80vh', width: '100%' }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
