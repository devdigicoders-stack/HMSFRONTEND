import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  IoMedkitOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoFlashOutline,
  IoCheckmarkCircle,
  IoSearchOutline,
  IoCashOutline,
  IoBusinessOutline
} from 'react-icons/io5';
import {
  patientService,
  doctorService,
  departmentService,
  appointmentService,
  userService
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { handlePhoneInput, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { generateStrongPassword } from '../../utils/passwordGenerator';

const STANDARD_SLOTS = [
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '11:30', end: '12:00' },
  { start: '12:00', end: '12:30' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
  { start: '15:30', end: '16:00' },
  { start: '16:00', end: '16:30' },
  { start: '16:30', end: '17:00' },
  { start: '17:00', end: '17:30' }
];

const QUICK_REASONS = [
  'Routine OPD Consultation',
  'Acute Fever & Body Aches',
  'Hypertension / BP Check',
  'Chest Pain / Discomfort',
  'Post-Treatment Follow-up',
  'Diabetes Monitoring'
];

const BookWalkInModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Patient Mode: 'existing' | 'quick'
  const [patientMode, setPatientMode] = useState('existing');

  // Selected existing patient
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Quick spot patient registration
  const [spotPatient, setSpotPatient] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    bloodGroup: 'O+'
  });

  // Appointment details
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(STANDARD_SLOTS[0]);
  const [reasonForVisit, setReasonForVisit] = useState('Routine OPD Consultation');

  useEffect(() => {
    if (!isOpen) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [deptRes, docRes, patRes] = await Promise.all([
          departmentService.getDepartments({ limit: 100 }),
          doctorService.getDoctors(),
          patientService.getPatients({ limit: 100 })
        ]);

        if (deptRes.data?.departments) {
          setDepartments(deptRes.data.departments);
        }
        if (docRes.data?.doctors) {
          setDoctors(docRes.data.doctors);
          if (docRes.data.doctors.length > 0) {
            setSelectedDoctorId(docRes.data.doctors[0].user?._id || docRes.data.doctors[0]._id);
          }
        }
        if (patRes.data?.patients) {
          setPatients(patRes.data.patients);
          if (patRes.data.patients.length > 0) {
            setSelectedPatientId(patRes.data.patients[0].user?._id || patRes.data.patients[0]._id);
          }
        }
      } catch (err) {
        toast.error('Could not load doctors or departments directory.', { title: 'Fetch Error' });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((d) => {
    if (selectedDept === 'All') return true;
    return d.department?.toLowerCase() === selectedDept.toLowerCase();
  });

  // Selected doctor object
  const currentDoctor = doctors.find(
    (d) => (d.user?._id || d._id) === selectedDoctorId
  );

  // Filter patients by search term
  const filteredPatients = patients.filter((p) => {
    const term = patientSearch.toLowerCase();
    const name = p.user?.name?.toLowerCase() || '';
    const phone = p.user?.phone?.toLowerCase() || '';
    const email = p.user?.email?.toLowerCase() || '';
    return name.includes(term) || phone.includes(term) || email.includes(term);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    let targetPatientId = selectedPatientId;
    let targetPatientDetails = null;

    // 1. If quick spot patient mode, create patient account first
    if (patientMode === 'quick') {
      if (!spotPatient.name.trim()) {
        return toast.warning('Please enter patient full legal name.', { title: 'Missing Information' });
      }
      if (spotPatient.phone && !isValidOptionalPhone(spotPatient.phone)) {
        return toast.warning(PHONE_ERROR_MSG, { title: 'Invalid Mobile Number' });
      }

      const autoEmail = spotPatient.email.trim()
        ? spotPatient.email.trim()
        : `patient.${Date.now()}@lifecare.internal`;
      const autoPass = generateStrongPassword('Pat');

      try {
        setBooking(true);
        const userRes = await userService.createUser({
          name: spotPatient.name,
          email: autoEmail,
          password: autoPass,
          phone: spotPatient.phone,
          gender: spotPatient.gender,
          bloodGroup: spotPatient.bloodGroup,
          role: 'patient'
        });

        targetPatientId = userRes.data.user.id || userRes.data.user._id;
        targetPatientDetails = {
          _id: targetPatientId,
          name: spotPatient.name,
          email: autoEmail,
          phone: spotPatient.phone,
          gender: spotPatient.gender,
          bloodGroup: spotPatient.bloodGroup
        };
      } catch (err) {
        setBooking(false);
        return toast.error(err.response?.data?.message || 'Error registering walk-in patient.', {
          title: 'Patient Creation Failed'
        });
      }
    } else {
      if (!targetPatientId) {
        return toast.warning('Please select a registered patient from the directory.', {
          title: 'Select Patient'
        });
      }
      const pFound = patients.find((p) => (p.user?._id || p._id) === targetPatientId);
      targetPatientDetails = pFound ? pFound.user || pFound : null;
    }

    if (!selectedDoctorId) {
      return toast.warning('Please assign an attending physician.', { title: 'Select Doctor' });
    }

    // 2. Book appointment
    try {
      setBooking(true);
      const apptRes = await appointmentService.bookAppointment({
        patientId: targetPatientId,
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot: selectedSlot,
        reasonForVisit: reasonForVisit.trim() || 'General OPD Consultation'
      });

      const bookedAppt = apptRes.data.appointment || {
        _id: 'OPD' + Date.now(),
        patient: targetPatientDetails,
        doctor: currentDoctor?.user || { name: 'Attending Physician' },
        roomNumber: currentDoctor?.roomNumber || 'OPD-101',
        consultationFee: currentDoctor?.consultationFee || 500,
        appointmentDate,
        timeSlot: selectedSlot,
        reasonForVisit,
        status: 'Confirmed'
      };

      // Enrich with doctor room and fee if populated doesn't have it
      if (!bookedAppt.roomNumber && currentDoctor?.roomNumber) {
        bookedAppt.roomNumber = currentDoctor.roomNumber;
      }
      if (!bookedAppt.consultationFee && currentDoctor?.consultationFee) {
        bookedAppt.consultationFee = currentDoctor.consultationFee;
      }

      toast.success('Walk-in OPD appointment booked & confirmed successfully!', {
        title: 'Appointment Scheduled'
      });

      if (onSuccess) {
        onSuccess(bookedAppt);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conflict: Unable to book appointment in that slot.', {
        title: 'Booking Conflict'
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OPD Reception Desk: Book Walk-in Consultation" maxWidth="740px">
      <form onSubmit={handleSubmit}>
        {/* Patient Selection Segment */}
        <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
              <IoPersonOutline className="me-1" /> Step 1: Patient Selection / Registration
            </span>

            {/* Toggle Modes */}
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                onClick={() => setPatientMode('existing')}
                className={`btn ${patientMode === 'existing' ? 'btn-primary' : 'btn-light border'}`}
                style={{ fontSize: '0.78rem', fontWeight: 650 }}
              >
                Existing Patient
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('quick')}
                className={`btn ${patientMode === 'quick' ? 'btn-primary' : 'btn-light border'}`}
                style={{ fontSize: '0.78rem', fontWeight: 650 }}
              >
                ⚡ Quick Walk-in Entry
              </button>
            </div>
          </div>

          {patientMode === 'existing' ? (
            <div>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Filter by patient name, phone, or email..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="form-control-custom py-1 mb-2"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="form-select-custom"
                required
              >
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => {
                    const id = p.user?._id || p._id;
                    const name = p.user?.name || p.name || 'Patient';
                    const phone = p.user?.phone || p.phone || '';
                    return (
                      <option key={id} value={id}>
                        {name} {phone ? `(${phone})` : ''} - ID: {id.substring(18)}
                      </option>
                    );
                  })
                ) : (
                  <option value="">No registered patients matching query</option>
                )}
              </select>
            </div>
          ) : (
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Patient Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={spotPatient.name}
                  onChange={(e) => setSpotPatient({ ...spotPatient, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="form-control-custom"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-custom">Contact Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  value={spotPatient.phone}
                  onChange={(e) => setSpotPatient({ ...spotPatient, phone: handlePhoneInput(e.target.value) })}
                  placeholder={PHONE_PLACEHOLDER}
                  className="form-control-custom"
                />
              </div>

              <div className="col-6 col-md-6">
                <label className="form-label-custom">Gender</label>
                <select
                  value={spotPatient.gender}
                  onChange={(e) => setSpotPatient({ ...spotPatient, gender: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-6 col-md-6">
                <label className="form-label-custom">Blood Group</label>
                <select
                  value={spotPatient.bloodGroup}
                  onChange={(e) => setSpotPatient({ ...spotPatient, bloodGroup: e.target.value })}
                  className="form-select-custom"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Clinical Selection */}
        <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#065F46', marginBottom: '0.5rem' }}>
            <IoMedkitOutline className="me-1" /> Step 2: Department & Attending Physician
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Filter by Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="form-select-custom"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Assign Doctor *</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="form-select-custom"
                required
              >
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((d) => {
                    const id = d.user?._id || d._id;
                    const name = d.user?.name || d.name || 'Doctor';
                    return (
                      <option key={id} value={id}>
                        Dr. {name} ({d.specialization || d.department || 'General'}) • ₹{d.consultationFee || 500}
                      </option>
                    );
                  })
                ) : (
                  <option value="">No doctors available in selected department</option>
                )}
              </select>
            </div>
          </div>

          {currentDoctor && (
            <div className="mt-2 pt-2 border-top d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ borderColor: '#BBF7D0', fontSize: '0.82rem' }}>
              <div>
                <strong>Dr. {currentDoctor.user?.name || currentDoctor.name}</strong> •{' '}
                <span className="text-secondary">{currentDoctor.specialization || 'Physician'}</span>
              </div>
              <div className="d-flex gap-3">
                <span>Room: <strong>{currentDoctor.roomNumber || 'OPD-101'}</strong></span>
                <span className="text-success fw-bold">Fee: ₹{currentDoctor.consultationFee || 500}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Date & Slot Selection */}
        <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.5rem' }}>
            <IoCalendarOutline className="me-1" /> Step 3: Consultation Schedule & Time Window
          </div>

          <div className="row g-2 mb-2">
            <div className="col-12 col-md-6">
              <label className="form-label-custom">Consultation Date *</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="form-control-custom"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label-custom">Selected Slot Window</label>
              <div
                className="p-2 rounded bg-white border d-flex align-items-center justify-content-between"
                style={{ height: '38px', borderColor: '#BFDBFE' }}
              >
                <strong style={{ color: '#2563EB', fontSize: '0.92rem' }}>
                  {selectedSlot.start} - {selectedSlot.end}
                </strong>
                <span className="badge bg-success-subtle text-success">Active Slot</span>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label-custom mb-1" style={{ fontSize: '0.78rem' }}>
              Select Time Slot Window:
            </label>
            <div className="d-flex flex-wrap gap-1.5" style={{ maxHeight: '110px', overflowY: 'auto' }}>
              {STANDARD_SLOTS.map((slot, index) => {
                const isSelected = selectedSlot.start === slot.start && selectedSlot.end === slot.end;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className="btn btn-sm"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 650,
                      padding: '0.2rem 0.5rem',
                      backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? 'none' : '1px solid #CBD5E1',
                      borderRadius: '6px'
                    }}
                  >
                    {slot.start} - {slot.end}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Reason for Visit */}
        <div className="mb-3">
          <label className="form-label-custom">
            Chief Complaint / Reason for Consultation *
          </label>
          <div className="d-flex flex-wrap gap-1 mb-2">
            {QUICK_REASONS.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReasonForVisit(r)}
                className="btn btn-sm btn-light border"
                style={{ fontSize: '0.74rem', padding: '0.15rem 0.45rem' }}
              >
                + {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            required
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
            placeholder="e.g. Severe headache, persistent cough for 3 days"
            className="form-control-custom"
          />
        </div>

        {/* Footer Actions */}
        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
          <div style={{ fontSize: '0.84rem' }}>
            Consultation Fee:{' '}
            <strong className="text-success" style={{ fontSize: '1.05rem' }}>
              ₹{currentDoctor?.consultationFee || 500}
            </strong>
          </div>

          <div className="d-flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary-custom">
              Cancel
            </button>
            <button
              type="submit"
              disabled={booking || loading}
              className="btn-primary-custom d-flex align-items-center gap-2"
              style={{ fontWeight: 700 }}
            >
              <IoCheckmarkCircle size={18} />
              {booking ? 'Scheduling Consultation...' : 'Confirm & Generate OPD Token'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BookWalkInModal;
