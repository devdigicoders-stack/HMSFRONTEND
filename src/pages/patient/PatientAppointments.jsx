import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoPrintOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
  IoRefreshOutline,
  IoMedkitOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline
} from 'react-icons/io5';

const PatientAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled' | 'all'
  const [search, setSearch] = useState('');

  // Modals
  const [cancelTargetAppt, setCancelTargetAppt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedTokenAppt, setSelectedTokenAppt] = useState(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedDetailsAppt, setSelectedDetailsAppt] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAppointments({ limit: 100 });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      toast.error('Failed to load your medical consultations. Please refresh.', {
        title: 'Network Error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancelTargetAppt) return;
    try {
      await appointmentService.updateStatus(cancelTargetAppt._id, {
        status: 'Cancelled',
        cancellationReason: cancellationReason.trim() || 'Cancelled by patient from portal.'
      });
      toast.success('Your scheduled visit has been cancelled.', {
        title: 'Appointment Cancelled'
      });
      setCancelTargetAppt(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel appointment.', {
        title: 'Cancellation Notice'
      });
    }
  };

  const handleOpenTokenSlip = (appt) => {
    setSelectedTokenAppt(appt);
    setIsTokenModalOpen(true);
  };

  const handleOpenDetails = (appt) => {
    setSelectedDetailsAppt(appt);
    setIsDetailsModalOpen(true);
  };

  const handleBookAgain = (doctorId) => {
    if (doctorId) {
      navigate(`/patient/book?doctorId=${doctorId}`);
    } else {
      navigate('/patient/book');
    }
  };

  // Filter appointments according to active tab and search query
  const today = new Date().setHours(0, 0, 0, 0);

  const upcomingList = appointments.filter(
    (a) => ['Pending', 'Confirmed', 'In Progress'].includes(a.status) && new Date(a.appointmentDate) >= today
  );
  const completedList = appointments.filter((a) => a.status === 'Completed');
  const cancelledList = appointments.filter((a) => ['Cancelled', 'Rejected'].includes(a.status));

  const getFilteredList = () => {
    let baseList = appointments;
    if (activeTab === 'upcoming') baseList = upcomingList;
    else if (activeTab === 'completed') baseList = completedList;
    else if (activeTab === 'cancelled') baseList = cancelledList;

    if (!search.trim()) return baseList;
    const term = search.toLowerCase();
    return baseList.filter(
      (a) =>
        a.doctor?.name?.toLowerCase().includes(term) ||
        a.reasonForVisit?.toLowerCase().includes(term) ||
        a._id?.toLowerCase().includes(term)
    );
  };

  const filteredAppointments = getFilteredList();

  const columns = [
    {
      header: 'Reference & Date',
      render: (a) => (
        <div>
          <div className="d-flex align-items-center gap-1 mb-1">
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'var(--light-blue)',
                color: 'var(--primary-blue)',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px'
              }}
            >
              #OPD-{a._id.substring(18).toUpperCase()}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
            {new Date(a.appointmentDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.74rem', color: 'var(--primary-green)', fontWeight: 600 }}>
            <IoTimeOutline size={13} /> {a.timeSlot?.start} - {a.timeSlot?.end}
          </div>
        </div>
      )
    },
    {
      header: 'Consultant Physician',
      render: (a) => (
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
              fontSize: '1.15rem',
              flexShrink: 0
            }}
          >
            <IoMedkitOutline />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Dr. {a.doctor?.name || 'Physician'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Phone: {a.doctor?.phone || 'Reception Desk'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Reason for Visit',
      render: (a) => (
        <div style={{ maxWidth: 220 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }} className="text-truncate" title={a.reasonForVisit}>
            {a.reasonForVisit}
          </div>
          {a.notes && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }} className="text-truncate">
              Note: {a.notes}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Visit Status',
      render: (a) => <StatusBadge status={a.status} />
    },
    {
      header: 'Care Actions',
      render: (a) => {
        const canCancel = ['Pending', 'Confirmed'].includes(a.status);
        return (
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenDetails(a)}
              className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
              style={{ fontSize: '0.74rem', padding: '0.22rem 0.5rem', fontWeight: 600 }}
              title="View Complete Visit Dossier"
            >
              <IoEyeOutline size={14} /> Details
            </button>

            {['Pending', 'Confirmed'].includes(a.status) && (
              <button
                type="button"
                onClick={() => handleOpenTokenSlip(a)}
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.5rem', fontWeight: 600 }}
                title="View & Print Official OPD Token Slip"
              >
                <IoPrintOutline size={14} /> Token Slip
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  setCancellationReason('');
                  setCancelTargetAppt(a);
                }}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.5rem', fontWeight: 600 }}
                title="Cancel Appointment"
              >
                <IoCloseCircleOutline size={14} /> Cancel
              </button>
            )}

            {['Completed', 'Cancelled'].includes(a.status) && (
              <button
                type="button"
                onClick={() => handleBookAgain(a.doctor?._id)}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.5rem', fontWeight: 600 }}
                title="Schedule Follow-up with this doctor"
              >
                <IoCalendarOutline size={13} /> Book Again
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="My Medical Appointments"
        subtitle="Review active OPD bookings, print clinical consultation token slips, and inspect complete appointment records"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchAppointments}
              className="btn btn-secondary-custom d-flex align-items-center gap-1"
              disabled={loading}
              title="Refresh Appointments"
            >
              <IoRefreshOutline size={17} className={loading ? 'spin-animation' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
            <Link to="/patient/book" className="btn-primary-custom d-flex align-items-center gap-2">
              <IoCalendarOutline size={16} /> Schedule New Visit
            </Link>
          </div>
        }
      />

      {/* Status Filter Navigation Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={activeTab === 'upcoming' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.84rem', fontWeight: 650 }}
        >
          Upcoming Visits ({upcomingList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={activeTab === 'completed' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.84rem', fontWeight: 650 }}
        >
          Completed Encounters ({completedList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={activeTab === 'cancelled' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.84rem', fontWeight: 650 }}
        >
          Cancelled ({cancelledList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.84rem', fontWeight: 650 }}
        >
          All Appointments ({appointments.length})
        </button>
      </div>

      <GlassCard>
        {/* Search Input Bar */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoSearchOutline color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder="Search by doctor name or visit reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-custom border-start-0"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredAppointments}
          loading={loading}
          emptyMessage={
            activeTab === 'upcoming'
              ? 'You have no active upcoming appointments scheduled. Need care? Click "Schedule New Visit".'
              : 'No appointments match the selected filter.'
          }
        />
      </GlassCard>

      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        appointment={selectedTokenAppt}
      />

      {/* 360° Appointment Details Dossier Modal */}
      {selectedDetailsAppt && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Clinical Encounter Dossier • #OPD-${selectedDetailsAppt._id.substring(18).toUpperCase()}`}
          maxWidth="640px"
        >
          <div className="row g-3">
            {/* Header Status & Doctor */}
            <div className="col-12">
              <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '10px',
                      backgroundColor: 'var(--light-blue)',
                      color: 'var(--primary-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    <IoMedkitOutline />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontWeight: 800 }}>Dr. {selectedDetailsAppt.doctor?.name || 'Physician'}</h5>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {selectedDetailsAppt.doctor?.email} • {selectedDetailsAppt.doctor?.phone || 'Hospital Phone'}
                    </div>
                  </div>
                </div>
                <StatusBadge status={selectedDetailsAppt.status} />
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="col-12 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                SCHEDULED DATE
              </span>
              <strong style={{ fontSize: '0.92rem' }}>
                {new Date(selectedDetailsAppt.appointmentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </strong>
            </div>

            <div className="col-12 col-md-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                CONSULTATION WINDOW
              </span>
              <strong style={{ fontSize: '0.92rem', color: 'var(--primary-blue)' }}>
                {selectedDetailsAppt.timeSlot?.start} - {selectedDetailsAppt.timeSlot?.end}
              </strong>
            </div>

            <div className="col-12">
              <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                CHIEF COMPLAINT / REASON FOR VISIT
              </span>
              <div className="p-2 rounded bg-light border mt-1" style={{ fontSize: '0.86rem' }}>
                {selectedDetailsAppt.reasonForVisit}
              </div>
            </div>

            {selectedDetailsAppt.notes && (
              <div className="col-12">
                <span className="text-secondary d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                  ADDITIONAL PATIENT REMARKS
                </span>
                <div className="p-2 rounded bg-light border mt-1" style={{ fontSize: '0.84rem' }}>
                  {selectedDetailsAppt.notes}
                </div>
              </div>
            )}

            {selectedDetailsAppt.cancellationReason && (
              <div className="col-12">
                <span className="text-danger d-block" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                  CANCELLATION REASON
                </span>
                <div className="p-2 rounded mt-1" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.84rem' }}>
                  {selectedDetailsAppt.cancellationReason}
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            {['Pending', 'Confirmed'].includes(selectedDetailsAppt.status) ? (
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenTokenSlip(selectedDetailsAppt);
                }}
                className="btn btn-primary-custom d-flex align-items-center gap-1"
                style={{ fontSize: '0.82rem' }}
              >
                <IoPrintOutline size={16} /> Print Token Slip
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
              className="btn-secondary-custom"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Appointment Cancellation Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!cancelTargetAppt}
        onClose={() => {
          setCancelTargetAppt(null);
          setCancellationReason('');
        }}
        onConfirm={handleCancelAppointment}
        title="Cancel Scheduled Appointment"
        message={`Are you sure you want to cancel your appointment with Dr. ${cancelTargetAppt?.doctor?.name || 'the physician'} on ${cancelTargetAppt ? new Date(cancelTargetAppt.appointmentDate).toLocaleDateString() : ''}?`}
        confirmText="Yes, Cancel Appointment"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PatientAppointments;
