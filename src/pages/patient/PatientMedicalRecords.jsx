import React, { useState, useEffect } from 'react';
import { medicalRecordService, prescriptionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { printPrescriptionA4 } from '../../utils/printA4Document';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  IoDocumentTextOutline,
  IoMedkitOutline,
  IoPulseOutline,
  IoPrintOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoEyeOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import { RiMedicineBottleLine, RiHospitalLine } from 'react-icons/ri';
import config from '../../config/appConfig';

const PatientMedicalRecords = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'prescriptions'
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [selectedPrintRx, setSelectedPrintRx] = useState(null);
  const [selectedRecordModal, setSelectedRecordModal] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, rxRes] = await Promise.all([
        medicalRecordService.getRecords(),
        prescriptionService.getPrescriptions()
      ]);
      setRecords(recRes.data.records || []);
      setPrescriptions(rxRes.data.prescriptions || []);
    } catch (err) {
      toast.error('Failed to fetch your confidential medical vault data.', {
        title: 'Network Notice'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPrintModal = (prescription) => {
    setSelectedPrintRx(prescription);
  };

  const handlePrintVoucher = () => {
    if (selectedPrintRx) {
      printPrescriptionA4({ prescription: selectedPrintRx });
    }
  };

  // Filter lists based on search
  const filteredRecords = records.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(term) ||
      r.doctor?.name?.toLowerCase().includes(term) ||
      r.recordType?.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    );
  });

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const hasMed = p.medications?.some((m) => m.medicineName?.toLowerCase().includes(term));
    return (
      p.diagnosis?.toLowerCase().includes(term) ||
      p.doctor?.name?.toLowerCase().includes(term) ||
      p._id?.toLowerCase().includes(term) ||
      hasMed
    );
  });

  return (
    <div>
      <PageHeader
        title="Electronic Health Records & Pharmacotherapy"
        subtitle="Confidential outpatient encounter summaries, biometric vitals tracking, and official digital prescription vouchers"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchData}
              className="btn btn-secondary-custom d-flex align-items-center gap-1"
              disabled={loading}
              title="Refresh Records"
            >
              <IoRefreshOutline size={17} className={loading ? 'spin-animation' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveTab('records')}
          className={activeTab === 'records' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.88rem', fontWeight: 650 }}
        >
          <IoDocumentTextOutline size={18} /> Clinical Encounters & Vitals ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={activeTab === 'prescriptions' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.88rem', fontWeight: 650 }}
        >
          <IoMedkitOutline size={18} /> Official Prescriptions ({prescriptions.length})
        </button>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoSearchOutline color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'records'
                    ? 'Search by title, doctor name, or encounter type...'
                    : 'Search by diagnosis, physician, or medicine name...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-custom border-start-0"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="p-5 text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-secondary" style={{ fontSize: '0.88rem' }}>Accessing electronic medical vault...</p>
        </div>
      ) : activeTab === 'records' ? (
        <div className="d-flex flex-column gap-3">
          {filteredRecords.length === 0 ? (
            <GlassCard className="p-5 text-center text-secondary">
              No clinical consultation records logged by your physicians yet.
            </GlassCard>
          ) : (
            filteredRecords.map((r) => (
              <GlassCard key={r._id} className="p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <div>
                    <span className="badge-status badge-status-info mb-1">{r.recordType}</span>
                    <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>{r.title}</h5>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Attending Physician: <strong>Dr. {r.doctor?.name}</strong> • Encounter Date: {new Date(r.recordedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRecordModal(r)}
                    className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                  >
                    <IoEyeOutline size={15} /> View Full Encounter
                  </button>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '0.85rem 0', lineHeight: 1.6 }}>
                  {r.description}
                </p>

                {/* Vital Signs Grid */}
                {r.vitalSigns && Object.values(r.vitalSigns).some(v => !!v) && (
                  <div className="p-3 mt-3 rounded" style={{ backgroundColor: 'rgba(234, 243, 255, 0.6)', border: '1px solid #bfdbfe' }}>
                    <div className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.04em' }}>
                      <IoPulseOutline size={16} /> RECORDED BIOMETRIC VITAL SIGNS
                    </div>
                    <div className="row g-3" style={{ fontSize: '0.85rem' }}>
                      {r.vitalSigns.bloodPressure && (
                        <div className="col-6 col-sm-3">
                          <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>BLOOD PRESSURE</span>
                          <strong style={{ fontSize: '0.95rem' }}>{r.vitalSigns.bloodPressure}</strong>
                        </div>
                      )}
                      {r.vitalSigns.heartRate && (
                        <div className="col-6 col-sm-3">
                          <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>PULSE / HEART RATE</span>
                          <strong style={{ fontSize: '0.95rem' }}>{r.vitalSigns.heartRate} bpm</strong>
                        </div>
                      )}
                      {r.vitalSigns.temperature && (
                        <div className="col-6 col-sm-3">
                          <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>TEMPERATURE</span>
                          <strong style={{ fontSize: '0.95rem' }}>{r.vitalSigns.temperature} °F</strong>
                        </div>
                      )}
                      {r.vitalSigns.spO2 && (
                        <div className="col-6 col-sm-3">
                          <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>OXYGEN SATURATION</span>
                          <strong style={{ fontSize: '0.95rem' }}>{r.vitalSigns.spO2} %</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {r.treatmentPlan && (
                  <div className="mt-3 p-2 px-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
                    <strong>Treatment Plan:</strong> {r.treatmentPlan}
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {filteredPrescriptions.length === 0 ? (
            <GlassCard className="p-5 text-center text-secondary">
              No prescriptions matching your search criteria.
            </GlassCard>
          ) : (
            filteredPrescriptions.map((p) => (
              <div key={p._id} className="rx-paper-container">
                <div className="rx-watermark">Rx</div>

                {/* Prescription Pad Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-blue)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem'
                      }}
                    >
                      <RiHospitalLine />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                        {config.hospitalFullName || 'LifeCare Multi-Speciality Hospital'}
                      </h5>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Department of Clinical Medicine • Outpatient Prescription
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        Date: {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Rx ID: {p._id.substring(18).toUpperCase()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPrintModal(p)}
                      className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                      title="Print Official Pharmacy Voucher"
                    >
                      <IoPrintOutline size={15} /> Print Rx Slip
                    </button>
                  </div>
                </div>

                {/* Patient & Doctor Demographics */}
                <div className="row g-2 mb-3 p-2 rounded" style={{ backgroundColor: 'var(--light-blue)', fontSize: '0.84rem' }}>
                  <div className="col-12 col-md-6">
                    <strong>Patient:</strong> {p.patient?.name} ({p.patient?.phone || 'No Phone'})
                  </div>
                  <div className="col-12 col-md-6 text-md-end">
                    <strong>Consultant Physician:</strong> Dr. {p.doctor?.name}
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="mb-3">
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Clinical Diagnosis:
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-blue)' }}>
                    {p.diagnosis}
                  </div>
                  {p.symptoms && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Presented Symptoms: {p.symptoms}
                    </div>
                  )}
                </div>

                {/* Medication Items List */}
                <div className="custom-table-container mt-2 mb-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Prescribed Medicine</th>
                        <th style={{ width: '15%' }}>Dosage</th>
                        <th style={{ width: '25%' }}>Frequency (Regimen)</th>
                        <th style={{ width: '15%' }}>Duration</th>
                        <th style={{ width: '15%' }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.medications.map((m, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            <RiMedicineBottleLine size={16} className="text-primary me-2" />
                            {m.medicineName}
                          </td>
                          <td><strong>{m.dosage}</strong></td>
                          <td>
                            <span className="badge-status badge-status-info">
                              {m.frequency}
                            </span>
                          </td>
                          <td>{m.duration}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Advice */}
                {p.clinicalAdvice && (
                  <div className="p-3 rounded mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
                    <strong>Physician Advice:</strong> {p.clinicalAdvice}
                  </div>
                )}

                {/* Doctor Stamp & Follow-up Footer */}
                <div className="d-flex flex-wrap justify-content-between align-items-end pt-3 border-top mt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    {p.followUpDate && (
                      <span className="badge-status badge-status-warning">
                        Follow-up Scheduled: {new Date(p.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-end">
                    <div style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--primary-blue)', fontSize: '0.92rem' }}>
                      Dr. {p.doctor?.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Digitally Verified Clinical Signature
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dedicated Printable Pharmacy Prescription Modal */}
      {selectedPrintRx && (
        <Modal
          isOpen={!!selectedPrintRx}
          onClose={() => setSelectedPrintRx(null)}
          title={`Official Outpatient Prescription • #Rx-${selectedPrintRx._id.substring(18).toUpperCase()}`}
          maxWidth="720px"
        >
          {/* Printable Container */}
          <div id="rx-print-voucher" className="p-4 bg-white rounded border">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #rx-print-voucher, #rx-print-voucher * {
                  visibility: visible;
                }
                #rx-print-voucher {
                  position: fixed;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: auto;
                  margin: 0;
                  padding: 20px;
                  background: white;
                  box-shadow: none;
                  border: none;
                }
              }
            `}</style>

            {/* Letterhead */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-blue)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}
                >
                  <RiHospitalLine />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 900, color: '#0F172A', letterSpacing: '0.02em' }}>
                    {config.hospitalFullName || 'LifeCare Multi-Speciality Hospital'}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    108 Healthcare Blvd, Medical Enclave • Emergency: +91 98765 43210
                  </div>
                </div>
              </div>
              <div className="text-end">
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>PRESCRIPTION SLIP</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-blue)', fontFamily: 'monospace' }}>
                  #RX-{selectedPrintRx._id.substring(18).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Patient & Doctor Demographics */}
            <div className="row g-2 mb-3 p-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.84rem' }}>
              <div className="col-6">
                <span className="text-secondary d-block" style={{ fontSize: '0.72rem' }}>PATIENT NAME</span>
                <strong>{selectedPrintRx.patient?.name || 'Walk-in Patient'}</strong>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{selectedPrintRx.patient?.phone}</div>
              </div>
              <div className="col-6 text-end">
                <span className="text-secondary d-block" style={{ fontSize: '0.72rem' }}>ATTENDING PHYSICIAN</span>
                <strong style={{ color: 'var(--primary-blue)' }}>Dr. {selectedPrintRx.doctor?.name}</strong>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Consultant Physician</div>
              </div>
              <div className="col-6 pt-2 border-top">
                <span className="text-secondary d-block" style={{ fontSize: '0.72rem' }}>DATE OF CONSULTATION</span>
                <strong>{new Date(selectedPrintRx.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
              <div className="col-6 text-end pt-2 border-top">
                <span className="text-secondary d-block" style={{ fontSize: '0.72rem' }}>FOLLOW-UP DATE</span>
                <strong>{selectedPrintRx.followUpDate ? new Date(selectedPrintRx.followUpDate).toLocaleDateString() : 'As Advised'}</strong>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mb-3">
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                CLINICAL DIAGNOSIS & OBSERVATION:
              </span>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                {selectedPrintRx.diagnosis}
              </div>
              {selectedPrintRx.symptoms && (
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Symptoms: {selectedPrintRx.symptoms}
                </div>
              )}
            </div>

            {/* Rx Medications */}
            <div className="mb-3">
              <div className="d-flex align-items-center gap-1 mb-2">
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary-blue)', fontFamily: 'serif' }}>℞</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>PRESCRIBED MEDICINES (DISPENSING SCHEDULE)</span>
              </div>

              <table className="table table-bordered" style={{ fontSize: '0.82rem' }}>
                <thead style={{ backgroundColor: '#F1F5F9' }}>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Regimen</th>
                    <th>Duration</th>
                    <th>Directions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrintRx.medications.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{m.medicineName}</td>
                      <td>{m.dosage}</td>
                      <td><span className="badge bg-light text-dark border">{m.frequency}</span></td>
                      <td>{m.duration}</td>
                      <td style={{ color: '#475569' }}>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedPrintRx.clinicalAdvice && (
              <div className="p-2 px-3 rounded mb-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                <strong>Advice:</strong> {selectedPrintRx.clinicalAdvice}
              </div>
            )}

            {/* Signature Stamp Footer */}
            <div className="d-flex justify-content-between align-items-end pt-3 border-top">
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Valid at hospital pharmacy & partner dispensing centers.
              </div>
              <div className="text-end">
                <div style={{ fontStyle: 'italic', fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1rem' }}>
                  Dr. {selectedPrintRx.doctor?.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Authorized Medical Practitioner • Digital Verification
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex justify-content-between mt-3 pt-3 border-top">
            <button
              type="button"
              onClick={handlePrintVoucher}
              className="btn btn-primary-custom d-flex align-items-center gap-2"
              style={{ fontWeight: 700 }}
            >
              <IoPrintOutline size={18} /> Print Rx Slip
            </button>
            <button
              type="button"
              onClick={() => setSelectedPrintRx(null)}
              className="btn-secondary-custom"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Clinical Encounter Full Details Modal */}
      {selectedRecordModal && (
        <Modal
          isOpen={!!selectedRecordModal}
          onClose={() => setSelectedRecordModal(null)}
          title={`Clinical Encounter Summary • ${selectedRecordModal.recordType}`}
          maxWidth="640px"
        >
          <div className="row g-3">
            <div className="col-12">
              <div className="p-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span className="badge-status badge-status-info mb-1">{selectedRecordModal.recordType}</span>
                <h5 style={{ margin: 0, fontWeight: 800 }}>{selectedRecordModal.title}</h5>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Attending Physician: <strong>Dr. {selectedRecordModal.doctor?.name}</strong> • Recorded: {new Date(selectedRecordModal.recordedDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="col-12">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>CLINICAL CONSULTATION NOTES</span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px' }}>
                {selectedRecordModal.description}
              </p>
            </div>

            {selectedRecordModal.vitalSigns && Object.values(selectedRecordModal.vitalSigns).some(v => !!v) && (
              <div className="col-12">
                <span className="text-secondary d-block mb-1" style={{ fontSize: '0.74rem', fontWeight: 700 }}>RECORDED VITAL SIGNS</span>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(234, 243, 255, 0.7)', border: '1px solid #BFDBFE' }}>
                  <div className="row g-2" style={{ fontSize: '0.84rem' }}>
                    {selectedRecordModal.vitalSigns.bloodPressure && (
                      <div className="col-6">BP: <strong>{selectedRecordModal.vitalSigns.bloodPressure}</strong></div>
                    )}
                    {selectedRecordModal.vitalSigns.heartRate && (
                      <div className="col-6">Pulse: <strong>{selectedRecordModal.vitalSigns.heartRate} bpm</strong></div>
                    )}
                    {selectedRecordModal.vitalSigns.temperature && (
                      <div className="col-6">Temp: <strong>{selectedRecordModal.vitalSigns.temperature} °F</strong></div>
                    )}
                    {selectedRecordModal.vitalSigns.spO2 && (
                      <div className="col-6">SpO2: <strong>{selectedRecordModal.vitalSigns.spO2} %</strong></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedRecordModal.treatmentPlan && (
              <div className="col-12">
                <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>TREATMENT PLAN & REGIMEN</span>
                <div className="p-2 rounded bg-light border" style={{ fontSize: '0.84rem' }}>
                  {selectedRecordModal.treatmentPlan}
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => setSelectedRecordModal(null)}
              className="btn-secondary-custom"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientMedicalRecords;
