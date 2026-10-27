import React, { useState, useEffect } from 'react';
import { labService, userService } from '../../services/api';
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
import { generateStrongPassword, copyToClipboard } from '../../utils/passwordGenerator';
import {
  handlePhoneInput,
  isValidOptionalPhone,
  PHONE_ERROR_MSG
} from '../../utils/phoneValidation';
import {
  IoAddOutline,
  IoFlaskOutline,
  IoSearchOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoPlayOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoFilterOutline,
  IoPersonAddOutline,
  IoKeyOutline,
  IoCopyOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoListOutline,
  IoGridOutline,
  IoMailOutline,
  IoCallOutline
} from 'react-icons/io5';

const LabManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'requests' | 'specialists'

  // Data states
  const [tests, setTests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialistViewMode, setSpecialistViewMode] = useState('list'); // 'list' | 'grid'

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [specialistStatusFilter, setSpecialistStatusFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [deleteConfirmTest, setDeleteConfirmTest] = useState(null);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState(null);

  // Specialist Modals state
  const [isEditSpecialistModalOpen, setIsEditSpecialistModalOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [confirmSpecialistStatus, setConfirmSpecialistStatus] = useState(null);
  const [deleteConfirmSpecialist, setDeleteConfirmSpecialist] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  // Lab Request Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);

  // New test form state
  const [newTest, setNewTest] = useState({
    testName: '',
    testCode: '',
    category: 'Biochemistry',
    price: '',
    turnaroundHours: 24,
    sampleType: 'Serum / Whole Blood',
    normalRange: '',
    units: '',
    description: '',
    preparationInstructions: ''
  });

  // Provision Lab Specialist State
  const [isAddLabUserModalOpen, setIsAddLabUserModalOpen] = useState(false);
  const [showLabPass, setShowLabPass] = useState(true);
  const [copiedLabPass, setCopiedLabPass] = useState(false);
  const [newLabUser, setNewLabUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [createdLabCredentials, setCreatedLabCredentials] = useState(null);
  const [isLabCredentialsModalOpen, setIsLabCredentialsModalOpen] = useState(false);

  const handleOpenAddLabUserModal = () => {
    setNewLabUser({
      name: '',
      email: '',
      phone: '',
      password: generateStrongPassword('Lab')
    });
    setShowLabPass(true);
    setIsAddLabUserModalOpen(true);
  };

  const handleAutoGenerateLabPassword = () => {
    setNewLabUser((prev) => ({ ...prev, password: generateStrongPassword('Lab') }));
    setShowLabPass(true);
  };

  const handleCopyLabPassword = async () => {
    if (!newLabUser.password) return;
    const ok = await copyToClipboard(newLabUser.password);
    if (ok) {
      setCopiedLabPass(true);
      setTimeout(() => setCopiedLabPass(false), 2000);
    }
  };

  const handleCreateLabUser = async (e) => {
    e.preventDefault();
    if (newLabUser.phone && !isValidOptionalPhone(newLabUser.phone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Mobile Number' });
    }
    if (!newLabUser.password || newLabUser.password.length < 6) {
      return toast.warning('Password must be at least 6 characters long.', {
        title: 'Weak Password'
      });
    }

    try {
      await userService.createUser({
        name: newLabUser.name,
        email: newLabUser.email,
        phone: newLabUser.phone,
        password: newLabUser.password,
        role: 'lab'
      });

      setIsAddLabUserModalOpen(false);

      setCreatedLabCredentials({
        name: newLabUser.name,
        email: newLabUser.email,
        password: newLabUser.password,
        role: 'lab'
      });
      setIsLabCredentialsModalOpen(true);

      toast.success(`Laboratory Specialist "${newLabUser.name}" provisioned successfully!`, {
        title: 'Lab Staff Account Created'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create laboratory user.', {
        title: 'Creation Failed'
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, requestsRes, specialistsRes] = await Promise.all([
        labService.getTests({ activeOnly: 'false' }).catch(() => ({ data: { tests: [] } })),
        labService.getRequests({ limit: 100 }).catch(() => ({ data: { requests: [] } })),
        userService.getUsers({ role: 'lab', limit: 100 }).catch(() => ({ data: { users: [] } }))
      ]);
      setTests(testsRes.data?.tests || []);
      setRequests(requestsRes.data?.requests || []);
      setSpecialists(specialistsRes.data?.users || []);
    } catch (err) {
      toast.error('Failed to fetch laboratory data.', { title: 'Network Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  // Create Test
  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      await labService.createTest(newTest);
      setIsAddModalOpen(false);
      toast.success(`Diagnostic test "${newTest.testName}" added to catalog.`, {
        title: 'Catalog Updated'
      });
      setNewTest({
        testName: '',
        testCode: '',
        category: 'Biochemistry',
        price: '',
        turnaroundHours: 24,
        sampleType: 'Serum / Whole Blood',
        normalRange: '',
        units: '',
        description: '',
        preparationInstructions: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating lab test.', {
        title: 'Creation Failed'
      });
    }
  };

  // Update Test
  const handleUpdateTest = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      await labService.updateTest(selectedTest._id, {
        testName: selectedTest.testName,
        testCode: selectedTest.testCode,
        category: selectedTest.category,
        price: Number(selectedTest.price),
        turnaroundHours: Number(selectedTest.turnaroundHours),
        sampleType: selectedTest.sampleType,
        normalRange: selectedTest.normalRange,
        units: selectedTest.units,
        description: selectedTest.description,
        preparationInstructions: selectedTest.preparationInstructions
      });
      setIsEditModalOpen(false);
      toast.success(`Diagnostic test "${selectedTest.testName}" updated successfully.`, {
        title: 'Test Updated'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating lab test.', {
        title: 'Update Failed'
      });
    }
  };

  // Toggle Test Active/Inactive
  const handleToggleTestStatus = async (test) => {
    try {
      await labService.toggleTestStatus(test._id);
      toast.success(`Test "${test.testName}" status updated.`, { title: 'Status Modified' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle test status.', {
        title: 'Action Failed'
      });
    }
  };

  // Delete Test
  const handleDeleteTest = async (test) => {
    try {
      await labService.deleteTest(test._id);
      toast.success(`Test "${test.testName}" deleted from catalog.`, { title: 'Test Deleted' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete test.', {
        title: 'Deletion Failed'
      });
    }
  };

  // Delete Specimen Request / Lab Order
  const handleDeleteRequest = async (request) => {
    try {
      await labService.deleteRequest(request._id);
      toast.success('Lab specimen order and results deleted permanently.', { title: 'Order Deleted' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lab specimen order.', {
        title: 'Deletion Failed'
      });
    }
  };

  // Update Specimen Request Workflow Status
  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await labService.updateRequestStatus(requestId, { status: newStatus });
      toast.success(`Specimen order status changed to "${newStatus}".`, {
        title: 'Order Updated'
      });
      if (selectedRequest && selectedRequest._id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.', {
        title: 'Update Failed'
      });
    }
  };

  // Specialist Handlers
  const handleUpdateSpecialist = async (e) => {
    e.preventDefault();
    if (!selectedSpecialist) return;
    if (selectedSpecialist.phone && !isValidOptionalPhone(selectedSpecialist.phone)) {
      return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Mobile Number' });
    }
    try {
      await userService.updateUser(selectedSpecialist._id, {
        name: selectedSpecialist.name,
        phone: selectedSpecialist.phone,
        status: selectedSpecialist.status,
        role: 'lab'
      });
      setIsEditSpecialistModalOpen(false);
      toast.success('Specialist details updated successfully.', {
        title: 'Specialist Updated'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating specialist.', {
        title: 'Update Failed'
      });
    }
  };

  const handleToggleSpecialistStatus = async (user) => {
    try {
      await userService.toggleStatus(user._id);
      toast.success(`Account status updated for ${user.name}`, {
        title: 'Status Modified'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.', {
        title: 'Operation Failed'
      });
    }
  };

  const handleDeleteSpecialist = async (user) => {
    try {
      await userService.deleteUser(user._id);
      toast.success(`${user.name}'s account has been permanently removed.`, {
        title: 'Specialist Deleted'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete specialist account.', {
        title: 'Deletion Failed'
      });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'catalog') {
      if (tests.length === 0) return toast.warning('No tests to export.');
      const headers = ['Test Code', 'Test Name', 'Category', 'Price (INR)', 'Turnaround (Hours)', 'Sample Type', 'Status'];
      const rows = tests.map((t) => [
        t.testCode,
        `"${t.testName}"`,
        t.category,
        t.price,
        t.turnaroundHours,
        `"${t.sampleType}"`,
        t.isActive ? 'Active' : 'Inactive'
      ]);
      downloadCSV(headers, rows, `Hospital_Lab_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    } else if (activeTab === 'requests') {
      if (requests.length === 0) return toast.warning('No specimen orders to export.');
      const headers = ['Order ID', 'Patient', 'Patient Phone', 'Test Name', 'Physician', 'Priority', 'Status', 'Date'];
      const rows = requests.map((r) => [
        `LAB-${r._id.substring(18).toUpperCase()}`,
        `"${r.patient?.name || ''}"`,
        `"${r.patient?.phone || ''}"`,
        `"${r.labTest?.testName || ''}"`,
        `"Dr. ${r.doctor?.name || 'OPD'}"`,
        r.priority,
        r.status,
        new Date(r.createdAt).toLocaleDateString()
      ]);
      downloadCSV(headers, rows, `Hospital_Lab_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      if (specialists.length === 0) return toast.warning('No lab specialists to export.');
      const headers = ['Specialist ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Registered Date'];
      const rows = specialists.map((s) => [
        `LAB-SPEC-${s._id.substring(18).toUpperCase()}`,
        `"${s.name || ''}"`,
        s.email,
        `"${s.phone || ''}"`,
        'Laboratory Specialist',
        s.status,
        new Date(s.createdAt).toLocaleDateString()
      ]);
      downloadCSV(headers, rows, `Hospital_Lab_Specialists_${new Date().toISOString().split('T')[0]}.csv`);
    }
    toast.success('Report exported successfully!', { title: 'Export Ready' });
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Catalog
  const filteredTests = tests.filter((t) => {
    const term = search.toLowerCase();
    const matchSearch =
      t.testName?.toLowerCase().includes(term) ||
      t.testCode?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term);
    const matchCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'active' && t.isActive) ||
      (statusFilter === 'inactive' && !t.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  // Filter Requests
  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.patient?.name?.toLowerCase().includes(term) ||
      r.doctor?.name?.toLowerCase().includes(term) ||
      r.labTest?.testName?.toLowerCase().includes(term) ||
      r._id?.toLowerCase().includes(term);
    const matchStatus = requestStatusFilter === 'All' || r.status === requestStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filter Specialists
  const filteredSpecialists = specialists.filter((s) => {
    const term = search.toLowerCase();
    const matchSearch =
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term) ||
      s._id?.toLowerCase().includes(term);
    const matchStatus =
      specialistStatusFilter === 'All' ||
      (specialistStatusFilter === 'active' && s.status === 'active') ||
      (specialistStatusFilter === 'inactive' && s.status === 'inactive');
    return matchSearch && matchStatus;
  });

  // Columns for Specialists
  const specialistColumns = [
    {
      header: 'Specialist & Identity',
      render: (s) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid #FDE68A',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {s.avatar ? (
              <img
                src={s.avatar}
                alt={s.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.innerText = s.name ? s.name.charAt(0).toUpperCase() : 'L';
                  }
                }}
              />
            ) : (
              s.name ? s.name.charAt(0).toUpperCase() : 'L'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontFamily: 'monospace' }}>
              ID: {s._id ? s._id.substring(18).toUpperCase() : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Official Email',
      render: (s) => (
        <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.86rem' }}>
          {s.email}
        </span>
      )
    },
    {
      header: 'Contact Phone',
      render: (s) => (
        <span style={{ fontSize: '0.86rem', color: s.phone ? '#1E293B' : '#94A3B8' }}>
          {s.phone || '—'}
        </span>
      )
    },
    {
      header: 'Assigned Role',
      render: () => (
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <IoFlaskOutline size={13} /> Lab Specialist
        </span>
      )
    },
    {
      header: 'Account Status',
      render: (s) => <StatusBadge status={s.status} />
    },
    {
      header: 'Administrative Actions',
      render: (s) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="View Specialist Profile Dossier"
            onClick={() => setProfileUserId(s._id)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.25rem 0.55rem' }}
          >
            <IoInformationCircleOutline size={15} color="#0284C7" /> View
          </button>

          <ActionBtn
            variant="edit"
            label="Edit"
            size="sm"
            onClick={() => {
              setSelectedSpecialist({ ...s });
              setIsEditSpecialistModalOpen(true);
            }}
          />

          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="Reset Password"
            onClick={() => setResetPasswordUser(s)}
            style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.25rem 0.55rem', color: '#B91C1C' }}
          >
            <IoKeyOutline size={14} /> Password
          </button>

          <ActionBtn
            variant={s.status === 'active' ? 'deactivate' : 'activate'}
            label={s.status === 'active' ? 'Deactivate' : 'Activate'}
            size="sm"
            onClick={() => (s.status === 'active' ? setConfirmSpecialistStatus(s) : handleToggleSpecialistStatus(s))}
          />

          <ActionBtn
            variant="delete"
            label="Delete"
            size="sm"
            onClick={() => setDeleteConfirmSpecialist(s)}
          />
        </div>
      )
    }
  ];

  // Columns for Catalog
  const catalogColumns = [
    {
      header: 'Test Name & Code',
      render: (t) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              border: '1px solid #BFDBFE'
            }}
          >
            <IoFlaskOutline />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.testName}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
              {t.testCode}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (t) => (
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            backgroundColor: '#F1F5F9',
            color: '#334155'
          }}
        >
          {t.category}
        </span>
      )
    },
    {
      header: 'Hospital Fee',
      render: (t) => <strong style={{ color: '#059669', fontSize: '0.92rem' }}>₹{t.price}</strong>
    },
    {
      header: 'Turnaround',
      render: (t) => (
        <div style={{ fontSize: '0.84rem' }}>
          <IoTimeOutline className="me-1 text-secondary" />
          {t.turnaroundHours} Hours
        </div>
      )
    },
    {
      header: 'Specimen Type',
      render: (t) => <span style={{ fontSize: '0.84rem', color: '#475569' }}>{t.sampleType}</span>
    },
    {
      header: 'Catalog Status',
      render: (t) => <StatusBadge status={t.isActive ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Actions',
      render: (t) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <ActionBtn
            variant="edit"
            label="Edit"
            size="sm"
            onClick={() => {
              setSelectedTest({ ...t });
              setIsEditModalOpen(true);
            }}
          />
          <ActionBtn
            variant={t.isActive ? 'deactivate' : 'activate'}
            label={t.isActive ? 'Deactivate' : 'Activate'}
            size="sm"
            onClick={() => handleToggleTestStatus(t)}
          />
          <ActionBtn
            variant="delete"
            label="Delete"
            size="sm"
            onClick={() => setDeleteConfirmTest(t)}
          />
        </div>
      )
    }
  ];

  // Columns for Requests Pipeline
  const requestColumns = [
    {
      header: 'Order Ref & Date',
      render: (r) => (
        <div>
          <span
            className="font-monospace fw-bold"
            style={{
              fontSize: '0.78rem',
              color: '#0F172A',
              backgroundColor: '#F1F5F9',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid #CBD5E1'
            }}
          >
            LAB-{r._id.substring(18).toUpperCase()}
          </span>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {new Date(r.createdAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.patient?.name || 'Patient'}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            {r.patient?.phone || 'No Phone'}
          </div>
        </div>
      )
    },
    {
      header: 'Diagnostic Test',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.labTest?.testName || 'Test'}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontFamily: 'monospace' }}>
            {r.labTest?.testCode} • ₹{r.labTest?.price || 0}
          </div>
        </div>
      )
    },
    {
      header: 'Requested By',
      render: (r) => (
        <span style={{ fontSize: '0.84rem', color: '#334155' }}>
          {r.doctor?.name ? `Dr. ${r.doctor.name}` : 'OPD Reception / Self'}
        </span>
      )
    },
    {
      header: 'Priority',
      render: (r) => <StatusBadge status={r.priority || 'Normal'} />
    },
    {
      header: 'Workflow Stage',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      header: 'Pipeline Actions',
      render: (r) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <ActionBtn
            variant="view"
            label="Details"
            size="sm"
            onClick={() => {
              setSelectedRequest(r);
              setIsRequestDetailOpen(true);
            }}
          />

          {r.status === 'Requested' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
              title="Collect Specimen Sample"
              onClick={() => handleUpdateRequestStatus(r._id, 'Sample Collected')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoFlaskOutline size={14} /> Sample
            </button>
          )}

          {r.status === 'Sample Collected' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              title="Process in Analyzer"
              onClick={() => handleUpdateRequestStatus(r._id, 'Processing')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoPlayOutline size={14} /> Process
            </button>
          )}

          {r.status === 'Processing' && (
            <button
              type="button"
              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
              title="Publish Diagnostic Results"
              onClick={() => handleUpdateRequestStatus(r._id, 'Published')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoCheckmarkDoneOutline size={14} /> Publish
            </button>
          )}

          <ActionBtn
            variant="delete"
            label="Delete Order"
            size="sm"
            onClick={() => setDeleteConfirmRequest(r)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Laboratory Suite & Diagnostics"
        subtitle="Manage hospital diagnostic catalog, pricing, specimen accessioning pipeline, and clinical test reports"
        actionButton={
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-light border d-flex align-items-center gap-2"
              style={{ fontWeight: 600, fontSize: '0.86rem' }}
            >
              <IoDownloadOutline size={18} /> Export Data (CSV)
            </button>

            <button
              type="button"
              onClick={handleOpenAddLabUserModal}
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              style={{ fontWeight: 600, fontSize: '0.86rem' }}
            >
              <IoPersonAddOutline size={18} /> Add Lab Specialist
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary-custom d-flex align-items-center gap-2"
            >
              <IoAddOutline size={20} /> Add Diagnostic Test
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={activeTab === 'catalog' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.86rem', fontWeight: 650 }}
        >
          Diagnostic Test Catalog ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={activeTab === 'requests' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.86rem', fontWeight: 650 }}
        >
          Specimen Pipeline & Orders ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('specialists')}
          className={activeTab === 'specialists' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.86rem', fontWeight: 650 }}
        >
          Lab Specialists ({specialists.length})
        </button>
      </div>

      <GlassCard>
        {/* Filters bar */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoSearchOutline color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'catalog'
                    ? 'Search test name, test code, or category...'
                    : activeTab === 'requests'
                    ? 'Search patient, physician, or test name...'
                    : 'Search lab specialist by name, email, or phone...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-custom border-start-0"
              />
            </div>
          </div>

          {activeTab === 'catalog' ? (
            <>
              <div className="col-6 col-md-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-select-custom"
                >
                  <option value="All">Category: All Categories</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>

              <div className="col-6 col-md-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select-custom"
                >
                  <option value="All">Status: All Statuses</option>
                  <option value="active">Active Tests Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </>
          ) : activeTab === 'requests' ? (
            <div className="col-12 col-md-4">
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="form-select-custom"
              >
                <option value="All">Stage: All Workflow Stages</option>
                <option value="Requested">Requested</option>
                <option value="Sample Collected">Sample Collected</option>
                <option value="Processing">In Processing</option>
                <option value="Published">Published & Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <>
              <div className="col-6 col-md-4">
                <select
                  value={specialistStatusFilter}
                  onChange={(e) => setSpecialistStatusFilter(e.target.value)}
                  className="form-select-custom"
                >
                  <option value="All">Status: All Statuses</option>
                  <option value="active">Active Specialists Only</option>
                  <option value="inactive">Inactive Specialists Only</option>
                </select>
              </div>
              <div className="col-6 col-md-3 text-end">
                <div className="btn-group" role="group" aria-label="View Switch">
                  <button
                    type="button"
                    className={`btn btn-sm ${specialistViewMode === 'list' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setSpecialistViewMode('list')}
                    title="List View"
                    style={{ fontWeight: 650, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <IoListOutline size={16} /> List
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${specialistViewMode === 'grid' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setSpecialistViewMode('grid')}
                    title="Grid View"
                    style={{ fontWeight: 650, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <IoGridOutline size={16} /> Grid
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tables */}
        {activeTab === 'catalog' ? (
          <DataTable
            columns={catalogColumns}
            data={filteredTests}
            loading={loading}
            emptyMessage="No laboratory tests match your selected criteria."
          />
        ) : activeTab === 'requests' ? (
          <DataTable
            columns={requestColumns}
            data={filteredRequests}
            loading={loading}
            emptyMessage="No specimen pipeline requests match your selected criteria."
          />
        ) : specialistViewMode === 'list' ? (
          <DataTable
            columns={specialistColumns}
            data={filteredSpecialists}
            loading={loading}
            emptyMessage="No laboratory specialists found."
          />
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="text-secondary mt-2" style={{ fontSize: '0.86rem' }}>Loading laboratory specialists...</div>
          </div>
        ) : filteredSpecialists.length === 0 ? (
          <div className="text-center py-5 text-secondary" style={{ fontSize: '0.9rem' }}>
            No laboratory specialists found.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredSpecialists.map((s) => (
              <div
                key={s._id}
                className="p-3 rounded-3 border d-flex flex-column justify-content-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'var(--border-subtle, #E2E8F0)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Top: Avatar, Name, Role badge, Status */}
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          border: '1px solid #FDE68A',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {s.avatar ? (
                          <img
                            src={s.avatar}
                            alt={s.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.parentElement) {
                                e.target.parentElement.innerText = s.name ? s.name.charAt(0).toUpperCase() : 'L';
                              }
                            }}
                          />
                        ) : (
                          s.name ? s.name.charAt(0).toUpperCase() : 'L'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.96rem' }}>
                          {s.name}
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <IoFlaskOutline size={12} /> Lab Specialist
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {/* Contact Info */}
                  <div className="py-2 my-2 border-top border-bottom" style={{ borderColor: '#F1F5F9', fontSize: '0.82rem' }}>
                    <div className="d-flex align-items-center gap-2 text-truncate text-secondary mb-1">
                      <IoMailOutline size={14} style={{ flexShrink: 0 }} />
                      <span className="text-truncate" title={s.email}>{s.email}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-secondary">
                      <IoCallOutline size={14} style={{ flexShrink: 0 }} />
                      <span>{s.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    <span className="font-monospace">ID: {s._id ? s._id.substring(18).toUpperCase() : ''}</span>
                    <span>Joined: {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="d-flex align-items-center gap-1 flex-wrap pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="View Specialist Profile Dossier"
                    onClick={() => setProfileUserId(s._id)}
                    style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem' }}
                  >
                    <IoInformationCircleOutline size={14} color="#0284C7" /> View
                  </button>

                  <ActionBtn
                    variant="edit"
                    label="Edit"
                    size="sm"
                    onClick={() => {
                      setSelectedSpecialist({ ...s });
                      setIsEditSpecialistModalOpen(true);
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="Reset Password"
                    onClick={() => setResetPasswordUser(s)}
                    style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.22rem 0.5rem', color: '#B91C1C' }}
                  >
                    <IoKeyOutline size={13} /> Key
                  </button>

                  <ActionBtn
                    variant={s.status === 'active' ? 'deactivate' : 'activate'}
                    label={s.status === 'active' ? 'Deactivate' : 'Activate'}
                    size="sm"
                    onClick={() => (s.status === 'active' ? setConfirmSpecialistStatus(s) : handleToggleSpecialistStatus(s))}
                  />

                  <ActionBtn
                    variant="delete"
                    label="Delete"
                    size="sm"
                    onClick={() => setDeleteConfirmSpecialist(s)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ==================== ADD LAB TEST MODAL ==================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Diagnostic Test to Hospital Catalog"
        maxWidth="700px"
      >
        <form onSubmit={handleCreateTest}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Diagnostic Test Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newTest.testName}
                onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                placeholder="e.g. Complete Blood Count (CBC)"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Unique Test Code <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newTest.testCode}
                onChange={(e) => setNewTest({ ...newTest, testCode: e.target.value.toUpperCase() })}
                placeholder="e.g. LAB-CBC-01"
                className="form-control-custom"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Medical Category <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={newTest.category}
                onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                className="form-select-custom"
              >
                <option value="Biochemistry">Biochemistry</option>
                <option value="Hematology">Hematology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Immunology">Immunology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Pathology">Pathology</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Hospital Fee (₹) <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={newTest.price}
                onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. 450"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Turnaround Time (Hours)</label>
              <input
                type="number"
                min="1"
                value={newTest.turnaroundHours}
                onChange={(e) => setNewTest({ ...newTest, turnaroundHours: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. 24"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Specimen Sample Type <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newTest.sampleType}
                onChange={(e) => setNewTest({ ...newTest, sampleType: e.target.value })}
                placeholder="e.g. Serum / Whole Blood / Urine"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Standard Reference Range</label>
              <input
                type="text"
                value={newTest.normalRange}
                onChange={(e) => setNewTest({ ...newTest, normalRange: e.target.value })}
                placeholder="e.g. 13.5 - 17.5"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Measurement Units</label>
              <input
                type="text"
                value={newTest.units}
                onChange={(e) => setNewTest({ ...newTest, units: e.target.value })}
                placeholder="e.g. g/dL, mg/dL"
                className="form-control-custom"
              />
            </div>

            <div className="col-12">
              <label className="form-label-custom">Patient Preparation Instructions</label>
              <input
                type="text"
                value={newTest.preparationInstructions}
                onChange={(e) => setNewTest({ ...newTest, preparationInstructions: e.target.value })}
                placeholder="e.g. 12 hours overnight fasting mandatory, drink water normally..."
                className="form-control-custom"
              />
            </div>

            <div className="col-12">
              <label className="form-label-custom">Clinical Description</label>
              <textarea
                rows={2}
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Clinical indications and diagnostic purpose..."
                className="form-control-custom"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary-custom"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom">
              Save Test to Catalog
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== EDIT LAB TEST MODAL ==================== */}
      {selectedTest && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Diagnostic Test: ${selectedTest.testName}`}
          maxWidth="700px"
        >
          <form onSubmit={handleUpdateTest}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Diagnostic Test Name</label>
                <input
                  type="text"
                  required
                  value={selectedTest.testName}
                  onChange={(e) => setSelectedTest({ ...selectedTest, testName: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Test Code</label>
                <input
                  type="text"
                  required
                  value={selectedTest.testCode}
                  onChange={(e) =>
                    setSelectedTest({ ...selectedTest, testCode: e.target.value.toUpperCase() })
                  }
                  className="form-control-custom"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Category</label>
                <select
                  value={selectedTest.category}
                  onChange={(e) => setSelectedTest({ ...selectedTest, category: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Hospital Price (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={selectedTest.price}
                  onChange={(e) => setSelectedTest({ ...selectedTest, price: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Turnaround Hours</label>
                <input
                  type="number"
                  min="1"
                  value={selectedTest.turnaroundHours}
                  onChange={(e) =>
                    setSelectedTest({ ...selectedTest, turnaroundHours: e.target.value })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Specimen Sample Type</label>
                <input
                  type="text"
                  required
                  value={selectedTest.sampleType}
                  onChange={(e) =>
                    setSelectedTest({ ...selectedTest, sampleType: e.target.value })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Reference Range</label>
                <input
                  type="text"
                  value={selectedTest.normalRange || ''}
                  onChange={(e) =>
                    setSelectedTest({ ...selectedTest, normalRange: e.target.value })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Measurement Units</label>
                <input
                  type="text"
                  value={selectedTest.units || ''}
                  onChange={(e) => setSelectedTest({ ...selectedTest, units: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Preparation Instructions</label>
                <input
                  type="text"
                  value={selectedTest.preparationInstructions || ''}
                  onChange={(e) =>
                    setSelectedTest({
                      ...selectedTest,
                      preparationInstructions: e.target.value
                    })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Clinical Description</label>
                <textarea
                  rows={2}
                  value={selectedTest.description || ''}
                  onChange={(e) =>
                    setSelectedTest({ ...selectedTest, description: e.target.value })
                  }
                  className="form-control-custom"
                />
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

      {/* ==================== SPECIMEN ORDER DETAIL MODAL ==================== */}
      {selectedRequest && (
        <Modal
          isOpen={isRequestDetailOpen}
          onClose={() => setIsRequestDetailOpen(false)}
          title={`Specimen Order: LAB-${selectedRequest._id.substring(18).toUpperCase()}`}
          maxWidth="640px"
        >
          <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
                  {selectedRequest.labTest?.testName}
                </strong>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Code: {selectedRequest.labTest?.testCode} • Category: {selectedRequest.labTest?.category}
                </div>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>
          </div>

          <div className="row g-3 mb-3" style={{ fontSize: '0.86rem' }}>
            <div className="col-12 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                PATIENT
              </span>
              <strong>{selectedRequest.patient?.name || 'Walk-in'}</strong>
              <div style={{ color: '#64748B', fontSize: '0.78rem' }}>
                Phone: {selectedRequest.patient?.phone || 'N/A'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                ORDERING PHYSICIAN
              </span>
              <strong>Dr. {selectedRequest.doctor?.name || 'OPD Desk'}</strong>
            </div>

            <div className="col-6 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                SPECIMEN SAMPLE
              </span>
              <div>{selectedRequest.labTest?.sampleType || 'Whole Blood / Serum'}</div>
            </div>

            <div className="col-6 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                PRICE & PRIORITY
              </span>
              <div className="d-flex align-items-center gap-2">
                <strong className="text-success">₹{selectedRequest.labTest?.price || 0}</strong>
                <StatusBadge status={selectedRequest.priority || 'Normal'} />
              </div>
            </div>

            <div className="col-12">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                PREPARATION INSTRUCTIONS
              </span>
              <div className="p-2 rounded bg-light border" style={{ fontSize: '0.82rem' }}>
                {selectedRequest.labTest?.preparationInstructions || 'No specific fasting or dietary restrictions.'}
              </div>
            </div>

            {selectedRequest.notes && (
              <div className="col-12">
                <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                  CLINICAL NOTES
                </span>
                <div className="p-2 rounded bg-light border" style={{ fontSize: '0.82rem' }}>
                  {selectedRequest.notes}
                </div>
              </div>
            )}
          </div>

          {/* Workflow Stage Control */}
          <div className="p-3 mb-3 rounded-2" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <label className="form-label-custom mb-1" style={{ color: '#065F46', fontWeight: 700 }}>
              Update Laboratory Workflow Stage
            </label>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {['Requested', 'Accepted', 'Sample Collected', 'Processing', 'Published', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdateRequestStatus(selectedRequest._id, st)}
                  className={`btn btn-sm ${selectedRequest.status === st ? 'btn-success text-white' : 'btn-light border'}`}
                  style={{ fontSize: '0.78rem', fontWeight: 600 }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsRequestDetailOpen(false)}
              className="btn-secondary-custom"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Provision Lab Specialist Modal */}
      <Modal
        isOpen={isAddLabUserModalOpen}
        onClose={() => setIsAddLabUserModalOpen(false)}
        title="Provision Laboratory Specialist Account"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateLabUser}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label-custom">
                Specialist Full Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newLabUser.name}
                onChange={(e) => setNewLabUser({ ...newLabUser, name: e.target.value })}
                placeholder="e.g. Ramesh Sharma"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">
                Official Email Address <span className="req-star" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={newLabUser.email}
                onChange={(e) => setNewLabUser({ ...newLabUser, email: e.target.value })}
                placeholder="lab.tech@hospital.com"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Contact Mobile</label>
              <input
                type="text"
                value={newLabUser.phone}
                onChange={(e) => setNewLabUser({ ...newLabUser, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label-custom mb-0">
                  Account Password <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerateLabPassword}
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
                  >
                    ⚡ Auto-Generate
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLabPassword}
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    style={{ fontSize: '0.78rem', color: copiedLabPass ? '#10B981' : '#64748B', fontWeight: 600 }}
                  >
                    <IoCopyOutline size={12} className="me-1" />
                    {copiedLabPass ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="input-group">
                <input
                  type={showLabPass ? 'text' : 'password'}
                  required
                  value={newLabUser.password}
                  onChange={(e) => setNewLabUser({ ...newLabUser, password: e.target.value })}
                  className="form-control form-control-custom font-monospace"
                  style={{ letterSpacing: showLabPass ? '0.05em' : 'normal' }}
                />
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setShowLabPass(!showLabPass)}
                  title={showLabPass ? 'Hide Password' : 'Show Password'}
                >
                  <IoEyeOutline size={16} />
                </button>
              </div>
              <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                Password automatically generated with strong entropy. Copy or share it after creation.
              </small>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsAddLabUserModalOpen(false)}
              className="btn btn-light border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <IoPersonAddOutline size={18} /> Provision Lab Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Lab Specialist Credentials Success Modal */}
      <CredentialsSuccessModal
        isOpen={isLabCredentialsModalOpen}
        onClose={() => setIsLabCredentialsModalOpen(false)}
        credentials={createdLabCredentials}
      />

      {/* Delete Test Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmTest}
        onClose={() => setDeleteConfirmTest(null)}
        onConfirm={() => {
          if (deleteConfirmTest) handleDeleteTest(deleteConfirmTest);
          setDeleteConfirmTest(null);
        }}
        title="Delete Diagnostic Test from Catalog"
        message={`Are you sure you want to delete "${deleteConfirmTest?.testName}" (${deleteConfirmTest?.testCode})? This will permanently remove it from the hospital test directory.`}
        confirmText="Delete Test"
        confirmVariant="danger"
      />

      {/* Delete Lab Specimen Request Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmRequest}
        onClose={() => setDeleteConfirmRequest(null)}
        onConfirm={() => {
          if (deleteConfirmRequest) handleDeleteRequest(deleteConfirmRequest);
          setDeleteConfirmRequest(null);
        }}
        title="Permanently Delete Lab Order"
        message={`Are you sure you want to permanently delete order LAB-${deleteConfirmRequest?._id?.substring(18).toUpperCase()} for patient ${deleteConfirmRequest?.patient?.name || 'Patient'} (${deleteConfirmRequest?.labTest?.testName || 'Lab Test'})? This will permanently delete the order and any associated lab test results.`}
        confirmText="Delete Order"
        confirmVariant="danger"
      />

      {/* ==================== EDIT LAB SPECIALIST MODAL ==================== */}
      {selectedSpecialist && (
        <Modal
          isOpen={isEditSpecialistModalOpen}
          onClose={() => setIsEditSpecialistModalOpen(false)}
          title={`Edit Specialist: ${selectedSpecialist.name}`}
          maxWidth="550px"
        >
          <form onSubmit={handleUpdateSpecialist}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label-custom">
                  Specialist Full Name <span className="req-star" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={selectedSpecialist.name}
                  onChange={(e) => setSelectedSpecialist({ ...selectedSpecialist, name: e.target.value })}
                  className="form-control form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Official Email (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={selectedSpecialist.email}
                  className="form-control form-control-custom bg-light"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Contact Mobile</label>
                <input
                  type="text"
                  value={selectedSpecialist.phone || ''}
                  onChange={(e) => handlePhoneInput(e, (clean) => setSelectedSpecialist({ ...selectedSpecialist, phone: clean }))}
                  placeholder="9876543210"
                  className="form-control form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Account Status</label>
                <select
                  value={selectedSpecialist.status}
                  onChange={(e) => setSelectedSpecialist({ ...selectedSpecialist, status: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                onClick={() => setIsEditSpecialistModalOpen(false)}
                className="btn btn-light border"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 650 }}>
                Save Modifications
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 360 Profile Dossier Modal */}
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
          setCreatedLabCredentials(updatedCreds);
          setIsLabCredentialsModalOpen(true);
        }}
      />

      {/* Deactivate Specialist Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmSpecialistStatus}
        onClose={() => setConfirmSpecialistStatus(null)}
        onConfirm={() => {
          if (confirmSpecialistStatus) handleToggleSpecialistStatus(confirmSpecialistStatus);
          setConfirmSpecialistStatus(null);
        }}
        title="Confirm Account Status Change"
        message={`Are you sure you want to deactivate ${confirmSpecialistStatus?.name || 'this specialist'}? They will not be able to access the Laboratory Portal until reactivated.`}
        confirmText="Deactivate Specialist"
        confirmVariant="danger"
      />

      {/* Delete Specialist Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmSpecialist}
        onClose={() => setDeleteConfirmSpecialist(null)}
        onConfirm={() => {
          if (deleteConfirmSpecialist) handleDeleteSpecialist(deleteConfirmSpecialist);
          setDeleteConfirmSpecialist(null);
        }}
        title="Permanently Remove Lab Specialist"
        message={`Are you sure you want to permanently delete ${deleteConfirmSpecialist?.name} (${deleteConfirmSpecialist?.email})? This action removes their credentials and staff access.`}
        confirmText="Delete Specialist"
        confirmVariant="danger"
      />
    </div>
  );
};

export default LabManagement;
