import React from 'react';
import Modal from './Modal';
import {
  IoPrintOutline,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoMedkitOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';
import { copyToClipboard } from '../../utils/passwordGenerator';
import { useToast } from '../../context/ToastContext';
import { printOpdSlipA4 } from '../../utils/printA4Document';

const OpdTokenSlipModal = ({ isOpen, onClose, appointment, hospitalSettings }) => {
  const { toast } = useToast();

  if (!isOpen || !appointment) return null;

  const apptId = appointment._id ? appointment._id.substring(18).toUpperCase() : 'N/A';
  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};
  const dateFormatted = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Today';

  const hospitalName = hospitalSettings?.hospitalName || 'LifeCare Multi-Speciality Hospital';
  const hospitalPhone = hospitalSettings?.contactNumber || '+91 98765 43210';
  const hospitalAddress = hospitalSettings?.address || '108 Healthcare Blvd, Medical Enclave, New Delhi';

  const handlePrint = () => {
    printOpdSlipA4({ appointment, hospitalSettings });
  };

  const handleCopySummary = async () => {
    const text = `🏥 *${hospitalName} - OPD Token Slip*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟️ TOKEN SLIP: #OPD-${apptId}
👤 Patient: ${patient.name || 'Walk-in Patient'} (${patient.phone || 'N/A'})
👨‍⚕️ Attending Doctor: Dr. ${doctor.name || 'On-Duty Physician'}
🏥 Room: ${appointment.roomNumber || doctor.roomNumber || 'OPD-101'}
📅 Date: ${dateFormatted}
⏰ Slot: ${appointment.timeSlot?.start} - ${appointment.timeSlot?.end}
🩺 Reason: ${appointment.reasonForVisit || 'General Consultation'}
💵 Consultation Fee: ₹${appointment.consultationFee || doctor.consultationFee || '500'} (Paid at OPD Counter)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please report 10 minutes prior to your time slot outside the doctor's room.`;

    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success('OPD slip summary copied to clipboard!', { title: 'Copied' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Outpatient Department (OPD) Consultation Token" maxWidth="620px">
      {/* Printable Area with CSS print styles */}
      <div id="opd-print-slip" className="opd-slip-container">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #opd-print-slip, #opd-print-slip * {
              visibility: visible;
            }
            #opd-print-slip {
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Slip Outer Frame */}
        <div
          style={{
            border: '2px dashed #94A3B8',
            borderRadius: '12px',
            padding: '1.25rem',
            backgroundColor: '#FFFFFF',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-3 border-bottom" style={{ borderColor: '#E2E8F0' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}
              >
                <IoMedkitOutline />
              </div>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                  {hospitalName}
                </h5>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {hospitalAddress} • Helpline: {hospitalPhone}
                </div>
              </div>
            </div>

            <div className="text-end">
              <span
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  display: 'inline-block'
                }}
              >
                TOKEN #{apptId}
              </span>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                OPD COUNTER DESK
              </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="row g-2 py-3 border-bottom" style={{ borderColor: '#E2E8F0', fontSize: '0.86rem' }}>
            <div className="col-12 col-sm-6">
              <div className="p-2 rounded bg-light">
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }} className="d-block">
                  <IoPersonOutline className="me-1" /> PATIENT DETAILS
                </span>
                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{patient.name || 'Patient'}</strong>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>
                  Phone: {patient.phone || 'N/A'} • {patient.email || ''}
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="p-2 rounded bg-light">
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }} className="d-block">
                  <IoMedkitOutline className="me-1" /> ATTENDING PHYSICIAN
                </span>
                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>
                  Dr. {doctor.name || 'Physician'}
                </strong>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>
                  Room: <strong>{appointment.roomNumber || doctor.roomNumber || 'OPD-101'}</strong>
                </div>
              </div>
            </div>

            <div className="col-6 col-sm-6">
              <div className="p-2 rounded" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 700 }} className="d-block">
                  <IoCalendarOutline className="me-1" /> CONSULTATION DATE
                </span>
                <strong style={{ color: '#065F46', fontSize: '0.92rem' }}>{dateFormatted}</strong>
              </div>
            </div>

            <div className="col-6 col-sm-6">
              <div className="p-2 rounded" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700 }} className="d-block">
                  <IoTimeOutline className="me-1" /> ALLOTTED TIME SLOT
                </span>
                <strong style={{ color: '#1E40AF', fontSize: '0.92rem' }}>
                  {appointment.timeSlot?.start} - {appointment.timeSlot?.end}
                </strong>
              </div>
            </div>

            <div className="col-12">
              <div className="p-2 rounded border" style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }}>
                <span style={{ fontSize: '0.72rem', color: '#7E22CE', fontWeight: 700 }} className="d-block">
                  CHIEF COMPLAINT / REASON FOR VISIT
                </span>
                <div style={{ color: '#581C87', fontWeight: 600 }}>
                  {appointment.reasonForVisit || 'General Routine Consultation'}
                </div>
              </div>
            </div>
          </div>

          {/* Fee & Barcode Banner */}
          <div className="d-flex align-items-center justify-content-between pt-3">
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                CONSULTATION FEE
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                ₹{appointment.consultationFee || doctor.consultationFee || 500}
                <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '0.35rem', fontWeight: 600 }}>
                  (PAID AT OPD DESK)
                </span>
              </div>
            </div>

            <div className="text-end">
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#ECFDF5',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0'
                }}
              >
                <IoCheckmarkCircle className="me-1" /> VERIFIED & SCHEDULED
              </span>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Issued on {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Instructions Footer */}
          <div className="mt-3 pt-2 border-top text-center" style={{ borderColor: '#E2E8F0', fontSize: '0.74rem', color: '#64748B' }}>
            ℹ️ Please report to the consultation room 10 minutes prior to your designated time slot. Carry this slip with you.
          </div>
        </div>
      </div>

      {/* Action Buttons (Excluded from print) */}
      <div className="d-flex justify-content-between align-items-center gap-2 mt-4 pt-3 border-top no-print">
        <button
          type="button"
          onClick={handleCopySummary}
          className="btn btn-light border d-flex align-items-center gap-2"
          style={{ fontWeight: 600, fontSize: '0.86rem' }}
        >
          <IoCopyOutline size={16} /> Copy Slip Text
        </button>

        <div className="d-flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary-custom">
            Done & Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary-custom d-flex align-items-center gap-2"
            style={{ fontWeight: 700 }}
          >
            <IoPrintOutline size={18} /> Print OPD Token Slip
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OpdTokenSlipModal;
