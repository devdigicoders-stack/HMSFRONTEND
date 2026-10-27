import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import HospitalBrandLogo from '../../components/common/HospitalBrandLogo';
import config from '../../config/appConfig';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      return toast.warning('Password must be at least 6 characters long.', {
        title: 'Validation Notice'
      });
    }
    if (newPassword !== confirmPassword) {
      return toast.warning('Passwords do not match. Please re-enter.', {
        title: 'Validation Notice'
      });
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success('Your password has been securely updated! Redirecting to login...', {
        title: 'Password Updated'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset token is invalid or has expired.';
      toast.error(msg, {
        title: 'Reset Failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(21, 150, 107, 0.06) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 159, 173, 0.06) 0px, transparent 50%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex mb-2">
            <HospitalBrandLogo size={46} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {config.hospitalName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
            Set New Password • Secure Account Credentials
          </p>
        </div>

        <div className="glass-card p-4 p-sm-5" style={{ borderRadius: 'var(--radius-lg)' }}>

          {success ? (
            <div className="text-center py-4">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Redirecting to secure login...
              </p>
              <Link to="/login" className="btn-primary-custom justify-content-center">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label-custom">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="form-control-custom"
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="form-control-custom"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-custom w-100 justify-content-center py-2 mt-2"
                style={{ fontSize: '0.92rem' }}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary-green)', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
