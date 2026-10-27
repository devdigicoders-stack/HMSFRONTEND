import React, { useState } from 'react';
import Modal from './Modal';
import {
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoFlashOutline
} from 'react-icons/io5';
import { generateStrongPassword, copyToClipboard } from '../../utils/passwordGenerator';
import { userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminResetPasswordModal = ({ isOpen, onClose, user, onSuccess }) => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleGenerate = () => {
    const rolePrefix = user?.role || 'doc';
    const pass = generateStrongPassword(rolePrefix);
    setPassword(pass);
  };

  const handleCopy = async () => {
    if (!password) return;
    const ok = await copyToClipboard(password);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      return toast.warning('Password must be at least 6 characters long.', {
        title: 'Validation Error'
      });
    }

    try {
      setSubmitting(true);
      await userService.adminResetPassword(user._id, password);
      toast.success(`Password for ${user.name} has been updated successfully.`, {
        title: 'Password Reset Successful'
      });

      if (onSuccess) {
        onSuccess({
          name: user.name,
          email: user.email,
          role: user.role,
          password: password
        });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.', {
        title: 'Reset Failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrative Password Reset" maxWidth="520px">
      <form onSubmit={handleSubmit}>
        <div className="mb-3 p-3 rounded-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <IoKeyOutline size={18} color="#DC2626" />
            <strong style={{ color: '#991B1B', fontSize: '0.92rem' }}>Target Account</strong>
          </div>
          <div style={{ fontSize: '0.86rem', color: '#450A0A' }}>
            <div><strong>User:</strong> {user.name} ({user.role?.toUpperCase()})</div>
            <div><strong>Email:</strong> {user.email}</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label-custom mb-0">New Temporary Password *</label>
            <button
              type="button"
              onClick={handleGenerate}
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{
                fontSize: '0.78rem',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '0.2rem 0.5rem',
                fontWeight: 600
              }}
            >
              <IoFlashOutline /> Auto-Generate
            </button>
          </div>

          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter or generate strong password"
              className="form-control-custom"
              style={{ fontFamily: showPassword ? 'monospace' : 'inherit' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-light border"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-light border"
              disabled={!password}
              title="Copy password"
            >
              {copied ? <IoCheckmarkCircle size={16} color="#10B981" /> : <IoCopyOutline size={16} />}
            </button>
          </div>
          <small className="text-secondary d-block mt-1">
            Must be at least 6 characters. We recommend clicking "Auto-Generate" for high security.
          </small>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary-custom">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="btn btn-danger d-flex align-items-center gap-2"
            style={{ fontWeight: 700, borderRadius: '8px' }}
          >
            <IoKeyOutline size={16} />
            {submitting ? 'Updating...' : 'Set & Issue New Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminResetPasswordModal;
