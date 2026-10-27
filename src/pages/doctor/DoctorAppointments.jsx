import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { appointmentService, medicalRecordService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';
import {
  MdEventNote,
  MdPlayCircleFilled,
  MdCheckCircle,
  MdCancel,
  MdSearch,
  MdInfoOutline,
  MdAssignment,
  MdAccessTime,
  MdRefresh,
  MdLocationOn,
  MdBiotech,
  MdPrint
} from 'react-icons/md';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'upcoming', 'past'
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isTokenSlipModalOpen, setIsTokenSlipModalOpen] = useState(false);

  // Consultation Record Modal
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationData, setConsultationData] = useState({
    diagnosis: '',
    symptoms: '',
    clinicalObservations: '',
    treatmentPlan: '',
    doctorNotes: '',
    followUpDate: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    spO2: '',
    weight: '',
    height: ''
  });
  const [submittingConsultation, setSubmittingConsultation] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAppointments({
        status: statusFilter,
        date: dateFilter,
        limit: 100
      });
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      toast.error('Failed to fetch assigned clinical appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  // Tab Filtering (Today, Upcoming, Past)
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments.filter((a) => {
      const apptDate = new Date(a.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);

      // Tab match
      if (activeTab === 'today') {
        if (apptDate.getTime() !== today.getTime()) return false;
      } else if (activeTab === 'upcoming') {
        if (apptDate < today || a.status === 'Completed' || a.status === 'Cancelled') return false;
      } else if (activeTab === 'past') {
        if (apptDate >= today && a.status !== 'Completed' && a.status !== 'Cancelled') return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ptName = a.patient?.name?.toLowerCase() || '';
        const ptEmail = a.patient?.email?.toLowerCase() || '';
        const ptPhone = a.patient?.phone?.toLowerCase() || '';
        const reason = a.reasonForVisit?.toLowerCase() || '';
        if (!ptName.includes(query) && !ptEmail.includes(query) && !ptPhone.includes(query) && !reason.includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  // Workflow Action: Transition to In Progress
  const handleStartConsultation = async (appt) => {
    try {
      await appointmentService.updateStatus(appt._id, { status: 'In Progress' });
      toast.success(`Consultation for ${appt.patient?.name || 'patient'} is now In Progress.`);
      fetchAppointments();

      // Open consultation chart modal directly
      setSelectedAppt(appt);
      setConsultationData({
        diagnosis: '',
        symptoms: appt.reasonForVisit || '',
        clinicalObservations: '',
        treatmentPlan: '',
        doctorNotes: '',
        followUpDate: '',
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        spO2: '',
        weight: '',
        height: ''
      });
      setIsConsultationModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error initiating consultation.', {
        title: 'Initiate Failed'
      });
    }
  };

  // Workflow Action: Open Consultation Form
  const handleOpenConsultationModal = (appt) => {
    setSelectedAppt(appt);
    setConsultationData({
      diagnosis: '',
      symptoms: appt.reasonForVisit || '',
      clinicalObservations: '',
      treatmentPlan: '',
      doctorNotes: '',
      followUpDate: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      spO2: '',
      weight: '',
      height: ''
    });
    setIsConsultationModalOpen(true);
  };

  // Submit Consultation Record & Complete Visit
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!consultationData.diagnosis.trim()) {
      return setError('Primary diagnosis is required to complete consultation.');
    }

    setSubmittingConsultation(true);
    try {
      await medicalRecordService.createRecord({
        patientId: selectedAppt.patient._id,
        appointmentId: selectedAppt._id,
        recordType: 'Consultation',
        title: `Outpatient Consultation: ${consultationData.diagnosis}`,
        description: consultationData.clinicalObservations || `Clinical consultation for ${selectedAppt.reasonForVisit}`,
        symptoms: consultationData.symptoms,
        clinicalObservations: consultationData.clinicalObservations,
        diagnosis: consultationData.diagnosis,
        vitalSigns: {
          bloodPressure: consultationData.bloodPressure,
          heartRate: consultationData.heartRate,
          temperature: consultationData.temperature,
          spO2: consultationData.spO2,
          weight: consultationData.weight,
          height: consultationData.height
        },
        treatmentPlan: consultationData.treatmentPlan,
        doctorNotes: consultationData.doctorNotes,
        followUpDate: consultationData.followUpDate || null
      });

      setIsConsultationModalOpen(false);
      setSuccessMsg('Clinical consultation record saved & encounter marked as Completed.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save consultation chart.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSubmittingConsultation(false);
    }
  };

  // Workflow Action: Cancel Appointment
  const handleConfirmCancel = async () => {
    if (!selectedAppt) return;
    try {
      await appointmentService.updateStatus(selectedAppt._id, {
        status: 'Cancelled',
        cancellationReason: cancelReason || 'Cancelled by attending physician.'
      });
      setIsCancelModalOpen(false);
      setCancelReason('');
      setSuccessMsg('Appointment cancelled in compliance with hospital protocol.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const columns = [
    {
      header: 'Patient Details',
      render: (a) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36,
              height: 36,
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
            {a.patient?.avatar ? (
              <img
                src={a.patient.avatar}
                alt={a.patient?.name || 'Patient'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              a.patient?.name ? a.patient.name.charAt(0).toUpperCase() : 'P'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {a.patient?.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {a.patient?.phone || a.patient?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Scheduled Slot',
      render: (a) => {
        const isToday = new Date(a.appointmentDate).toDateString() === new Date().toDateString();
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
              {new Date(a.appointmentDate).toLocaleDateString()}
              {isToday && (
                <span className="badge ms-1" style={{ backgroundColor: 'var(--primary-blue)', fontSize: '0.66rem' }}>
                  TODAY
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
              {a.timeSlot?.start} - {a.timeSlot?.end}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Chief Complaint',
      render: (a) => (
        <div style={{ maxWidth: 220, fontSize: '0.82rem', color: 'var(--text-main)' }}>
          {a.reasonForVisit}
        </div>
      )
    },
    {
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} />
    },
    {
      header: 'Encounter Actions',
      render: (a) => {
        const isCompleted = a.status === 'Completed';
        const isCancelled = a.status === 'Cancelled' || a.status === 'Rejected';
        const isInProgress = a.status === 'In Progress';
        const isReady = a.status === 'Confirmed' || a.status === 'Pending';

        return (
          <div className="d-flex align-items-center gap-1.5">
            {/* Ready to Start */}
            {isReady && (
              <ActionBtn
                variant="start"
                label="Start Visit"
                size="xs"
                onClick={() => handleStartConsultation(a)}
              />
            )}

            {/* In Progress */}
            {isInProgress && (
              <ActionBtn
                variant="success"
                label="Resume Chart"
                size="xs"
                onClick={() => handleOpenConsultationModal(a)}
              />
            )}

            {/* View Details Modal Button */}
            <ActionBtn
              variant="view"
              label="Details"
              size="xs"
              onClick={() => {
                setSelectedAppt(a);
                setIsDetailModalOpen(true);
              }}
            />

            {/* Token Slip Print Shortcut */}
            <button
              type="button"
              onClick={() => {
                setSelectedAppt(a);
                setIsTokenSlipModalOpen(true);
              }}
              className="btn btn-sm btn-light-custom d-flex align-items-center gap-1"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
              title="Print OPD Token Slip"
            >
              <MdPrint size={14} /> Slip
            </button>

            {/* Cancel Button (Only if not completed or already cancelled) */}
            {!isCompleted && !isCancelled && (
              <ActionBtn
                variant="cancel"
                label="Cancel"
                size="xs"
                onClick={() => {
                  setSelectedAppt(a);
                  setIsCancelModalOpen(true);
                }}
              />
            )}

            {isCompleted && (
              <div className="d-flex align-items-center gap-1">
                <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded-md">
                  ✓ Discharged
                </span>
                <Link
                  to="/doctor/prescriptions"
                  state={{ patientId: a.patient?._id, appointmentId: a._id }}
                  className="btn btn-sm btn-outline-primary py-0 px-1.5"
                  style={{ fontSize: '0.72rem' }}
                  title="Write Prescription"
                >
                  <MdAssignment size={13} /> Rx
                </Link>
                <Link
                  to="/doctor/lab-requests"
                  state={{ patientId: a.patient?._id }}
                  className="btn btn-sm btn-outline-purple py-0 px-1.5"
                  style={{ fontSize: '0.72rem', color: '#7c3aed', borderColor: '#c4b5fd' }}
                  title="Order Lab Test"
                >
                  <MdBiotech size={13} /> Lab
                </Link>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  const filteredData = getFilteredAppointments();

  return (
    <div>
      <PageHeader
        title="Physician Appointment Schedule"
        subtitle="Manage outpatient consultation queue, document clinical encounters, and enforce status workflow"
        actionButton={
          <button onClick={fetchAppointments} className="btn-secondary-custom d-flex align-items-center gap-1">
            <MdRefresh size={17} /> Refresh Schedule
          </button>
        }
      />

      <GlassCard>
        {/* Schedule Tabs */}
        <div className="d-flex flex-wrap gap-2 border-bottom pb-3 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary-custom' : 'btn-light-custom'}`}
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            All Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`btn btn-sm ${activeTab === 'today' ? 'btn-primary-custom' : 'btn-light-custom'}`}
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary-custom' : 'btn-light-custom'}`}
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Upcoming Visits
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`btn btn-sm ${activeTab === 'past' ? 'btn-primary-custom' : 'btn-light-custom'}`}
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Past Encounters
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search by patient name, phone, or complaint..."
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

          <div className="col-6 col-md-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select-custom"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-control-custom"
              style={{ fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Appointments Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="No assigned appointments found matching the specified parameters."
        />
      </GlassCard>

      {/* 1. Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Clinical Appointment Particulars"
          maxWidth="600px"
        >
          <div className="p-2">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  APPOINTMENT REFERENCE ID
                </span>
                <div style={{ fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1rem' }}>
                  #{selectedAppt._id}
                </div>
              </div>
              <StatusBadge status={selectedAppt.status} />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Patient Name</label>
                <div style={{ fontWeight: 700 }}>{selectedAppt.patient?.name}</div>
              </div>
              <div className="col-6">
                <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Contact Phone</label>
                <div style={{ fontWeight: 700 }}>{selectedAppt.patient?.phone || 'Not Provided'}</div>
              </div>
              <div className="col-6">
                <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Scheduled Date</label>
                <div style={{ fontWeight: 600 }}>{new Date(selectedAppt.appointmentDate).toLocaleDateString()}</div>
              </div>
              <div className="col-6">
                <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Time Slot</label>
                <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                  {selectedAppt.timeSlot?.start} - {selectedAppt.timeSlot?.end}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Chief Complaint / Reason for Visit</label>
                <div className="p-2 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  {selectedAppt.reasonForVisit}
                </div>
              </div>
              {selectedAppt.notes && (
                <div className="col-12">
                  <label className="form-label-custom" style={{ fontSize: '0.75rem' }}>Clinical Notes</label>
                  <div className="p-2 rounded" style={{ backgroundColor: 'var(--light-blue)', fontSize: '0.85rem' }}>
                    {selectedAppt.notes}
                  </div>
                </div>
              )}
              {selectedAppt.cancellationReason && (
                <div className="col-12">
                  <label className="form-label-custom" style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Cancellation Justification</label>
                  <div className="p-2 rounded bg-danger-subtle text-danger" style={{ fontSize: '0.85rem' }}>
                    {selectedAppt.cancellationReason}
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-secondary-custom"
              >
                Close Particulars
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Comprehensive Clinical Consultation Form Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isConsultationModalOpen}
          onClose={() => setIsConsultationModalOpen(false)}
          title={`Clinical Encounter: ${selectedAppt.patient?.name}`}
          maxWidth="750px"
        >
          <form onSubmit={handleSaveConsultation}>
            {/* Header info badge */}
            <div className="p-2 mb-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--light-blue)', border: '1px solid #bfdbfe' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chief Complaint: </span>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{selectedAppt.reasonForVisit}</strong>
              </div>
              <span className="badge" style={{ backgroundColor: 'var(--primary-blue)', fontSize: '0.7rem' }}>
                {selectedAppt.timeSlot?.start} - {selectedAppt.timeSlot?.end}
              </span>
            </div>

            {/* Vitals Strip */}
            <div className="p-3 mb-3 rounded border" style={{ backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Patient Vital Signs
              </div>
              <div className="row g-2">
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Blood Pressure</label>
                  <input
                    type="text"
                    value={consultationData.bloodPressure}
                    onChange={(e) => setConsultationData({ ...consultationData, bloodPressure: e.target.value })}
                    placeholder="120/80 mmHg"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Heart Rate</label>
                  <input
                    type="text"
                    value={consultationData.heartRate}
                    onChange={(e) => setConsultationData({ ...consultationData, heartRate: e.target.value })}
                    placeholder="72 bpm"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Temperature</label>
                  <input
                    type="text"
                    value={consultationData.temperature}
                    onChange={(e) => setConsultationData({ ...consultationData, temperature: e.target.value })}
                    placeholder="98.6 F"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>SpO2 (%)</label>
                  <input
                    type="text"
                    value={consultationData.spO2}
                    onChange={(e) => setConsultationData({ ...consultationData, spO2: e.target.value })}
                    placeholder="99%"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Weight (kg)</label>
                  <input
                    type="text"
                    value={consultationData.weight}
                    onChange={(e) => setConsultationData({ ...consultationData, weight: e.target.value })}
                    placeholder="70 kg"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label-custom" style={{ fontSize: '0.72rem' }}>Height (cm)</label>
                  <input
                    type="text"
                    value={consultationData.height}
                    onChange={(e) => setConsultationData({ ...consultationData, height: e.target.value })}
                    placeholder="175 cm"
                    className="form-control-custom"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis & Symptoms */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Primary Clinical Diagnosis <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={consultationData.diagnosis}
                  onChange={(e) => setConsultationData({ ...consultationData, diagnosis: e.target.value })}
                  placeholder="e.g. Acute Pharyngitis, Essential Hypertension"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Symptoms & Duration</label>
                <input
                  type="text"
                  value={consultationData.symptoms}
                  onChange={(e) => setConsultationData({ ...consultationData, symptoms: e.target.value })}
                  placeholder="e.g. Throat irritation x 3 days, mild fever"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Clinical Observations & Physical Exam</label>
                <textarea
                  rows={2}
                  value={consultationData.clinicalObservations}
                  onChange={(e) => setConsultationData({ ...consultationData, clinicalObservations: e.target.value })}
                  placeholder="Systemic examination findings, chest auscultation, throat inspection..."
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label-custom">Treatment Plan & Medical Recommendations</label>
                <textarea
                  rows={2}
                  value={consultationData.treatmentPlan}
                  onChange={(e) => setConsultationData({ ...consultationData, treatmentPlan: e.target.value })}
                  placeholder="Therapy regimen, lifestyle & dietary advice, hydration protocol..."
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label-custom">Follow-up Date</label>
                <input
                  type="date"
                  value={consultationData.followUpDate}
                  onChange={(e) => setConsultationData({ ...consultationData, followUpDate: e.target.value })}
                  className="form-control-custom"
                />
              </div>

              <div className="col-12">
                <label className="form-label-custom">Doctor's Confidential Notes</label>
                <input
                  type="text"
                  value={consultationData.doctorNotes}
                  onChange={(e) => setConsultationData({ ...consultationData, doctorNotes: e.target.value })}
                  placeholder="Internal physician remarks or next visit reminders..."
                  className="form-control-custom"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsConsultationModalOpen(false)}
                className="btn-secondary-custom"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingConsultation}
                className="btn-primary-custom d-flex align-items-center gap-1"
              >
                <MdCheckCircle size={18} />
                {submittingConsultation ? 'Saving Chart...' : 'Save Chart & Complete Visit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Cancel Appointment Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Clinical Consultation"
          maxWidth="500px"
        >
          <div className="p-2">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              Are you sure you want to cancel the appointment for <strong>{selectedAppt.patient?.name}</strong> on {new Date(selectedAppt.appointmentDate).toLocaleDateString()} at {selectedAppt.timeSlot?.start}?
            </p>

            <div className="mb-3">
              <label className="form-label-custom">Reason for Cancellation <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Physician emergency / rescheduling required / patient requested cancellation..."
                className="form-control-custom"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="btn-secondary-custom"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn-danger-custom"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. OPD Token Slip Print Modal */}
      {selectedAppt && (
        <OpdTokenSlipModal
          isOpen={isTokenSlipModalOpen}
          onClose={() => setIsTokenSlipModalOpen(false)}
          appointment={selectedAppt}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;
