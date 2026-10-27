import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { labService, patientService } from '../../services/api';
import { printLabReportA4 } from '../../utils/printA4Document';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  IoAddOutline,
  IoFlaskOutline,
  IoEyeOutline,
  IoPrintOutline,
  IoDownloadOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';
import { MdRefresh, MdCancel } from 'react-icons/md';

const DoctorLabRequests = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    testId: '',
    priority: 'Normal',
    clinicalNotes: ''
  });

  // Result modal
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [viewResult, setViewResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      const [reqRes, catRes, ptRes] = await Promise.all([
        labService.getRequests(),
        labService.getTests({ activeOnly: 'true' }),
        patientService.getPatients({ limit: 50 })
      ]);
      setRequests(reqRes.data.requests || []);
      setTestsCatalog(catRes.data.tests || []);
      setPatients(ptRes.data.patients || []);
    } catch (err) {
      toast.error('Failed to fetch laboratory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  // Auto-open modal if navigated with patientId from Appointments or Patient Directory
  useEffect(() => {
    if (location.state?.patientId) {
      setFormData((prev) => ({
        ...prev,
        patientId: location.state.patientId
      }));
      setIsOrderModalOpen(true);
    }
  }, [location.state]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.testId) {
      return toast.warning('Please select both patient and diagnostic test.', {
        title: 'Validation Notice'
      });
    }

    try {
      await labService.createRequest(formData);
      setIsOrderModalOpen(false);
      toast.success('Laboratory investigation ordered successfully.', {
        title: 'Order Submitted'
      });
      setFormData((prev) => ({ ...prev, testId: '', clinicalNotes: '' }));
      fetchLabData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error ordering test.', {
        title: 'Order Failed'
      });
    }
  };

  const handleOpenReport = async (requestId) => {
    setIsResultModalOpen(true);
    setResultLoading(true);
    try {
      const res = await labService.getResult(requestId);
      setViewResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Report result is still undergoing laboratory verification.');
      setIsResultModalOpen(false);
      setTimeout(() => setError(''), 4000);
    } finally {
      setResultLoading(false);
    }
  };

  const handleDownloadAttachment = async (requestId, fileName) => {
    try {
      const res = await labService.downloadReportFile(requestId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `report-${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Could not download attached file.');
      setTimeout(() => setError(''), 3500);
    }
  };

  const selectedTestObj = testsCatalog.find((t) => t._id === formData.testId);

  const columns = [
    {
      header: 'Patient Name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.patient?.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.patient?.phone || r.patient?.email}</div>
        </div>
      )
    },
    {
      header: 'Test Investigation',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.labTest?.testName}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontFamily: 'monospace' }}>
            {r.labTest?.testCode} • {r.labTest?.category}
          </div>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (r) => <StatusBadge status={r.priority} />
    },
    {
      header: 'Workflow Stage',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} />
          {r.status === 'Rejected' && r.rejectionReason && (
            <div className="text-danger mt-1" style={{ fontSize: '0.72rem' }}>
              <strong>Reason:</strong> {r.rejectionReason}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Order Date',
      render: (r) => new Date(r.createdAt).toLocaleDateString()
    },
    {
      header: 'Diagnostic Actions',
      render: (r) => {
        if (r.status === 'Published') {
          return (
            <button
              onClick={() => handleOpenReport(r._id)}
              className="btn btn-sm btn-primary-custom"
              style={{ fontSize: '0.76rem', padding: '0.25rem 0.55rem' }}
            >
              <IoEyeOutline size={14} /> View Report
            </button>
          );
        }
        return (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {r.status === 'Sample Collected'
              ? 'Specimen Collected'
              : r.status === 'Processing'
              ? 'Bench Testing'
              : r.status === 'Completed' || r.status === 'Reviewed'
              ? 'Reviewing'
              : r.status}
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Physician Diagnostic Orders"
        subtitle="Order pathology investigations, track specimen custody milestones, and review released clinical reports"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchLabData}
              className="btn-secondary-custom d-flex align-items-center gap-1"
            >
              <MdRefresh size={16} /> Refresh
            </button>
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="btn-primary-custom d-flex align-items-center gap-1"
            >
              <IoAddOutline size={18} /> Order Lab Test
            </button>
          </div>
        }
      />

      <GlassCard>
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyMessage="No diagnostic tests ordered yet."
        />
      </GlassCard>

      {/* Order Lab Test Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Order Diagnostic Investigation for Patient"
        maxWidth="640px"
      >
        <form onSubmit={handleOrderSubmit}>
          <div className="mb-3">
            <label className="form-label-custom">Select Patient <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="form-select-custom"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((pt) => (
                <option key={pt.user?._id} value={pt.user?._id}>
                  {pt.user?.name} ({pt.user?.phone || pt.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Diagnostic Test <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
            <select
              required
              value={formData.testId}
              onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
              className="form-select-custom"
            >
              <option value="">-- Select Diagnostic Test --</option>
              {testsCatalog.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.testName} ({t.category}) - Sample: {t.sampleType} - ₹{t.price}
                </option>
              ))}
            </select>
            {selectedTestObj?.preparationInstructions && (
              <div className="mt-1" style={{ fontSize: '0.76rem', color: 'var(--primary-blue)' }}>
                <strong>Prep Instructions:</strong> {selectedTestObj.preparationInstructions}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="form-select-custom"
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="Stat">Stat (Emergency Immediate)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Clinical Indication / Suspicion</label>
            <textarea
              rows={3}
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              placeholder="Clinical reason, suspected pathology, or pre-operative workup..."
              className="form-control-custom"
            />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="btn-secondary-custom"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom">
              Submit Test Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Verified Report Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Pathology Diagnostic Report"
        maxWidth="720px"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              onClick={() => setIsResultModalOpen(false)}
              className="btn-secondary-custom"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => printLabReportA4({ result: viewResult })}
              className="btn-primary-custom d-flex align-items-center gap-1"
            >
              <IoPrintOutline size={16} /> Print Report
            </button>
          </div>
        }
      >
        {resultLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading certified report...
          </div>
        ) : viewResult ? (
          <div>
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--light-blue)', border: '1px solid #bfdbfe' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
                    {viewResult.labRequest?.labTest?.testName}
                  </h6>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Patient: <strong>{viewResult.patient?.name}</strong> • Specimen: {viewResult.labRequest?.sampleType || viewResult.labRequest?.labTest?.sampleType}
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge-status badge-status-success">Released</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {viewResult.publishedAt ? new Date(viewResult.publishedAt).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Analyte / Parameter</th>
                    <th>Measured Finding</th>
                    <th>Standard Reference Range</th>
                    <th>Clinical Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {viewResult.parameters?.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.parameterName}</td>
                      <td>
                        <strong>{p.measuredValue}</strong>{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.referenceRange || 'Standard'}</td>
                      <td>
                        <StatusBadge status={p.flag || 'Normal'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
              <strong>Pathologist Remarks:</strong>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-main)' }}>{viewResult.remarks}</p>
            </div>

            {viewResult.reportFileUrl && (
              <div className="mt-3 p-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F1F5F9', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.82rem' }}>
                  <strong>Attached Scanned / Signed File:</strong> {viewResult.reportFileName || 'Diagnostic Document'}
                </span>
                <button
                  onClick={() => handleDownloadAttachment(viewResult.labRequest?._id || viewResult.labRequest, viewResult.reportFileName)}
                  className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                  style={{ fontSize: '0.78rem' }}
                >
                  <IoDownloadOutline size={14} /> Download File
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default DoctorLabRequests;
