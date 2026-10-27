import React from 'react';

const PageHeader = ({ title, subtitle, actionButton }) => {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 650, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: '#64748B', fontSize: '0.84rem', fontWeight: 400, margin: '0.25rem 0 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
