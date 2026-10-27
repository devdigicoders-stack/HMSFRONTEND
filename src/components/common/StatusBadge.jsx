import React from 'react';

/**
 * Standardized Status Badge component matching user reference screenshot:
 * Soft pastel capsule pill (rounded-full) with 1px matching border and leading bullet dot.
 * - Admitted / Cancelled / Rejected / Critical -> Soft Rose Red (#FFF1F2, border: #FECDD3, text: #E11D48)
 * - Under Treatment / In Progress / Accepted -> Soft Sky Blue (#EFF6FF, border: #BFDBFE, text: #2563EB)
 * - Discharged / Confirmed / Completed / Active -> Soft Mint Green (#ECFDF5, border: #A7F3D0, text: #059669)
 * - Pending / Requested / Sample Collected -> Soft Warm Amber (#FFFBEB, border: #FDE68A, text: #D97706)
 */
const StatusBadge = ({ status, className = '', style = {} }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  let badgeClass = 'badge-status-neutral';
  let config = {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#64748B'
  };

  // Rose / Red (Admitted, Cancelled, Rejected, Inactive, Critical, Abnormal, etc.)
  if (['admitted', 'cancelled', 'rejected', 'inactive', 'critical', 'abnormal', 'high', 'low', 'stat', 'failed'].includes(normalized)) {
    badgeClass = 'badge-status-danger';
    config = {
      bg: '#FFF1F2',
      border: '#FECDD3',
      color: '#E11D48'
    };
  }
  // Green / Mint (Discharged, Completed, Confirmed, Active, Normal, Published, Reviewed, Available)
  else if (['discharged', 'completed', 'confirmed', 'active', 'normal', 'published', 'reviewed', 'available', 'success'].includes(normalized)) {
    badgeClass = 'badge-status-success';
    config = {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669'
    };
  }
  // Blue / Sky (Under Treatment, In Progress, Accepted, Scheduled, Processing)
  else if (['under treatment', 'accepted', 'in progress', 'scheduled', 'processing', 'ongoing'].includes(normalized)) {
    badgeClass = 'badge-status-info';
    config = {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      color: '#2563EB'
    };
  }
  // Amber / Warm (Pending, Requested, Sample Collected, Waiting, Urgent)
  else if (['pending', 'requested', 'sample collected', 'waiting', 'urgent'].includes(normalized)) {
    badgeClass = 'badge-status-warning';
    config = {
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#D97706'
    };
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        fontSize: '11.5px',
        fontWeight: 600,
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: config.border,
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.25,
        ...style
      }}
      className={`badge-status ${badgeClass} ${className}`}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          flexShrink: 0
        }}
        className="badge-status-dot"
      />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
