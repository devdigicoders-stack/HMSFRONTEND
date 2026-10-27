import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { labService } from '../../services/api';
import { printLabReportA4 } from '../../utils/printA4Document';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  IoAddOutline,
  IoTrashOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoShieldCheckmarkOutline,
  IoPrintOutline,
  IoDocumentAttachOutline,
  IoAlertCircleOutline,
  IoDownloadOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import config from '../../config/appConfig';
import HospitalBrandLogo from '../../components/common/HospitalBrandLogo';

const LabResultEntry = () => {
  const [searchParams] = useSearchParams();
  const initialRequestId = searchParams.get('requestId') || '';
  const { toast } = useToast();

  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequestId);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Result state
  const [parameters, setParameters] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [existingResult, setExistingResult] = useState(null);
  const [amendmentReason, setAmendmentReason] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Prepopulate standard parameters based on test code
  const loadDefaultParameters = (labTest) => {
    if (!labTest) {
      setParameters([
        { parameterName: 'Analyte Measured', measuredValue: '', unit: '', referenceRange: '', flag: 'Normal' }
      ]);
      return;
    }

    const testCode = (labTest.testCode || '').toUpperCase();
    if (testCode.includes('CBC')) {
      setParameters([
        { parameterName: 'Hemoglobin (Hb)', measuredValue: '', unit: 'g/dL', referenceRange: '13.5 - 17.5 g/dL', flag: 'Normal' },
        { parameterName: 'Total Leukocyte Count (WBC)', measuredValue: '', unit: '/mcL', referenceRange: '4,000 - 11,000 /mcL', flag: 'Normal' },
        { parameterName: 'Platelet Count', measuredValue: '', unit: '/mcL', referenceRange: '150,000 - 450,000 /mcL', flag: 'Normal' },
        { parameterName: 'RBC Count', measuredValue: '', unit: 'million/mcL', referenceRange: '4.5 - 5.9 million/mcL', flag: 'Normal' }
      ]);
    } else if (testCode.includes('LIPID')) {
      setParameters([
        { parameterName: 'Total Cholesterol', measuredValue: '', unit: 'mg/dL', referenceRange: '< 200 mg/dL', flag: 'Normal' },
        { parameterName: 'HDL (Good) Cholesterol', measuredValue: '', unit: 'mg/dL', referenceRange: '> 40 mg/dL', flag: 'Normal' },
        { parameterName: 'LDL (Bad) Cholesterol', measuredValue: '', unit: 'mg/dL', referenceRange: '< 100 mg/dL', flag: 'Normal' },
        { parameterName: 'Triglycerides', measuredValue: '', unit: 'mg/dL', referenceRange: '< 150 mg/dL', flag: 'Normal' }
      ]);
    } else if (testCode.includes('HBA1C')) {
      setParameters([
        { parameterName: 'HbA1c Glycated Hemoglobin', measuredValue: '', unit: '%', referenceRange: 'Normal: <5.7%, Diabetes: >=6.5%', flag: 'Normal' },
        { parameterName: 'Estimated Average Glucose (eAG)', measuredValue: '', unit: 'mg/dL', referenceRange: '70 - 126 mg/dL', flag: 'Normal' }
      ]);
    } else if (testCode.includes('CMP')) {
      setParameters([
        { parameterName: 'Fasting Blood Glucose', measuredValue: '', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', flag: 'Normal' },
        { parameterName: 'Serum Creatinine', measuredValue: '', unit: 'mg/dL', referenceRange: '0.7 - 1.3 mg/dL', flag: 'Normal' },
        { parameterName: 'Blood Urea Nitrogen (BUN)', measuredValue: '', unit: 'mg/dL', referenceRange: '7 - 20 mg/dL', flag: 'Normal' },
        { parameterName: 'Serum Calcium', measuredValue: '', unit: 'mg/dL', referenceRange: '8.5 - 10.2 mg/dL', flag: 'Normal' }
      ]);
    } else if (testCode.includes('THYROID')) {
      setParameters([
        { parameterName: 'Thyroid Stimulating Hormone (TSH)', measuredValue: '', unit: 'mIU/L', referenceRange: '0.4 - 4.0 mIU/L', flag: 'Normal' },
        { parameterName: 'Free T4 (Thyroxine)', measuredValue: '', unit: 'ng/dL', referenceRange: '0.8 - 1.8 ng/dL', flag: 'Normal' },
        { parameterName: 'Free T3 (Triiodothyronine)', measuredValue: '', unit: 'pg/mL', referenceRange: '2.3 - 4.2 pg/mL', flag: 'Normal' }
      ]);
    } else if (testCode.includes('URINE')) {
      setParameters([
        { parameterName: 'Color & Appearance', measuredValue: 'Pale Yellow, Clear', unit: 'Visual', referenceRange: 'Clear', flag: 'Normal' },
        { parameterName: 'pH', measuredValue: '6.0', unit: 'pH units', referenceRange: '5.0 - 7.5', flag: 'Normal' },
        { parameterName: 'Specific Gravity', measuredValue: '1.020', unit: '', referenceRange: '1.005 - 1.030', flag: 'Normal' },
        { parameterName: 'Protein (Albumin)', measuredValue: 'Negative', unit: 'Qualitative', referenceRange: 'Negative', flag: 'Normal' },
        { parameterName: 'Urine Glucose', measuredValue: 'Negative', unit: 'Qualitative', referenceRange: 'Negative', flag: 'Normal' }
      ]);
    } else {
      setParameters([
        {
          parameterName: labTest.testName || 'Analyte Result',
          measuredValue: '',
          unit: labTest.units && labTest.units !== 'N/A' ? labTest.units : '',
          referenceRange: labTest.normalRange || 'Refer to laboratory clinical guidelines',
          flag: 'Normal'
        }
      ]);
    }
  };

  // Fetch candidate requests for result entry
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await labService.getRequests({ limit: 60 });
      // Eligible work orders: Processing, Completed, Reviewed, Published, or Sample Collected
      const eligible = (res.data.requests || []).filter((r) =>
        ['Processing', 'Completed', 'Reviewed', 'Published', 'Sample Collected'].includes(r.status)
      );
      setRequests(eligible);

      if (eligible.length > 0) {
        const found = eligible.find((r) => r._id === initialRequestId) || eligible[0];
        handleSelectRequest(found);
      }
    } catch (err) {
      toast.error('Failed to fetch candidate work orders for results entry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [initialRequestId]);

  const handleSelectRequest = async (workOrder) => {
    if (!workOrder) return;
    setSelectedRequestId(workOrder._id);
    setSelectedRequest(workOrder);
    setReportFile(null);
    setAmendmentReason('');

    // Try fetching existing result from server
    try {
      const res = await labService.getResult(workOrder._id);
      if (res.data.success && res.data.result) {
        const existing = res.data.result;
        setExistingResult(existing);
        setParameters(existing.parameters || []);
        setRemarks(existing.remarks || '');
        return;
      }
    } catch (err) {
      // No existing result yet; load default template
      setExistingResult(null);
      setRemarks('Results verified following standardized clinical pathology laboratory guidelines.');
      loadDefaultParameters(workOrder.labTest);
    }
  };

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { parameterName: '', measuredValue: '', unit: '', referenceRange: '', flag: 'Normal' }
    ]);
  };

  const handleRemoveParam = (idx) => {
    if (parameters.length <= 1) return;
    setParameters(parameters.filter((_, i) => i !== idx));
  };

  const handleParamChange = (idx, field, value) => {
    const updated = [...parameters];
    updated[idx][field] = value;
    setParameters(updated);
  };

  // Save result (Draft or Direct Publish)
  const handleSaveResult = async (publishNow = false) => {
    if (!selectedRequestId) return toast.warning('Please select a specimen work order.');
    if (parameters.length === 0) return toast.warning('At least one measured parameter is required.');

    // Validate parameter inputs
    for (const p of parameters) {
      if (!p.parameterName.trim() || p.measuredValue === undefined || p.measuredValue === '') {
        return toast.warning('All test parameters must have both a name and a measured value.');
      }
    }

    // If report is already released, require amendment reason
    if (existingResult?.publishedAt && !amendmentReason.trim()) {
      return toast.warning('An official clinical amendment reason is required to update released results.');
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('requestId', selectedRequestId);
      formData.append('parameters', JSON.stringify(parameters));
      formData.append('remarks', remarks);
      formData.append('publishNow', publishNow ? 'true' : 'false');
      if (amendmentReason.trim()) {
        formData.append('amendmentReason', amendmentReason.trim());
      }
      if (reportFile) {
        formData.append('reportFile', reportFile);
      }

      const res = await labService.recordResult(formData);
      toast.success(
        publishNow
          ? 'Official diagnostic certificate verified and released to patient & doctor!'
          : 'Test results saved as completed (ready for review/release).',
        { title: publishNow ? 'Report Published' : 'Results Recorded' }
      );

      // Refresh current request details
      if (res.data.result) {
        setExistingResult(res.data.result);
      }
      setAmendmentReason('');
      fetchWorkOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording test results.', {
        title: 'Recording Failed'
      });
    } finally {
      setSaving(false);
    }
  };

  // Review & Release actions
  const handleReviewAction = async (actionType) => {
    setSaving(true);
    try {
      await labService.reviewAndReleaseResult(selectedRequestId, {
        action: actionType,
        notes: actionType === 'review' ? 'Approved by supervising clinical pathologist' : undefined
      });
      toast.success(
        actionType === 'review'
          ? 'Diagnostic report approved and verified by pathologist.'
          : 'Diagnostic report officially released.',
        { title: actionType === 'review' ? 'Report Verified' : 'Report Released' }
      );
      fetchWorkOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error executing review action.', {
        title: 'Action Failed'
      });
    } finally {
      setSaving(false);
    }
  };

  // Secure download existing attached file
  const handleDownloadAttachment = async () => {
    if (!selectedRequestId) return;
    try {
      const res = await labService.downloadReportFile(selectedRequestId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', existingResult?.reportFileName || `report-${selectedRequestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Unable to download attached report document.');
    }
  };

  const isAlreadyReleased = Boolean(existingResult?.publishedAt || selectedRequest?.status === 'Published');

  return (
    <div>
      <PageHeader
        title="Diagnostic Results Entry & Verification"
        subtitle="Record structured analyte findings, apply abnormal diagnostic flags, attach verified documents, and release certified pathology reports"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchWorkOrders}
              className="btn-secondary-custom d-flex align-items-center gap-1"
            >
              <IoRefreshOutline size={16} /> Refresh
            </button>
            {isAlreadyReleased && (
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="btn-primary-custom d-flex align-items-center gap-1"
              >
                <IoPrintOutline size={16} /> Print Official Certificate
              </button>
            )}
          </div>
        }
      />

      <div className="row g-4">
        {/* Left Column: Specimen Work Order Selector */}
        <div className="col-12 col-lg-4">
          <GlassCard>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Specimen Work Orders
              </h5>
              <span className="badge bg-light text-secondary border" style={{ fontSize: '0.72rem' }}>
                {requests.length} Active
              </span>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading work orders...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-4 text-secondary" style={{ fontSize: '0.85rem' }}>
                No specimen orders ready for results entry.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {requests.map((r) => {
                  const isSelected = selectedRequestId === r._id;
                  return (
                    <div
                      key={r._id}
                      onClick={() => handleSelectRequest(r)}
                      className="p-3 rounded transition-all cursor-pointer"
                      style={{
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--light-blue)' : 'rgba(255, 255, 255, 0.65)',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {r.patient?.name}
                        </strong>
                        <StatusBadge status={r.status} />
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 600, marginTop: '0.2rem' }}>
                        {r.labTest?.testName}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>Sample: {r.sampleType || r.labTest?.sampleType}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Results Entry & Verification Form */}
        <div className="col-12 col-lg-8">
          <GlassCard>
            {selectedRequest ? (
              <>
                {/* Header Information */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      {selectedRequest.labTest?.testName}
                    </h5>
                    <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>Patient: <strong>{selectedRequest.patient?.name}</strong></span>
                      <span>• Sample Specimen: <strong>{selectedRequest.sampleType || selectedRequest.labTest?.sampleType}</strong></span>
                      <span>• Code: <code>{selectedRequest.labTest?.testCode}</code></span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <StatusBadge status={selectedRequest.status} />
                    <button
                      type="button"
                      onClick={handleAddParam}
                      className="btn btn-sm btn-light-custom"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <IoAddOutline size={15} /> Add Parameter
                    </button>
                  </div>
                </div>

                {/* Released Report Warning Banner & Amendment Reason */}
                {isAlreadyReleased && (
                  <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', fontSize: '0.82rem', color: '#92400E' }}>
                    <div className="d-flex align-items-center gap-2 font-weight-bold mb-1">
                      <IoAlertCircleOutline size={18} />
                      <strong>Released Report Mode (Controlled Amendment Required)</strong>
                    </div>
                    <div>
                      This diagnostic report was officially released on{' '}
                      <strong>{existingResult?.publishedAt ? new Date(existingResult.publishedAt).toLocaleString() : 'N/A'}</strong>.
                      To update or correct any parameter values, please provide an official clinical amendment reason below.
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Mandatory amendment rationale (e.g. Recalibration of serum analyte analyzer)..."
                        value={amendmentReason}
                        onChange={(e) => setAmendmentReason(e.target.value)}
                        className="form-control form-control-sm bg-white"
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Parameters Editor Table */}
                <div className="mb-4">
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '32%' }}>Analyte Parameter *</th>
                          <th style={{ width: '22%' }}>Measured Finding *</th>
                          <th style={{ width: '15%' }}>Unit</th>
                          <th style={{ width: '17%' }}>Reference Range</th>
                          <th style={{ width: '10%' }}>Flag</th>
                          <th style={{ width: '4%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parameters.map((param, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                required
                                value={param.parameterName}
                                onChange={(e) => handleParamChange(idx, 'parameterName', e.target.value)}
                                placeholder="e.g. Hemoglobin"
                                className="form-control-custom"
                                style={{ fontSize: '0.82rem', padding: '0.35rem 0.55rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                value={param.measuredValue}
                                onChange={(e) => handleParamChange(idx, 'measuredValue', e.target.value)}
                                placeholder="e.g. 14.2"
                                className="form-control-custom font-monospace"
                                style={{ fontSize: '0.86rem', fontWeight: 700, padding: '0.35rem 0.55rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                                placeholder="g/dL"
                                className="form-control-custom"
                                style={{ fontSize: '0.82rem', padding: '0.35rem 0.55rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={param.referenceRange}
                                onChange={(e) => handleParamChange(idx, 'referenceRange', e.target.value)}
                                placeholder="13.5 - 17.5"
                                className="form-control-custom"
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.55rem' }}
                              />
                            </td>
                            <td>
                              <select
                                value={param.flag || 'Normal'}
                                onChange={(e) => handleParamChange(idx, 'flag', e.target.value)}
                                className="form-select-custom"
                                style={{ fontSize: '0.76rem', padding: '0.35rem 0.35rem' }}
                              >
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Low">Low</option>
                                <option value="Abnormal">Abnormal</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={parameters.length <= 1}
                                onClick={() => handleRemoveParam(idx)}
                                className="btn btn-sm btn-outline-danger p-1"
                                title="Remove parameter"
                              >
                                <IoTrashOutline size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks & File Attachment */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-7">
                    <label className="form-label-custom">Clinical Pathologist & Technical Remarks</label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Technical observations, calibration notes, morphological features, or clinical flags..."
                      className="form-control-custom"
                    />
                  </div>

                  <div className="col-12 col-md-5">
                    <label className="form-label-custom">Upload Certified Scan / Signed Report (PDF / Image)</label>
                    <div
                      className="p-3 text-center rounded"
                      style={{
                        border: '2px dashed var(--border-subtle)',
                        backgroundColor: 'rgba(244, 247, 251, 0.45)'
                      }}
                    >
                      <IoCloudUploadOutline size={26} color="var(--primary-blue)" />
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg"
                        onChange={(e) => setReportFile(e.target.files[0])}
                        className="form-control form-control-sm mt-2"
                        style={{ fontSize: '0.76rem' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Max file size: 5.0 MB (.pdf, .png, .jpg)
                      </span>

                      {existingResult?.reportFileUrl && (
                        <div className="mt-2 pt-2 border-top">
                          <button
                            type="button"
                            onClick={handleDownloadAttachment}
                            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <IoDownloadOutline size={14} /> Download Attached File ({existingResult.reportFileName || 'File'})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amendment History Audit Log if present */}
                {existingResult?.amendmentHistory?.length > 0 && (
                  <div className="p-3 mb-4 rounded" style={{ backgroundColor: 'rgba(244, 247, 251, 0.7)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                    <h6 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                      Previous Amendment Audit Trail ({existingResult.amendmentHistory.length})
                    </h6>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 150, overflowY: 'auto' }}>
                      {existingResult.amendmentHistory.map((am, i) => (
                        <div key={i} className="p-2 bg-white rounded border">
                          <div className="d-flex justify-content-between">
                            <strong>Amendment #{i + 1}: {am.reason}</strong>
                            <span className="text-secondary">{new Date(am.amendedAt).toLocaleString()}</span>
                          </div>
                          <div className="text-secondary mt-1" style={{ fontSize: '0.74rem' }}>
                            Amended By: {am.amendedBy?.name || 'Staff Pathologist'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    {selectedRequest.status === 'Completed' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleReviewAction('review')}
                        className="btn btn-sm btn-light-custom"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <IoShieldCheckmarkOutline size={15} /> Verify & Approve (Reviewed)
                      </button>
                    )}
                    {selectedRequest.status === 'Reviewed' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleReviewAction('release')}
                        className="btn btn-sm btn-primary-custom"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <IoCheckmarkCircleOutline size={15} /> Release Report (Publish)
                      </button>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveResult(false)}
                      className="btn-secondary-custom"
                      style={{ fontSize: '0.84rem' }}
                    >
                      {saving ? 'Saving...' : 'Save Draft (Completed)'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveResult(true)}
                      className="btn-primary-custom"
                      style={{ fontSize: '0.84rem' }}
                    >
                      <IoCheckmarkCircleOutline size={17} />
                      {saving ? 'Processing...' : isAlreadyReleased ? 'Apply Amendment & Release' : 'Verify & Release Official Report'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-5 text-center text-secondary">
                Select a specimen work order from the left list to record or amend clinical findings.
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Scoped Print Media Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-lab-certificate, #printable-lab-certificate * {
            visibility: visible !important;
          }
          #printable-lab-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Official Certificate Printable Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Certified Diagnostic Laboratory Certificate"
          maxWidth="750px"
          footer={
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="btn-secondary-custom"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  printLabReportA4({
                    result: {
                      _id: selectedRequest?._id,
                      labRequest: selectedRequest,
                      labTest: selectedRequest?.labTest,
                      patient: selectedRequest?.patient,
                      parameters: parameters.map(p => ({
                        parameterName: p.parameterName,
                        resultValue: p.measuredValue,
                        unit: p.unit,
                        referenceRange: p.referenceRange,
                        flag: p.flag
                      })),
                      remarks: remarks || 'Clinical investigation verified by laboratory staff.',
                      releasedAt: new Date()
                    }
                  });
                }}
                className="btn-primary-custom"
              >
                <IoPrintOutline size={16} /> Print Certificate
              </button>
            </div>
          }
        >
          <div id="printable-lab-certificate" className="rx-paper-container" style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="d-flex align-items-center gap-2">
                <HospitalBrandLogo size={34} />
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {config.hospitalName}
                  </h5>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Department of Laboratory Medicine • {config.hospitalTagline}
                  </div>
                </div>
              </div>
              <div className="text-end">
                <span className="badge-status badge-status-success">
                  <IoCheckmarkCircleOutline size={14} /> Official Verified
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Barcode: APX-{selectedRequest._id.slice(-8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--mint)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div className="row g-2">
                <div className="col-6 col-md-3"><strong>Patient:</strong> {selectedRequest.patient?.name}</div>
                <div className="col-6 col-md-3"><strong>Phone:</strong> {selectedRequest.patient?.phone || 'N/A'}</div>
                <div className="col-6 col-md-3"><strong>Specimen:</strong> {selectedRequest.sampleType || selectedRequest.labTest?.sampleType}</div>
                <div className="col-6 col-md-3"><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Test Title */}
            <div className="mb-3">
              <h6 style={{ margin: 0, fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>
                {selectedRequest.labTest?.testName}
              </h6>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Test Code: {selectedRequest.labTest?.testCode} • Category: {selectedRequest.labTest?.category}
              </div>
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
                  {parameters.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{p.parameterName}</td>
                      <td>
                        <strong>{p.measuredValue}</strong>{' '}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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

            {/* Remarks */}
            <div className="p-3 rounded mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <strong>Clinical Remarks & Interpretation:</strong>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-main)' }}>{remarks}</p>
            </div>

            {/* Sign-off */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <div>Electronic report validated under hospital diagnostic quality protocols.</div>
              <div className="text-end">
                <strong style={{ color: 'var(--primary-blue)' }}>Senior Pathologist Signature Verified</strong>
                <div>Laboratory Information Management System (LIMS)</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LabResultEntry;
