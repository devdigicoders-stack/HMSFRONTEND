import React from 'react';
import Modal from './Modal';
import { IoWarningOutline, IoAlertCircleOutline } from 'react-icons/io5';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger', 'warning', 'primary'
  type,
  loading = false
}) => {
  const activeVariant = type || confirmVariant || 'danger';

  const getConfirmStyle = () => {
    switch (activeVariant) {
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          color: '#FFFFFF'
        };
      case 'primary':
        return {
          backgroundColor: 'var(--primary-blue, #2563EB)',
          borderColor: 'var(--primary-blue, #2563EB)',
          color: '#FFFFFF'
        };
      case 'danger':
      default:
        return {
          backgroundColor: '#DC2626',
          borderColor: '#B91C1C',
          color: '#FFFFFF'
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-sm btn-light border px-3"
            style={{
              borderColor: 'var(--border-subtle, #E2E8F0)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.84rem'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-sm px-3 shadow-sm"
            style={{
              ...getConfirmStyle(),
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.84rem'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <div className="d-flex align-items-start gap-3 py-2">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: activeVariant === 'danger' ? '#FEE2E2' : '#FEF3C7',
            color: activeVariant === 'danger' ? '#DC2626' : '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {activeVariant === 'danger' ? <IoAlertCircleOutline size={26} /> : <IoWarningOutline size={26} />}
        </div>
        <div>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-main, #1E293B)', lineHeight: 1.5, fontWeight: 500 }}>
            {message}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
