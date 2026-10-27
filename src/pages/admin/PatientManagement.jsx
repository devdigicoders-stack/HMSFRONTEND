import React, { useState, useEffect } from 'react';
import { patientService, userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CredentialsSuccessModal from '../../components/common/CredentialsSuccessModal';
import UserProfileModal from '../../components/common/UserProfileModal';
import AdminResetPasswordModal from '../../components/common/AdminResetPasswordModal';
import {
  IoEyeOutline,
  IoSearchOutline,
  IoMedicalOutline,
  IoCreateOutline,
  IoSaveOutline,
  IoPersonOutline,
  IoAddOutline,
  IoTrashOutline,
  IoFlashOutline,
  IoEyeOffOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoListOutline,
  IoGridOutline,
  IoMailOutline,
  IoCallOutline
} from 'react-icons/io5';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { generateStrongPassword, copyToClipboard } from '../../utils/passwordGenerator';

const PatientManagement = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Clinical History Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit Patient Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmPatient, setConfirmPatient] = useState(null);
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: '',
    knownAllergies: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Credentials and Dossier Modals
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [copiedAddPassword, setCopiedAddPassword] = useState(false);

  // Add Patient Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingNewPatient, setSavingNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: generateStrongPassword('Pat'),
    phone: '',
    gender: 'Male',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: ''
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientService.getPatients({ page, limit: 10, search });
      setPatients(res.data.patients);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to fetch patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  // Toggle Account Active / Inactive
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userService.toggleStatus(userId);
      toast.success(`Patient account successfully ${currentStatus === 'active' ? 'deactivated' : 'activated'}.`);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating patient status.');
    }
  };

  // Add New Patient Submit
  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim() || !newPatient.email.trim() || !newPatient.password) {
      return toast.warning('Name, Email, and Password are required to create a patient account.');
    }

    if (newPatient.password.length < 6) {
      return toast.warning('Password must be at least 6 characters long.');
    }

    if (newPatient.phone && !isValidOptionalPhone(newPatient.phone)) {
      return toast.warning('Patient ' + PHONE_ERROR_MSG);
    }

    if (newPatient.emergencyPhone && !isValidOptionalPhone(newPatient.emergencyPhone)) {
      return toast.warning('Emergency ' + PHONE_ERROR_MSG);
    }

    setSavingNewPatient(true);
    try {
      await userService.createUser({
        ...newPatient,
        role: 'patient'
      });
      setIsAddModalOpen(false);

      // Open Credentials Modal for copying
      setCreatedCredentials({
        name: newPatient.name,
        email: newPatient.email,
        password: newPatient.password,
        role: 'patient'
      });
      setIsCredentialsModalOpen(true);

      toast.success(`Patient account created for ${newPatient.name}!`, {
        title: 'Patient Account Created'
      });

      setNewPatient({
        name: '',
        email: '',
        password: generateStrongPassword('Pat'),
        phone: '',
        gender: 'Male',
        bloodGroup: 'O+',
        dateOfBirth: '',
        address: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRel: ''
      });
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating patient account.', {
        title: 'Registration Failed'
      });
    } finally {
      setSavingNewPatient(false);
    }
  };

  // Delete Patient Permanent
  const handleDeletePatient = async () => {
    if (!deleteConfirmPatient) return;
    try {
      setIsDeletingPatient(true);
      const patientId = deleteConfirmPatient._id || deleteConfirmPatient.user?._id;
      await patientService.deletePatient(patientId);
      toast.success(`Patient record for ${deleteConfirmPatient.user?.name || ''} has been permanently deleted.`);
      setDeleteConfirmPatient(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient record.');
    } finally {
      setIsDeletingPatient(false);
    }
  };

  // Open Edit Modal
  const openEditPatient = (p) => {
    setSelectedPatient(p);
    setEditFormData({
      name: p.user?.name || '',
      phone: p.user?.phone || '',
      gender: p.profile?.gender || 'Male',
      bloodGroup: p.profile?.bloodGroup || 'O+',
      dateOfBirth: p.profile?.dateOfBirth ? new Date(p.profile.dateOfBirth).toISOString().split('T')[0] : '',
      address: p.profile?.address || '',
      emergencyName: p.profile?.emergencyContact?.name || '',
      emergencyPhone: p.profile?.emergencyContact?.phone || '',
      emergencyRel: p.profile?.emergencyContact?.relationship || '',
      knownAllergies: p.profile?.knownAllergies ? p.profile.knownAllergies.join(', ') : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.phone && !isValidOptionalPhone(editFormData.phone)) {
      return toast.warning('Patient ' + PHONE_ERROR_MSG);
    }
    if (editFormData.emergencyPhone && !isValidOptionalPhone(editFormData.emergencyPhone)) {
      return toast.warning('Emergency ' + PHONE_ERROR_MSG);
    }
    setSavingEdit(true);
    try {
      await patientService.updateProfile(selectedPatient.user._id, {
        name: editFormData.name,
        phone: editFormData.phone,
        gender: editFormData.gender,
        bloodGroup: editFormData.bloodGroup,
        dateOfBirth: editFormData.dateOfBirth || null,
        address: editFormData.address,
        emergencyContact: {
          name: editFormData.emergencyName,
          phone: editFormData.emergencyPhone,
          relationship: editFormData.emergencyRel
        },
        knownAllergies: editFormData.knownAllergies ? editFormData.knownAllergies.split(',').map(s => s.trim()).filter(Boolean) : []
      });
      setIsEditModalOpen(false);
      toast.success('Patient profile updated successfully.');
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating patient details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const openPatientHistory = async (p) => {
    setSelectedPatient(p);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await patientService.getHistory(p.user._id);
      setHistory(res.data.history);
    } catch (err) {
      toast.error('Could not load clinical history for patient.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    {
      header: 'Patient Profile',
      render: (p) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              overflow: 'hidden'
            }}
          >
            {p.user?.avatar ? (
              <img
                src={p.user.avatar}
                alt={p.user?.name || 'Patient'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <IoPersonOutline />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.user?.name}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{p.user?.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Demographics',
      render: (p) => (
        <span>
          {p.profile?.gender || 'N/A'} • <strong style={{ color: 'var(--primary-blue)' }}>{p.profile?.bloodGroup || 'Unknown'}</strong>
        </span>
      )
    },
    { header: 'Contact Phone', render: (p) => p.user?.phone || 'Not specified' },
    {
      header: 'Emergency Contact',
      render: (p) => p.profile?.emergencyContact?.name ? `${p.profile.emergencyContact.name} (${p.profile.emergencyContact.relationship || 'Kin'})` : 'None logged'
    },
    {
      header: 'Account Status',
      render: (p) => (
        <div className="d-flex align-items-center gap-2">
          <StatusBadge status={p.user?.status || 'active'} />
          <ActionBtn
            variant={p.user?.status === 'active' ? 'deactivate' : 'activate'}
            label={p.user?.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
            size="xs"
            onClick={() => (p.user?.status === 'active' ? setConfirmPatient(p) : handleToggleStatus(p.user?._id, p.user?.status))}
          />
        </div>
      )
    },
    {
      header: 'Admin Actions',
      render: (p) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="View Full Dossier"
            onClick={() => setProfileUserId(p.user?._id)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.2rem 0.5rem' }}
          >
            <IoInformationCircleOutline size={15} color="#0284C7" /> View
          </button>
          <ActionBtn
            variant="edit"
            label="Edit"
            size="sm"
            onClick={() => openEditPatient(p)}
          />
          <ActionBtn
            variant="history"
            label="History"
            size="sm"
            onClick={() => openPatientHistory(p)}
          />
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="Reset Patient Password"
            onClick={() => setResetPasswordUser(p.user)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.2rem 0.5rem', color: '#B91C1C' }}
          >
            <IoKeyOutline size={14} /> Password
          </button>
          <ActionBtn
            variant="delete"
            label="Delete"
            size="sm"
            onClick={() => setDeleteConfirmPatient(p)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Patient Medical Directory"
        subtitle="Confidential electronic patient records, permitted profile updates, clinical timeline logs, and status enforcement"
      />

      <GlassCard>
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                  <IoSearchOutline color="var(--text-secondary)" />
                </span>
                <input
                  type="text"
                  placeholder="Search patient name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control form-control-custom border-start-0"
                />
              </div>
              <button type="submit" className="btn-secondary-custom">
                Search
              </button>
            </form>
          </div>

          <div className="col-12 col-md-7 text-md-end d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }} className="me-2">
              Total: <strong>{total}</strong>
            </div>

            <div className="btn-group" role="group" aria-label="View Switch">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('list')}
                title="List View"
                style={{ fontWeight: 650, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <IoListOutline size={16} /> List
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{ fontWeight: 650, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <IoGridOutline size={16} /> Grid
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary-custom d-inline-flex align-items-center gap-2"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600 }}
            >
              <IoAddOutline size={18} />
              <span>Add New Patient</span>
            </button>
          </div>
        </div>

        {/* Content: List or Grid */}
        {viewMode === 'list' ? (
          <DataTable
            columns={columns}
            data={patients}
            loading={loading}
            emptyMessage="No registered patients matching query."
          />
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="text-secondary mt-2" style={{ fontSize: '0.86rem' }}>Loading patient directory...</div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-5 text-secondary" style={{ fontSize: '0.9rem' }}>
            No registered patients matching query.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {patients.map((p, pIdx) => {
              const patientUserId = p.user?._id || p._id || `patient-${pIdx}`;
              const displayId = typeof patientUserId === 'string' && patientUserId.length >= 6
                ? patientUserId.slice(-6).toUpperCase()
                : String(pIdx + 1).padStart(4, '0');

              return (
                <div
                  key={patientUserId}
                  className="p-3 rounded-3 border d-flex flex-column justify-content-between"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'var(--border-subtle, #E2E8F0)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Top: Avatar, Name, Status */}
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid rgba(0,0,0,0.06)'
                          }}
                        >
                          {p.user?.avatar ? (
                            <img
                              src={p.user.avatar}
                              alt={p.user?.name || 'Patient'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.parentElement) {
                                  e.target.parentElement.innerText = p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'P';
                                }
                              }}
                            />
                          ) : (
                            p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'P'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.96rem' }}>
                            {p.user?.name || 'Patient'}
                          </div>
                          <span className="font-monospace text-secondary" style={{ fontSize: '0.74rem' }}>
                            PAT-{displayId}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={p.user?.status || 'active'} />
                    </div>

                    {/* Demographics & Clinical Profile */}
                    <div className="py-2 my-2 border-top border-bottom" style={{ borderColor: '#F1F5F9', fontSize: '0.82rem' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Gender / Blood:</span>
                        <span className="fw-semibold">
                          {p.profile?.gender || 'N/A'} • <strong className="text-primary">{p.profile?.bloodGroup || 'Unknown'}</strong>
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Emergency:</span>
                        <span className="text-truncate" style={{ maxWidth: '60%' }}>
                          {p.profile?.emergencyContact?.name ? `${p.profile.emergencyContact.name} (${p.profile.emergencyContact.relationship || 'Kin'})` : 'None specified'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary">Registered:</span>
                        <span className="text-secondary">{p.user?.createdAt ? new Date(p.user.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }} className="mb-3">
                      <div className="d-flex align-items-center gap-2 text-truncate mb-1">
                        <IoMailOutline size={14} style={{ flexShrink: 0 }} />
                        <span className="text-truncate">{p.user?.email || 'No email'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <IoCallOutline size={14} style={{ flexShrink: 0 }} />
                        <span>{p.user?.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="d-flex align-items-center gap-1 flex-wrap pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                      title="View Profile Dossier"
                      onClick={() => setProfileUserId(p.user?._id)}
                      style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem' }}
                    >
                      <IoInformationCircleOutline size={14} color="#0284C7" /> View
                    </button>
                    <ActionBtn
                      variant="history"
                      label="History"
                      size="sm"
                      onClick={() => openPatientHistory(p)}
                    />
                    <ActionBtn
                      variant="edit"
                      label="Edit"
                      size="sm"
                      onClick={() => openEditPatient(p)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                      title="Reset Password"
                      onClick={() => setResetPasswordUser(p.user)}
                      style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem', color: '#B91C1C' }}
                    >
                      <IoKeyOutline size={13} /> Key
                    </button>
                    <ActionBtn
                      variant={p.user?.status === 'active' ? 'deactivate' : 'activate'}
                      label={p.user?.status === 'active' ? 'Deactivate' : 'Activate'}
                      size="sm"
                      onClick={() => (p.user?.status === 'active' ? setConfirmPatient(p) : handleToggleStatus(p.user?._id, p.user?.status))}
                    />
                    <ActionBtn
                      variant="delete"
                      label="Delete"
                      size="sm"
                      onClick={() => setDeleteConfirmPatient(p)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <div>Showing Page {page} of {Math.max(Math.ceil(total / 10), 1)}</div>
          <div className="d-flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-sm btn-light border"
            >
              Previous
            </button>
            <button
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
              className="btn btn-sm btn-light border"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Edit Patient Permitted Info Modal */}
      {selectedPatient && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Patient Profile: ${selectedPatient.user?.name}`}
          maxWidth="650px"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Full Legal Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Phone Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: handlePhoneInput(e.target.value) })}
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Gender</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Blood Group</label>
                <select
                  value={editFormData.bloodGroup}
                  onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
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
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Residential Address</label>
                <textarea
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="e.g. 123 Main St, Apartment 4B"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Emergency Contact Name</label>
                <input
                  type="text"
                  value={editFormData.emergencyName}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyName: e.target.value })}
                  className="form-control-custom"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Emergency Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={editFormData.emergencyPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyPhone: handlePhoneInput(e.target.value) })}
                  className="form-control-custom"
                  placeholder={PHONE_PLACEHOLDER}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Relationship</label>
                <input
                  type="text"
                  value={editFormData.emergencyRel}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyRel: e.target.value })}
                  className="form-control-custom"
                  placeholder="Spouse / Parent"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Known Allergies (comma separated)</label>
                <input
                  type="text"
                  value={editFormData.knownAllergies}
                  onChange={(e) => setEditFormData({ ...editFormData, knownAllergies: e.target.value })}
                  className="form-control-custom"
                  placeholder="Penicillin, Peanuts, Sulfa drugs"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary-custom">
                Cancel
              </button>
              <button type="submit" disabled={savingEdit} className="btn-primary-custom">
                {savingEdit ? 'Saving...' : 'Update Patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Patient Clinical History Modal */}
      {selectedPatient && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Clinical History: ${selectedPatient.user?.name}`}
          maxWidth="700px"
        >
          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
              Loading patient chart...
            </div>
          ) : (
            <div>
              {/* Patient Basic Demographics Card */}
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--light-blue)' }}>
                <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                  <div className="col-4"><strong>Blood Group:</strong> {selectedPatient.profile?.bloodGroup || 'Unknown'}</div>
                  <div className="col-4"><strong>Gender:</strong> {selectedPatient.profile?.gender || 'N/A'}</div>
                  <div className="col-4"><strong>Phone:</strong> {selectedPatient.user?.phone || 'N/A'}</div>
                  <div className="col-12"><strong>Address:</strong> {selectedPatient.profile?.address || 'Not specified'}</div>
                </div>
              </div>

              {/* Past Consultations */}
              <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Appointments ({history?.appointments?.length || 0})
              </h6>
              {history?.appointments?.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: '0.82rem' }}>No past appointments recorded.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  {history?.appointments?.map((a) => (
                    <div key={a._id} className="p-2 border rounded" style={{ fontSize: '0.82rem', background: '#fff' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Dr. {a.doctor?.name}</strong>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="text-secondary">{new Date(a.appointmentDate).toLocaleDateString()} at {a.timeSlot?.start}</div>
                      <div>Reason: {a.reasonForVisit}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prescriptions */}
              <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Prescriptions ({history?.prescriptions?.length || 0})
              </h6>
              {history?.prescriptions?.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: '0.82rem' }}>No prescriptions issued.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  {history?.prescriptions?.map((p) => (
                    <div key={p._id} className="p-2 border rounded" style={{ fontSize: '0.82rem', background: '#fff' }}>
                      <div className="d-flex justify-content-between">
                        <strong>Diagnosis: {p.diagnosis}</strong>
                        <span className="text-secondary">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1">
                        {p.medications?.map((m, i) => (
                          <div key={i} className="text-primary font-monospace" style={{ fontSize: '0.78rem' }}>
                            • {m.medicineName} ({m.dosage}) - {m.frequency} for {m.duration}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lab Requests */}
              <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Laboratory Requests ({history?.labRequests?.length || 0})
              </h6>
              {history?.labRequests?.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: '0.82rem' }}>No lab tests requested.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history?.labRequests?.map((l) => (
                    <div key={l._id} className="p-2 border rounded d-flex justify-content-between align-items-center" style={{ fontSize: '0.82rem', background: '#fff' }}>
                      <div>
                        <strong>{l.labTest?.testName}</strong>
                        <div className="text-secondary">{new Date(l.createdAt).toLocaleDateString()}</div>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Deactivate Patient Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!confirmPatient}
        onClose={() => setConfirmPatient(null)}
        onConfirm={() => {
          if (confirmPatient) {
            handleToggleStatus(confirmPatient.user?._id, confirmPatient.user?.status);
          }
          setConfirmPatient(null);
        }}
        title="Confirm Patient Deactivation"
        message={`Are you sure you want to deactivate the patient account for ${confirmPatient?.user?.name || 'this patient'}? They will be unable to log in to book appointments.`}
        confirmText="Deactivate Patient"
        confirmVariant="danger"
      />

      {/* Delete Patient Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPatient}
        onClose={() => setDeleteConfirmPatient(null)}
        onConfirm={handleDeletePatient}
        title="Permanently Delete Patient"
        message={`Are you sure you want to permanently delete patient "${deleteConfirmPatient?.user?.name || 'this patient'}"? All associated account credentials and medical records will be removed.`}
        confirmText="Delete Patient"
        confirmVariant="danger"
      />

      {/* Add New Patient Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Patient Account"
          size="lg"
        >
          <form onSubmit={handleAddPatientSubmit}>
            <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--mint)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)', marginBottom: '0.2rem' }}>
                🔑 Patient Login Credentials
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                The email and password entered below will be used by the patient to securely log in to LifeCare Hospital.
              </div>
            </div>

            {/* Section A: Credentials */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Full Legal Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Login Email Address <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="email"
                  required
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="form-control-custom"
                />
              </div>

              {/* PASSWORD GENERATION & DISPLAY ROW */}
              <div className="col-12">
                <div
                  className="p-3 rounded-2"
                  style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label-custom mb-0" style={{ color: '#065F46', fontWeight: 700 }}>
                      <IoKeyOutline className="me-1" /> Initial Login Password{' '}
                      <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = generateStrongPassword('Pat');
                        setNewPatient((prev) => ({ ...prev, password: pass }));
                        setShowAddPassword(true);
                      }}
                      className="btn btn-sm d-flex align-items-center gap-1"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.65rem'
                      }}
                    >
                      <IoFlashOutline /> ⚡ Auto-Generate Strong Password
                    </button>
                  </div>

                  <div className="input-group">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPatient.password}
                      onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                      placeholder="Enter or generate password"
                      className="form-control-custom"
                      style={{
                        fontFamily: showAddPassword ? 'monospace' : 'inherit',
                        fontWeight: 700,
                        fontSize: '0.98rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="btn btn-light border"
                      title={showAddPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAddPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newPatient.password) return;
                        const ok = await copyToClipboard(newPatient.password);
                        if (ok) {
                          setCopiedAddPassword(true);
                          setTimeout(() => setCopiedAddPassword(false), 2000);
                        }
                      }}
                      className="btn btn-light border"
                      disabled={!newPatient.password}
                      title="Copy password to clipboard"
                    >
                      {copiedAddPassword ? (
                        <IoCheckmarkCircle size={18} color="#10B981" />
                      ) : (
                        <IoCopyOutline size={18} />
                      )}
                    </button>
                  </div>
                  <small style={{ fontSize: '0.76rem', color: '#047857' }} className="d-block mt-1">
                    Credentials can be copied and shared directly after clicking 'Create Patient Account'.
                  </small>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: handlePhoneInput(e.target.value) })}
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>
            </div>

            {/* Section B: Demographics */}
            <h6 style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
              Demographics & Information
            </h6>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Gender <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                <select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Blood Group</label>
                <select
                  value={newPatient.bloodGroup}
                  onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
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
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Residential Address</label>
                <input
                  type="text"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="Street address, City, State, ZIP"
                  className="form-control-custom"
                />
              </div>
            </div>

            {/* Section C: Emergency Contact */}
            <h6 style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
              Emergency Contact Protocol (Optional)
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Emergency Contact Name</label>
                <input
                  type="text"
                  value={newPatient.emergencyName}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyName: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Emergency Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={newPatient.emergencyPhone}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyPhone: handlePhoneInput(e.target.value) })}
                  className="form-control-custom"
                  placeholder={PHONE_PLACEHOLDER}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Relationship</label>
                <input
                  type="text"
                  value={newPatient.emergencyRel}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyRel: e.target.value })}
                  placeholder="e.g. Spouse, Parent, Kin"
                  className="form-control-custom"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-sm btn-light border px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingNewPatient}
                className="btn-primary-custom px-4"
              >
                {savingNewPatient ? 'Creating Account...' : 'Create Patient Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Permanently Delete Patient Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPatient}
        onClose={() => setDeleteConfirmPatient(null)}
        onConfirm={handleDeletePatient}
        loading={isDeletingPatient}
        title="Permanently Delete Patient Record"
        message={`Are you sure you want to permanently delete patient ${deleteConfirmPatient?.user?.name || 'this patient'}? This will remove their medical profile, user login account, and assigned appointments and clinical records. This action cannot be undone.`}
        confirmText="Delete Patient"
        confirmVariant="danger"
      />

      {/* Credentials Created Success Modal */}
      <CredentialsSuccessModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        credentials={createdCredentials}
        title="Patient Credentials Provisioned"
      />

      {/* Full 360 Dossier Modal */}
      <UserProfileModal
        isOpen={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
        onResetPasswordClick={(u) => {
          setProfileUserId(null);
          setResetPasswordUser(u);
        }}
      />

      {/* Admin Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
        onSuccess={(updatedCreds) => {
          setCreatedCredentials(updatedCreds);
          setIsCredentialsModalOpen(true);
        }}
      />
    </div>
  );
};

export default PatientManagement;
