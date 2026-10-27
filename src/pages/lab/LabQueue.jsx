import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { labService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import {
  IoCheckmarkOutline,
  IoFlaskOutline,
  IoArrowForwardOutline,
  IoEyeOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';
import { MdRefresh, MdClear, MdCancel } from 'react-icons/md';

const LabQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample Collection modal state
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectReq, setCollectReq] = useState(null);
  const [sampleTypeInput, setSampleTypeInput] = useState('');
  const [sampleNotesInput, setSampleNotesInput] = useState('');

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReq, setRejectReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Request Details modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailReq, setDetailReq] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await labService.getRequests({
        page,
        limit: 12,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        search: searchQuery ? searchQuery.trim() : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setRequests(res.data.requests || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch specimen requests queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Open Sample Collection modal
  const handleOpenCollectModal = (reqItem) => {
    setCollectReq(reqItem);
    setSampleTypeInput(reqItem.sampleType || reqItem.labTest?.sampleType || '');
    setSampleNotesInput('');
    setIsCollectModalOpen(true);
  };

  // Submit Sample Collection
  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (!collectReq) return;
    try {
      await labService.updateRequestStatus(collectReq._id, {
        status: 'Sample Collected',
        sampleType: sampleTypeInput,
        sampleNotes: sampleNotesInput,
        note: `Specimen (${sampleTypeInput || 'Sample'}) received & logged into lab inventory`
      });
      setIsCollectModalOpen(false);
      toast.success(`Specimen (${sampleTypeInput || 'Sample'}) registered for ${collectReq.patient?.name}`, {
        title: 'Sample Collected'
      });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording sample collection.', {
        title: 'Collection Failed'
      });
    }
  };

  // Submit Rejection
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      return toast.warning('Clinical rejection reason is mandatory.', {
        title: 'Validation Notice'
      });
    }
    try {
      await labService.updateRequestStatus(rejectReq._id, {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
        note: `Sample rejected by laboratory: ${rejectionReason.trim()}`
      });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      toast.error('Sample request rejected and logged in immutable audit trail.', {
        title: 'Sample Rejected'
      });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting sample request.', {
        title: 'Rejection Failed'
      });
    }
  };

  // Advance single status
  const handleAdvanceStatus = async (id, nextStatus, note = '') => {
    try {
      await labService.updateRequestStatus(id, { status: nextStatus, note });
      toast.success(`Specimen custody transitioned to: ${nextStatus}`, {
        title: 'Status Updated'
      });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status.', {
        title: 'Update Failed'
      });
    }
  };

  // View Detailed Request Modal
  const handleViewDetails = async (reqId) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await labService.getRequestById(reqId);
      setDetailReq(res.data.labRequest);
    } catch (err) {
      toast.error('Could not load detailed request information.');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      header: 'Request ID & Test',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.labTest?.testName}</div>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontFamily: 'monospace', fontWeight: 600 }}>
              {r.labTest?.testCode}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>• ID: {r._id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.patient?.name}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{r.patient?.phone || r.patient?.email}</div>
        </div>
      )
    },
    {
      header: 'Ordering Physician',
      render: (r) => (r.doctor?.name ? `Dr. ${r.doctor.name}` : <span className="text-secondary">Self Order</span>)
    },
    {
      header: 'Sample Type',
      render: (r) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
          {r.sampleType || r.labTest?.sampleType || 'Specimen'}
        </span>
      )
    },
    {
      header: 'Priority',
      render: (r) => <StatusBadge status={r.priority} />
    },
    {
      header: 'Workflow Stage',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      header: 'Expected By',
      render: (r) => (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {r.expectedCompletionDate ? (
            <span className="d-flex align-items-center gap-1">
              <IoTimeOutline size={13} />
              {new Date(r.expectedCompletionDate).toLocaleDateString()}
            </span>
          ) : (
            'Standard'
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      render: (r) => {
        return (
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {/* View Details Button */}
            <ActionBtn
              variant="view"
              label="Details"
              size="xs"
              onClick={() => handleViewDetails(r._id)}
            />

            {/* Requested State Actions */}
            {r.status === 'Requested' && (
              <>
                <ActionBtn
                  variant="success"
                  label="Accept"
                  size="xs"
                  onClick={() => handleAdvanceStatus(r._id, 'Accepted')}
                />
                <ActionBtn
                  variant="delete"
                  label="Reject"
                  size="xs"
                  onClick={() => {
                    setRejectReq(r);
                    setIsRejectModalOpen(true);
                  }}
                />
              </>
            )}

            {/* Accepted State Action */}
            {r.status === 'Accepted' && (
              <ActionBtn
                variant="prescribe"
                label="Collect Sample"
                size="xs"
                onClick={() => handleOpenCollectModal(r)}
              />
            )}

            {/* Sample Collected State Action */}
            {r.status === 'Sample Collected' && (
              <ActionBtn
                variant="start"
                label="Start Bench"
                size="xs"
                onClick={() => handleAdvanceStatus(r._id, 'Processing')}
              />
            )}

            {/* In-Bench or Completed State Action */}
            {['Processing', 'Completed'].includes(r.status) && (
              <ActionBtn
                variant="edit"
                label="Enter Results"
                size="xs"
                onClick={() => navigate(`/lab/results?requestId=${r._id}`)}
              />
            )}

            {/* Reviewed State Action */}
            {r.status === 'Reviewed' && (
              <ActionBtn
                variant="success"
                label="Release"
                size="xs"
                onClick={() => navigate(`/lab/results?requestId=${r._id}`)}
              />
            )}

            {/* Published / Released State: Distinct Certified Report Document Icon */}
            {r.status === 'Published' && (
              <ActionBtn
                variant="prescribe"
                icon={IoDocumentTextOutline}
                label="Released Report"
                title="View Certified Released Report"
                size="xs"
                onClick={() => navigate(`/lab/results?requestId=${r._id}`)}
              />
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Specimen Pipeline Custody Queue"
        subtitle="Manage end-to-end custody: Intake → Specimen Collection → Bench Analysis → Pathologist Review → Electronic Release"
        actionButton={
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="btn-secondary-custom d-flex align-items-center gap-1"
          >
            <MdRefresh size={16} className={loading ? 'spin' : ''} /> Refresh Queue
          </button>
        }
      />

      <GlassCard>
        {/* Search & Multi-Filter Panel */}
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              Search Orders
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <IoSearchOutline size={15} color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder="Patient name, phone, test code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm border-start-0"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              Workflow Stage
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="All">All Stages</option>
              <option value="Requested">Requested</option>
              <option value="Accepted">Accepted</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing (Bench)</option>
              <option value="Completed">Completed</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Published">Published</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              Priority Level
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="All">All Priorities</option>
              <option value="Stat">Stat (Immediate)</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control form-control-sm"
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label-custom" style={{ margin: 0, marginBottom: '0.2rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control form-control-sm"
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <div className="col-12 col-md-1 d-flex gap-1">
            <button type="submit" className="btn btn-sm btn-primary-custom flex-grow-1" style={{ fontSize: '0.78rem' }}>
              Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-sm btn-light border"
              title="Reset Filters"
              style={{ fontSize: '0.78rem' }}
            >
              <MdClear size={14} />
            </button>
          </div>
        </form>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyMessage="No laboratory requests match the selected criteria."
        />

        {/* Pagination Bar */}
        <div
          className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top"
          style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
        >
          <div>
            Showing {requests.length > 0 ? (page - 1) * 12 + 1 : 0} to{' '}
            {Math.min(page * 12, total)} of {total} test orders
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-sm btn-light border"
              style={{ fontSize: '0.78rem' }}
            >
              Previous
            </button>
            <span className="px-2" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              Page {page} of {Math.max(Math.ceil(total / 12), 1)}
            </span>
            <button
              disabled={page * 12 >= total}
              onClick={() => setPage(page + 1)}
              className="btn btn-sm btn-light border"
              style={{ fontSize: '0.78rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 1. Sample Collection Modal */}
      {collectReq && (
        <Modal
          isOpen={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          title={`Log Specimen Collection: ${collectReq.labTest?.testName}`}
        >
          <form onSubmit={handleCollectSubmit}>
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--light-blue)', fontSize: '0.84rem' }}>
              <div>Patient: <strong>{collectReq.patient?.name}</strong> ({collectReq.patient?.phone})</div>
              <div>Diagnostic Test: <strong>{collectReq.labTest?.testName}</strong> ({collectReq.labTest?.testCode})</div>
              {collectReq.labTest?.preparationInstructions && (
                <div className="mt-1 text-primary">
                  <strong>Prep Instructions:</strong> {collectReq.labTest.preparationInstructions}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Specimen Sample Type <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={sampleTypeInput}
                onChange={(e) => setSampleTypeInput(e.target.value)}
                placeholder="e.g. Whole Blood (EDTA), Serum, Clean-catch Urine..."
                className="form-control-custom"
              />
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Specimen Collection Notes</label>
              <textarea
                rows={2}
                value={sampleNotesInput}
                onChange={(e) => setSampleNotesInput(e.target.value)}
                placeholder="e.g. Fasting confirmed, drawn from left antecubital fossa, sample volume 8 mL..."
                className="form-control-custom"
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="btn-secondary-custom"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary-custom">
                <IoFlaskOutline size={16} /> Confirm Specimen Received
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Sample Rejection Modal */}
      {rejectReq && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title={`Reject Specimen: ${rejectReq.labTest?.testName}`}
        >
          <form onSubmit={handleRejectSubmit}>
            <div className="p-2.5 rounded mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#64748B' }}>
              Note: Rejecting this sample logs an audit event and notifies the attending physician. An explicit clinical reason is mandatory.
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Clinical Rejection Reason <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Severe hemolysis, inadequate sample volume, clotted specimen, broken container seal..."
                className="form-control-custom"
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="btn-secondary-custom"
              >
                Cancel
              </button>
              <button type="submit" className="btn-danger-custom">
                Confirm Sample Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Detailed Request View Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Diagnostic Work Order Full Custody Record"
        maxWidth="680px"
      >
        {detailLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading request custody timeline...
          </div>
        ) : detailReq ? (
          <div>
            {/* Header Summary */}
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--light-blue)', border: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
              <div className="row g-2">
                <div className="col-6 col-md-4">
                  <strong>Patient:</strong> {detailReq.patient?.name}
                </div>
                <div className="col-6 col-md-4">
                  <strong>Contact:</strong> {detailReq.patient?.phone || 'N/A'}
                </div>
                <div className="col-6 col-md-4">
                  <strong>Physician:</strong> {detailReq.doctor?.name ? `Dr. ${detailReq.doctor.name}` : 'Self Request'}
                </div>
                <div className="col-6 col-md-4">
                  <strong>Test:</strong> {detailReq.labTest?.testName}
                </div>
                <div className="col-6 col-md-4">
                  <strong>Code:</strong> <code>{detailReq.labTest?.testCode}</code>
                </div>
                <div className="col-6 col-md-4">
                  <strong>Stage:</strong> <StatusBadge status={detailReq.status} />
                </div>
              </div>
            </div>

            {/* Clinical Indication */}
            {detailReq.clinicalNotes && (
              <div className="p-2 mb-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                <strong>Clinical Notes from Doctor:</strong>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-main)' }}>{detailReq.clinicalNotes}</p>
              </div>
            )}

            {/* Specimen Info */}
            <div className="p-2 mb-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div className="row g-2">
                <div className="col-6">
                  <strong>Specimen Sample:</strong> {detailReq.sampleType || detailReq.labTest?.sampleType}
                </div>
                <div className="col-6">
                  <strong>Collected At:</strong>{' '}
                  {detailReq.sampleCollectedAt ? new Date(detailReq.sampleCollectedAt).toLocaleString() : 'Pending collection'}
                </div>
                {detailReq.sampleNotes && (
                  <div className="col-12 text-secondary">
                    <em>Sample Notes: {detailReq.sampleNotes}</em>
                  </div>
                )}
                {detailReq.rejectionReason && (
                  <div className="col-12 text-danger">
                    <strong>Rejection Reason:</strong> {detailReq.rejectionReason} (by {detailReq.rejectedBy?.name || 'Staff'})
                  </div>
                )}
              </div>
            </div>

            {/* Custody Timeline */}
            <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Chain of Custody Timeline
            </h6>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {detailReq.statusHistory?.map((h, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: 'rgba(244, 247, 251, 0.7)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}
                >
                  <div>
                    <StatusBadge status={h.status} />
                    <span className="ms-2" style={{ color: 'var(--text-main)' }}>
                      {h.note || `Transitioned to ${h.status}`}
                    </span>
                  </div>
                  <div className="text-end text-secondary" style={{ fontSize: '0.72rem' }}>
                    <div>{new Date(h.timestamp).toLocaleString()}</div>
                    <div>By: {h.updatedBy?.name || 'Authorized Staff'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-secondary-custom"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default LabQueue;
