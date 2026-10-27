import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { patientService, authService, userService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  MdPerson,
  MdLock,
  MdCameraAlt,
  MdEmail,
  MdPhone,
  MdVerified,
  MdSecurity,
  MdCheckCircle,
  MdWarning,
  MdVisibility,
  MdVisibilityOff,
  MdRefresh
} from 'react-icons/md';
import {
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoCheckmarkDoneCircleOutline,
  IoPersonCircleOutline
} from 'react-icons/io5';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';


const PatientProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'security', 'account'

  // Personal Information State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    gender: 'Male',
    bloodGroup: 'Unknown',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    knownAllergies: '',
    chronicConditions: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and feedback
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch verified profile details
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileError('');
      const res = await authService.getMe();
      const p = res.data.profile || {};
      const u = res.data.user || {};

      setFormData({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        avatar: u.avatar || '',
        gender: p.gender || 'Not Specified',
        bloodGroup: p.bloodGroup || 'Unknown',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
        address: p.address || '',
        emergencyContactName: p.emergencyContact?.name || '',
        emergencyContactRelationship: p.emergencyContact?.relationship || '',
        emergencyContactPhone: p.emergencyContact?.phone || '',
        knownAllergies: Array.isArray(p.knownAllergies) ? p.knownAllergies.join(', ') : '',
        chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions.join(', ') : '',
        insuranceProvider: p.insuranceProvider || '',
        insurancePolicyNumber: p.insurancePolicyNumber || ''
      });
    } catch (err) {
      setProfileError('Failed to load verified patient profile records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'emergencyContactPhone') {
      setFormData({ ...formData, [name]: handlePhoneInput(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Avatar Upload Handler
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('Avatar image file size must be less than 3 MB.');
      setTimeout(() => setProfileError(''), 4000);
      return;
    }

    try {
      setUploadingAvatar(true);
      setProfileError('');
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const res = await userService.uploadAvatar(uploadFormData);
      const newAvatarUrl = res.data.avatar;

      setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
      setProfileSuccess('Profile photo uploaded and updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3500);
      refreshUser();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Error uploading profile image.');
      setTimeout(() => setProfileError(''), 4000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Avatar Removal Handler
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await userService.removeAvatar();
      setFormData((prev) => ({ ...prev, avatar: '' }));
      setProfileSuccess('Profile photo removed successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
      refreshUser();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to remove photo.');
      setTimeout(() => setProfileError(''), 3500);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Submit Profile Information
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    // Frontend validations
    if (!formData.name.trim()) {
      setProfileError('Please provide your full legal name.');
      setSavingProfile(false);
      return;
    }

    if (!formData.email.trim()) {
      setProfileError('Please provide your account email address.');
      setSavingProfile(false);
      return;
    }

    if (formData.phone && !isValidOptionalPhone(formData.phone)) {
      setProfileError('Contact ' + PHONE_ERROR_MSG);
      setSavingProfile(false);
      return;
    }

    if (formData.emergencyContactPhone && !isValidOptionalPhone(formData.emergencyContactPhone)) {
      setProfileError('Emergency ' + PHONE_ERROR_MSG);
      setSavingProfile(false);
      return;
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) {
        setProfileError('Date of birth cannot be in the future.');
        setSavingProfile(false);
        return;
      }
    }

    try {
      const res = await patientService.updateProfile(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address.trim(),
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          relationship: formData.emergencyContactRelationship.trim(),
          phone: formData.emergencyContactPhone.trim()
        },
        knownAllergies: formData.knownAllergies
          ? formData.knownAllergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        chronicConditions: formData.chronicConditions
          ? formData.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        insuranceProvider: formData.insuranceProvider.trim(),
        insurancePolicyNumber: formData.insurancePolicyNumber.trim()
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

      toast.success('Personal medical profile successfully updated and synchronized.', {
        title: 'Profile Updated'
      });
      setProfileSuccess('Profile details saved successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
      refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile. Please check your inputs.', {
        title: 'Update Failed'
      });
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
      setTimeout(() => setProfileError(''), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.warning('Please enter your current verified password.', {
        title: 'Verification Notice'
      });
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters in length.', {
        title: 'Security Notice'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('New password and confirmation password do not match.', {
        title: 'Security Notice'
      });
      return;
    }

    try {
      setSavingPassword(true);
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password has been securely updated. You can now use your new password.', {
        title: 'Security Updated'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed: Current password is incorrect.', {
        title: 'Verification Failed'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Patient Account & Medical Profile"
        subtitle="Manage your personal healthcare records, clinical flags, emergency contacts, and account security credentials"
      />

      <div className="row g-4">
        {/* Left Column: Patient Profile Overview & Identity Badge */}
        <div className="col-12 col-lg-4">
          <GlassCard className="text-center p-4 mb-4">
            {/* Avatar Preview & Upload Controls */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div className="position-relative mb-2.5">
                <div
                  style={{
                    width: 110,
                    height: 110,
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
                    color: '#059669',
                    margin: '0 auto',
                    position: 'relative'
                  }}
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name || 'Patient'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{(formData.name || user?.name || 'P')[0]?.toUpperCase()}</span>
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
                  className="btn btn-sm btn-primary-custom"
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
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
              <div className="d-flex align-items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn btn-sm btn-secondary-custom d-flex align-items-center gap-1"
                  style={{ fontSize: '0.74rem', padding: '0.3rem 0.7rem' }}
                >
                  <MdCameraAlt size={14} /> {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="btn btn-sm btn-outline-danger"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                    title="Remove Profile Photo"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                JPG, PNG, or WebP. Max 3MB.
              </span>
            </div>

            <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>
              {formData.name || user?.name || 'Patient Name'}
            </h5>

            <div className="d-flex align-items-center justify-content-center gap-2 mt-1 mb-3">
              <span className="badge-status badge-status-success d-inline-flex align-items-center gap-1">
                <MdVerified size={13} /> {user?.status === 'active' ? 'Account Active' : 'Account Inactive'}
              </span>
              <span className="badge-status badge-status-info">
                Role: Patient
              </span>
            </div>

            {/* Quick Contact Details */}
            <div className="p-3 rounded text-start" style={{ backgroundColor: 'rgba(244, 247, 251, 0.7)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <MdEmail className="text-secondary" size={16} />
                <span className="text-truncate" style={{ fontWeight: 600 }}>{user?.email || 'N/A'}</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <MdPhone className="text-secondary" size={16} />
                <span>{formData.phone || user?.phone || 'No phone registered'}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <IoShieldCheckmarkOutline className="text-success" size={16} />
                <span style={{ color: 'var(--text-secondary)' }}>Blood Group: <strong>{formData.bloodGroup}</strong></span>
              </div>
            </div>
          </GlassCard>

          {/* Account Status & Policy Card */}
          <GlassCard className="p-4">
            <h6 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdSecurity className="text-primary" size={18} /> Account Status & Policy
            </h6>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p className="mb-2">
                <strong>Account Status:</strong> <span className="text-success fw-bold">Active & Verified</span>
              </p>
              <p className="mb-2">
                <strong>User Identifier:</strong> <code>{user?.id}</code>
              </p>
              <p className="mb-0" style={{ fontSize: '0.78rem', background: 'rgba(235, 243, 252, 0.6)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe' }}>
                Note: Patients cannot self-modify privileged credentials such as <em>Account Role</em> or <em>Verification Status</em>. Contact hospital administrative desk for credential audits.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Editable Information & Password Management */}
        <div className="col-12 col-lg-8">
          <GlassCard>
            {/* Tabs Navigation */}
            <div className="d-flex border-bottom mb-4 gap-2 pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`btn btn-sm ${activeTab === 'personal' ? 'btn-primary-custom' : 'btn-light-custom'}`}
                style={{ borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.84rem' }}
              >
                1. Personal & Medical Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary-custom' : 'btn-light-custom'}`}
                style={{ borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.84rem' }}
              >
                2. Password & Security
              </button>
            </div>

            {loading ? (
              <div className="p-5 text-center text-secondary">
                <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                Loading profile credentials...
              </div>
            ) : activeTab === 'personal' ? (
              <form onSubmit={handleProfileSubmit}>
                {/* 1. General Info */}
                <div className="mb-4">
                  <h6 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}>
                    A. General Demographics & Contact
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Full Legal Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-control-custom"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">
                        Account Email Address <span className="req-star" style={{ color: "#ef4444" }}>*</span>
                        <span className="text-secondary ms-1" style={{ fontSize: '0.72rem' }}>(changing email logs you out)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control-custom"
                        placeholder="patient@example.com"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Contact Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        maxLength={10}
                        pattern={PHONE_PATTERN}
                        title={PHONE_TITLE}
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-control-custom"
                        placeholder={PHONE_PLACEHOLDER}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Gender <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="form-select-custom"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Not Specified">Not Specified</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Blood Group <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        className="form-select-custom"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label-custom">Primary Residential Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street, City, State, Postal Code"
                        className="form-control-custom"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Emergency Contact */}
                <div className="mb-4">
                  <h6 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}>
                    B. Emergency Contact Protocol
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Emergency Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        placeholder="e.g., Sarah Doe"
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Relationship</label>
                      <input
                        type="text"
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={handleInputChange}
                        placeholder="Spouse / Parent / Sibling"
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Emergency Phone</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        maxLength={10}
                        pattern={PHONE_PATTERN}
                        title={PHONE_TITLE}
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        placeholder={PHONE_PLACEHOLDER}
                        className="form-control-custom"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Clinical Flags & Insurance */}
                <div className="mb-4">
                  <h6 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}>
                    C. Clinical Flags & Health Insurance
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Known Drug / Food Allergies</label>
                      <input
                        type="text"
                        name="knownAllergies"
                        value={formData.knownAllergies}
                        onChange={handleInputChange}
                        placeholder="Comma separated: Penicillin, Peanuts"
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Chronic Conditions / History</label>
                      <input
                        type="text"
                        name="chronicConditions"
                        value={formData.chronicConditions}
                        onChange={handleInputChange}
                        placeholder="Comma separated: Hypertension, Asthma"
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Insurance Provider</label>
                      <input
                        type="text"
                        name="insuranceProvider"
                        value={formData.insuranceProvider}
                        onChange={handleInputChange}
                        placeholder="e.g. Blue Cross Blue Shield"
                        className="form-control-custom"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Insurance Policy / Member Number</label>
                      <input
                        type="text"
                        name="insurancePolicyNumber"
                        value={formData.insurancePolicyNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. BCBS-9912-3841"
                        className="form-control-custom"
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary-custom px-4"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* Security & Password Tab */
              <form onSubmit={handlePasswordSubmit}>
                <h6 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
                  Update Password Credentials
                </h6>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Ensure your account uses a strong password with at least 6 characters. You must verify your current password before changing it.
                </p>

                <div className="mb-3">
                  <label className="form-label-custom">Current Verified Password <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="unified-input-wrapper">
                    <span className="input-icon-left">
                      <MdLock size={18} />
                    </span>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      required
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="input-btn-right"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">New Password <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <div className="unified-input-wrapper">
                      <span className="input-icon-left">
                        <MdLock size={18} />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        required
                        minLength={6}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        className="input-btn-right"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
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
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        minLength={6}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Re-type new password"
                      />
                      <button
                        type="button"
                        className="input-btn-right"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary-custom px-4"
                  >
                    {savingPassword ? 'Verifying & Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
