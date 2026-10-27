import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  IoBusinessOutline,
  IoAddOutline,
  IoSearchOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoMedicalOutline,
  IoPeopleOutline
} from 'react-icons/io5';
import {
  handlePhoneInput,
  isValidOptionalPhone,
  PHONE_PLACEHOLDER,
  PHONE_PATTERN,
  PHONE_TITLE,
  PHONE_ERROR_MSG
} from '../../utils/phoneValidation';

const DepartmentManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Add Department State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active'
  });

  // Edit Department State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active'
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete & Status Confirmations
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);
  const [statusConfirmDept, setStatusConfirmDept] = useState(null);

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getDepartments({
        page,
        limit: 10,
        search,
        status: statusFilter
      });
      setDepartments(res.data.departments || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load hospital departments.', { title: 'Network Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDepartments();
  };

  // Create new department
  const handleCreateDepartment = async (e) => {
    e.preventDefault();

    if (!newDept.name.trim() || !newDept.code.trim()) {
      return toast.warning('Department Name and Unique Code are required fields.', {
        title: 'Validation Notice'
      });
    }

    if (newDept.contactPhone && !isValidOptionalPhone(newDept.contactPhone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Phone Number' });
    }

    setSavingNew(true);
    try {
      await departmentService.createDepartment(newDept);
      toast.success(`Department '${newDept.name}' created successfully.`, {
        title: 'Department Created'
      });
      setIsAddModalOpen(false);
      setNewDept({
        name: '',
        code: '',
        description: '',
        headOfDepartment: '',
        location: '',
        contactPhone: '',
        contactEmail: '',
        status: 'active'
      });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating department.', {
        title: 'Creation Failed'
      });
    } finally {
      setSavingNew(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setEditFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment || '',
      location: dept.location || '',
      contactPhone: dept.contactPhone || '',
      contactEmail: dept.contactEmail || '',
      status: dept.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  // Update existing department
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();

    if (!editFormData.name.trim() || !editFormData.code.trim()) {
      return toast.warning('Department Name and Unique Code are required.', {
        title: 'Validation Notice'
      });
    }

    if (editFormData.contactPhone && !isValidOptionalPhone(editFormData.contactPhone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Phone Number' });
    }

    setSavingEdit(true);
    try {
      await departmentService.updateDepartment(selectedDept._id, editFormData);
      toast.success(`Department '${editFormData.name}' updated successfully.`, {
        title: 'Department Updated'
      });
      setIsEditModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating department.', {
        title: 'Update Failed'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle Department Status (Active/Inactive)
  const handleToggleStatus = async (dept) => {
    const nextStatus = dept.status === 'active' ? 'inactive' : 'active';
    try {
      await departmentService.updateDepartment(dept._id, { status: nextStatus });
      toast.success(
        `Department '${dept.name}' is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}.`,
        { title: 'Status Updated' }
      );
      setStatusConfirmDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error toggling department status.', {
        title: 'Status Update Failed'
      });
      setStatusConfirmDept(null);
    }
  };

  // Delete Department Permanent
  const handleDeleteDepartment = async () => {
    if (!deleteConfirmDept) return;
    try {
      await departmentService.deleteDepartment(deleteConfirmDept._id);
      toast.success(`Department '${deleteConfirmDept.name}' has been permanently removed.`, {
        title: 'Department Deleted'
      });
      setDeleteConfirmDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete department with active staff.', {
        title: 'Deletion Restricted'
      });
      setDeleteConfirmDept(null);
    }
  };

  // Quick Stats
  const activeCount = departments.filter((d) => d.status === 'active').length;
  const totalDoctorsAssigned = departments.reduce((acc, curr) => acc + (curr.doctorCount || 0), 0);

  // Table Columns Definition
  const columns = [
    {
      header: 'Department & Code',
      render: (d) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '9px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}
          >
            <IoMedicalOutline size={18} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>
                {d.name}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '5px',
                  letterSpacing: '0.04em'
                }}
              >
                {d.code}
              </span>
            </div>
            {d.description && (
              <div
                style={{
                  fontSize: '0.73rem',
                  color: '#64748B',
                  maxWidth: '280px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {d.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Campus Wing / Location',
      render: (d) => (
        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: '#334155' }}>
          <IoLocationOutline size={15} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{d.location || 'Central Hospital Wing'}</span>
        </div>
      )
    },
    {
      header: 'Head of Dept (HOD)',
      render: (d) => (
        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>
          <IoPersonOutline size={14} style={{ color: '#64748B', flexShrink: 0 }} />
          <span>{d.headOfDepartment || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Assigned Doctors',
      render: (d) => (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            backgroundColor: d.doctorCount > 0 ? '#F0FDF4' : '#F8FAFC',
            border: `1px solid ${d.doctorCount > 0 ? '#BBF7D0' : '#E2E8F0'}`,
            color: d.doctorCount > 0 ? '#15803D' : '#64748B',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <IoPeopleOutline size={13} />
          {d.doctorCount} Physician{d.doctorCount === 1 ? '' : 's'}
        </span>
      )
    },
    {
      header: 'Contact Details',
      render: (d) => (
        <div style={{ fontSize: '0.74rem' }}>
          {d.contactPhone && (
            <div className="d-flex align-items-center gap-1" style={{ color: '#334155' }}>
              <IoCallOutline size={12} style={{ color: '#94A3B8' }} />
              <span>{d.contactPhone}</span>
            </div>
          )}
          {d.contactEmail && (
            <div className="d-flex align-items-center gap-1" style={{ color: '#64748B' }}>
              <IoMailOutline size={12} style={{ color: '#94A3B8' }} />
              <span>{d.contactEmail}</span>
            </div>
          )}
          {!d.contactPhone && !d.contactEmail && <span className="text-muted">Not specified</span>}
        </div>
      )
    },
    {
      header: 'Status',
      render: (d) => (
        <div className="d-flex align-items-center gap-2">
          <StatusBadge status={d.status || 'active'} />
          <ActionBtn
            variant={d.status === 'active' ? 'deactivate' : 'activate'}
            label={d.status === 'active' ? 'Deactivate' : 'Activate'}
            size="xs"
            onClick={() => (d.status === 'active' ? setStatusConfirmDept(d) : handleToggleStatus(d))}
          />
        </div>
      )
    },
    {
      header: 'Actions',
      render: (d) => (
        <div className="d-flex align-items-center gap-2">
          <ActionBtn
            variant="edit"
            label="Edit"
            onClick={() => openEditModal(d)}
          />
          <ActionBtn
            variant="delete"
            label="Delete"
            onClick={() => setDeleteConfirmDept(d)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Departments"
        subtitle="Configure clinical departments, medical divisions, assigned staff, and department coordinates"
      />

      {/* Top Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Total Departments</span>
              <span className="p-1 rounded" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <IoBusinessOutline size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E293B' }}>{total}</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Active Clinical Wings</span>
              <span className="p-1 rounded" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                <IoMedicalOutline size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669' }}>{activeCount}</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Assigned Physicians</span>
              <span className="p-1 rounded" style={{ backgroundColor: '#FAF5FF', color: '#9333EA' }}>
                <IoPeopleOutline size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#9333EA' }}>{totalDoctorsAssigned}</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Campus Operating Unit</span>
              <span className="p-1 rounded" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                <IoLocationOutline size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706' }}>Main Hospital</div>
          </div>
        </div>
      </div>

      <GlassCard>
        {/* Table Search & Add Header */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                  <IoSearchOutline color="var(--text-secondary)" />
                </span>
                <input
                  type="text"
                  placeholder="Search department by name, code, HOD..."
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

          <div className="col-12 col-md-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="col-12 col-md-4 text-md-end d-flex align-items-center justify-content-md-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary-custom d-inline-flex align-items-center gap-2"
              style={{ padding: '0.55rem 1.05rem', fontSize: '0.84rem', fontWeight: 600 }}
            >
              <IoAddOutline size={18} />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={departments}
          loading={loading}
          emptyMessage="No clinical departments found matching your criteria."
        />

        {/* Pagination */}
        <div
          className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top"
          style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
        >
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
              disabled={page >= Math.ceil(total / 10)}
              onClick={() => setPage(page + 1)}
              className="btn btn-sm btn-light border"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Clinical Department"
          size="lg"
        >
          <form onSubmit={handleCreateDepartment}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-8">
                <label className="form-label-custom">
                  Department Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Cardiology & Vascular Care"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">
                  Department Code <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CARD"
                  className="form-control-custom"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={newDept.headOfDepartment}
                  onChange={(e) => setNewDept({ ...newDept, headOfDepartment: e.target.value })}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Location / Building Wing</label>
                <input
                  type="text"
                  value={newDept.location}
                  onChange={(e) => setNewDept({ ...newDept, location: e.target.value })}
                  placeholder="e.g. Building A, 2nd Floor (West Wing)"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Official Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={newDept.contactPhone}
                  onChange={(e) => setNewDept({ ...newDept, contactPhone: handlePhoneInput(e.target.value) })}
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Official Department Email</label>
                <input
                  type="email"
                  value={newDept.contactEmail}
                  onChange={(e) => setNewDept({ ...newDept, contactEmail: e.target.value })}
                  placeholder="cardiology@hospital.com"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Clinical Description & Scope</label>
                <textarea
                  rows={3}
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  placeholder="Specialized clinical focus, equipment, facilities, or treatment scopes..."
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Operational Status</label>
                <select
                  value={newDept.status}
                  onChange={(e) => setNewDept({ ...newDept, status: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="active">Active Division</option>
                  <option value="inactive">Inactive / Under Maintenance</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-sm btn-light border px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingNew}
                className="btn-primary-custom px-4"
              >
                {savingNew ? 'Saving Department...' : 'Save Department'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Department Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Department • ${selectedDept?.name}`}
          size="lg"
        >
          <form onSubmit={handleUpdateDepartment}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-8">
                <label className="form-label-custom">
                  Department Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">
                  Department Code <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                  className="form-control-custom"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={editFormData.headOfDepartment}
                  onChange={(e) => setEditFormData({ ...editFormData, headOfDepartment: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Location / Building Wing</label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Official Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={editFormData.contactPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPhone: handlePhoneInput(e.target.value) })}
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Official Department Email</label>
                <input
                  type="email"
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Clinical Description & Scope</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Operational Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="active">Active Division</option>
                  <option value="inactive">Inactive / Under Maintenance</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-sm btn-light border px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary-custom px-4"
              >
                {savingEdit ? 'Updating Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate/Activate Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmDept}
        onClose={() => setStatusConfirmDept(null)}
        onConfirm={() => handleToggleStatus(statusConfirmDept)}
        title="Confirm Department Status Change"
        message={`Are you sure you want to change the status of '${statusConfirmDept?.name}' to ${statusConfirmDept?.status === 'active' ? 'Inactive' : 'Active'}?`}
        confirmText={statusConfirmDept?.status === 'active' ? 'Deactivate Department' : 'Activate Department'}
        confirmVariant={statusConfirmDept?.status === 'active' ? 'warning' : 'success'}
      />

      {/* Delete Department Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmDept}
        onClose={() => setDeleteConfirmDept(null)}
        onConfirm={handleDeleteDepartment}
        title="Permanently Delete Department"
        message={`Are you sure you want to permanently delete '${deleteConfirmDept?.name}' (${deleteConfirmDept?.code})? This action cannot be reversed.`}
        confirmText="Delete Department"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DepartmentManagement;
