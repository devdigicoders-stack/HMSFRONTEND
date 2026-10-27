import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { labService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  IoAddOutline,
  IoFlaskOutline,
  IoCreateOutline,
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import { MdRefresh } from 'react-icons/md';

const LabTestCatalog = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add & Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmTest, setConfirmTest] = useState(null);
  const [currentTest, setCurrentTest] = useState({
    testName: '',
    testCode: '',
    category: 'Biochemistry',
    price: '',
    turnaroundHours: '',
    sampleType: '',
    normalRange: '',
    units: '',
    description: '',
    preparationInstructions: '',
    isActive: true
  });

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await labService.getTests({
        activeOnly: 'false',
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: searchQuery ? searchQuery.trim() : undefined
      });
      setTests(res.data.tests || []);
    } catch (err) {
      setError('Failed to fetch laboratory test catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentTest({
      testName: '',
      testCode: '',
      category: 'Biochemistry',
      price: '',
      turnaroundHours: '',
      sampleType: '',
      normalRange: '',
      units: '',
      description: '',
      preparationInstructions: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setCurrentTest({
      _id: t._id,
      testName: t.testName || '',
      testCode: t.testCode || '',
      category: t.category || 'Biochemistry',
      price: t.price !== undefined ? t.price : '',
      turnaroundHours: t.turnaroundHours !== undefined ? t.turnaroundHours : '',
      sampleType: t.sampleType || '',
      normalRange: t.normalRange || '',
      units: t.units || '',
      description: t.description || '',
      preparationInstructions: t.preparationInstructions || '',
      isActive: t.isActive !== undefined ? t.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await labService.toggleTestStatus(id);
      toast.success(`Diagnostic test status changed to ${!currentStatus ? 'Active' : 'Inactive'}.`, {
        title: 'Status Updated'
      });
      setSuccessMsg(`Test status changed to ${!currentStatus ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCatalog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating test status.', {
        title: 'Update Failed'
      });
      setError(err.response?.data?.message || 'Error updating test status.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentTest.testName.trim() || !currentTest.testCode.trim() || !currentTest.sampleType.trim()) {
      toast.warning('Test name, unique test code, and specimen sample type are required.', {
        title: 'Validation Notice'
      });
      return setError('Test name, unique test code, and specimen sample type are required.');
    }

    try {
      if (isEditing) {
        await labService.updateTest(currentTest._id, currentTest);
        toast.success('Diagnostic test profile updated successfully.', {
          title: 'Catalog Updated'
        });
        setSuccessMsg('Diagnostic test updated successfully.');
      } else {
        await labService.createTest(currentTest);
        toast.success('New diagnostic test added to laboratory catalog.', {
          title: 'Test Created'
        });
        setSuccessMsg('New diagnostic test added to laboratory catalog.');
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCatalog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving diagnostic test.', {
        title: 'Save Failed'
      });
      setError(err.response?.data?.message || 'Error saving diagnostic test.');
      setTimeout(() => setError(''), 4500);
    }
  };

  const columns = [
    {
      header: 'Test Name & Code',
      render: (t) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--light-blue)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}
          >
            <IoFlaskOutline />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.testName}</div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontFamily: 'monospace', fontWeight: 600 }}>
                {t.testCode}
              </span>
              {t.preparationInstructions && (
                <span
                  title={`Preparation: ${t.preparationInstructions}`}
                  style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'help' }}
                >
                  <IoInformationCircleOutline size={13} /> Has prep notes
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Department', accessor: 'category' },
    {
      header: 'Fee (₹)',
      render: (t) => <strong style={{ color: 'var(--success)' }}>₹{t.price}</strong>
    },
    {
      header: 'Turnaround',
      render: (t) => `${t.turnaroundHours} Hours`
    },
    { header: 'Specimen Type', accessor: 'sampleType' },
    {
      header: 'Status',
      render: (t) => <StatusBadge status={t.isActive ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Actions',
      render: (t) => (
        <div className="d-flex align-items-center gap-1">
          <button
            onClick={() => handleOpenEdit(t)}
            className="btn btn-sm btn-light border"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            <IoCreateOutline size={13} /> Edit
          </button>
          <button
            onClick={() => (t.isActive ? setConfirmTest(t) : handleToggleStatus(t._id, t.isActive))}
            className={`btn btn-sm ${t.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            {t.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pathology Diagnostic Test Catalog"
        subtitle="Configure hospital laboratory test profiles, specimen requirements, preparation instructions, clinical pricing, and active status"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchCatalog}
              className="btn-secondary-custom d-flex align-items-center gap-1"
            >
              <MdRefresh size={16} /> Refresh
            </button>
            <button onClick={handleOpenAdd} className="btn-primary-custom d-flex align-items-center gap-1">
              <IoAddOutline size={18} /> Add Catalog Test
            </button>
          </div>
        }
      />

      <GlassCard>
        {/* Search & Category Filter */}
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-4">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              Search Catalog
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <IoSearchOutline size={15} color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder="Search by test name, code, sample..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm border-start-0"
              />
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              Department / Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select-custom"
            >
              <option value="All">All Laboratory Departments</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Immunology">Immunology</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Pathology">Pathology</option>
            </select>
          </div>

          <div className="col-12 col-md-2">
            <button type="submit" className="btn btn-sm btn-primary-custom w-100" style={{ height: '31px' }}>
              Filter Catalog
            </button>
          </div>
        </form>

        <DataTable
          columns={columns}
          data={tests}
          loading={loading}
          emptyMessage="No diagnostic tests found in laboratory catalog."
        />
      </GlassCard>

      {/* Add / Edit Test Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit Diagnostic Test: ${currentTest.testName}` : 'Add Diagnostic Test to Hospital Catalog'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Test Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={currentTest.testName}
                onChange={(e) => setCurrentTest({ ...currentTest, testName: e.target.value })}
                placeholder="e.g. Complete Blood Count (CBC)"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Unique Test Code <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={currentTest.testCode}
                onChange={(e) => setCurrentTest({ ...currentTest, testCode: e.target.value.toUpperCase() })}
                placeholder="e.g. LAB-CBC-01"
                className="form-control-custom font-monospace"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Department / Category <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <select
                value={currentTest.category}
                onChange={(e) => setCurrentTest({ ...currentTest, category: e.target.value })}
                className="form-select-custom"
              >
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Immunology">Immunology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Pathology">Pathology</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Hospital Price / Fee (₹) <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="number"
                required
                min="0"
                value={currentTest.price}
                onChange={(e) => setCurrentTest({ ...currentTest, price: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. 450"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Turnaround Time (Hours)</label>
              <input
                type="number"
                min="1"
                value={currentTest.turnaroundHours}
                onChange={(e) => setCurrentTest({ ...currentTest, turnaroundHours: e.target.value })}
                className="form-control-custom"
                placeholder="e.g. 24"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Specimen Sample Type <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={currentTest.sampleType}
                onChange={(e) => setCurrentTest({ ...currentTest, sampleType: e.target.value })}
                placeholder="e.g. Whole Blood (EDTA), Serum, Urine"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Standard Units</label>
              <input
                type="text"
                value={currentTest.units}
                onChange={(e) => setCurrentTest({ ...currentTest, units: e.target.value })}
                placeholder="e.g. mg/dL, g/dL, %"
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Standard Reference Range</label>
              <input
                type="text"
                value={currentTest.normalRange}
                onChange={(e) => setCurrentTest({ ...currentTest, normalRange: e.target.value })}
                placeholder="e.g. 13.5 - 17.5 g/dL"
                className="form-control-custom"
              />
            </div>

            <div className="col-12">
              <label className="form-label-custom">Patient Preparation Instructions</label>
              <input
                type="text"
                value={currentTest.preparationInstructions}
                onChange={(e) => setCurrentTest({ ...currentTest, preparationInstructions: e.target.value })}
                placeholder="e.g. 12 hours overnight fasting required, avoid heavy exercise..."
                className="form-control-custom"
              />
            </div>

            <div className="col-12">
              <label className="form-label-custom">Clinical Description & Indications</label>
              <textarea
                rows={2}
                value={currentTest.description}
                onChange={(e) => setCurrentTest({ ...currentTest, description: e.target.value })}
                placeholder="Primary clinical indications, diagnostic utility..."
                className="form-control-custom"
              />
            </div>

            <div className="col-12">
              <div className="form-check form-switch mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActiveToggle"
                  checked={currentTest.isActive}
                  onChange={(e) => setCurrentTest({ ...currentTest, isActive: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="isActiveToggle" style={{ fontSize: '0.85rem' }}>
                  Active in hospital diagnostic catalog (Visible for doctor and patient ordering)
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary-custom"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom">
              {isEditing ? 'Save Changes' : 'Add Test to Catalog'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Lab Test Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!confirmTest}
        onClose={() => setConfirmTest(null)}
        onConfirm={() => {
          if (confirmTest) {
            handleToggleStatus(confirmTest._id, confirmTest.isActive);
          }
          setConfirmTest(null);
        }}
        title="Confirm Test Deactivation"
        message={`Are you sure you want to deactivate '${confirmTest?.testName}' (${confirmTest?.testCode})? This test will no longer appear in patient or doctor ordering catalogues.`}
        confirmText="Deactivate Test"
        confirmVariant="danger"
      />
    </div>
  );
};

export default LabTestCatalog;
