import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { userService, departmentService } from '../../services/api';
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
  IoAddOutline,
  IoSearchOutline,
  IoToggleOutline,
  IoCreateOutline,
  IoFlashOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoKeyOutline,
  IoTrashOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoMedkitOutline,
  IoFlaskOutline,
  IoShieldCheckmarkOutline,
  IoListOutline,
  IoGridOutline,
  IoMailOutline,
  IoCallOutline
} from 'react-icons/io5';
import {
  handlePhoneInput,
  isValidOptionalPhone,
  PHONE_PLACEHOLDER,
  PHONE_PATTERN,
  PHONE_TITLE,
  PHONE_ERROR_MSG
} from '../../utils/phoneValidation';
import { generateStrongPassword, copyToClipboard } from '../../utils/passwordGenerator';

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Departments for dynamic dropdown
  const [departments, setDepartments] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // 360 Profile Dossier Modal
  const [profileUserId, setProfileUserId] = useState(null);

  // Admin Reset Password Modal
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  // Credentials Generated Modal
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // Password visibility & copy feedback in Add Modal
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [copiedAddPassword, setCopiedAddPassword] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'doctor',
    specialization: '',
    qualifications: '',
    experienceYears: 2,
    consultationFee: 500,
    department: '',
    roomNumber: 'OPD-101',
    gender: 'Male',
    bloodGroup: 'O+'
  });

  // Fetch departments for doctor creation
  const fetchDepartments = async () => {
    try {
      const res = await departmentService.getDepartments({ limit: 100 });
      if (res.data?.departments) {
        setDepartments(res.data.departments);
        if (res.data.departments.length > 0 && !newUser.department) {
          setNewUser((prev) => ({ ...prev, department: res.data.departments[0].name }));
        }
      }
    } catch (err) {
      // Non-critical, fallback to text/general
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        page,
        limit,
        search,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Could not load hospital users directory.', {
        title: 'Network Error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleStatus(user._id);
      toast.success(`Account status updated for ${user.name}`, {
        title: 'Status Modified'
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.', {
        title: 'Operation Failed'
      });
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await userService.deleteUser(user._id);
      toast.success(`${user.name}'s account has been permanently removed.`, {
        title: 'User Deleted'
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user account.', {
        title: 'Deletion Failed'
      });
    }
  };

  const handleAutoGeneratePassword = () => {
    const rolePrefix =
      newUser.role === 'doctor'
        ? 'Doc'
        : newUser.role === 'lab'
        ? 'Lab'
        : newUser.role === 'admin'
        ? 'Adm'
        : 'Pat';
    const generated = generateStrongPassword(rolePrefix);
    setNewUser((prev) => ({ ...prev, password: generated }));
    setShowAddPassword(true);
  };

  const handleCopyAddPassword = async () => {
    if (!newUser.password) return;
    const ok = await copyToClipboard(newUser.password);
    if (ok) {
      setCopiedAddPassword(true);
      setTimeout(() => setCopiedAddPassword(false), 2000);
    }
  };

  const handleOpenAddModal = () => {
    // Auto-generate an initial password for convenience
    const initialPass = generateStrongPassword('doc');
    setNewUser({
      name: '',
      email: '',
      password: initialPass,
      phone: '',
      role: 'doctor',
      specialization: 'General Medicine',
      qualifications: 'MBBS',
      experienceYears: 2,
      consultationFee: 500,
      department: departments[0]?.name || 'General OPD',
      roomNumber: 'OPD-101',
      gender: 'Male',
      bloodGroup: 'O+'
    });
    setShowAddPassword(true);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.phone && !isValidOptionalPhone(newUser.phone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Mobile Number' });
    }
    if (!newUser.password || newUser.password.length < 6) {
      return toast.warning('Password must be at least 6 characters long.', {
        title: 'Weak Password'
      });
    }

    try {
      await userService.createUser(newUser);
      setIsAddModalOpen(false);

      // Save credentials for the success modal
      setCreatedCredentials({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      setIsCredentialsModalOpen(true);

      toast.success(`Authorized ${newUser.role.toUpperCase()} account created successfully!`, {
        title: 'Account Provisioned'
      });

      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating user account.', {
        title: 'Registration Failed'
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (selectedUser.phone && !isValidOptionalPhone(selectedUser.phone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Mobile Number' });
    }
    try {
      await userService.updateUser(selectedUser._id, {
        name: selectedUser.name,
        phone: selectedUser.phone,
        status: selectedUser.status,
        role: selectedUser.role
      });
      setIsEditModalOpen(false);
      toast.success('User details updated successfully.', {
        title: 'User Updated'
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating user.', {
        title: 'Update Failed'
      });
    }
  };

  const columns = [
    {
      header: 'Full Name & ID',
      render: (u) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor:
                u.role === 'admin'
                  ? '#FEE2E2'
                  : u.role === 'doctor'
                  ? '#DCFCE7'
                  : u.role === 'lab'
                  ? '#FEF3C7'
                  : '#DBEAFE',
              color:
                u.role === 'admin'
                  ? '#991B1B'
                  : u.role === 'doctor'
                  ? '#15803D'
                  : u.role === 'lab'
                  ? '#B45309'
                  : '#1D4ED8',
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
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={u.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.innerText = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                  }
                }}
              />
            ) : (
              u.name ? u.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              ID: {u._id ? u._id.substring(18) : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Email Address',
      render: (u) => (
        <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.86rem' }}>
          {u.email}
        </span>
      )
    },
    {
      header: 'Assigned Role',
      render: (u) => (
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            backgroundColor:
              u.role === 'admin'
                ? '#FEE2E2'
                : u.role === 'doctor'
                ? '#DCFCE7'
                : u.role === 'lab'
                ? '#FEF3C7'
                : '#DBEAFE',
            color:
              u.role === 'admin'
                ? '#991B1B'
                : u.role === 'doctor'
                ? '#15803D'
                : u.role === 'lab'
                ? '#B45309'
                : '#1D4ED8',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          {u.role}
        </span>
      )
    },
    {
      header: 'Phone',
      render: (u) => (
        <span style={{ fontSize: '0.86rem', color: u.phone ? '#1E293B' : '#94A3B8' }}>
          {u.phone || '—'}
        </span>
      )
    },
    {
      header: 'Account Status',
      render: (u) => <StatusBadge status={u.status} />
    },
    {
      header: 'Administrative Actions',
      render: (u) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="View Full Profile Dossier"
            onClick={() => setProfileUserId(u._id)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.25rem 0.55rem' }}
          >
            <IoInformationCircleOutline size={15} color="#0284C7" /> View
          </button>

          <ActionBtn
            variant="edit"
            label="Edit"
            size="sm"
            onClick={() => {
              setSelectedUser(u);
              setIsEditModalOpen(true);
            }}
          />

          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="Reset Password"
            onClick={() => setResetPasswordUser(u)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.25rem 0.55rem', color: '#B91C1C' }}
          >
            <IoKeyOutline size={14} /> Password
          </button>

          <ActionBtn
            variant={u.status === 'active' ? 'deactivate' : 'activate'}
            label={u.status === 'active' ? 'Deactivate' : 'Activate'}
            size="sm"
            onClick={() => (u.status === 'active' ? setConfirmUser(u) : handleToggleStatus(u))}
          />

          <button
            type="button"
            className="btn btn-sm btn-outline-danger border d-inline-flex align-items-center"
            title="Delete User Account"
            onClick={() => setDeleteConfirmUser(u)}
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.76rem' }}
          >
            <IoTrashOutline size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Personnel & Patient Accounts"
        subtitle="Provision clinical staff, generate credentials, monitor authorized access and inspect dossiers"
        actionButton={
          <button onClick={handleOpenAddModal} className="btn-primary-custom d-flex align-items-center gap-2">
            <IoAddOutline size={20} />
            Provision New User
          </button>
        }
      />

      {/* Quick Role Filter Badges */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {[
          { key: 'all', label: 'All Users', icon: IoPeopleOutline },
          { key: 'doctor', label: 'Doctors', icon: IoMedkitOutline },
          { key: 'patient', label: 'Patients', icon: IoPeopleOutline },
          { key: 'lab', label: 'Lab Specialists', icon: IoFlaskOutline },
          { key: 'admin', label: 'Administrators', icon: IoShieldCheckmarkOutline }
        ].map((filter) => {
          const Icon = filter.icon;
          const isActive = roleFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                setRoleFilter(filter.key);
                setPage(1);
              }}
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{
                backgroundColor: isActive ? 'var(--primary-blue, #10B981)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                border: isActive ? 'none' : '1px solid #CBD5E1',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                fontWeight: 650,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              {filter.label}
            </button>
          );
        })}
      </div>

      <GlassCard className="mb-4">
        {/* Filters and Search Toolbar */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <input
                type="text"
                placeholder="Search by full name, email, or contact phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control-custom"
              />
              <button type="submit" className="btn-secondary-custom">
                <IoSearchOutline size={16} />
              </button>
            </form>
          </div>

          <div className="col-6 col-md-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="all">Role: All Roles</option>
              <option value="doctor">Doctors Only</option>
              <option value="patient">Patients Only</option>
              <option value="lab">Lab Staff Only</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="all">Status: All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
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
            data={users}
            loading={loading}
            emptyMessage="No hospital users match your criteria."
          />
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="text-secondary mt-2" style={{ fontSize: '0.86rem' }}>Loading users directory...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-secondary" style={{ fontSize: '0.9rem' }}>
            No hospital users match your criteria.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {users.map((u) => (
              <div
                key={u._id}
                className="p-3 rounded-3 border d-flex flex-column justify-content-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'var(--border-subtle, #E2E8F0)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Top row: Avatar, Name, Role badge, Status */}
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor:
                            u.role === 'admin'
                              ? '#FEE2E2'
                              : u.role === 'doctor'
                              ? '#DCFCE7'
                              : u.role === 'lab'
                              ? '#FEF3C7'
                              : '#DBEAFE',
                          color:
                            u.role === 'admin'
                              ? '#991B1B'
                              : u.role === 'doctor'
                              ? '#15803D'
                              : u.role === 'lab'
                              ? '#B45309'
                              : '#1D4ED8',
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
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.parentElement) {
                                e.target.parentElement.innerText = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                              }
                            }}
                          />
                        ) : (
                          u.name ? u.name.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.96rem' }}>
                          {u.name}
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor:
                              u.role === 'admin'
                                ? '#FEE2E2'
                                : u.role === 'doctor'
                                ? '#DCFCE7'
                                : u.role === 'lab'
                                ? '#FEF3C7'
                                : '#DBEAFE',
                            color:
                              u.role === 'admin'
                                ? '#991B1B'
                                : u.role === 'doctor'
                                ? '#15803D'
                                : u.role === 'lab'
                                ? '#B45309'
                                : '#1D4ED8'
                          }}
                        >
                          {u.role === 'lab' ? 'Lab Specialist' : u.role}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>

                  {/* Contact Info */}
                  <div className="py-2 my-2 border-top border-bottom" style={{ borderColor: '#F1F5F9', fontSize: '0.82rem' }}>
                    <div className="d-flex align-items-center gap-2 text-truncate text-secondary mb-1">
                      <IoMailOutline size={15} style={{ flexShrink: 0 }} />
                      <span className="text-truncate" title={u.email}>{u.email}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-secondary">
                      <IoCallOutline size={15} style={{ flexShrink: 0 }} />
                      <span>{u.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    <span className="font-monospace">ID: {u._id ? u._id.substring(18) : ''}</span>
                    <span>Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="d-flex align-items-center gap-1 flex-wrap pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="View Profile Dossier"
                    onClick={() => setProfileUserId(u._id)}
                    style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem' }}
                  >
                    <IoInformationCircleOutline size={14} color="#0284C7" /> View
                  </button>

                  <ActionBtn
                    variant="edit"
                    label="Edit"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u);
                      setIsEditModalOpen(true);
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="Reset Password"
                    onClick={() => setResetPasswordUser(u)}
                    style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem', color: '#B91C1C' }}
                  >
                    <IoKeyOutline size={13} /> Key
                  </button>

                  <ActionBtn
                    variant={u.status === 'active' ? 'deactivate' : 'activate'}
                    label={u.status === 'active' ? 'Deactivate' : 'Activate'}
                    size="sm"
                    onClick={() => (u.status === 'active' ? setConfirmUser(u) : handleToggleStatus(u))}
                  />

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger border d-inline-flex align-items-center"
                    title="Delete User"
                    onClick={() => setDeleteConfirmUser(u)}
                    style={{ padding: '0.22rem 0.45rem', fontSize: '0.74rem' }}
                  >
                    <IoTrashOutline size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        <div
          className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top"
          style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
        >
          <div>
            Total Records: <strong>{total}</strong>
          </div>
          <div className="d-flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-sm btn-light border"
            >
              Previous
            </button>
            <span className="align-self-center px-2">
              Page {page} of {Math.max(Math.ceil(total / limit), 1)}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="btn btn-sm btn-light border"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ==================== ADD USER MODAL WITH AUTO-PASSWORD ==================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Hospital User Account"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateUser}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Role Authorization <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={newUser.role}
                onChange={(e) => {
                  const role = e.target.value;
                  const rolePrefix =
                    role === 'doctor' ? 'Doc' : role === 'lab' ? 'Lab' : role === 'admin' ? 'Adm' : 'Pat';
                  setNewUser({
                    ...newUser,
                    role,
                    password: generateStrongPassword(rolePrefix)
                  });
                }}
                className="form-select-custom"
              >
                <option value="doctor">Doctor / Attending Physician</option>
                <option value="patient">Patient</option>
                <option value="lab">Laboratory Specialist</option>
                <option value="admin">Hospital Administrator</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Full Legal Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder={newUser.role === 'doctor' ? 'Dr. Alexander Wright' : 'John Doe'}
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Official Email Address <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@hospital.com"
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
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: handlePhoneInput(e.target.value) })}
                placeholder={PHONE_PLACEHOLDER}
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
                    onClick={handleAutoGeneratePassword}
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
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                    onClick={handleCopyAddPassword}
                    className="btn btn-light border"
                    disabled={!newUser.password}
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
                  Generated credentials can be copied and shared immediately after clicking 'Create Account'.
                </small>
              </div>
            </div>

            {/* Doctor Specific Details */}
            {newUser.role === 'doctor' && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">
                    Clinical Department <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="form-select-custom"
                    required
                  >
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name} ({dept.code || 'DEPT'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="General OPD">General OPD</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">
                    Specialization <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.specialization}
                    onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                    placeholder="e.g. Interventional Cardiology, Orthopedic Surgery"
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Medical Qualifications</label>
                  <input
                    type="text"
                    value={newUser.qualifications}
                    onChange={(e) => setNewUser({ ...newUser, qualifications: e.target.value })}
                    placeholder="e.g. MBBS, MD, FRCS"
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Consultation Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newUser.consultationFee}
                    onChange={(e) => setNewUser({ ...newUser, consultationFee: e.target.value })}
                    className="form-control-custom"
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Consulting Room</label>
                  <input
                    type="text"
                    value={newUser.roomNumber}
                    onChange={(e) => setNewUser({ ...newUser, roomNumber: e.target.value })}
                    placeholder="e.g. OPD-104"
                    className="form-control-custom"
                  />
                </div>
              </>
            )}

            {/* Patient Specific Details */}
            {newUser.role === 'patient' && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Gender</label>
                  <select
                    value={newUser.gender}
                    onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                    className="form-select-custom"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Blood Group</label>
                  <select
                    value={newUser.bloodGroup}
                    onChange={(e) => setNewUser({ ...newUser, bloodGroup: e.target.value })}
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
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary-custom"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom d-flex align-items-center gap-2">
              <IoCheckmarkCircle size={18} /> Provision & Issue Account
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== EDIT USER MODAL ==================== */}
      {selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Update Profile: ${selectedUser.name}`}
          maxWidth="560px"
        >
          <form onSubmit={handleUpdateUser}>
            <div className="mb-3">
              <label className="form-label-custom">Full Name</label>
              <input
                type="text"
                required
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                className="form-control-custom"
              />
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Phone Number</label>
              <input
                type="tel"
                maxLength={10}
                pattern={PHONE_PATTERN}
                title={PHONE_TITLE}
                value={selectedUser.phone}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, phone: handlePhoneInput(e.target.value) })
                }
                placeholder={PHONE_PLACEHOLDER}
                className="form-control-custom"
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label-custom">Account Status</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-6">
                <label className="form-label-custom">Assigned Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="doctor">Doctor</option>
                  <option value="patient">Patient</option>
                  <option value="lab">Lab Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn-secondary-custom"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary-custom">
                Save Modifications
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================== CREDENTIALS SUCCESS MODAL ==================== */}
      <CredentialsSuccessModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        credentials={createdCredentials}
        title="Account Successfully Provisioned"
      />

      {/* ==================== 360 PROFILE DOSSIER MODAL ==================== */}
      <UserProfileModal
        isOpen={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
        onResetPasswordClick={(u) => {
          setProfileUserId(null);
          setResetPasswordUser(u);
        }}
      />

      {/* ==================== ADMIN RESET PASSWORD MODAL ==================== */}
      <AdminResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
        onSuccess={(updatedCreds) => {
          setCreatedCredentials(updatedCreds);
          setIsCredentialsModalOpen(true);
        }}
      />

      {/* ==================== DEACTIVATE CONFIRMATION DIALOG ==================== */}
      <ConfirmDialog
        isOpen={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => {
          if (confirmUser) handleToggleStatus(confirmUser);
          setConfirmUser(null);
        }}
        title="Confirm Account Status Change"
        message={`Are you sure you want to deactivate ${confirmUser?.name || 'this user'} (${confirmUser?.role?.toUpperCase() || ''})? They will be locked out until reactivated.`}
        confirmText="Deactivate Account"
        confirmVariant="danger"
      />

      {/* ==================== DELETE USER CONFIRMATION DIALOG ==================== */}
      <ConfirmDialog
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={() => {
          if (deleteConfirmUser) handleDeleteUser(deleteConfirmUser);
          setDeleteConfirmUser(null);
        }}
        title="Permanently Delete User Account"
        message={`Are you sure you want to permanently delete ${deleteConfirmUser?.name} (${deleteConfirmUser?.email})? This action removes their authentication record and corresponding profile.`}
        confirmText="Yes, Delete Permanently"
        confirmVariant="danger"
      />
    </div>
  );
};

export default UserManagement;
