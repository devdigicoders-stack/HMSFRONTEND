import React, { useState } from 'react';
import Modal from './Modal';
import {
  IoCopyOutline,
  IoCheckmarkCircle,
  IoEyeOutline,
  IoEyeOffOutline,
  IoKeyOutline,
  IoMailOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoShareSocialOutline
} from 'react-icons/io5';
import { copyToClipboard, formatCredentialsShare } from '../../utils/passwordGenerator';

const CredentialsSuccessModal = ({ isOpen, onClose, credentials, title = 'Account Provisioned Successfully' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedType, setCopiedType] = useState(''); // 'all' | 'pass' | 'email'

  if (!credentials) return null;

  const { name, email, password, role } = credentials;

  const handleCopyAll = async () => {
    const formatted = formatCredentialsShare({ name, email, password, role });
    const ok = await copyToClipboard(formatted);
    if (ok) {
      setCopiedType('all');
      setTimeout(() => setCopiedType(''), 3000);
    }
  };

  const handleCopyPassword = async () => {
    const ok = await copyToClipboard(password);
    if (ok) {
      setCopiedType('pass');
      setTimeout(() => setCopiedType(''), 2500);
    }
  };

  const handleCopyEmail = async () => {
    const ok = await copyToClipboard(email);
    if (ok) {
      setCopiedType('email');
      setTimeout(() => setCopiedType(''), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="560px">
      <div className="text-center mb-3">
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            marginBottom: '0.75rem',
            boxShadow: '0 0 0 6px #F0FDF4'
          }}
        >
          <IoShieldCheckmarkOutline />
        </div>
        <h4 style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {name || 'User Account'} Ready!
        </h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Account credentials generated. Please copy and securely share these with the {role || 'user'}.
        </p>
      </div>

      {/* Role badge */}
      <div className="d-flex justify-content-center mb-3">
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '0.3rem 0.85rem',
            borderRadius: '20px',
            backgroundColor:
              role === 'doctor'
                ? '#ECFDF5'
                : role === 'lab'
                ? '#FFFBEB'
                : role === 'admin'
                ? '#FEF2F2'
                : '#EFF6FF',
            color:
              role === 'doctor'
                ? '#059669'
                : role === 'lab'
                ? '#D97706'
                : role === 'admin'
                ? '#DC2626'
                : '#2563EB',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          Authorized Role: {role}
        </span>
      </div>

      {/* Credentials Card */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1.1rem',
          marginBottom: '1.25rem'
        }}
      >
        {/* Full Name */}
        <div className="d-flex align-items-center justify-content-between py-2 border-bottom" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex align-items-center gap-2">
            <IoPersonOutline size={18} color="#64748B" />
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Full Name</span>
          </div>
          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>{name}</span>
        </div>

        {/* Email */}
        <div className="d-flex align-items-center justify-content-between py-2 border-bottom" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex align-items-center gap-2">
            <IoMailOutline size={18} color="#64748B" />
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Login Email</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', fontFamily: 'monospace' }}>
              {email}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="btn btn-sm"
              title="Copy email"
              style={{
                padding: '0.15rem 0.45rem',
                fontSize: '0.75rem',
                backgroundColor: copiedType === 'email' ? '#10B981' : '#E2E8F0',
                color: copiedType === 'email' ? '#FFFFFF' : '#334155',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              {copiedType === 'email' ? <IoCheckmarkCircle size={14} /> : <IoCopyOutline size={14} />}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="d-flex align-items-center justify-content-between py-2">
          <div className="d-flex align-items-center gap-2">
            <IoKeyOutline size={18} color="#64748B" />
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Password</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                fontWeight: 800,
                color: '#2563EB',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                backgroundColor: '#EFF6FF',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                letterSpacing: showPassword ? '0.05em' : '0.15em'
              }}
            >
              {showPassword ? password : '••••••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-sm btn-light border"
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{ padding: '0.15rem 0.45rem', fontSize: '0.85rem' }}
            >
              {showPassword ? <IoEyeOffOutline size={15} /> : <IoEyeOutline size={15} />}
            </button>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="btn btn-sm"
              title="Copy password"
              style={{
                padding: '0.15rem 0.45rem',
                fontSize: '0.75rem',
                backgroundColor: copiedType === 'pass' ? '#10B981' : '#E2E8F0',
                color: copiedType === 'pass' ? '#FFFFFF' : '#334155',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              {copiedType === 'pass' ? <IoCheckmarkCircle size={14} /> : <IoCopyOutline size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Copy All Big Button */}
      <div className="d-flex flex-column gap-2">
        <button
          type="button"
          onClick={handleCopyAll}
          className="btn d-flex align-items-center justify-content-center gap-2 py-2"
          style={{
            backgroundColor: copiedType === 'all' ? '#059669' : '#10B981',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {copiedType === 'all' ? (
            <>
              <IoCheckmarkCircle size={20} />
              Copied All Details to Clipboard!
            </>
          ) : (
            <>
              <IoCopyOutline size={18} />
              Copy Full Credentials (For WhatsApp / SMS / Email)
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-light border py-2"
          style={{ fontWeight: 600, fontSize: '0.88rem', borderRadius: '8px' }}
        >
          Done & Close
        </button>
      </div>
    </Modal>
  );
};

export default CredentialsSuccessModal;
