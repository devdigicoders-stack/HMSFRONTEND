import React from 'react';
import { IoTrendingUpOutline, IoTrendingDownOutline } from 'react-icons/io5';

const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = 'primary', // 'primary', 'teal', 'success', 'warning', 'danger', 'info'
  subtext,
  trend, // e.g. "+12.4%" or "-3.2%"
  trendUp = true,
  onClick,
  className = '',
  style = {}
}) => {
  const getTheme = () => {
    switch (variant) {
      case 'teal':
      case 'info':
        return {
          bg: 'rgba(14, 159, 173, 0.12)',
          color: '#0E9FAD',
          border: 'rgba(14, 159, 173, 0.25)',
          glow: 'rgba(14, 159, 173, 0.18)'
        };
      case 'warning':
        return {
          bg: 'rgba(230, 162, 60, 0.12)',
          color: '#E6A23C',
          border: 'rgba(230, 162, 60, 0.25)',
          glow: 'rgba(230, 162, 60, 0.15)'
        };
      case 'danger':
        return {
          bg: 'rgba(220, 91, 91, 0.12)',
          color: '#DC5B5B',
          border: 'rgba(220, 91, 91, 0.25)',
          glow: 'rgba(220, 91, 91, 0.15)'
        };
      case 'success':
      case 'primary':
      default:
        return {
          bg: 'rgba(21, 150, 107, 0.12)',
          color: '#15966B',
          border: 'rgba(21, 150, 107, 0.25)',
          glow: 'rgba(21, 150, 107, 0.16)'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      onClick={onClick}
      className={`glass-card stat-card ${onClick ? 'cursor-pointer' : ''} glass-card-interactive h-100 w-100 ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '1.15rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        minHeight: '106px',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          className="stat-card-title text-truncate"
          style={{
            fontSize: '0.78rem',
            fontWeight: 500,
            color: '#64748B',
            marginBottom: '0.2rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={title}
        >
          {title}
        </div>
        <div
          className="stat-card-value"
          style={{
            fontSize: '1.65rem',
            fontWeight: 650,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            lineHeight: 1.15
          }}
        >
          {value !== undefined && value !== null ? value : '—'}
        </div>

        {(trend || subtext) && (
          <div
            className="d-flex align-items-center gap-1.5 mt-1"
            style={{
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {trend && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  color: trendUp ? '#059669' : '#DC2626',
                  backgroundColor: trendUp ? '#ECFDF5' : '#FEF2F2',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  flexShrink: 0
                }}
              >
                {trendUp ? <IoTrendingUpOutline size={12} /> : <IoTrendingDownOutline size={12} />}
                {trend}
              </span>
            )}
            {subtext && (
              <span
                className="text-truncate"
                style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 400 }}
                title={subtext}
              >
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>

      {Icon && (
        <div
          className="stat-card-icon-wrapper"
          style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            backgroundColor: theme.bg,
            color: theme.color,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: `0 4px 12px ${theme.glow}`,
            flexShrink: 0
          }}
        >
          <Icon />
        </div>
      )}
    </div>
  );
};

export default StatCard;
