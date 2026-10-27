import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import HospitalBrandLogo from '../../components/common/HospitalBrandLogo';
import config from '../../config/appConfig';

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResetToken('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      toast.success(res.data.message || 'Password reset instructions have been generated.', {
        title: 'Recovery Link Sent'
      });
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not process password recovery request.';
      toast.error(msg, {
        title: 'Recovery Failed'
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
            Password Recovery • Request a secure reset token
          </p>
        </div>

        <div className="glass-card p-4 p-sm-5" style={{ borderRadius: 'var(--radius-lg)' }}>

          {resetToken && (
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--mint)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-green)', marginBottom: '0.35rem' }}>
                Single-Use Reset Token (15m validity):
              </div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                {resetToken}
              </div>
              <div className="mt-2">
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="btn btn-sm btn-primary-custom"
                  style={{ fontSize: '0.78rem' }}
                >
                  Proceed to Reset Form &rarr;
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label-custom">Hospital Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="form-control-custom"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-custom w-100 justify-content-center py-2 mt-2"
              style={{ fontSize: '0.92rem' }}
            >
              {loading ? 'Sending Request...' : 'Generate Reset Token'}
            </button>
          </form>

          <div className="mt-4 text-center" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Remembered password?{' '}
            <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary-green)', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
