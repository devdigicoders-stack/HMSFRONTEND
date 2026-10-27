import React, { useState, useEffect } from 'react';
import { labService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { printLabReportA4 } from '../../utils/printA4Document';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  IoFlaskOutline,
  IoEyeOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoPrintOutline,
  IoDownloadOutline,
  IoInformationCircleOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoCheckmarkDoneOutline,
  IoFilterOutline
} from 'react-icons/io5';
import config from '../../config/appConfig';
import HospitalBrandLogo from '../../components/common/HospitalBrandLogo';

const PatientLabReports = () => {
  const { toast } = useToast();

  // Primary view toggle: 'my_orders' vs 'catalog'
  const [viewMode, setViewMode] = useState('my_orders');

  // Requests state
  const [requests, setRequests] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for My Orders
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all' | 'published' | 'processing' | 'requested'
  const [searchOrders, setSearchOrders] = useState('');

  // Filters for Catalog Directory
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [searchCatalog, setSearchCatalog] = useState('');

  // Order Test Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  // View Result Modal
  const [viewResult, setViewResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      const [reqRes, catRes] = await Promise.all([
        labService.getRequests(),
        labService.getTests({ activeOnly: 'true' })
      ]);
      setRequests(reqRes.data.requests || []);
      const catalog = catRes.data.tests || [];
      setTestsCatalog(catalog);
      if (catalog.length > 0 && !selectedTestId) {
        setSelectedTestId(catalog[0]._id);
      }
    } catch (err) {
      toast.error('Failed to fetch laboratory reports.', { title: 'Network Notice' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  const handleOpenOrderModal = (testId = null) => {
    if (testId) {
      setSelectedTestId(testId);
    } else if (testsCatalog.length > 0 && !selectedTestId) {
      setSelectedTestId(testsCatalog[0]._id);
    }
    setOrderNotes('');
    setIsOrderModalOpen(true);
  };

  const handleOrderLabTest = async (e) => {
    e.preventDefault();
    if (!selectedTestId) {
      return toast.warning('Please select a diagnostic test from the catalog.', { title: 'Test Required' });
    }

    try {
      setOrderLoading(true);
      await labService.createRequest({
        testId: selectedTestId,
        clinicalNotes: orderNotes,
        priority: 'Normal'
      });
      setIsOrderModalOpen(false);
      setOrderNotes('');
      toast.success('Diagnostic investigation requested! Our lab reception will accession your sample.', {
        title: 'Order Submitted'
      });
      fetchLabData();
      setViewMode('my_orders');
      setActiveStatusTab('all');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting diagnostic test.', {
        title: 'Order Failed'
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOpenReport = async (requestId) => {
    setIsResultModalOpen(true);
    setResultLoading(true);
    try {
      const res = await labService.getResult(requestId);
      setViewResult(res.data.result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Laboratory results have not been verified and released yet.', {
        title: 'Report Pending'
      });
      setIsResultModalOpen(false);
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
      link.setAttribute('download', fileName || `lab-report-${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Could not download attached report document.', { title: 'Download Notice' });
    }
  };

  const selectedTestObj = testsCatalog.find((t) => t._id === selectedTestId);

  // Filtered Orders
  const publishedCount = requests.filter((r) => r.status === 'Published').length;
  const processingCount = requests.filter((r) => ['Sample Collected', 'Processing', 'In Progress'].includes(r.status)).length;
  const requestedCount = requests.filter((r) => ['Requested', 'Accepted'].includes(r.status)).length;

  const filteredRequests = requests.filter((r) => {
    if (activeStatusTab === 'published' && r.status !== 'Published') return false;
    if (activeStatusTab === 'processing' && !['Sample Collected', 'Processing', 'In Progress'].includes(r.status)) return false;
    if (activeStatusTab === 'requested' && !['Requested', 'Accepted'].includes(r.status)) return false;

    if (!searchOrders.trim()) return true;
    const term = searchOrders.toLowerCase();
    return (
      r.labTest?.testName?.toLowerCase().includes(term) ||
      r.labTest?.category?.toLowerCase().includes(term) ||
      r.doctor?.name?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term) ||
      r._id?.toLowerCase().includes(term)
    );
  });

  // Filtered Catalog
  const categories = ['All', ...new Set(testsCatalog.map((t) => t.category).filter(Boolean))];

  const filteredCatalog = testsCatalog.filter((t) => {
    if (catalogCategory !== 'All' && t.category !== catalogCategory) return false;
    if (!searchCatalog.trim()) return true;
    const term = searchCatalog.toLowerCase();
    return (
      t.testName?.toLowerCase().includes(term) ||
      t.testCode?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term)
    );
  });

  // Columns for My Orders
  const ordersColumns = [
    {
      header: 'Laboratory Test',
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '8px',
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
            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{r.labTest?.testName}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Category: {r.labTest?.category} • Sample: {r.sampleType || r.labTest?.sampleType || 'Whole Blood'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Ordering Physician',
      render: (r) => (r.doctor?.name ? `Dr. ${r.doctor.name}` : <span className="text-secondary">Self Requested</span>)
    },
    {
      header: 'Date Requested',
      render: (r) => new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    {
      header: 'Progress Status',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} />
          {r.status === 'Rejected' && r.rejectionReason && (
            <div className="text-danger mt-1" style={{ fontSize: '0.72rem' }}>
              <strong>Rejection:</strong> {r.rejectionReason}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Diagnostic Report',
      render: (r) => {
        if (r.status === 'Published') {
          return (
            <button
              onClick={() => handleOpenReport(r._id)}
              className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem', padding: '0.28rem 0.65rem' }}
            >
              <IoEyeOutline size={15} /> Official Report
            </button>
          );
        }
        return (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {r.status === 'Sample Collected'
              ? 'Specimen Received'
              : r.status === 'Processing'
              ? 'Testing in Lab...'
              : r.status === 'Completed' || r.status === 'Reviewed'
              ? 'Verification in Progress...'
              : 'Processing in Lab...'}
          </span>
        );
      }
    }
  ];

  // Columns for Catalog
  const catalogColumns = [
    {
      header: 'Diagnostic Investigation',
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
      header: 'Category & Sample',
      render: (t) => (
        <div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#334155' }}>
            {t.category}
          </span>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Specimen: {t.sampleType || 'Whole Blood'}
          </div>
        </div>
      )
    },
    {
      header: 'Preparation / Fasting',
      render: (t) => (
        <div style={{ maxWidth: 220, fontSize: '0.78rem', color: t.preparationInstructions ? '#0284C7' : '#64748B' }}>
          {t.preparationInstructions ? (
            <span><IoInformationCircleOutline size={14} className="me-1" />{t.preparationInstructions}</span>
          ) : (
            'No fasting restrictions.'
          )}
        </div>
      )
    },
    {
      header: 'TAT & Price',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            ₹{t.price}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Turnaround: {t.turnaroundHours} hrs
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      render: (t) => (
        <button
          type="button"
          onClick={() => handleOpenOrderModal(t._id)}
          className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
          style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
        >
          <IoAddOutline size={14} /> Request Test
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pathology Diagnostic Reports & Investigation Directory"
        subtitle="Track sample specimen processing, turnaround timelines, view certified clinical test certificates, or order voluntary health tests"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchLabData}
              className="btn btn-secondary-custom d-flex align-items-center gap-1"
              disabled={loading}
              title="Refresh Lab Data"
            >
              <IoRefreshOutline size={17} className={loading ? 'spin-animation' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
            <button
              onClick={() => handleOpenOrderModal()}
              className="btn-primary-custom d-flex align-items-center gap-2"
            >
              <IoAddOutline size={18} /> Request Lab Test
            </button>
          </div>
        }
      />

      {/* Top Mode Selector */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setViewMode('my_orders')}
          className={viewMode === 'my_orders' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.88rem', fontWeight: 650 }}
        >
          <IoDocumentTextOutline size={17} /> My Test Requests & Reports ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('catalog')}
          className={viewMode === 'catalog' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.88rem', fontWeight: 650 }}
        >
          <IoFlaskOutline size={17} /> Hospital Diagnostic Catalog & Pricing ({testsCatalog.length})
        </button>
      </div>

      {viewMode === 'my_orders' ? (
        <div>
          {/* Status Sub-tabs */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveStatusTab('all')}
              className={activeStatusTab === 'all' ? 'btn-primary-custom' : 'btn-secondary-custom'}
              style={{ fontSize: '0.82rem', fontWeight: 650 }}
            >
              All Requests ({requests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveStatusTab('published')}
              className={activeStatusTab === 'published' ? 'btn-primary-custom' : 'btn-secondary-custom'}
              style={{ fontSize: '0.82rem', fontWeight: 650 }}
            >
              Published Certificates ({publishedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveStatusTab('processing')}
              className={activeStatusTab === 'processing' ? 'btn-primary-custom' : 'btn-secondary-custom'}
              style={{ fontSize: '0.82rem', fontWeight: 650 }}
            >
              In-Lab Processing ({processingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveStatusTab('requested')}
              className={activeStatusTab === 'requested' ? 'btn-primary-custom' : 'btn-secondary-custom'}
              style={{ fontSize: '0.82rem', fontWeight: 650 }}
            >
              Awaiting Sample ({requestedCount})
            </button>
          </div>

          <GlassCard>
            {/* Search Bar */}
            <div className="row g-3 align-items-center mb-3">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <IoSearchOutline color="var(--text-secondary)" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by test name, category, or physician..."
                    value={searchOrders}
                    onChange={(e) => setSearchOrders(e.target.value)}
                    className="form-control form-control-custom border-start-0"
                  />
                </div>
              </div>
            </div>

            <DataTable
              columns={ordersColumns}
              data={filteredRequests}
              loading={loading}
              emptyMessage="No diagnostic test records match your filter."
            />
          </GlassCard>
        </div>
      ) : (
        <div>
          {/* Catalog View */}
          <GlassCard className="p-3 mb-3">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <IoSearchOutline color="var(--text-secondary)" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search test directory by name, code, or description..."
                    value={searchCatalog}
                    onChange={(e) => setSearchCatalog(e.target.value)}
                    className="form-control form-control-custom border-start-0"
                  />
                </div>
              </div>

              <div className="col-12 col-md-7 d-flex gap-2 flex-wrap justify-content-md-end">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    className={`btn btn-sm ${catalogCategory === cat ? 'btn-primary-custom' : 'btn-light border'}`}
                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <DataTable
              columns={catalogColumns}
              data={filteredCatalog}
              loading={loading}
              emptyMessage="No tests found in directory for this filter."
            />
          </GlassCard>
        </div>
      )}

      {/* Order New Test Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Request Hospital Diagnostic Investigation"
        maxWidth="600px"
      >
        <form onSubmit={handleOrderLabTest}>
          <div className="mb-3">
            <label className="form-label-custom">
              Select Test from Clinical Directory <span className="req-star" style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="form-select-custom"
            >
              {testsCatalog.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.testName} (₹{t.price}) • TAT {t.turnaroundHours} hrs
                </option>
              ))}
            </select>
            {selectedTestObj?.preparationInstructions && (
              <div className="p-2 mt-2 rounded" style={{ backgroundColor: 'var(--light-blue)', fontSize: '0.78rem', color: 'var(--primary-blue)' }}>
                <IoInformationCircleOutline size={14} className="me-1" />
                <strong>Preparation Required:</strong> {selectedTestObj.preparationInstructions}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Clinical Reason / Relevant Symptoms</label>
            <textarea
              rows={3}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Describe your health symptoms or reasons for requesting this diagnostic investigation..."
              className="form-control form-control-custom"
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
            <button type="submit" disabled={orderLoading} className="btn-primary-custom">
              {orderLoading ? 'Submitting Request...' : 'Submit Test Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Certified Pathology Report Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Certified Pathology Diagnostic Report"
        maxWidth="740px"
        footer={
          <div className="d-flex justify-content-end gap-2">
            {viewResult?.reportFileUrl && (
              <button
                type="button"
                onClick={() => handleDownloadAttachment(viewResult.labRequest?._id || viewResult.labRequest, viewResult.reportFileName)}
                className="btn-secondary-custom d-flex align-items-center gap-1"
              >
                <IoDownloadOutline size={16} /> Download File
              </button>
            )}
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
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
            Loading certified diagnostic record...
          </div>
        ) : viewResult ? (
          <div id="lab-cert-print" className="rx-paper-container" style={{ padding: '1.5rem', background: '#fff' }}>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #lab-cert-print, #lab-cert-print * {
                  visibility: visible;
                }
                #lab-cert-print {
                  position: fixed;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 20px;
                  box-shadow: none;
                  border: none;
                }
              }
            `}</style>

            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="d-flex align-items-center gap-2">
                <HospitalBrandLogo size={36} />
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {config.hospitalName || 'LifeCare Hospital'} Diagnostics & Pathology
                  </h5>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Accredited Laboratory Services • {config.hospitalTagline || 'Advanced Patient Care'}
                  </span>
                </div>
              </div>

              <div className="text-end">
                <span className="badge-status badge-status-success">
                  <IoCheckmarkCircleOutline size={14} /> Official Verified
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Barcode: APX-{(viewResult._id || '').slice(-8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--mint)', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
              <div className="row g-2">
                <div className="col-6 col-md-3"><strong>Patient:</strong> {viewResult.patient?.name}</div>
                <div className="col-6 col-md-3"><strong>Phone:</strong> {viewResult.patient?.phone || 'N/A'}</div>
                <div className="col-6 col-md-3"><strong>Specimen:</strong> {viewResult.labRequest?.sampleType || viewResult.labRequest?.labTest?.sampleType || 'Whole Blood'}</div>
                <div className="col-6 col-md-3"><strong>Verified Date:</strong> {new Date(viewResult.publishedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Investigation Title */}
            <div className="mb-3">
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Test Investigation Profile:
              </span>
              <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1.15rem' }}>
                {viewResult.labRequest?.labTest?.testName}
              </h5>
            </div>

            {/* Parameters Table */}
            <div className="custom-table-container mb-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Analyte / Parameter</th>
                    <th>Measured Result</th>
                    <th>Standard Reference Range</th>
                    <th>Clinical Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {viewResult.parameters?.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{p.parameterName}</td>
                      <td>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                          {p.measuredValue}
                        </span>{' '}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {p.referenceRange || 'Clinical Standard'}
                      </td>
                      <td>
                        <StatusBadge status={p.flag || 'Normal'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pathologist Remarks */}
            <div className="p-3 rounded mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <strong>Pathology Specialist Remarks:</strong>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {viewResult.remarks || 'Test findings verified. Clinical correlation recommended.'}
              </p>
            </div>

            {/* Verification Stamp */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                This is a computer-verified diagnostic document backed by hospital electronic health records.
              </div>
              <div className="text-end">
                <strong style={{ color: 'var(--primary-blue)', fontSize: '0.88rem' }}>
                  {viewResult.performedBy?.name || 'Authorized Pathologist'}
                </strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Senior Clinical Pathologist
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default PatientLabReports;
