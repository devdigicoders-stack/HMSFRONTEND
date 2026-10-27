import React from 'react';
import { IoFolderOpenOutline } from 'react-icons/io5';

const EmptyState = ({
  icon: Icon = IoFolderOpenOutline,
  title = 'No Records Found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`glass-card p-5 text-center d-flex flex-column align-items-center justify-content-center ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.6)'
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--mint)',
          color: 'var(--primary-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.6rem',
          marginBottom: '1rem'
        }}
      >
        <Icon />
      </div>

      <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
        {title}
      </h5>

      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 0 1.25rem 0' }}>
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn btn-sm btn-primary px-3"
          style={{
            backgroundColor: 'var(--primary-green)',
            borderColor: 'var(--primary-green)',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
