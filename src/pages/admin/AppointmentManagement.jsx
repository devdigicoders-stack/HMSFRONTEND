import React, { useState, useEffect } from 'react';
import { appointmentService, settingService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ActionBtn from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BookWalkInModal from '../../components/common/BookWalkInModal';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoEyeOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoMedkitOutline,
  IoPrintOutline,
  IoDownloadOutline,
  IoAddOutline,
  IoFlashOutline,
  IoCheckmarkDoneOutline,
  IoPlayOutline
} from 'react-icons/io5';

const AppointmentManagement = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Hospital settings for print slip branding
  const [hospitalSettings, setHospitalSettings] = useState(null);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    appointmentDate: '',
    start: '',
    end: ''
  });

  // Cancel with reason modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Permanent Delete modal state
  const [deleteApptModal, setDeleteApptModal] = useState(null);
  const [isDeletingAppt, setIsDeletingAppt] = useState(false);

  // Walk-in booking modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Print Token Slip modal state
  const [printAppt, setPrintAppt] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Fetch hospital settings
  const fetchSettings = async () => {
    try {
      const res = await settingService.getSettings();
      if (res.data?.settings) {
        setHospitalSettings(res.data.settings);
      }
    } catch (err) {
      // fallback
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAppointments({
        page,
        limit: 10,
        status: statusFilter,
        date: dateFilter
      });
      setAppointments(res.data.appointments || []);
      setFilteredAppointments(res.data.appointments || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch appointment schedules.', { title: 'Network Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, statusFilter, dateFilter]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Client-side search filtering over retrieved dataset
  useEffect(() => {
    if (!search.trim()) {
      setFilteredAppointments(appointments);
      return;
    }
    const term = search.toLowerCase();
    const filtered = appointments.filter((a) => {
      const patientName = a.patient?.name?.toLowerCase() || '';
      const doctorName = a.doctor?.name?.toLowerCase() || '';
      const reason = a.reasonForVisit?.toLowerCase() || '';
      const apptId = a._id?.toLowerCase() || '';
      return (
        patientName.includes(term) ||
        doctorName.includes(term) ||
        reason.includes(term) ||
        apptId.includes(term)
      );
    });
    setFilteredAppointments(filtered);
  }, [search, appointments]);

  const handleUpdateStatus = async (id, newStatus, reason = '') => {
    try {
      await appointmentService.updateStatus(id, {
        status: newStatus,
        cancellationReason: reason
      });
      toast.success(`Appointment status updated to ${newStatus}.`, {
        title: 'Status Updated'
      });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating appointment status.', {
        title: 'Update Failed'
      });
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      await appointmentService.updateStatus(selectedAppt._id, {
        status: 'Cancelled',
        cancellationReason: cancelReason || 'Cancelled by Hospital Admin'
      });
      setIsCancelModalOpen(false);
      setCancelReason('');
      toast.success('Appointment consultation cancelled successfully.', {
        title: 'Appointment Cancelled'
      });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling appointment.', {
        title: 'Cancellation Failed'
      });
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deleteApptModal) return;
    try {
      setIsDeletingAppt(true);
      await appointmentService.deleteAppointment(deleteApptModal._id);
      toast.success('Appointment deleted permanently.', { title: 'Appointment Deleted' });
      setDeleteApptModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting appointment.', {
        title: 'Delete Failed'
      });
    } finally {
      setIsDeletingAppt(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.reschedule(selectedAppt._id, {
        appointmentDate: rescheduleData.appointmentDate,
        timeSlot: { start: rescheduleData.start, end: rescheduleData.end }
      });
      setIsRescheduleOpen(false);
      toast.success('Appointment successfully rescheduled.', {
        title: 'Reschedule Confirmed'
      });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conflict: Unable to reschedule to that time slot.', {
        title: 'Reschedule Conflict'
      });
    }
  };

  const handlePrintSlip = (appt) => {
    setPrintAppt(appt);
    setIsPrintModalOpen(true);
  };

  const handleWalkInSuccess = (newAppt) => {
    fetchAppointments();
    // Open print slip immediately so reception can print or share
    if (newAppt) {
      setPrintAppt(newAppt);
      setIsPrintModalOpen(true);
    }
  };

  const handleExportCSV = () => {
    if (appointments.length === 0) {
      return toast.warning('No appointments to export.', { title: 'Export Empty' });
    }
    const headers = [
      'Token/ID',
      'Patient Name',
      'Patient Phone',
      'Physician',
      'Department',
      'Date',
      'Start Time',
      'End Time',
      'Status',
      'Reason for Visit'
    ];
    const rows = appointments.map((a) => [
      `APT-${a._id.substring(18).toUpperCase()}`,
      `"${a.patient?.name || ''}"`,
      `"${a.patient?.phone || ''}"`,
      `"Dr. ${a.doctor?.name || ''}"`,
      `"${a.doctor?.specialization || a.doctor?.department || ''}"`,
      new Date(a.appointmentDate).toLocaleDateString(),
      a.timeSlot?.start || '',
      a.timeSlot?.end || '',
      a.status,
      `"${(a.reasonForVisit || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Hospital_Appointments_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Appointments docket exported to CSV!', { title: 'Export Ready' });
  };

  const columns = [
    {
      header: 'Token / ID',
      render: (a) => (
        <div>
          <span
            className="font-monospace fw-bold"
            style={{
              fontSize: '0.8rem',
              color: '#0F172A',
              backgroundColor: '#F1F5F9',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid #CBD5E1'
            }}
          >
            #{a._id.substring(18).toUpperCase()}
          </span>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.patient?.name || 'Walk-in'}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            {a.patient?.phone || a.patient?.email || 'Registered Patient'}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Physician',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>Dr. {a.doctor?.name || 'Physician'}</div>
          <div style={{ fontSize: '0.74rem', color: '#0284C7' }}>
            {a.doctor?.specialization || 'General OPD'}
          </div>
        </div>
      )
    },
    {
      header: 'Date & Slot Window',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600 }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
          <div
            style={{
              fontSize: '0.74rem',
              color: '#059669',
              fontWeight: 700,
              fontFamily: 'monospace'
            }}
          >
            {a.timeSlot?.start} - {a.timeSlot?.end}
          </div>
        </div>
      )
    },
    {
      header: 'Reason for Visit',
      render: (a) => (
        <span
          style={{
            fontSize: '0.82rem',
            color: '#334155',
            display: 'inline-block',
            maxWidth: '180px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={a.reasonForVisit}
        >
          {a.reasonForVisit}
        </span>
      )
    },
    {
      header: 'Current Status',
      render: (a) => <StatusBadge status={a.status} />
    },
    {
      header: 'OPD Actions',
      render: (a) => (
        <div className="d-flex align-items-center gap-1 flex-wrap">
          {/* Print Slip Button on every row */}
          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
            title="Print OPD Token Slip"
            onClick={() => handlePrintSlip(a)}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              backgroundColor: '#F0FDF4',
              color: '#059669',
              borderColor: '#A7F3D0'
            }}
          >
            <IoPrintOutline size={15} /> Token Slip
          </button>

          {/* View Details */}
          <ActionBtn
            variant="view"
            label="View"
            size="sm"
            onClick={() => {
              setSelectedAppt(a);
              setIsDetailOpen(true);
            }}
          />

          {/* Quick Status Workflow Buttons */}
          {a.status === 'Pending' && (
            <button
              type="button"
              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
              title="Confirm Appointment"
              onClick={() => handleUpdateStatus(a._id, 'Confirmed')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoCheckmarkCircleOutline size={14} /> Confirm
            </button>
          )}

          {a.status === 'Confirmed' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              title="Mark Patient In Consultation"
              onClick={() => handleUpdateStatus(a._id, 'In Progress')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoPlayOutline size={14} /> In-Progress
            </button>
          )}

          {a.status === 'In Progress' && (
            <button
              type="button"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
              title="Complete Consultation"
              onClick={() => handleUpdateStatus(a._id, 'Completed')}
              style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              <IoCheckmarkDoneOutline size={14} /> Complete
            </button>
          )}

          {['Pending', 'Confirmed'].includes(a.status) && (
            <>
              <ActionBtn
                variant="edit"
                label="Reschedule"
                size="sm"
                onClick={() => {
                  setSelectedAppt(a);
                  setRescheduleData({
                    appointmentDate: new Date(a.appointmentDate).toISOString().split('T')[0],
                    start: a.timeSlot?.start || '09:00',
                    end: a.timeSlot?.end || '09:30'
                  });
                  setIsRescheduleOpen(true);
                }}
              />
              <ActionBtn
                variant="cancel"
                label="Cancel Consultation"
                size="sm"
                onClick={() => {
                  setSelectedAppt(a);
                  setCancelReason('');
                  setIsCancelModalOpen(true);
                }}
              />
            </>
          )}

          {/* Permanent Delete Action for Admin */}
          <ActionBtn
            variant="delete"
            label="Delete Appointment"
            size="sm"
            onClick={() => setDeleteApptModal(a)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Hospital OPD Appointments & Reception Desk"
        subtitle="Schedule walk-in consultations, generate printable token slips, coordinate patient queues and manage statuses"
        actionButton={
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-light border d-flex align-items-center gap-2"
              style={{ fontWeight: 600, fontSize: '0.86rem' }}
            >
              <IoDownloadOutline size={18} /> Export Docket (CSV)
            </button>

            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(true)}
              className="btn-primary-custom d-flex align-items-center gap-2"
            >
              <IoAddOutline size={20} />
              Book Walk-in OPD Consultation
            </button>
          </div>
        }
      />

      {/* Quick Status Filter Chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {[
          { key: 'All', label: 'All Appointments' },
          { key: 'Confirmed', label: 'Confirmed' },
          { key: 'Pending', label: 'Pending Review' },
          { key: 'In Progress', label: 'In Progress' },
          { key: 'Completed', label: 'Completed' },
          { key: 'Cancelled', label: 'Cancelled' }
        ].map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                setPage(1);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: isActive ? 'var(--primary-blue, #10B981)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                border: isActive ? 'none' : '1px solid #CBD5E1',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                fontWeight: 650,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <GlassCard className="mb-4">
        {/* Search & Filters */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span
                className="input-group-text bg-white border-end-0"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <IoSearchOutline color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                placeholder="Search patient name, doctor, reason, or token #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-custom border-start-0"
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="All">Status: All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <div className="d-flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="form-control-custom"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="btn btn-sm btn-light border"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredAppointments}
          loading={loading}
          emptyMessage="No consultations match your selected criteria."
        />

        {/* Pagination */}
        <div
          className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top"
          style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
        >
          <div>
            Total Consultations: <strong>{total}</strong>
          </div>
          <div className="d-flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-sm btn-light border"
            >
              Previous
            </button>
            <span className="align-self-center px-2">
              Page {page} of {Math.max(Math.ceil(total / 10), 1)}
            </span>
            <button
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
              className="btn btn-sm btn-light border"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Appointment Details: #${selectedAppt._id.substring(18).toUpperCase()}`}
          maxWidth="600px"
        >
          <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                >
                  REF ID: {selectedAppt._id}
                </span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Scheduled On: {new Date(selectedAppt.createdAt).toLocaleString()}
                </div>
              </div>
              <StatusBadge status={selectedAppt.status} />
            </div>
          </div>

          <div className="row g-3" style={{ fontSize: '0.88rem' }}>
            <div className="col-12 col-md-6">
              <label className="text-secondary d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                PATIENT
              </label>
              <strong>{selectedAppt.patient?.name}</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {selectedAppt.patient?.phone} • {selectedAppt.patient?.email}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="text-secondary d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                ATTENDING PHYSICIAN
              </label>
              <strong>Dr. {selectedAppt.doctor?.name}</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {selectedAppt.doctor?.specialization || 'General Practice'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="text-secondary d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                DATE & TIME WINDOW
              </label>
              <div>{new Date(selectedAppt.appointmentDate).toLocaleDateString()}</div>
              <strong style={{ color: '#059669', fontFamily: 'monospace' }}>
                {selectedAppt.timeSlot?.start} - {selectedAppt.timeSlot?.end}
              </strong>
            </div>

            <div className="col-12 col-md-6">
              <label className="text-secondary d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                FEE STATUS
              </label>
              <div className="text-success fw-bold">₹{selectedAppt.doctor?.consultationFee || 500} (Paid)</div>
            </div>

            <div className="col-12">
              <label className="text-secondary d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                CHIEF COMPLAINT / REASON FOR VISIT
              </label>
              <div className="p-2.5 rounded border bg-light">
                {selectedAppt.reasonForVisit || 'None recorded'}
              </div>
            </div>

            {selectedAppt.cancellationReason && (
              <div className="col-12">
                <label className="text-danger d-block" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  CANCELLATION REASON
                </label>
                <div className="p-2 rounded bg-danger-subtle text-danger" style={{ fontSize: '0.84rem' }}>
                  {selectedAppt.cancellationReason}
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              onClick={() => {
                setIsDetailOpen(false);
                handlePrintSlip(selectedAppt);
              }}
              className="btn btn-outline-success d-flex align-items-center gap-2"
              style={{ fontWeight: 650 }}
            >
              <IoPrintOutline size={16} /> Print Token Slip
            </button>

            <button
              type="button"
              onClick={() => setIsDetailOpen(false)}
              className="btn-secondary-custom"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel Reason Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Appointment"
        >
          <form onSubmit={handleCancelSubmit}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to cancel the appointment for{' '}
              <strong>{selectedAppt.patient?.name}</strong> with{' '}
              <strong>Dr. {selectedAppt.doctor?.name}</strong>?
            </p>
            <div className="mb-3">
              <label className="form-label-custom">Cancellation Reason *</label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for administrative cancellation (e.g. physician unavailable, patient requested change)..."
                className="form-control-custom"
              />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="btn-secondary-custom"
              >
                Keep Appointment
              </button>
              <button type="submit" className="btn btn-danger">
                Confirm Cancellation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {selectedAppt && (
        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          title={`Reschedule Consultation: Dr. ${selectedAppt.doctor?.name}`}
        >
          <form onSubmit={handleRescheduleSubmit}>
            <div className="mb-3">
              <label className="form-label-custom">New Consultation Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleData.appointmentDate}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, appointmentDate: e.target.value })
                }
                className="form-control-custom"
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label-custom">Start Time</label>
                <input
                  type="text"
                  required
                  placeholder="09:30"
                  value={rescheduleData.start}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, start: e.target.value })
                  }
                  className="form-control-custom"
                />
              </div>

              <div className="col-6">
                <label className="form-label-custom">End Time</label>
                <input
                  type="text"
                  required
                  placeholder="10:00"
                  value={rescheduleData.end}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, end: e.target.value })
                  }
                  className="form-control-custom"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                className="btn-secondary-custom"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary-custom">
                Confirm Reschedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================== WALK-IN OPD BOOKING MODAL ==================== */}
      <BookWalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={handleWalkInSuccess}
      />

      {/* ==================== PRINTABLE OPD TOKEN SLIP MODAL ==================== */}
      <OpdTokenSlipModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        appointment={printAppt}
        hospitalSettings={hospitalSettings}
      />

      {/* ==================== PERMANENT DELETE APPOINTMENT CONFIRMATION ==================== */}
      <ConfirmDialog
        isOpen={!!deleteApptModal}
        onClose={() => setDeleteApptModal(null)}
        onConfirm={handleDeleteAppointment}
        loading={isDeletingAppt}
        title="Permanently Delete Appointment"
        message={`Are you sure you want to permanently delete appointment #${deleteApptModal?._id?.substring(18).toUpperCase()} for patient ${deleteApptModal?.patient?.name || 'Walk-in'} with Dr. ${deleteApptModal?.doctor?.name || ''}? This will remove all associated logs and scheduling records.`}
        confirmText="Delete Appointment"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AppointmentManagement;
