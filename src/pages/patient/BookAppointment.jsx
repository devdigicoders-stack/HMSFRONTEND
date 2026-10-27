import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { doctorService, appointmentService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  MdSearch,
  MdLocationOn,
  MdSchool,
  MdCheckCircle,
  MdArrowBack,
  MdArrowForward,
  MdPrint,
  MdRefresh,
  MdEventNote,
  MdPerson,
  MdAttachMoney,
  MdSchedule,
  MdInfoOutline
} from 'react-icons/md';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoMedkitOutline,
  IoCheckmarkDoneCircleOutline,
  IoWarningOutline,
  IoDocumentTextOutline,
  IoPrintOutline
} from 'react-icons/io5';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Workflow Steps: 1: Select Doctor, 2: Select Date & Slot, 3: Reason for Visit, 4: Review, 5: Confirmation
  const [currentStep, setCurrentStep] = useState(1);

  // Doctors Catalog State
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Date & Slot State
  const [appointmentDate, setAppointmentDate] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Reason for Visit State
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submission & Confirmation State
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const cleanDoctorName = (name) => {
    if (!name) return 'Physician';
    return name.replace(/^Dr\.?\s*/i, '');
  };

  // Min date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  // Fetch Doctors and check for pre-selected doctor from query param
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        const res = await doctorService.getDoctors();
        const activeDocs = (res.data.doctors || []).filter(
          (d) => d.user && d.user.status === 'active' && d.isAvailable !== false
        );
        setDoctors(activeDocs);

        const paramDoctorId = searchParams.get('doctorId');
        if (paramDoctorId) {
          const preSelected = activeDocs.find(
            (d) => d.user?._id === paramDoctorId || d._id === paramDoctorId
          );
          if (preSelected) {
            setSelectedDoctor(preSelected);
            setCurrentStep(2); // Jump straight to date & slot
          }
        } else if (activeDocs.length > 0) {
          setSelectedDoctor(activeDocs[0]);
        }
      } catch (err) {
        setBookingError('Unable to fetch active hospital doctors. Please refresh the page.');
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
    setAppointmentDate(minDateStr);
  }, [searchParams]);

  // Fetch Available Slots from Backend when Doctor or Date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor?.user?._id || !appointmentDate) return;

      try {
        setSlotsLoading(true);
        setSelectedSlot(null);
        setBookingError('');

        const res = await doctorService.getAvailableSlots(
          selectedDoctor.user._id,
          appointmentDate
        );

        setSlotsData(res.data);

        // Pre-select first available slot if any
        const firstAvailable = (res.data.slots || []).find((s) => s.isAvailable);
        if (firstAvailable) {
          setSelectedSlot({ start: firstAvailable.start, end: firstAvailable.end });
        }
      } catch (err) {
        console.error('Error fetching backend time slots:', err);
        setBookingError(
          err.response?.data?.message || 'Could not fetch time slots for the selected date.'
        );
        setSlotsData(null);
      } finally {
        setSlotsLoading(false);
      }
    };

    if (currentStep >= 2 && selectedDoctor && appointmentDate) {
      fetchSlots();
    }
  }, [selectedDoctor, appointmentDate, currentStep]);

  // Filter doctors
  const specialties = ['All', ...new Set(doctors.map((d) => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter((d) => {
    const matchesSpec = selectedSpecialty === 'All' || d.specialization === selectedSpecialty;
    const matchesSearch =
      !searchDoctor ||
      d.user?.name?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
      d.department?.toLowerCase().includes(searchDoctor.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  // Step 1 Validation & Proceed
  const handleProceedToDate = () => {
    if (!selectedDoctor) {
      toast.warning('Please select a physician to continue.', {
        title: 'Physician Selection'
      });
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Proceed
  const handleProceedToReason = () => {
    if (!appointmentDate) {
      toast.warning('Please select an appointment date.', {
        title: 'Date Required'
      });
      return;
    }
    if (!selectedSlot || !selectedSlot.start) {
      toast.warning('Please select an available consultation time slot.', {
        title: 'Time Slot Required'
      });
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Validation & Proceed to Review
  const handleProceedToReview = (e) => {
    if (e) e.preventDefault();
    if (!reasonForVisit.trim()) {
      toast.warning('Please describe the reason for your visit or current symptoms.', {
        title: 'Details Required'
      });
      return;
    }
    setCurrentStep(4);
  };

  // Step 4: Final Confirm Booking via API
  const handleConfirmBooking = async () => {
    setBookingLoading(true);

    try {
      // Backend automatically sets patientId from req.user.id for role 'patient'
      const payload = {
        doctorId: selectedDoctor.user._id,
        appointmentDate,
        timeSlot: selectedSlot,
        reasonForVisit: reasonForVisit.trim(),
        notes: additionalNotes.trim()
      };

      const res = await appointmentService.bookAppointment(payload);
      const appt = res.data.appointment;
      const enrichedAppt = {
        ...appt,
        doctor: {
          name: selectedDoctor?.user?.name || 'Attending Physician',
          phone: selectedDoctor?.user?.phone || '',
          specialization: selectedDoctor?.specialization || 'General',
          department: selectedDoctor?.department || 'OPD',
          roomNumber: selectedDoctor?.roomNumber || 'OPD-101',
          consultationFee: selectedDoctor?.consultationFee || 500
        },
        patient: {
          name: user?.name || 'Patient',
          phone: user?.phone || '',
          email: user?.email || ''
        }
      };
      setConfirmedAppointment(enrichedAppt);
      setCurrentStep(5); // Confirmation screen
      toast.success(
        `Consultation confirmed with Dr. ${selectedDoctor?.user?.name || 'Physician'} for ${appointmentDate} at ${selectedSlot.start}!`,
        { title: 'Booking Confirmed' }
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to confirm booking. The selected time slot may have just been booked. Please choose another time.';
      toast.error(msg, {
        title: 'Booking Notice'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Print Appointment Slip
  const handlePrintSlip = () => {
    setIsTokenModalOpen(true);
  };

  // Reset and book another
  const handleBookAnother = () => {
    setConfirmedAppointment(null);
    setReasonForVisit('');
    setAdditionalNotes('');
    setCurrentStep(1);
  };

  return (
    <div>
      <PageHeader
        title="Clinical Appointment Booking"
        subtitle="Schedule an in-person consultation with certified medical specialists in 4 simple steps"
      />

      {/* Stepper Progress Bar */}
      {currentStep < 5 && (
        <div className="booking-stepper">
          <div className="booking-step-item">
            <div
              className={`booking-step-circle ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div className={`booking-step-label ${currentStep === 1 ? 'active' : ''}`}>
              Select Doctor
            </div>
          </div>

          <div className="booking-step-item">
            <div
              className={`booking-step-circle ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div className={`booking-step-label ${currentStep === 2 ? 'active' : ''}`}>
              Date & Slot
            </div>
          </div>

          <div className="booking-step-item">
            <div
              className={`booking-step-circle ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}
            >
              {currentStep > 3 ? '✓' : '3'}
            </div>
            <div className={`booking-step-label ${currentStep === 3 ? 'active' : ''}`}>
              Symptoms / Reason
            </div>
          </div>

          <div className="booking-step-item">
            <div className={`booking-step-circle ${currentStep === 4 ? 'active' : ''}`}>
              4
            </div>
            <div className={`booking-step-label ${currentStep === 4 ? 'active' : ''}`}>
              Review & Confirm
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1: SELECT DOCTOR ================= */}
      {currentStep === 1 && (
        <div className="row g-4">
          <div className="col-12">
            <GlassCard>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
                    Step 1: Choose Your Attending Physician
                  </h5>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Select a specialist based on clinical department, fees, and schedule
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <div className="position-relative">
                    <MdSearch
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search doctor or specialty..."
                      value={searchDoctor}
                      onChange={(e) => setSearchDoctor(e.target.value)}
                      className="form-control-custom"
                      style={{ paddingLeft: '2.2rem', width: 240, fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Specialty Filter Pills */}
              <div className="d-flex flex-wrap gap-2 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                {specialties.map((spec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`btn btn-sm ${selectedSpecialty === spec ? 'btn-primary-custom' : 'btn-light-custom'}`}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.8rem', borderRadius: '20px' }}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {/* Doctors Grid */}
              {doctorsLoading ? (
                <div className="text-center py-5 text-secondary">
                  <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                  Loading available physicians...
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-5">
                  <IoMedkitOutline size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <h6 style={{ fontWeight: 700 }}>No physicians found</h6>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Try selecting a different specialty or clearing your search filter.
                  </p>
                </div>
              ) : (
                <div className="row g-3" style={{ maxHeight: 520, overflowY: 'auto' }}>
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctor?._id === doc._id;
                    return (
                      <div key={doc._id} className="col-12 col-md-6 col-xl-4">
                        <div
                          onClick={() => setSelectedDoctor(doc)}
                          className="p-3 rounded h-100 cursor-pointer transition-all"
                          style={{
                            border: isSelected ? '2px solid var(--primary-green)' : '1px solid var(--border-subtle)',
                            backgroundColor: isSelected ? 'var(--mint)' : 'rgba(255, 255, 255, 0.75)',
                            boxShadow: isSelected ? '0 4px 16px rgba(21, 150, 107, 0.18)' : 'var(--shadow-xs)',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            position: 'relative'
                          }}
                        >
                          {isSelected && (
                            <span
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                color: 'var(--primary-blue)',
                                fontSize: '1.2rem'
                              }}
                            >
                              <MdCheckCircle />
                            </span>
                          )}

                          <div className="d-flex gap-3 align-items-center mb-2">
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                backgroundColor: isSelected ? 'var(--primary-blue)' : 'var(--light-blue)',
                                color: isSelected ? '#fff' : 'var(--primary-blue)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem',
                                flexShrink: 0,
                                overflow: 'hidden'
                              }}
                            >
                              {doc.user?.avatar ? (
                                <img
                                  src={doc.user.avatar}
                                  alt={doc.user.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <IoMedkitOutline />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div style={{ fontWeight: 750, fontSize: '0.94rem', color: '#0F172A' }} className="text-truncate">
                                Dr. {cleanDoctorName(doc.user?.name)}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#0E9FAD', fontWeight: 650 }}>
                                {doc.specialization}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }} className="text-truncate">
                                {doc.department}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: 'var(--border-subtle)', fontSize: '0.74rem' }}>
                            <span className="text-secondary">
                              <MdSchool size={13} /> {doc.experienceYears} Yrs Exp
                            </span>
                            <span className="text-secondary">
                              Fee: <strong style={{ color: '#0F172A', fontSize: '0.84rem' }}>₹{doc.consultationFee}</strong>
                            </span>
                          </div>

                          <div className="mt-1.5 text-truncate" style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Days: <strong style={{ color: '#334155' }}>{doc.availableDays?.join(', ') || 'Mon-Fri'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedDoctor ? (
                    <>Selected: <strong style={{ color: '#0F172A' }}>Dr. {cleanDoctorName(selectedDoctor.user?.name)}</strong> (₹{selectedDoctor.consultationFee})</>
                  ) : (
                    'Please click on a doctor card above'
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleProceedToDate}
                  disabled={!selectedDoctor}
                  className="btn-primary-custom d-flex align-items-center gap-1.5 px-3.5"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  <span>Continue to Date & Slot</span> <MdArrowForward size={15} />
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ================= STEP 2: SELECT DATE & TIME SLOT ================= */}
      {currentStep === 2 && (
        <div className="row g-3">
          {/* Selected Doctor Summary Card */}
          <div className="col-12 col-lg-4">
            <GlassCard className="p-3 mb-3">
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Selected Attending Doctor
              </div>

              <div className="d-flex gap-2.5 align-items-center mb-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(21, 150, 107, 0.12)',
                    color: '#15966B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {selectedDoctor?.user?.avatar ? (
                    <img
                      src={selectedDoctor.user.avatar}
                      alt={selectedDoctor.user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <IoMedkitOutline />
                  )}
                </div>

                <div>
                  <h6 style={{ margin: 0, fontWeight: 750, fontSize: '0.98rem', color: '#0F172A' }}>
                    Dr. {cleanDoctorName(selectedDoctor?.user?.name)}
                  </h6>
                  <div style={{ fontSize: '0.78rem', color: '#0E9FAD', fontWeight: 650 }}>
                    {selectedDoctor?.specialization}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {selectedDoctor?.department}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-secondary">Consultation Fee</span>
                  <strong style={{ color: '#0F172A', fontWeight: 750 }}>₹{selectedDoctor?.consultationFee}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-secondary">OPD Chamber</span>
                  <strong style={{ color: '#0F172A', fontWeight: 650 }}>{selectedDoctor?.roomNumber || 'Room 101'}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Clinic Hours</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedDoctor?.workingHours?.start} - {selectedDoctor?.workingHours?.end}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
                <strong style={{ color: '#334155' }}>Scheduled Days:</strong> {selectedDoctor?.availableDays?.join(', ') || 'Mon - Fri'}
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-sm btn-outline-secondary w-100 mt-3"
                style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
              >
                Change Doctor
              </button>
            </GlassCard>
          </div>

          {/* Date Picker & Slots Grid */}
          <div className="col-12 col-lg-8">
            <GlassCard className="p-3.5">
              <h6 style={{ margin: 0, fontWeight: 750, fontSize: '1.02rem', color: '#0F172A', marginBottom: '0.2rem' }}>
                Step 2: Select Consultation Date & Live Time Slot
              </h6>
              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.1rem' }}>
                Available slots are fetched in real-time directly from our hospital scheduling server.
              </p>

              {/* Date Input */}
              <div className="row g-2.5 align-items-center mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label-custom" style={{ fontSize: '0.76rem', marginBottom: '0.3rem' }}>
                    Select Appointment Date <span className="req-star" style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="form-control-custom"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  {slotsData?.dayOfWeek && (
                    <div
                      className="p-2 rounded-3 mt-sm-3 d-flex align-items-center justify-content-between"
                      style={{
                        backgroundColor: slotsData.isAvailableDay ? '#ECFDF5' : '#FEF2F2',
                        border: `1px solid ${slotsData.isAvailableDay ? '#A7F3D0' : '#FECDD3'}`,
                        fontSize: '0.76rem'
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748B' }}>Selected Day: </span>
                        <strong style={{ color: '#0F172A' }}>{slotsData.dayOfWeek}</strong>
                      </div>
                      {slotsData.isAvailableDay ? (
                        <span style={{ color: '#059669', fontWeight: 650 }}>✓ Doctor on duty</span>
                      ) : (
                        <span style={{ color: '#DC2626', fontWeight: 650 }}>✗ Off-duty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Backend Slots View */}
              {slotsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Verifying clinic schedule and conflict-free slots...
                  </span>
                </div>
              ) : slotsData?.isAvailableDay === false ? (
                <div className="alert alert-warning d-flex align-items-center gap-2 p-2.5 mb-3" style={{ fontSize: '0.8rem' }}>
                  <IoWarningOutline size={20} className="flex-shrink-0" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.82rem' }}>Doctor Unavailable on this Day</strong>
                    <span style={{ fontSize: '0.76rem' }}>{slotsData.message}</span>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Slot Counts Header */}
                  <div className="d-flex justify-content-between align-items-center mb-2.5 pb-1 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      Available Time Slots ({slotsData?.availableSlotsCount || 0} Open)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      30-minute consultation windows
                    </span>
                  </div>

                  {/* Morning Slots */}
                  <div className="mb-3">
                    <label className="d-flex align-items-center gap-1 mb-1.5" style={{ fontSize: '0.76rem', fontWeight: 650, color: '#334155' }}>
                      <IoTimeOutline size={14} className="text-primary" /> Morning Clinic (09:00 AM - 12:30 PM)
                    </label>

                    {(slotsData?.morningSlots || []).length === 0 ? (
                      <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>No morning slots configured.</span>
                    ) : (
                      <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))' }}>
                        {slotsData.morningSlots.map((slot, idx) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot({ start: slot.start, end: slot.end })}
                              className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                            >
                              <span>{slot.start}</span>
                              <span className="slot-status-tag">
                                {slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Available'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Afternoon Slots */}
                  <div className="mb-3">
                    <label className="d-flex align-items-center gap-1 mb-1.5" style={{ fontSize: '0.76rem', fontWeight: 650, color: '#334155' }}>
                      <IoTimeOutline size={14} className="text-primary" /> Afternoon Clinic (02:00 PM - 05:00 PM)
                    </label>

                    {(slotsData?.afternoonSlots || []).length === 0 ? (
                      <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>No afternoon slots configured.</span>
                    ) : (
                      <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))' }}>
                        {slotsData.afternoonSlots.map((slot, idx) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot({ start: slot.start, end: slot.end })}
                              className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                            >
                              <span>{slot.start}</span>
                              <span className="slot-status-tag">
                                {slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Available'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="d-flex justify-content-between align-items-center pt-2.5 mt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary-custom d-flex align-items-center gap-1"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  <MdArrowBack size={15} /> Back
                </button>

                <button
                  type="button"
                  onClick={handleProceedToReason}
                  disabled={!selectedSlot}
                  className="btn-primary-custom d-flex align-items-center gap-1.5 px-3.5"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                >
                  <span>Continue to Reason</span> <MdArrowForward size={15} />
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ================= STEP 3: ENTER REASON FOR VISIT ================= */}
      {currentStep === 3 && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <GlassCard className="p-3.5">
              <h6 style={{ margin: 0, fontWeight: 750, fontSize: '1.02rem', color: '#0F172A', marginBottom: '0.2rem' }}>
                Step 3: Clinical Reason for Consultation
              </h6>
              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Please provide clinical symptoms or medical concerns for Dr. {cleanDoctorName(selectedDoctor?.user?.name)} to review prior to your visit.
              </p>

              <form onSubmit={handleProceedToReason}>
                <div className="mb-3">
                  <label className="form-label-custom" style={{ fontSize: '0.76rem', marginBottom: '0.35rem' }}>
                    Primary Health Concern / Reason for Visit <span className="req-star" style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    placeholder="e.g. Experiencing persistent dull chest discomfort for 3 days, accompanied by slight shortness of breath..."
                    className="form-control-custom"
                    style={{ fontSize: '0.82rem', lineHeight: 1.45 }}
                  />
                  <div className="form-text" style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                    Describe symptoms, duration, pain scale, or if this is a routine review.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label-custom" style={{ fontSize: '0.76rem', marginBottom: '0.35rem' }}>
                    Additional Medical Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Previous blood test report available, need prescription refill, prefer morning review..."
                    className="form-control-custom"
                    style={{ fontSize: '0.82rem', lineHeight: 1.45 }}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2.5 mt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn btn-secondary-custom d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                  >
                    <MdArrowBack size={15} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    disabled={!reasonForVisit.trim()}
                    className="btn-primary-custom d-flex align-items-center gap-1.5 px-3.5"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                  >
                    <span>Review Booking Details</span> <MdArrowForward size={15} />
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ================= STEP 4: REVIEW & CONFIRM ================= */}
      {currentStep === 4 && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <GlassCard className="p-3.5">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 style={{ margin: 0, fontWeight: 750, fontSize: '1.02rem', color: '#0F172A' }}>
                  Step 4: Review Consultation Particulars
                </h6>
                <span className="badge-status badge-status-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Final Review</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.2rem' }}>
                Please verify your appointment schedule and attending physician details before final confirmation.
              </p>

              {/* Summary Table Card */}
              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="row g-2.5">
                  <div className="col-12 col-sm-6">
                    <span className="text-secondary d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Patient Name (Identity Verified)
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                      {user?.name || 'Authenticated Patient'}
                    </strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {user?.email} • {user?.phone || 'No phone'}
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <span className="text-secondary d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Consulting Physician
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                      Dr. {cleanDoctorName(selectedDoctor?.user?.name)}
                    </strong>
                    <div style={{ fontSize: '0.74rem', color: '#0E9FAD', fontWeight: 650 }}>
                      {selectedDoctor?.specialization} ({selectedDoctor?.department})
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 pt-2 border-top" style={{ borderColor: '#E2E8F0' }}>
                    <span className="text-secondary d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Date & Schedule
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
                      {new Date(appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                      {selectedSlot?.start} - {selectedSlot?.end}
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 pt-2 border-top" style={{ borderColor: '#E2E8F0' }}>
                    <span className="text-secondary d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Clinic Location & Fee
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
                      OPD Room {selectedDoctor?.roomNumber || '101'}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700 }}>
                      Fee: ₹{selectedDoctor?.consultationFee} <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>(Payable upon arrival)</span>
                    </div>
                  </div>

                  <div className="col-12 pt-2 border-top" style={{ borderColor: '#E2E8F0' }}>
                    <span className="text-secondary d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Reason for Consultation
                    </span>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#1E293B', marginTop: '0.15rem' }}>
                      {reasonForVisit}
                    </p>
                    {additionalNotes && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                        <em>Notes: {additionalNotes}</em>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Policy note */}
              <div className="p-2.5 mb-3 rounded-3 d-flex gap-2 align-items-center" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '0.74rem', color: '#1E40AF' }}>
                <MdInfoOutline size={17} className="flex-shrink-0 text-primary" />
                <span>
                  Please arrive 10 minutes prior to your time slot for vital sign assessment and reception check-in.
                </span>
              </div>

              {/* Confirmation Action Buttons */}
              <div className="d-flex justify-content-between align-items-center pt-2.5 border-top" style={{ borderColor: '#F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={bookingLoading}
                  className="btn btn-secondary-custom d-flex align-items-center gap-1"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  <MdArrowBack size={15} /> Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="btn-primary-custom d-flex align-items-center gap-1.5 px-3.5"
                  style={{ fontSize: '0.84rem', padding: '0.5rem 1.15rem' }}
                >
                  {bookingLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm text-light me-1" role="status" />
                      <span>Securing Slot...</span>
                    </>
                  ) : (
                    <>
                      <IoCheckmarkDoneCircleOutline size={17} />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ================= STEP 5: BOOKING CONFIRMATION SCREEN ================= */}
      {currentStep === 5 && confirmedAppointment && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-7">
            {/* Printable Appointment Slip */}
            <div className="appointment-slip mb-3 p-3.5" style={{ borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div className="text-center mb-3">
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1.5px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    margin: '0 auto 0.5rem'
                  }}
                >
                  <MdCheckCircle />
                </div>

                <h5 style={{ fontWeight: 800, fontSize: '1.18rem', color: '#0F172A', margin: 0 }}>
                  Appointment Confirmed!
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                  Your consultation slot has been reserved in the hospital docket.
                </p>
              </div>

              {/* Reference ID Pill */}
              <div className="p-2 mb-3 text-center rounded-3" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Official Appointment Reference ID
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E40AF', letterSpacing: '0.04em' }}>
                  #{confirmedAppointment._id}
                </div>
              </div>

              {/* Slip Body Details */}
              <div className="row g-2.5 mb-3" style={{ fontSize: '0.8rem' }}>
                <div className="col-6">
                  <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>Attending Doctor</span>
                  <strong style={{ color: '#0F172A' }}>Dr. {cleanDoctorName(confirmedAppointment.doctor?.name || selectedDoctor?.user?.name)}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#0E9FAD', fontWeight: 600 }}>
                    {selectedDoctor?.specialization}
                  </div>
                </div>

                <div className="col-6 text-end">
                  <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>Consultation Date</span>
                  <strong style={{ color: '#0F172A' }}>
                    {new Date(confirmedAppointment.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </strong>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                    {confirmedAppointment.timeSlot?.start} - {confirmedAppointment.timeSlot?.end}
                  </div>
                </div>

                <div className="col-6 pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>Clinic Chamber</span>
                  <strong style={{ color: '#0F172A' }}>Room {selectedDoctor?.roomNumber || 'OPD 101'}</strong>
                </div>

                <div className="col-6 text-end pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>Consultation Fee</span>
                  <strong style={{ color: '#0F172A', fontSize: '0.94rem' }}>
                    ₹{selectedDoctor?.consultationFee}
                  </strong>
                </div>

                <div className="col-12 pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>Reason for Visit</span>
                  <span style={{ color: '#334155' }}>{confirmedAppointment.reasonForVisit}</span>
                </div>
              </div>

              <div className="text-center pt-2.5 border-top" style={{ borderColor: '#F1F5F9', fontSize: '0.7rem', color: '#94A3B8' }}>
                Hospital Management System • Verified & Confirmed
              </div>
            </div>

            {/* Quick Next Action Navigation Buttons */}
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(true)}
                className="btn btn-primary-custom d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', fontWeight: 700 }}
              >
                <IoPrintOutline size={16} /> View & Print OPD Token Slip
              </button>

              <Link
                to="/patient/appointments"
                className="btn btn-secondary-custom d-flex align-items-center gap-1"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
              >
                <MdEventNote size={15} /> My Appointments
              </Link>

              <button
                type="button"
                onClick={handleBookAnother}
                className="btn btn-light-custom"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              >
                Book Another Visit
              </button>

              <Link
                to="/patient/dashboard"
                className="btn btn-light-custom"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        appointment={confirmedAppointment}
      />
    </div>
  );
};

export default BookAppointment;
