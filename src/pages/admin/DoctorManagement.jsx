import React, { useState, useEffect } from 'react';
import { doctorService, userService, appointmentService, departmentService } from '../../services/api';
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
  IoCreateOutline,
  IoMedkitOutline,
  IoAddOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoToggleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoFlashOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoListOutline,
  IoGridOutline,
  IoMailOutline,
  IoCallOutline,
  IoTrashOutline
} from 'react-icons/io5';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { generateStrongPassword, copyToClipboard } from '../../utils/passwordGenerator';

const DoctorManagement = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Search & Filter
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Edit Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDoctor, setConfirmDoctor] = useState(null);
  const [deleteDoctorModal, setDeleteDoctorModal] = useState(null);
  const [isDeletingDoctor, setIsDeletingDoctor] = useState(false);

  // Modals state for password, credentials & dossier
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [copiedAddPassword, setCopiedAddPassword] = useState(false);

  // Add Doctor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: generateStrongPassword('Doc'),
    phone: '',
    specialization: '',
    qualifications: '',
    experienceYears: 3,
    consultationFee: 600,
    department: 'General OPD',
    roomNumber: 'OPD-101'
  });

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await departmentService.getDepartments({ limit: 100 });
      if (res.data?.departments) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      // fallback
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getDoctors();
      setDoctors(res.data.doctors);
      setFilteredDoctors(res.data.doctors);
    } catch (err) {
      toast.error('Failed to fetch doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  // Filter effect
  useEffect(() => {
    let list = [...doctors];
    if (deptFilter !== 'All') {
      list = list.filter(d => d.department?.toLowerCase() === deptFilter.toLowerCase());
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        d =>
          d.user?.name?.toLowerCase().includes(term) ||
          d.specialization?.toLowerCase().includes(term) ||
          d.user?.email?.toLowerCase().includes(term) ||
          d.roomNumber?.toLowerCase().includes(term)
      );
    }
    setFilteredDoctors(list);
  }, [search, deptFilter, doctors]);

  // Handle Add Doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (newDoctor.phone && !isValidOptionalPhone(newDoctor.phone)) {
      toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Phone Number' });
      return;
    }
    if (!newDoctor.password || newDoctor.password.length < 6) {
      toast.warning('Password must be at least 6 characters long.', { title: 'Weak Password' });
      return;
    }
    try {
      await userService.createUser({
        ...newDoctor,
        role: 'doctor'
      });
      setIsAddModalOpen(false);

      // Open credentials popup
      setCreatedCredentials({
        name: `Dr. ${newDoctor.name.replace(/^Dr\.\s*/i, '')}`,
        email: newDoctor.email,
        password: newDoctor.password,
        role: 'doctor'
      });
      setIsCredentialsModalOpen(true);

      toast.success(`Physician account for Dr. ${newDoctor.name} provisioned!`, {
        title: 'Doctor Account Created'
      });

      setNewDoctor({
        name: '',
        email: '',
        password: generateStrongPassword('Doc'),
        phone: '',
        specialization: '',
        qualifications: '',
        experienceYears: 3,
        consultationFee: 600,
        department: departments[0]?.name || 'General OPD',
        roomNumber: 'OPD-101'
      });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating doctor account.', {
        title: 'Registration Failed'
      });
    }
  };

  // Handle Edit Doctor
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (selectedDoctor.user?.phone && !isValidOptionalPhone(selectedDoctor.user.phone)) {
      toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Phone Number' });
      return;
    }
    try {
      await doctorService.updateProfile(selectedDoctor.user._id, {
        specialization: selectedDoctor.specialization,
        qualifications: selectedDoctor.qualifications,
        experienceYears: selectedDoctor.experienceYears,
        consultationFee: selectedDoctor.consultationFee,
        department: selectedDoctor.department,
        roomNumber: selectedDoctor.roomNumber,
        isAvailable: selectedDoctor.isAvailable,
        name: selectedDoctor.user?.name,
        phone: selectedDoctor.user?.phone
      });
      setIsEditModalOpen(false);
      toast.success('Doctor profile updated successfully.');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile.');
    }
  };

  // Handle Account Status Toggle (Active / Deactivated)
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userService.toggleStatus(userId);
      toast.success(`Doctor account status changed to ${currentStatus === 'active' ? 'Inactive' : 'Active'}.`);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating doctor account status.');
    }
  };

  // Handle Permanent Delete Doctor
  const handleDeleteDoctor = async () => {
    if (!deleteDoctorModal) return;
    try {
      setIsDeletingDoctor(true);
      const doctorId = deleteDoctorModal._id || deleteDoctorModal.user?._id;
      await doctorService.deleteDoctor(doctorId);
      toast.success(`Physician Dr. ${deleteDoctorModal.user?.name || ''} has been permanently deleted.`);
      setDeleteDoctorModal(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting doctor record.');
    } finally {
      setIsDeletingDoctor(false);
    }
  };

  // Open Doctor Appointment Schedule
  const openDoctorSchedule = async (doc) => {
    setScheduleDoctor(doc);
    setIsScheduleModalOpen(true);
    setScheduleLoading(true);
    try {
      const res = await appointmentService.getAppointments({ doctor: doc.user?._id, limit: 30 });
      setDoctorAppointments(res.data?.appointments || []);
    } catch (err) {
      toast.error('Could not retrieve schedule for this doctor.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const columns = [
    {
      header: 'Physician Details',
      render: (d) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            {(d.user?.avatar || d.avatar) ? (
              <img
                src={d.user?.avatar || d.avatar}
                alt={d.user?.name || 'Doctor'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.innerText = d.user?.name ? d.user.name.charAt(0).toUpperCase() : 'D';
                  }
                }}
              />
            ) : (
              d.user?.name ? d.user.name.charAt(0).toUpperCase() : 'D'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.user?.name}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {d.user?.email} {d.user?.phone ? `• ${d.user.phone}` : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Department & Specialty',
      render: (d) => (
        <div>
          <strong style={{ color: 'var(--primary-blue)' }}>{d.specialization}</strong>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{d.department}</div>
        </div>
      )
    },
    {
      header: 'Credentials',
      render: (d) => (
        <div>
          <div>{d.qualifications}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{d.experienceYears} Years Clinical Exp</div>
        </div>
      )
    },
    {
      header: 'Fee & Room',
      render: (d) => (
        <div>
          <span style={{ fontWeight: 700 }}>₹{d.consultationFee}</span>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Room: {d.roomNumber}</div>
        </div>
      )
    },
    {
      header: 'Clinic Availability',
      render: (d) => (
        <StatusBadge status={d.isAvailable ? 'Active' : 'Inactive'} />
      )
    },
    {
      header: 'Account Status',
      render: (d) => (
        <div className="d-flex align-items-center gap-2">
          <StatusBadge status={d.user?.status || 'active'} />
          <ActionBtn
            variant={d.user?.status === 'active' ? 'deactivate' : 'activate'}
            label={d.user?.status === 'active' ? 'Deactivate' : 'Activate'}
            size="xs"
            onClick={() => (d.user?.status === 'active' ? setConfirmDoctor(d) : handleToggleStatus(d.user?._id, d.user?.status))}
          />
        </div>
      )
    },
    {
      header: 'Admin Actions',
      render: (d) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="View Full Clinical Dossier"
            onClick={() => setProfileUserId(d.user?._id)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.2rem 0.5rem' }}
          >
            <IoInformationCircleOutline size={15} color="#0284C7" /> View
          </button>
          <ActionBtn
            variant="edit"
            label="Edit"
            size="sm"
            onClick={() => {
              setSelectedDoctor({ ...d });
              setIsEditModalOpen(true);
            }}
          />
          <ActionBtn
            variant="view"
            label="Schedule"
            size="sm"
            onClick={() => openDoctorSchedule(d)}
          />
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="Reset Doctor Login Password"
            onClick={() => setResetPasswordUser(d.user)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.2rem 0.5rem', color: '#B91C1C' }}
          >
            <IoKeyOutline size={14} /> Password
          </button>
          <ActionBtn
            variant="delete"
            label="Delete Doctor"
            size="sm"
            onClick={() => setDeleteDoctorModal(d)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Physician & Doctor Management"
        subtitle="Provision doctor accounts, configure clinical credentials, schedule caps, consultation fees, and access states"
        actionButton={
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary-custom">
            <IoAddOutline size={18} /> Add New Doctor
          </button>
        }
      />

      <GlassCard>
        {/* Search & Filter Toolbar */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoSearchOutline color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder="Search physician by name, specialty, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-custom border-start-0"
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="form-select-custom"
            >
              <option value="All">All Clinical Departments</option>
              <option value="Cardiology & Vascular Care">Cardiology & Vascular Care</option>
              <option value="Department of Neurosciences">Department of Neurosciences</option>
              <option value="Pediatric & Neonatal Care">Pediatric & Neonatal Care</option>
              <option value="General OPD">General OPD</option>
            </select>
          </div>

          <div className="col-6 col-md-2 text-center" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Total: <strong>{filteredDoctors.length}</strong>
          </div>

          <div className="col-12 col-md-2 text-md-end">
            <div className="btn-group w-100" role="group" aria-label="View Switch">
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
          </div>
        </div>

        {/* Content: List or Grid */}
        {viewMode === 'list' ? (
          <DataTable
            columns={columns}
            data={filteredDoctors}
            loading={loading}
            emptyMessage="No doctors matching search criteria."
          />
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="text-secondary mt-2" style={{ fontSize: '0.86rem' }}>Loading doctors...</div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-5 text-secondary" style={{ fontSize: '0.9rem' }}>
            No doctors matching search criteria.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredDoctors.map((d) => (
              <div
                key={d._id}
                className="p-3 rounded-3 border d-flex flex-column justify-content-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'var(--border-subtle, #E2E8F0)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Top: Avatar, Name, Availability */}
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.15rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}
                      >
                        {(d.user?.avatar || d.avatar) ? (
                          <img
                            src={d.user?.avatar || d.avatar}
                            alt={d.user?.name || 'Doctor'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.parentElement) {
                                e.target.parentElement.innerText = d.user?.name ? d.user.name.charAt(0).toUpperCase() : 'D';
                              }
                            }}
                          />
                        ) : (
                          d.user?.name ? d.user.name.charAt(0).toUpperCase() : 'D'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.96rem' }}>
                          {d.user?.name}
                        </div>
                        <strong style={{ color: 'var(--primary-blue)', fontSize: '0.78rem' }}>
                          {d.specialization}
                        </strong>
                      </div>
                    </div>
                    <StatusBadge status={d.isAvailable ? 'Active' : 'Inactive'} />
                  </div>

                  {/* Department & Credentials */}
                  <div className="py-2 my-2 border-top border-bottom" style={{ borderColor: '#F1F5F9', fontSize: '0.82rem' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">Department:</span>
                      <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{d.department}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">Qualifications:</span>
                      <span className="fw-semibold">{d.qualifications || 'MBBS'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">Experience:</span>
                      <span className="fw-semibold">{d.experienceYears} Years Clinical</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Fee / Room:</span>
                      <span className="fw-bold text-success">₹{d.consultationFee} <span className="text-secondary fw-normal">({d.roomNumber})</span></span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }} className="mb-3">
                    <div className="d-flex align-items-center gap-2 text-truncate mb-1">
                      <IoMailOutline size={14} style={{ flexShrink: 0 }} />
                      <span className="text-truncate">{d.user?.email}</span>
                    </div>
                    {d.user?.phone && (
                      <div className="d-flex align-items-center gap-2">
                        <IoCallOutline size={14} style={{ flexShrink: 0 }} />
                        <span>{d.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="d-flex align-items-center gap-1 flex-wrap pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <ActionBtn
                    variant="edit"
                    label="Edit"
                    size="sm"
                    onClick={() => {
                      setSelectedDoctor({ ...d });
                      setIsEditModalOpen(true);
                    }}
                  />
                  <ActionBtn
                    variant="view"
                    label="Schedule"
                    size="sm"
                    onClick={() => openDoctorSchedule(d)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="Reset Password"
                    onClick={() => setResetPasswordUser(d.user)}
                    style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem', color: '#B91C1C' }}
                  >
                    <IoKeyOutline size={13} /> Key
                  </button>
                  <ActionBtn
                    variant={d.user?.status === 'active' ? 'deactivate' : 'activate'}
                    label={d.user?.status === 'active' ? 'Deactivate' : 'Activate'}
                    size="sm"
                    onClick={() => handleToggleStatus(d.user?._id, d.user?.status)}
                  />
                  <ActionBtn
                    variant="delete"
                    label="Delete"
                    size="sm"
                    onClick={() => setDeleteDoctorModal(d)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Add New Doctor Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision Attending Physician Account"
        maxWidth="680px"
      >
        <form onSubmit={handleAddDoctor}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Physician Full Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                className="form-control-custom"
                placeholder="Dr. Emily Watson"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Doctor Email Address <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="email"
                required
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                className="form-control-custom"
                placeholder="emily.watson@hospital.com"
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
                      const pass = generateStrongPassword('Doc');
                      setNewDoctor((prev) => ({ ...prev, password: pass }));
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
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
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
                      if (!newDoctor.password) return;
                      const ok = await copyToClipboard(newDoctor.password);
                      if (ok) {
                        setCopiedAddPassword(true);
                        setTimeout(() => setCopiedAddPassword(false), 2000);
                      }
                    }}
                    className="btn btn-light border"
                    disabled={!newDoctor.password}
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
                  Credentials can be copied and shared directly after clicking 'Provision Doctor Account'.
                </small>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Contact Phone Number</label>
              <input
                type="tel"
                maxLength={10}
                pattern={PHONE_PATTERN}
                title={PHONE_TITLE}
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({ ...newDoctor, phone: handlePhoneInput(e.target.value) })}
                className="form-control-custom"
                placeholder={PHONE_PLACEHOLDER}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Hospital Department <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              {departments.length > 0 ? (
                <select
                  value={newDoctor.department}
                  onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                  className="form-select-custom"
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={newDoctor.department}
                  onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                  className="form-control-custom"
                  placeholder="Cardiology & Vascular Care"
                />
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Medical Specialization <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. Cardiology, Neurology"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Qualifications <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={newDoctor.qualifications}
                onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })}
                className="form-control-custom"
                placeholder="MBBS, MD, FACC"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label-custom">Experience (Years) <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="number"
                min={0}
                required
                value={newDoctor.experienceYears}
                onChange={(e) => setNewDoctor({ ...newDoctor, experienceYears: e.target.value === '' ? '' : Number(e.target.value) })}
                className="form-control-custom"
                placeholder="e.g. 5"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label-custom">Consultation Fee (₹) <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="number"
                min={0}
                required
                value={newDoctor.consultationFee}
                onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: e.target.value === '' ? '' : Number(e.target.value) })}
                className="form-control-custom"
                placeholder="e.g. 700"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label-custom">Allocated Room <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={newDoctor.roomNumber}
                onChange={(e) => setNewDoctor({ ...newDoctor, roomNumber: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. OPD-102"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary-custom">
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom">
              Provision Doctor Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Profile Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Clinical Profile: ${selectedDoctor.user?.name}`}
          maxWidth="650px"
        >
          <form onSubmit={handleUpdate}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={selectedDoctor.user?.name || ''}
                  onChange={(e) =>
                    setSelectedDoctor({
                      ...selectedDoctor,
                      user: { ...selectedDoctor.user, name: e.target.value }
                    })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={selectedDoctor.user?.phone || ''}
                  onChange={(e) =>
                    setSelectedDoctor({
                      ...selectedDoctor,
                      user: { ...selectedDoctor.user, phone: handlePhoneInput(e.target.value) }
                    })
                  }
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Specialization</label>
                <input
                  type="text"
                  required
                  value={selectedDoctor.specialization || ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, specialization: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Qualifications</label>
                <input
                  type="text"
                  required
                  value={selectedDoctor.qualifications || ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, qualifications: e.target.value })}
                  placeholder="e.g. MBBS, MD"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  value={selectedDoctor.experienceYears ?? ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, experienceYears: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="e.g. 5"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={selectedDoctor.consultationFee ?? ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, consultationFee: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="e.g. 700"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Room Number</label>
                <input
                  type="text"
                  value={selectedDoctor.roomNumber || ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, roomNumber: e.target.value })}
                  placeholder="e.g. OPD-102"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Department</label>
                <input
                  type="text"
                  value={selectedDoctor.department || ''}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, department: e.target.value })}
                  placeholder="e.g. General OPD"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Accepting New Patient Appointments</label>
                <select
                  value={selectedDoctor.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, isAvailable: e.target.value === 'true' })}
                  className="form-select-custom"
                >
                  <option value="true">Active & Accepting Appointments</option>
                  <option value="false">Unavailable / On Leave</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary-custom">
                Cancel
              </button>
              <button type="submit" className="btn-primary-custom">
                Save Doctor Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Doctor Schedule Modal */}
      {scheduleDoctor && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title={`Clinical Schedule: Dr. ${scheduleDoctor.user?.name}`}
          maxWidth="700px"
        >
          {scheduleLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
              Loading appointment docket...
            </div>
          ) : (
            <div>
              <div className="p-3 mb-3 rounded d-flex align-items-center gap-3" style={{ backgroundColor: 'var(--light-blue)' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
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
                  {(scheduleDoctor.user?.avatar || scheduleDoctor.avatar) ? (
                    <img
                      src={scheduleDoctor.user?.avatar || scheduleDoctor.avatar}
                      alt={scheduleDoctor.user?.name || 'Doctor'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                          e.target.parentElement.innerText = scheduleDoctor.user?.name ? scheduleDoctor.user.name.charAt(0).toUpperCase() : 'D';
                        }
                      }}
                    />
                  ) : (
                    scheduleDoctor.user?.name ? scheduleDoctor.user.name.charAt(0).toUpperCase() : 'D'
                  )}
                </div>
                <div className="row g-2 flex-grow-1" style={{ fontSize: '0.82rem' }}>
                  <div className="col-4"><strong>Specialty:</strong> {scheduleDoctor.specialization}</div>
                  <div className="col-4"><strong>Room:</strong> {scheduleDoctor.roomNumber}</div>
                  <div className="col-4"><strong>Department:</strong> {scheduleDoctor.department}</div>
                </div>
              </div>

              <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Assigned Appointments ({doctorAppointments.length})
              </h6>

              {doctorAppointments.length === 0 ? (
                <div className="text-center py-4 text-secondary" style={{ fontSize: '0.84rem' }}>
                  No active appointments currently scheduled for this physician.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 350, overflowY: 'auto' }}>
                  {doctorAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="p-3 border rounded d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: '#fff', fontSize: '0.82rem' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {appt.patient?.name || 'Patient'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Reason: {appt.reasonForVisit}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                          Date: {new Date(appt.appointmentDate).toLocaleDateString()} ({appt.timeSlot?.start} - {appt.timeSlot?.end})
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Deactivate Doctor Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!confirmDoctor}
        onClose={() => setConfirmDoctor(null)}
        onConfirm={() => {
          if (confirmDoctor) {
            handleToggleStatus(confirmDoctor.user?._id, confirmDoctor.user?.status);
          }
          setConfirmDoctor(null);
        }}
        title="Confirm Doctor Deactivation"
        message={`Are you sure you want to deactivate Dr. ${confirmDoctor?.user?.name || 'this doctor'}'s account? This will block their login and suspend new patient bookings.`}
        confirmText="Deactivate Doctor"
        confirmVariant="danger"
      />

      {/* Permanently Delete Doctor Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!deleteDoctorModal}
        onClose={() => setDeleteDoctorModal(null)}
        onConfirm={handleDeleteDoctor}
        loading={isDeletingDoctor}
        title="Permanently Delete Physician"
        message={`Are you sure you want to permanently delete Dr. ${deleteDoctorModal?.user?.name || 'this doctor'}? This will delete their profile, user credentials, and assigned records. This action cannot be undone.`}
        confirmText="Delete Doctor"
        confirmVariant="danger"
      />

      {/* Credentials Created Success Modal */}
      <CredentialsSuccessModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        credentials={createdCredentials}
        title="Physician Credentials Provisioned"
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

export default DoctorManagement;
