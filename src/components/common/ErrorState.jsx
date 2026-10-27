import React from 'react';
import { IoAlertCircleOutline, IoRefreshOutline } from 'react-icons/io5';

const ErrorState = ({
  title = 'Failed to Load Information',
  message = 'An unexpected error occurred while communicating with the hospital database.',
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`glass-card p-4 text-center d-flex flex-column align-items-center justify-content-center ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--danger-border)',
        background: 'var(--danger-bg)'
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          marginBottom: '0.75rem',
          boxShadow: '0 2px 8px rgba(220, 91, 91, 0.15)'
        }}
      >
        <IoAlertCircleOutline />
      </div>

      <h6 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger)', margin: '0 0 0.25rem 0' }}>
        {title}
      </h6>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 0 1rem 0' }}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 px-3"
          style={{ fontSize: '0.8rem', fontWeight: 600 }}
        >
          <IoRefreshOutline size={15} /> Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
