import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService, doctorService, userService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdShield,
  MdVerified,
  MdLocationOn,
  MdMedicalServices,
  MdSchool,
  MdAttachMoney,
  MdWorkHistory,
  MdCloudUpload,
  MdCheck,
  MdCameraAlt,
  MdDeleteOutline
} from 'react-icons/md';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';

const DoctorProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Editable Profile Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    roomNumber: '',
    avatar: ''
  });

  // Password Update State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Notifications
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Fetch doctor data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.data?.user) {
        const u = res.data.user;
        const p = res.data.profile || {};
        setProfile(p);
        setFormData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          bio: p.bio || '',
          roomNumber: p.roomNumber || '',
          avatar: u.avatar || ''
        });
      }
    } catch (err) {
      setProfileError('Failed to load doctor profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Avatar File Upload
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

  // Handle Avatar Removal
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

  // Submit Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    if (!formData.name.trim()) {
      setProfileError('Doctor name is required.');
      setSavingProfile(false);
      return;
    }

    if (!formData.email.trim()) {
      setProfileError('Doctor email address is required.');
      setSavingProfile(false);
      return;
    }

    if (formData.phone && !isValidOptionalPhone(formData.phone)) {
      setProfileError('Contact ' + PHONE_ERROR_MSG);
      setSavingProfile(false);
      return;
    }

    try {
      const res = await doctorService.updateProfile(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio,
        roomNumber: formData.roomNumber,
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

      toast.success('Clinical profile details updated & synchronized with audit stream.', {
        title: 'Profile Updated'
      });
      setProfileSuccess('Profile details updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
      if (refreshUser) refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile.', {
        title: 'Update Failed'
      });
      setProfileError(err.response?.data?.message || 'Error updating profile.');
      setTimeout(() => setProfileError(''), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

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
      toast.error(err.response?.data?.message || 'Failed to update password. Verify current password.', {
        title: 'Verification Failed'
      });
      setPassError(err.response?.data?.message || 'Failed to update password. Verify current password.');
      setTimeout(() => setPassError(''), 4000);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading doctor clinical profile...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Physician Profile & Credentials"
        subtitle="Manage your public clinical bio, consulting suite, contact details, and account security"
      />

      <div className="row g-4">
        {/* Left Column: Profile Card & Read-Only Credentials */}
        <div className="col-12 col-lg-4">
          <GlassCard className="text-center mb-4">
            {/* Avatar Preview & Upload Controls */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  style={{
                    width: 106,
                    height: 106,
                    borderRadius: '50%',
                    border: '3px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                    backgroundColor: '#F1F5F9',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 750,
                    color: 'var(--primary-green, #059669)',
                    margin: '0 auto',
                    position: 'relative'
                  }}
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name || 'Doctor'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{(formData.name || user?.name || 'D')[0]?.toUpperCase()}</span>
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

                {/* Camera Icon Trigger Button */}
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
                    backgroundColor: 'var(--primary-green, #059669)',
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

              {/* Upload & Remove Action Buttons */}
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

            <h5 style={{ fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-main)' }}>
              {user?.name
                ? user.name.trim().toLowerCase().startsWith('dr.') || user.name.trim().toLowerCase().startsWith('dr ')
                  ? user.name
                  : `Dr. ${user.name}`
                : 'Doctor'}
            </h5>
            <div style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 700, marginBottom: '0.5rem' }}>
              {profile?.specialization || 'Medical Specialist'} • {profile?.department || 'OPD'}
            </div>

            <div className="d-flex justify-content-center gap-2 mb-3">
              <span
                className="badge"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MdVerified /> Verified Practitioner
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--light-blue)',
                  color: 'var(--primary-blue)',
                  fontSize: '0.74rem'
                }}
              >
                Physician Account
              </span>
            </div>
          </GlassCard>

          {/* Academic & Clinical Qualifications (Read-Only) */}
          <GlassCard className="mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              Credentials & Clinical Privileges
            </h6>
            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.82rem' }}>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}><MdSchool /> Qualifications:</span>
                <span style={{ fontWeight: 700 }}>{profile?.qualifications || 'MBBS, MD'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}><MdWorkHistory /> Experience:</span>
                <span style={{ fontWeight: 700 }}>{profile?.experienceYears || 1} Years</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}><MdAttachMoney /> Consultation Fee:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>₹{profile?.consultationFee || 500}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span style={{ color: 'var(--text-secondary)' }}><MdMedicalServices /> Max Intake/Day:</span>
                <span style={{ fontWeight: 700 }}>{profile?.maxAppointmentsPerDay || 25} Patients</span>
              </div>
            </div>
          </GlassCard>

          {/* Policy Notice */}
          <GlassCard style={{ backgroundColor: 'rgba(234, 243, 255, 0.45)' }}>
            <div className="d-flex gap-2">
              <MdShield style={{ color: 'var(--primary-blue)', flexShrink: 0, marginTop: '2px' }} size={20} />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Institutional Security Notice:</strong> Clinical specialty, department credentials, and practitioner role are governed by Hospital Administration. Contact the Medical Director to request credential alterations.
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Editable Information & Password Management */}
        <div className="col-12 col-lg-8">
          {/* Edit Profile Information */}
          <GlassCard className="mb-4">
            <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              Professional Information
            </h5>

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Physician Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">
                    Physician Account Email <span className="req-star" style={{ color: "#ef4444" }}>*</span>
                    <span className="text-secondary ms-1" style={{ fontSize: '0.72rem' }}>(changing email logs you out)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control-custom"
                    placeholder="doctor@hospital.com"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Direct Contact Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    pattern={PHONE_PATTERN}
                    title={PHONE_TITLE}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: handlePhoneInput(e.target.value) })}
                    placeholder={PHONE_PLACEHOLDER}
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Consulting OPD Suite / Room</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. OPD-104 (Block B)"
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label-custom">Professional Biography & Clinical Focus</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Provide a brief clinical biography, areas of medical focus, or patient consultation guidance..."
                    className="form-control-custom"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary-custom d-flex align-items-center gap-1"
                >
                  <MdCheck size={18} /> {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Secure Password Update Card */}
          <GlassCard>
            <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Security & Password
            </h5>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Verify your current password before configuring new credentials.
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label className="form-label-custom">Current Password <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="Enter existing password"
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

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">New Password <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
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

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Confirm New Password <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-secondary-custom d-flex align-items-center gap-1"
                >
                  <MdLock size={16} /> {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
