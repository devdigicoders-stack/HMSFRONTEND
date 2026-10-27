import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { doctorService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import {
  MdPeople,
  MdSearch,
  MdRefresh,
  MdPerson,
  MdHistory,
  MdAssignment,
  MdWarning,
  MdLocalHospital,
  MdPhone,
  MdEmail,
  MdContactPhone,
  MdLocationOn,
  MdBiotech,
  MdAdd
} from 'react-icons/md';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Patient Details Modal
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('appointments'); // 'appointments', 'consultations', 'prescriptions'

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getPatients({
        search: searchQuery,
        page,
        limit: 12
      });
      if (res.data?.success) {
        setPatients(res.data.patients || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch assigned patient directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  // Open Patient Clinical File
  const handleViewPatientHistory = async (patientId) => {
    setSelectedPatientId(patientId);
    setIsModalOpen(true);
    setLoadingDetails(true);
    setPatientDetails(null);
    setActiveHistoryTab('appointments');

    try {
      const res = await doctorService.getPatientDetails(patientId);
      if (res.data?.success) {
        setPatientDetails(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied or error loading patient medical record.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const columns = [
    {
      header: 'Patient Profile',
      render: (p) => (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'var(--light-blue)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              overflow: 'hidden'
            }}
          >
            {(p.avatar || p.user?.avatar) ? (
              <img
                src={p.avatar || p.user?.avatar}
                alt={p.name || 'Patient'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              p.name ? p.name.charAt(0).toUpperCase() : 'P'
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {p.phone || p.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Demographics',
      render: (p) => {
        const age = calculateAge(p.profile?.dateOfBirth);
        return (
          <div style={{ fontSize: '0.8rem' }}>
            <div>
              <strong>Gender:</strong> {p.profile?.gender || 'Not Specified'}
            </div>
            <div>
              <strong>Blood:</strong> <span className="badge bg-secondary-subtle text-secondary">{p.profile?.bloodGroup || 'Unknown'}</span>
              {age !== null && <span> • {age} yrs</span>}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Consultation History',
      render: (p) => (
        <div style={{ fontSize: '0.8rem' }}>
          <div>
            <strong style={{ color: 'var(--primary-blue)' }}>{p.totalVisitsWithDoctor || 1}</strong> encounter(s) with you
          </div>
          {p.latestAppointment && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Latest: {new Date(p.latestAppointment.appointmentDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Clinical Flags',
      render: (p) => {
        const allergies = p.profile?.knownAllergies || [];
        return allergies.length > 0 ? (
          <div className="d-flex flex-wrap gap-1">
            {allergies.map((a, i) => (
              <span key={i} className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.7rem' }}>
                <MdWarning size={11} /> {a}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>No flagged allergies</span>
        );
      }
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="d-flex align-items-center gap-1">
          <button
            onClick={() => handleViewPatientHistory(p._id)}
            className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
            style={{ fontSize: '0.76rem', padding: '0.25rem 0.55rem' }}
            title="Open 360° Clinical File"
          >
            <MdHistory size={15} /> Chart
          </button>
          <Link
            to="/doctor/prescriptions"
            state={{ patientId: p._id }}
            className="btn btn-sm btn-light-custom d-flex align-items-center gap-0.5"
            style={{ fontSize: '0.74rem', padding: '0.25rem 0.5rem', color: 'var(--primary-blue)' }}
            title="Write New Prescription"
          >
            <MdAssignment size={13} /> Rx
          </Link>
          <Link
            to="/doctor/lab-requests"
            state={{ patientId: p._id }}
            className="btn btn-sm btn-light-custom d-flex align-items-center gap-0.5"
            style={{ fontSize: '0.74rem', padding: '0.25rem 0.5rem', color: '#7c3aed' }}
            title="Order Diagnostic Lab Investigation"
          >
            <MdBiotech size={13} /> Lab
          </Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Assigned Patient Clinical Directory"
        subtitle="Access medical summaries, prior encounter notes, diagnoses, and pharmacotherapy history for your assigned patients"
        actionButton={
          <button onClick={fetchPatients} className="btn-secondary-custom d-flex align-items-center gap-1">
            <MdRefresh size={17} /> Refresh List
          </button>
        }
      />

      <GlassCard>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder="Search patient by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control-custom ps-4"
                  style={{ fontSize: '0.84rem' }}
                />
                <MdSearch
                  size={18}
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-secondary"
                />
              </div>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn-primary-custom" style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}>
                Search
              </button>
            </div>
            {searchQuery && (
              <div className="col-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="btn btn-sm btn-light-custom"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </form>

        <DataTable
          columns={columns}
          data={patients}
          loading={loading}
          emptyMessage="No assigned patients found in your clinical docket. (Patients will appear here once an appointment has been booked)."
        />

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div className="d-flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-sm btn-light-custom"
              >
                &larr; Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-sm btn-light-custom"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Patient Detailed Medical History Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={patientDetails?.patient?.name ? `Patient Clinical File: ${patientDetails.patient.name}` : 'Patient Clinical File'}
        maxWidth="820px"
      >
        {loadingDetails ? (
          <div className="p-5 text-center">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Retrieving authorized electronic medical records and clinical history...
            </div>
          </div>
        ) : patientDetails ? (
          <div>
            {/* Demographics & Clinical Summary Banner */}
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--light-blue)', border: '1px solid #bfdbfe' }}>
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {patientDetails.patient?.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <MdPhone /> {patientDetails.patient?.phone || 'No Phone'} • <MdEmail /> {patientDetails.patient?.email}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <MdLocationOn /> {patientDetails.profile?.address || 'Address not recorded'}
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    DEMOGRAPHICS
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    {patientDetails.profile?.gender || 'Not Specified'} • {calculateAge(patientDetails.profile?.dateOfBirth) || 'N/A'} yrs
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                    Blood Group: {patientDetails.profile?.bloodGroup || 'Unknown'}
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    EMERGENCY CONTACT
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {patientDetails.profile?.emergencyContact?.name || 'None listed'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {patientDetails.profile?.emergencyContact?.phone || ''}
                  </div>
                </div>
              </div>

              {/* Allergies and Chronic Conditions */}
              {(patientDetails.profile?.knownAllergies?.length > 0 || patientDetails.profile?.chronicConditions?.length > 0) && (
                <div className="mt-2 pt-2 border-top d-flex flex-wrap gap-2 align-items-center" style={{ borderColor: '#bfdbfe' }}>
                  {patientDetails.profile?.knownAllergies?.map((a, i) => (
                    <span key={i} className="badge bg-danger text-white" style={{ fontSize: '0.72rem' }}>
                      Allergy: {a}
                    </span>
                  ))}
                  {patientDetails.profile?.chronicConditions?.map((c, i) => (
                    <span key={i} className="badge bg-warning text-dark" style={{ fontSize: '0.72rem' }}>
                      Chronic: {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-tabs within Clinical File */}
            <div className="d-flex gap-2 border-bottom pb-2 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setActiveHistoryTab('appointments')}
                className={`btn btn-sm ${activeHistoryTab === 'appointments' ? 'btn-primary-custom' : 'btn-light-custom'}`}
                style={{ fontSize: '0.8rem' }}
              >
                Encounters ({patientDetails.appointments?.length || 0})
              </button>
              <button
                onClick={() => setActiveHistoryTab('consultations')}
                className={`btn btn-sm ${activeHistoryTab === 'consultations' ? 'btn-primary-custom' : 'btn-light-custom'}`}
                style={{ fontSize: '0.8rem' }}
              >
                Consultation Records ({patientDetails.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveHistoryTab('prescriptions')}
                className={`btn btn-sm ${activeHistoryTab === 'prescriptions' ? 'btn-primary-custom' : 'btn-light-custom'}`}
                style={{ fontSize: '0.8rem' }}
              >
                Prescriptions ({patientDetails.prescriptions?.length || 0})
              </button>
            </div>

            {/* TAB 1: Appointments History */}
            {activeHistoryTab === 'appointments' && (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Consultation Date</th>
                      <th>Time Slot</th>
                      <th>Chief Complaint</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patientDetails.appointments || []).length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-3 text-secondary">No encounters on file.</td></tr>
                    ) : (
                      patientDetails.appointments.map((a) => (
                        <tr key={a._id}>
                          <td style={{ fontWeight: 600 }}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                          <td style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{a.timeSlot?.start} - {a.timeSlot?.end}</td>
                          <td>{a.reasonForVisit}</td>
                          <td><StatusBadge status={a.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Clinical Consultation Records & Vitals */}
            {activeHistoryTab === 'consultations' && (
              <div className="d-flex flex-column gap-3">
                {(patientDetails.medicalRecords || []).length === 0 ? (
                  <div className="text-center py-4 text-secondary">No recorded consultation notes found.</div>
                ) : (
                  patientDetails.medicalRecords.map((rec) => (
                    <div key={rec._id} className="p-3 rounded border" style={{ backgroundColor: '#ffffff' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>
                            {rec.title || rec.diagnosis || 'Clinical Consultation'}
                          </strong>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Recorded: {new Date(rec.recordedDate || rec.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.72rem' }}>
                          {rec.recordType}
                        </span>
                      </div>

                      {/* Vitals pill */}
                      {rec.vitalSigns && Object.values(rec.vitalSigns).some(Boolean) && (
                        <div className="p-2 mb-2 rounded" style={{ backgroundColor: '#f1f5f9', fontSize: '0.78rem' }}>
                          <strong>Vitals:</strong> BP: {rec.vitalSigns.bloodPressure || 'N/A'} • Pulse: {rec.vitalSigns.heartRate || 'N/A'} • Temp: {rec.vitalSigns.temperature || 'N/A'} • SpO2: {rec.vitalSigns.spO2 || 'N/A'}
                        </div>
                      )}

                      {rec.diagnosis && (
                        <div style={{ fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                          <strong>Diagnosis:</strong> {rec.diagnosis}
                        </div>
                      )}

                      {rec.description && (
                        <div style={{ fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                          <strong>Findings / Exam:</strong> {rec.description}
                        </div>
                      )}

                      {rec.treatmentPlan && (
                        <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                          <strong>Plan / Advice:</strong> {rec.treatmentPlan}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: Prescriptions */}
            {activeHistoryTab === 'prescriptions' && (
              <div className="d-flex flex-column gap-3">
                {(patientDetails.prescriptions || []).length === 0 ? (
                  <div className="text-center py-4 text-secondary">No prescriptions issued for this patient.</div>
                ) : (
                  patientDetails.prescriptions.map((rx) => (
                    <div key={rx._id} className="p-3 rounded border" style={{ backgroundColor: '#ffffff' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong style={{ color: 'var(--primary-blue)', fontSize: '0.9rem' }}>
                          Diagnosis: {rx.diagnosis}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="custom-table-container mb-2">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rx.medications.map((m, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 700 }}>{m.medicineName}</td>
                                <td>{m.dosage}</td>
                                <td>{m.frequency}</td>
                                <td>{m.duration}</td>
                                <td>{m.instructions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {rx.clinicalAdvice && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <strong>Clinical Advice:</strong> {rx.clinicalAdvice}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/doctor/prescriptions', { state: { patientId: patientDetails.patient._id } });
                  }}
                  className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                >
                  <MdAssignment size={15} /> Write Prescription
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/doctor/lab-requests', { state: { patientId: patientDetails.patient._id } });
                  }}
                  className="btn btn-sm btn-light-custom d-flex align-items-center gap-1"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', color: '#7c3aed' }}
                >
                  <MdBiotech size={15} /> Order Lab Test
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary-custom"
                style={{ fontSize: '0.82rem' }}
              >
                Close Clinical File
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default DoctorPatients;
