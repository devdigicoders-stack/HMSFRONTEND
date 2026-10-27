import React from 'react';
import {
  IoEyeOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoCloseCircleOutline,
  IoPlayOutline,
  IoCalendarOutline,
  IoPrintOutline,
  IoBanOutline,
  IoPowerOutline,
  IoToggleOutline
} from 'react-icons/io5';
import { MdHistory } from 'react-icons/md';


export const ActionBtn = ({
  variant = 'view', // 'view', 'edit', 'delete', 'history', 'success', 'prescribe', 'download', 'cancel', 'start', 'print', 'calendar'
  label,
  icon: CustomIcon,
  onClick,
  disabled = false,
  title,
  className = '',
  size = 'sm',
  style = {}
}) => {
  const configs = {
    view: {
      icon: IoEyeOutline,
      label: 'View',
      actionClass: 'action-btn-view',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      color: '#2563EB'
    },
    edit: {
      icon: IoPencilOutline,
      label: 'Edit',
      actionClass: 'action-btn-edit',
      bg: '#FAF5FF',
      border: '#E9D5FF',
      color: '#9333EA'
    },
    history: {
      icon: MdHistory,
      label: 'History',
      actionClass: 'action-btn-history',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#D97706'
    },
    print: {
      icon: IoPrintOutline,
      label: 'Print',
      actionClass: 'action-btn-print',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669'
    },
    delete: {
      icon: IoTrashOutline,
      label: 'Delete',
      actionClass: 'action-btn-delete',
      bg: '#FFF1F2',
      border: '#FECDD3',
      color: '#E11D48'
    },
    cancel: {
      icon: IoCloseCircleOutline,
      label: 'Cancel',
      actionClass: 'action-btn-cancel',
      bg: '#FFF1F2',
      border: '#FECDD3',
      color: '#E11D48'
    },
    success: {
      icon: IoCheckmarkCircleOutline,
      label: 'Approve',
      actionClass: 'action-btn-success',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669'
    },
    start: {
      icon: IoPlayOutline,
      label: 'Start',
      actionClass: 'action-btn-start',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669'
    },
    prescribe: {
      icon: IoDocumentTextOutline,
      label: 'Prescribe',
      actionClass: 'action-btn-prescribe',
      bg: '#F0FDFA',
      border: '#99F6E4',
      color: '#0D9488'
    },
    download: {
      icon: IoDownloadOutline,
      label: 'Download',
      actionClass: 'action-btn-download',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      color: '#4F46E5'
    },
    calendar: {
      icon: IoCalendarOutline,
      label: 'Schedule',
      actionClass: 'action-btn-view',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      color: '#2563EB'
    },
    deactivate: {
      icon: IoBanOutline,
      label: 'Deactivate',
      actionClass: 'action-btn-cancel',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#D97706'
    },
    activate: {
      icon: IoCheckmarkCircleOutline,
      label: 'Activate',
      actionClass: 'action-btn-success',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#059669'
    },
    toggle: {
      icon: IoToggleOutline,
      label: 'Toggle Status',
      actionClass: 'action-btn-view',
      bg: '#F8FAFC',
      border: '#CBD5E1',
      color: '#475569'
    }
  };

  const current = configs[variant] || configs.view;
  const IconComponent = CustomIcon || current.icon;
  const tooltipText = title || label || current.label;

  // Exact reference dimensions: 32px width × 30px height, 8px border-radius
  const width = size === 'xs' ? 30 : size === 'lg' ? 36 : 32;
  const height = size === 'xs' ? 28 : size === 'lg' ? 34 : 30;
  const iconSize = size === 'xs' ? 14 : size === 'lg' ? 18 : 15;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltipText}
      aria-label={tooltipText}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        borderRadius: '8px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: current.border,
        backgroundColor: current.bg,
        color: current.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      className={`action-btn-custom ${current.actionClass} group relative inline-flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 disabled:opacity-40 disabled:pointer-events-none select-none no-underline ${className}`}
    >
      <IconComponent size={iconSize} className="shrink-0 transition-transform duration-150 group-hover:scale-110" />

      {/* Floating Tooltip Pill */}
      {tooltipText && (
        <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/95 text-white text-[11px] font-medium rounded shadow-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 border border-white/10 scale-95 group-hover:scale-100">
          {tooltipText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-slate-900/95" />
        </span>
      )}
    </button>
  );
};

export default ActionBtn;
