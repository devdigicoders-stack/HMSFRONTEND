import React from 'react';

const FormField = ({
  label,
  name,
  error,
  helperText,
  required = false,
  icon: Icon,
  children
}) => {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            fontWeight: 650,
            color: '#334155',
            marginBottom: '0.4rem',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          <span>
            {label}
            {required && (
              <span className="req-star" style={{ color: '#ef4444', marginLeft: 3, fontWeight: 700 }}>*</span>
            )}
          </span>
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <Icon size={16} />
          </div>
        )}
        <div style={{ paddingLeft: Icon ? 34 : 0 }}>
          {children}
        </div>
      </div>

      {helperText && !error && (
        <div style={{
          fontSize: '0.7rem',
          color: '#94A3B8',
          marginTop: '0.3rem',
          fontWeight: 450,
          lineHeight: 1.4
        }}>
          {helperText}
        </div>
      )}

      {error && (
        <div style={{
          fontSize: '0.7rem',
          color: '#E11D48',
          marginTop: '0.3rem',
          fontWeight: 550,
          lineHeight: 1.4
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
