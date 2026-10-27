import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { doctorService, authService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  MdSchedule,
  MdCheck,
  MdDeleteOutline,
  MdAdd,
  MdInfoOutline,
  MdAccessTime,
  MdCalendarToday,
  MdWarning
} from 'react-icons/md';

const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const slotDurationOptions = [15, 20, 30, 45, 60];

const DoctorSchedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [availableDays, setAvailableDays] = useState([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' });
  const [slotDuration, setSlotDuration] = useState(30);
  const [breakTimes, setBreakTimes] = useState({ enabled: true, start: '13:00', end: '14:00' });
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [newDateInput, setNewDateInput] = useState('');
  const [dateToDelete, setDateToDelete] = useState(null);
  const [maxPerDay, setMaxPerDay] = useState(25);
  const [roomNumber, setRoomNumber] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getMe();
      const p = res.data?.profile || {};
      setProfile(p);
      setAvailableDays(p.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
      setWorkingHours(p.workingHours || { start: '09:00', end: '17:00' });
      setSlotDuration(p.slotDuration || 30);
      setBreakTimes(p.breakTimes || { enabled: true, start: '13:00', end: '14:00' });
      setUnavailableDates(p.unavailableDates || []);
      setMaxPerDay(p.maxAppointmentsPerDay || 25);
      setRoomNumber(p.roomNumber || '');
      setIsAvailable(p.isAvailable !== false);
    } catch (err) {
      setError('Failed to fetch physician operational schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      if (availableDays.length <= 1) {
        return setError('You must configure at least one active working day in the clinic.');
      }
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleAddUnavailableDate = () => {
    if (!newDateInput) return;
    if (unavailableDates.includes(newDateInput)) {
      return setError('This date is already marked as unavailable.');
    }
    setUnavailableDates([...unavailableDates, newDateInput]);
    setNewDateInput('');
  };

  const handleRemoveUnavailableDate = (dateToRemove) => {
    setUnavailableDates(unavailableDates.filter(d => d !== dateToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    // Validate working hours
    if (workingHours.start >= workingHours.end) {
      setSaving(false);
      return toast.warning('Shift start time must be earlier than shift end time.');
    }

    // Validate break times
    if (breakTimes.enabled) {
      if (breakTimes.start >= breakTimes.end) {
        setSaving(false);
        return toast.warning('Break start time must be earlier than break end time.');
      }
      if (breakTimes.start < workingHours.start || breakTimes.end > workingHours.end) {
        setSaving(false);
        return toast.warning('Break hours must fall within your scheduled shift working hours.');
      }
    }

    try {
      await doctorService.updateProfile(user.id, {
        availableDays,
        workingHours,
        slotDuration: Number(slotDuration),
        breakTimes,
        unavailableDates,
        maxAppointmentsPerDay: Number(maxPerDay),
        roomNumber,
        isAvailable
      });

      toast.success('Operational availability, slot intervals, and leave dates updated successfully.', {
        title: 'Schedule Updated'
      });
      fetchSchedule();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating schedule availability.', {
        title: 'Update Failed'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading schedule configuration...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Physician Availability & Schedule Management"
        subtitle="Configure consultation operating hours, appointment slot intervals, break periods, and scheduled leave dates"
      />

      <div className="row g-4">
        {/* Main Settings Form */}
        <div className="col-12 col-lg-8">
          <GlassCard>
            <form onSubmit={handleSubmit}>
              {/* 1. Working Days */}
              <div className="mb-4">
                <label className="form-label-custom" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Weekly Clinic Days
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  Select the recurring days of the week when you are stationed at the hospital for outpatient consults.
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {allDays.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`btn btn-sm ${isSelected ? 'btn-primary-custom' : 'btn-light-custom'}`}
                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                      >
                        {day} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Shift Hours & Slot Duration */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Shift Start Time <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="time"
                    required
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Shift End Time <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="time"
                    required
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                    className="form-control-custom"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Consultation Slot Duration <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="form-select-custom"
                  >
                    {slotDurationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} Minutes per Slot
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Intermission & Lunch Break Configuration */}
              <div className="p-3 mb-4 rounded border" style={{ backgroundColor: 'rgba(234, 243, 255, 0.45)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary-blue)' }}>
                    Intermission / Lunch Break
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="breakSwitch"
                      checked={breakTimes.enabled}
                      onChange={(e) => setBreakTimes({ ...breakTimes, enabled: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="breakSwitch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {breakTimes.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                {breakTimes.enabled && (
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label-custom" style={{ fontSize: '0.76rem' }}>Break Start Time</label>
                      <input
                        type="time"
                        value={breakTimes.start}
                        onChange={(e) => setBreakTimes({ ...breakTimes, start: e.target.value })}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label-custom" style={{ fontSize: '0.76rem' }}>Break End Time</label>
                      <input
                        type="time"
                        value={breakTimes.end}
                        onChange={(e) => setBreakTimes({ ...breakTimes, end: e.target.value })}
                        className="form-control-custom"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Unavailable Dates (Leave & Out-of-Office Dates) */}
              <div className="mb-4">
                <label className="form-label-custom" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Scheduled Leave & Unavailable Dates
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  Add individual vacation or holiday dates when you will not be available. The patient booking portal will automatically block these dates.
                </div>

                <div className="d-flex gap-2 mb-3">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="form-control-custom"
                    style={{ maxWidth: 220, fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddUnavailableDate}
                    className="btn-light-custom d-flex align-items-center gap-1"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <MdAdd size={16} /> Block Date
                  </button>
                </div>

                {unavailableDates.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {unavailableDates.map((d, idx) => (
                      <span
                        key={idx}
                        className="badge bg-danger-subtle text-danger d-flex align-items-center gap-1 p-2"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <MdCalendarToday size={13} /> {d}
                        <button
                          type="button"
                          onClick={() => setDateToDelete(d)}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: '#b91c1c',
                            lineHeight: 1
                          }}
                          title="Remove blocked date"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    No vacation or leave dates currently scheduled.
                  </div>
                )}
              </div>

              {/* 5. Room & Capacity */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Daily Intake Limit (Max Consults)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={maxPerDay}
                    onChange={(e) => setMaxPerDay(e.target.value)}
                    className="form-control-custom"
                    placeholder="e.g. 25"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Assigned Clinic Suite / OPD Room</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. OPD-104"
                    className="form-control-custom"
                  />
                </div>
              </div>

              {/* 6. Active Online Booking Switch */}
              <div className="p-3 mb-4 rounded border form-check form-switch" style={{ backgroundColor: '#ffffff' }}>
                <input
                  className="form-check-input ms-0 me-3"
                  type="checkbox"
                  id="doctorActiveAcceptingSwitch"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="doctorActiveAcceptingSwitch" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  Accept Online Appointments
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  When switched off, patients cannot book new appointments with you on the patient portal.
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary-custom d-flex align-items-center gap-1"
                >
                  <MdCheck size={18} /> {saving ? 'Updating Schedule...' : 'Save Schedule Settings'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Schedule Summary & Booking Portal Preview */}
        <div className="col-12 col-lg-4">
          <GlassCard className="mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              Booking Engine Source of Truth
            </h6>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              The patient booking wizard dynamically calculates real-time appointment slots using this exact configuration.
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <div className="mb-2">
                <strong>Configured Shift:</strong> {workingHours.start} - {workingHours.end}
              </div>
              <div className="mb-2">
                <strong>Slot Interval:</strong> {slotDuration} Minutes
              </div>
              <div className="mb-2">
                <strong>Break Period:</strong> {breakTimes.enabled ? `${breakTimes.start} - ${breakTimes.end}` : 'None'}
              </div>
              <div className="mb-2">
                <strong>Working Days:</strong> {availableDays.join(', ')}
              </div>
              <div>
                <strong>Blocked Dates:</strong> {unavailableDates.length} date(s)
              </div>
            </div>

            <div className="d-flex align-items-start gap-2">
              <MdInfoOutline style={{ color: 'var(--primary-blue)', flexShrink: 0, marginTop: '2px' }} size={18} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Modifying these settings immediately coordinates with the patient booking engine. Existing booked appointments are strictly preserved.
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Remove Blocked Date Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!dateToDelete}
        onClose={() => setDateToDelete(null)}
        onConfirm={() => {
          if (dateToDelete) {
            handleRemoveUnavailableDate(dateToDelete);
          }
          setDateToDelete(null);
        }}
        title="Remove Blocked Leave Date"
        message={`Are you sure you want to remove ${dateToDelete} from your blocked dates? Patients will be able to book consultations on this date again.`}
        confirmText="Remove Date"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DoctorSchedule;
