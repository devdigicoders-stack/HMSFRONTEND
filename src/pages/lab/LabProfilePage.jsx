import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService, userService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdBiotech,
  MdCameraAlt,
  MdSave,
  MdInfoOutline,
  MdCheckCircleOutline
} from 'react-icons/md';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';

const LabProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Messages
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Fetch current user details
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.data?.user) {
        const u = res.data.user;
        setFormData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          avatar: u.avatar || ''
        });
      }
    } catch (err) {
      setProfileError('Failed to load laboratory personnel profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Avatar upload
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, WEBP).');
      setTimeout(() => setProfileError(''), 4000);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('Avatar image file size must be less than 3 MB.');
      setTimeout(() => setProfileError(''), 4000);
      return;
    }

    const data = new FormData();
    data.append('avatar', file);

    try {
      setUploadingAvatar(true);
      setProfileError('');
      const res = await userService.uploadAvatar(data);
      const newAvatarUrl = res.data.avatar;
      setFormData(prev => ({ ...prev, avatar: newAvatarUrl }));
      setProfileSuccess('Profile photo uploaded and updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
      if (refreshUser) refreshUser();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Avatar upload failed.');
      setTimeout(() => setProfileError(''), 4000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Avatar removal
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await userService.removeAvatar();
      setFormData(prev => ({ ...prev, avatar: '' }));
      setProfileSuccess('Profile photo removed successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
      if (refreshUser) refreshUser();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to remove photo.');
      setTimeout(() => setProfileError(''), 3500);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Submit profile changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    if (!formData.name.trim()) {
      setProfileError('Staff name is required.');
      setSavingProfile(false);
      return;
    }

    if (!formData.email.trim()) {
      setProfileError('Account email address is required.');
      setSavingProfile(false);
      return;
    }

    if (formData.phone && !isValidOptionalPhone(formData.phone)) {
      setProfileError('Contact ' + PHONE_ERROR_MSG);
      setSavingProfile(false);
      return;
    }

    try {
      const res = await userService.updateMyProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar
      });

      if (res.data?.emailChanged) {
        toast.success('Email updated successfully. Logging out for security re-authentication...', {
          title: 'Email Changed'
        });
        setProfileSuccess('Email updated successfully. Logging out in 2 seconds...');
        setTimeout(() => {
          logout();
        }, 1800);
        return;
      }

      toast.success('Laboratory staff profile updated successfully.', {
        title: 'Profile Updated'
      });
      setProfileSuccess('Profile details saved successfully.');
      setTimeout(() => setProfileSuccess(''), 3500);
      if (refreshUser) refreshUser();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update laboratory profile.';
      toast.error(msg, { title: 'Update Error' });
      setProfileError(msg);
      setTimeout(() => setProfileError(''), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit password changes
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!passwords.currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long.', {
        title: 'Security Warning'
      });
      return setPassError('New password must be at least 6 characters long.');
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.warning('New password and confirmation password do not match.', {
        title: 'Security Warning'
      });
      return setPassError('New password and confirmation password do not match.');
    }

    setSavingPassword(true);
    try {
      await authService.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      toast.success('Security password credentials updated successfully.', {
        title: 'Password Updated'
      });
      setPassSuccess('Security credentials updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Verify current password.';
      toast.error(msg, { title: 'Verification Failed' });
      setPassError(msg);
      setTimeout(() => setPassError(''), 4000);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading laboratory profile details...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Laboratory Personnel Profile & Security"
        subtitle="Manage pathology desk credentials, contact information, and account security"
      />

      <div className="row g-4">
        {/* Left Column: Staff Card & Photo */}
        <div className="col-12 col-lg-4">
          <GlassCard className="text-center mb-4">
            <div className="d-flex flex-column align-items-center mb-3">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  style={{
                    width: 106,
                    height: 106,
                    borderRadius: '50%',
                    border: '3px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                    backgroundColor: '#FFFBEB',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 750,
                    color: '#D97706',
                    margin: '0 auto',
                    position: 'relative'
                  }}
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name || 'Lab Staff'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{(formData.name || user?.name || 'L')[0]?.toUpperCase()}</span>
                  )}
                  {uploadingAvatar && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div className="spinner-border spinner-border-sm text-light" role="status" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn btn-sm"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#D97706',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    cursor: 'pointer'
                  }}
                  title="Upload / Change Photo"
                >
                  <MdCameraAlt size={16} />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  style={{ display: 'none' }}
                />
              </div>

              <div className="d-flex align-items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{
                    fontSize: '0.74rem',
                    padding: '0.3rem 0.75rem',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    fontWeight: 600,
                    borderRadius: '6px'
                  }}
                >
                  <MdCameraAlt size={14} /> {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="btn btn-sm btn-outline-danger"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem', borderRadius: '6px' }}
                    title="Remove Profile Photo"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                PNG, JPG or WEBP (max 3MB)
              </span>
            </div>

            <h5 style={{ fontWeight: 800, margin: '0.5rem 0 0.2rem 0', color: 'var(--text-main)' }}>
              {formData.name || user?.name || 'Lab Staff'}
            </h5>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.75rem' }}>
              {formData.email || user?.email}
            </div>

            <div className="d-flex justify-content-center gap-2 mb-3">
              <span
                className="badge"
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MdBiotech /> Pathology Staff
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MdCheckCircleOutline /> Active Account
              </span>
            </div>

            <div
              className="p-2.5 rounded text-start"
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                fontSize: '0.74rem',
                color: '#1E40AF',
                lineHeight: 1.45
              }}
            >
              <div className="d-flex align-items-center gap-1.5 mb-1" style={{ fontWeight: 700 }}>
                <MdInfoOutline size={15} /> Security Protocol
              </div>
              Updating your email address changes your login credential. You will be automatically logged out upon saving to re-authenticate with the new address.
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Account Details & Security Forms */}
        <div className="col-12 col-lg-8">
          {/* Section 1: Staff Information */}
          <GlassCard className="mb-4">
            <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
              Personnel Information
            </h6>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Update your pathology account profile details and email.
            </p>

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Full Legal Name *
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdPerson size={18} />
                    </span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Technician"
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Account Email Address *
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdEmail size={18} />
                    </span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="lab@hospital.com"
                      required
                    />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '0.25rem' }}>
                    * Changing email will log you out immediately to re-login.
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Contact Phone Number
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdPhone size={18} />
                    </span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handlePhoneInput(e, (val) => setFormData(prev => ({ ...prev, phone: val })))}
                      placeholder={PHONE_PLACEHOLDER}
                      pattern={PHONE_PATTERN}
                      title={PHONE_TITLE}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Department / Role
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-custom bg-light"
                    value="Clinical Pathology & Diagnostics"
                    disabled
                    style={{ fontSize: '0.85rem', color: '#64748B' }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary-custom d-flex align-items-center gap-1.5 px-4"
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {savingProfile ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <MdSave size={16} /> Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Section 2: Password & Security */}
          <GlassCard>
            <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
              Security & Password
            </h6>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Verify your current password to set a new password.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Current Password *
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="Current password"
                      required
                    />
                    <button
                      type="button"
                      className="input-btn-right"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      title={showCurrentPass ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    New Password *
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="At least 6 chars"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="input-btn-right"
                      onClick={() => setShowNewPass(!showNewPass)}
                      title={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showNewPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Confirm Password *
                  </label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="input-btn-right"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      title={showConfirmPass ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn btn-primary-custom d-flex align-items-center gap-1.5 px-4"
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {savingPassword ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" /> Updating Password...
                    </>
                  ) : (
                    <>
                      <MdLock size={16} /> Update Security Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default LabProfilePage;
