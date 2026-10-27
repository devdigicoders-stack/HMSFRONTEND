import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { prescriptionService, doctorService, appointmentService } from '../../services/api';
import { printPrescriptionA4 } from '../../utils/printA4Document';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  MdAssignment,
  MdAdd,
  MdDeleteOutline,
  MdPrint,
  MdRefresh,
  MdSearch,
  MdLocalHospital,
  MdPerson,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import config from '../../config/appConfig';
import HospitalBrandLogo from '../../components/common/HospitalBrandLogo';

const DoctorPrescriptions = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [assignedAppointments, setAssignedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Create Prescription Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    clinicalAdvice: '',
    followUpDate: '',
    medications: [
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  });

  // View / Print Prescription Slip Modal
  const [selectedRx, setSelectedRx] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printAreaRef = useRef();

  // Medication Item Delete Confirmation
  const [deleteMedIndex, setDeleteMedIndex] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [rxRes, ptRes, apptRes] = await Promise.all([
        prescriptionService.getPrescriptions({ limit: 100 }),
        doctorService.getPatients({ limit: 100 }),
        appointmentService.getAppointments({ limit: 100 })
      ]);

      if (rxRes.data?.success) {
        setPrescriptions(rxRes.data.prescriptions || []);
      }
      if (ptRes.data?.success) {
        setAssignedPatients(ptRes.data.patients || []);
      }
      if (apptRes.data?.success) {
        setAssignedAppointments(apptRes.data.appointments || []);
      }
    } catch (err) {
      toast.error('Failed to fetch electronic prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill patient and open modal if navigated from Appointments or Patient Directory
  useEffect(() => {
    if (location.state?.patientId) {
      setFormData((prev) => ({
        ...prev,
        patientId: location.state.patientId,
        appointmentId: location.state.appointmentId || ''
      }));
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handlePatientSelect = (e) => {
    const pId = e.target.value;
    // Find if there is an active/recent appointment for this patient
    const matchingAppt = assignedAppointments.find(a => (a.patient?._id === pId || a.patient === pId) && a.status !== 'Cancelled');
    setFormData({
      ...formData,
      patientId: pId,
      appointmentId: matchingAppt ? matchingAppt._id : ''
    });
  };

  const handleAddMedicationRow = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const executeRemoveMedication = (idx) => {
    if (formData.medications.length <= 1) return;
    const updated = formData.medications.filter((_, i) => i !== idx);
    setFormData({ ...formData, medications: updated });
  };

  const handleRemoveMedicationRow = (idx) => {
    if (formData.medications.length <= 1) return;
    const med = formData.medications[idx];
    if (med.medicineName?.trim() || med.dosage?.trim() || med.instructions?.trim()) {
      setDeleteMedIndex(idx);
    } else {
      executeRemoveMedication(idx);
    }
  };

  const handleMedicationChange = (idx, field, value) => {
    const updated = [...formData.medications];
    updated[idx][field] = value;
    setFormData({ ...formData, medications: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      return toast.warning('Please choose an authorized patient.', {
        title: 'Validation Notice'
      });
    }
    if (!formData.diagnosis.trim()) {
      return toast.warning('Please enter a clinical diagnosis.', {
        title: 'Validation Notice'
      });
    }

    // Validate medication rows
    for (let i = 0; i < formData.medications.length; i++) {
      const m = formData.medications[i];
      if (!m.medicineName.trim() || !m.dosage.trim() || !m.duration.trim()) {
        return toast.warning(`Medication item #${i + 1} requires medicine name, dosage, and duration.`, {
          title: 'Prescription Item Missing'
        });
      }
    }

    setSubmitting(true);
    try {
      await prescriptionService.createPrescription(formData);
      setIsModalOpen(false);
      toast.success('Electronic pharmacotherapy prescription issued and stored securely.', {
        title: 'Prescription Created'
      });

      // Reset form
      setFormData({
        patientId: '',
        appointmentId: '',
        diagnosis: '',
        symptoms: '',
        clinicalAdvice: '',
        followUpDate: '',
        medications: [
          { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
        ]
      });

      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating prescription.', {
        title: 'Issuance Failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (selectedRx) {
      printPrescriptionA4({ prescription: selectedRx });
    }
  };

  // Filtered prescriptions
  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const ptName = p.patient?.name?.toLowerCase() || '';
    const diag = p.diagnosis?.toLowerCase() || '';
    const medNames = (p.medications || []).map(m => m.medicineName?.toLowerCase()).join(' ');
    return ptName.includes(q) || diag.includes(q) || medNames.includes(q);
  });

  const columns = [
    {
      header: 'Patient Details',
      render: (p) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'var(--light-blue)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              overflow: 'hidden'
            }}
          >
            {p.patient?.avatar ? (
              <img
                src={p.patient.avatar}
                alt={p.patient?.name || 'Patient'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              p.patient?.name ? p.patient.name.charAt(0).toUpperCase() : 'P'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {p.patient?.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {p.patient?.phone || p.patient?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Clinical Diagnosis',
      render: (p) => (
        <div>
          <strong style={{ color: 'var(--primary-blue)', fontSize: '0.88rem' }}>{p.diagnosis}</strong>
          {p.symptoms && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Symptoms: {p.symptoms}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Prescribed Regimen',
      render: (p) => (
        <div style={{ fontSize: '0.78rem' }}>
          {(p.medications || []).slice(0, 2).map((m, i) => (
            <div key={i}>
              • <strong>{m.medicineName}</strong> ({m.dosage}) - {m.frequency}
            </div>
          ))}
          {(p.medications || []).length > 2 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
              +{p.medications.length - 2} more item(s)
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Issued Date',
      render: (p) => (
        <div style={{ fontSize: '0.8rem' }}>
          <div>{new Date(p.createdAt).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Follow-up: {p.followUpDate ? new Date(p.followUpDate).toLocaleDateString() : 'As required'}
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      render: (p) => (
        <button
          onClick={() => {
            setSelectedRx(p);
            setIsPrintModalOpen(true);
          }}
          className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
        >
          <MdPrint size={15} /> View / Print Rx
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Electronic Pharmacotherapy & Prescriptions"
        subtitle="Formulate structured multi-medicine prescriptions, review pharmacotherapy history, and generate printable clinic slips"
        actionButton={
          <div className="d-flex gap-2">
            <button onClick={fetchData} className="btn-secondary-custom d-flex align-items-center gap-1">
              <MdRefresh size={17} /> Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary-custom d-flex align-items-center gap-1"
            >
              <MdAdd size={18} /> New Prescription
            </button>
          </div>
        }
      />

      {/* Scoped print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-prescription-voucher, #printable-prescription-voucher * {
            visibility: visible !important;
          }
          #printable-prescription-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <GlassCard>
        {/* Search Input */}
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search prescriptions by patient name, diagnosis, or drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control-custom ps-4"
                style={{ fontSize: '0.82rem' }}
              />
              <MdSearch
                size={17}
                className="position-absolute top-50 start-0 translate-middle-y ms-2 text-secondary"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPrescriptions}
          loading={loading}
          emptyMessage="No electronic prescriptions found matching the search."
        />
      </GlassCard>

      {/* 1. New Electronic Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulate Electronic Prescription"
        maxWidth="780px"
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            {/* Select Patient */}
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Select Assigned Patient <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <select
                required
                value={formData.patientId}
                onChange={handlePatientSelect}
                className="form-select-custom"
              >
                <option value="">-- Choose Assigned Patient --</option>
                {assignedPatients.map((pt) => (
                  <option key={pt._id} value={pt._id}>
                    {pt.name} ({pt.phone || pt.email})
                  </option>
                ))}
              </select>
              {assignedPatients.length === 0 && (
                <div style={{ fontSize: '0.74rem', color: '#ea580c', marginTop: '0.2rem' }}>
                  No assigned patients found in your clinical docket.
                </div>
              )}
            </div>

            {/* Link to Appointment (Optional) */}
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Link to Appointment</label>
              <select
                value={formData.appointmentId}
                onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                className="form-select-custom"
              >
                <option value="">-- None / Standalone Order --</option>
                {assignedAppointments
                  .filter(a => !formData.patientId || (a.patient?._id === formData.patientId || a.patient === formData.patientId))
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {new Date(a.appointmentDate).toLocaleDateString()} ({a.timeSlot?.start}) - {a.reasonForVisit}
                    </option>
                  ))}
              </select>
            </div>

            {/* Diagnosis */}
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Primary Clinical Diagnosis <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                required
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g. Acute Pharyngitis, Type-2 Diabetes Mellitus"
                className="form-control-custom"
              />
            </div>

            {/* Symptoms */}
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Presenting Symptoms</label>
              <input
                type="text"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Cough, sore throat, elevated temperature"
                className="form-control-custom"
              />
            </div>
          </div>

          {/* Dynamic Multi-Medication Order Items */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label-custom" style={{ margin: 0, fontWeight: 700 }}>
                Medication Order Items *
              </label>
              <button
                type="button"
                onClick={handleAddMedicationRow}
                className="btn btn-sm btn-light-custom"
                style={{ fontSize: '0.76rem' }}
              >
                + Add Another Medication
              </button>
            </div>

            <div className="d-flex flex-column gap-2">
              {formData.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border"
                  style={{ backgroundColor: 'rgba(244, 247, 251, 0.7)' }}
                >
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Drug / Generic Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amoxicillin, Paracetamol"
                        value={med.medicineName}
                        onChange={(e) => handleMedicationChange(idx, 'medicineName', e.target.value)}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Dosage <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500 mg"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. 1-0-1 (Twice daily)"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="col-10 col-md-2">
                      <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Duration <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="col-2 col-md-1 text-end pt-3">
                      <button
                        type="button"
                        disabled={formData.medications.length <= 1}
                        onClick={() => handleRemoveMedicationRow(idx)}
                        className="btn btn-sm btn-outline-danger p-1"
                        style={{ lineHeight: 1 }}
                        title="Remove drug"
                      >
                        <MdDeleteOutline size={17} />
                      </button>
                    </div>

                    <div className="col-12 mt-1">
                      <input
                        type="text"
                        placeholder="Patient instructions (e.g. Take with warm water after meals)"
                        value={med.instructions}
                        onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                        className="form-control-custom"
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Advice and Follow-up */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-8">
              <label className="form-label-custom">Clinical Advice / Dietary Instructions</label>
              <textarea
                rows={2}
                value={formData.clinicalAdvice}
                onChange={(e) => setFormData({ ...formData, clinicalAdvice: e.target.value })}
                placeholder="Dietary precautions, hydration advice, warnings..."
                className="form-control-custom"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label-custom">Next Follow-Up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="form-control-custom"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary-custom"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-custom d-flex align-items-center gap-1"
            >
              <MdCheckCircle size={18} />
              {submitting ? 'Issuing Prescription...' : 'Sign & Issue Prescription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. View / Print Prescription Slip Modal */}
      {selectedRx && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Electronic Prescription Slip (Rx)"
          maxWidth="700px"
        >
          <div className="p-3">
            {/* Printable Slip Container */}
            <div
              id="printable-prescription-voucher"
              ref={printAreaRef}
              className="p-4 rounded border"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {/* Slip Header */}
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <HospitalBrandLogo size={36} />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary-green)', letterSpacing: '-0.02em' }}>
                      {config.hospitalName}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Department of Clinical Medicine • {config.hospitalTagline}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      24/7 Clinical Helpline: {config.hospitalPhone}
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-blue)' }}>
                    ℞
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Rx Ref: #{selectedRx._id.slice(-8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                    Date: {new Date(selectedRx.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Meta Grid */}
              <div className="row g-2 p-2 mb-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div className="col-6">
                  <strong>Patient Name:</strong> {selectedRx.patient?.name}
                </div>
                <div className="col-6 text-end">
                  <strong>Attending Doctor:</strong> Dr. {selectedRx.doctor?.name}
                </div>
                <div className="col-6">
                  <strong>Contact:</strong> {selectedRx.patient?.phone || selectedRx.patient?.email}
                </div>
                <div className="col-6 text-end">
                  <strong>Doctor Contact:</strong> {selectedRx.doctor?.phone || selectedRx.doctor?.email}
                </div>
                <div className="col-12 mt-1 pt-1 border-top" style={{ borderColor: '#e2e8f0' }}>
                  <strong>Primary Diagnosis:</strong> <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>{selectedRx.diagnosis}</span>
                  {selectedRx.symptoms && <span> (Symptoms: {selectedRx.symptoms})</span>}
                </div>
              </div>

              {/* Medications Table */}
              <div className="custom-table-container mb-3">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRx.medications || []).map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.medicineName}</td>
                        <td>{m.dosage}</td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td style={{ fontSize: '0.78rem' }}>{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advice & Follow-up */}
              {selectedRx.clinicalAdvice && (
                <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem' }}>
                  <strong>Physician Clinical Advice:</strong> {selectedRx.clinicalAdvice}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-end pt-4 mt-4 border-top" style={{ borderColor: '#e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Next Follow-up:</strong> {selectedRx.followUpDate ? new Date(selectedRx.followUpDate).toLocaleDateString() : 'As needed / SOS'}</div>
                  <div>Issued electronically via {config.hospitalName} HMS</div>
                </div>

                <div className="text-center" style={{ minWidth: 160 }}>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--primary-blue)', borderBottom: '1px solid #94a3b8', paddingBottom: '4px' }}>
                    Dr. {selectedRx.doctor?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Digitally Verified Signature
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="btn-secondary-custom"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-primary-custom d-flex align-items-center gap-1"
              >
                <MdPrint size={17} /> Print Prescription Slip
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Remove Medication Item */}
      <ConfirmDialog
        isOpen={deleteMedIndex !== null}
        onClose={() => setDeleteMedIndex(null)}
        onConfirm={() => {
          if (deleteMedIndex !== null) {
            executeRemoveMedication(deleteMedIndex);
            setDeleteMedIndex(null);
          }
        }}
        title="Remove Medication"
        message={`Are you sure you want to remove ${
          deleteMedIndex !== null && formData.medications[deleteMedIndex]?.medicineName?.trim()
            ? `"${formData.medications[deleteMedIndex].medicineName}"`
            : 'this medication entry'
        } from the prescription?`}
        confirmText="Remove Medication"
        type="danger"
      />
    </div>
  );
};

export default DoctorPrescriptions;
