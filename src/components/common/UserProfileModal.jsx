import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/api';
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoMedkitOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoShieldCheckmarkOutline,
  IoKeyOutline,
  IoPulseOutline,
  IoWarningOutline,
  IoBusinessOutline,
  IoCashOutline
} from 'react-icons/io5';

const UserProfileModal = ({ isOpen, onClose, userId, onResetPasswordClick }) => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) {
      setData(null);
      return;
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const res = await userService.getUserById(userId);
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load user profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const user = data?.user;
  const profile = data?.profile;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hospital Personnel / Patient Dossier" maxWidth="700px">
      {loading ? (
        <div className="py-5 text-center">
          <LoadingSpinner text="Retrieving detailed clinical & administrative dossier..." />
        </div>
      ) : user ? (
        <div>
          {/* Header Profile Summary */}
          <div
            className="p-3 mb-4 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '14px',
                  backgroundColor:
                    user.role === 'doctor'
                      ? '#ECFDF5'
                      : user.role === 'lab'
                      ? '#FFFBEB'
                      : user.role === 'admin'
                      ? '#FEF2F2'
                      : '#EFF6FF',
                  color:
                    user.role === 'doctor'
                      ? '#059669'
                      : user.role === 'lab'
                      ? '#D97706'
                      : user.role === 'admin'
                      ? '#DC2626'
                      : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  overflow: 'hidden'
                }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>{user.name}</h5>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor:
                        user.role === 'doctor'
                          ? '#D1FAE5'
                          : user.role === 'lab'
                          ? '#FEF3C7'
                          : user.role === 'admin'
                          ? '#FEE2E2'
                          : '#DBEAFE',
                      color:
                        user.role === 'doctor'
                          ? '#065F46'
                          : user.role === 'lab'
                          ? '#92400E'
                          : user.role === 'admin'
                          ? '#991B1B'
                          : '#1E40AF'
                    }}
                  >
                    {user.role}
                  </span>
                  <StatusBadge status={user.status} />
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    ID: {user._id ? user._id.substring(18) : ''}
                  </span>
                </div>
              </div>
            </div>

            {onResetPasswordClick && (
              <button
                type="button"
                onClick={() => onResetPasswordClick(user)}
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                style={{ fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px' }}
              >
                <IoKeyOutline size={15} /> Reset Password
              </button>
            )}
          </div>

          {/* Contact & Primary Details Grid */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-2 border" style={{ backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <IoMailOutline className="me-1" /> EMAIL ADDRESS
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B', wordBreak: 'break-all' }}>{user.email}</div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-2 border" style={{ backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <IoCallOutline className="me-1" /> CONTACT PHONE
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{user.phone || 'Not provided'}</div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-2 border" style={{ backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <IoCalendarOutline className="me-1" /> REGISTERED ON
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-2 border" style={{ backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <IoTimeOutline className="me-1" /> LAST SYSTEM ACCESS
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Deep Profiles */}
          {user.role === 'doctor' && (
            <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IoMedkitOutline size={20} color="#059669" />
                <h6 style={{ margin: 0, fontWeight: 700, color: '#065F46' }}>Physician Clinical Profile</h6>
              </div>
              <div className="row g-2" style={{ fontSize: '0.86rem' }}>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">Department:</span>
                  <strong>{profile?.department?.name || profile?.department || 'General OPD'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">Specialization:</span>
                  <strong>{profile?.specialization || 'General Physician'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">Qualifications:</span>
                  <strong>{profile?.qualifications || 'MBBS'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">Experience:</span>
                  <strong>{profile?.experienceYears || 1} Years</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">OPD Room:</span>
                  <strong>{profile?.roomNumber || 'Room 101'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-secondary d-block">Consultation Fee:</span>
                  <strong className="text-success">${profile?.consultationFee || 500}</strong>
                </div>
                <div className="col-12 mt-2">
                  <span className="text-secondary d-block">Available Days:</span>
                  <strong>
                    {profile?.availableDays && profile.availableDays.length > 0
                      ? profile.availableDays.join(', ')
                      : 'Monday - Saturday'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {user.role === 'patient' && (
            <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IoPulseOutline size={20} color="#2563EB" />
                <h6 style={{ margin: 0, fontWeight: 700, color: '#1E40AF' }}>Patient Clinical Record</h6>
              </div>
              <div className="row g-2" style={{ fontSize: '0.86rem' }}>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block">Gender:</span>
                  <strong>{profile?.gender || 'Not specified'}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block">Blood Group:</span>
                  <strong className="text-danger">{profile?.bloodGroup || 'Unknown'}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block">Date of Birth:</span>
                  <strong>
                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </strong>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-secondary d-block">Address:</span>
                  <strong>{profile?.address || 'Not provided'}</strong>
                </div>
                <div className="col-12 mt-2 border-top pt-2" style={{ borderColor: '#DBEAFE' }}>
                  <span className="text-secondary d-block">Emergency Contact:</span>
                  <strong>
                    {profile?.emergencyContact?.name
                      ? `${profile.emergencyContact.name} (${profile.emergencyContact.relationship || 'Relation'} - ${profile.emergencyContact.phone || 'No phone'})`
                      : 'No emergency contact on file'}
                  </strong>
                </div>
                {profile?.knownAllergies && (
                  <div className="col-12 mt-1">
                    <span className="text-danger d-block">
                      <IoWarningOutline className="me-1" /> Known Allergies:
                    </span>
                    <span className="badge bg-danger-subtle text-danger">{profile.knownAllergies}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary-custom">
              Close Dossier
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default UserProfileModal;
