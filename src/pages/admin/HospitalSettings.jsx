import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { settingService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import {
  IoSettingsOutline,
  IoSaveOutline,
  IoBusinessOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';
import { handlePhoneInput, isValidPhoneNumber, isValidOptionalPhone, PHONE_PLACEHOLDER, PHONE_PATTERN, PHONE_TITLE, PHONE_ERROR_MSG } from '../../utils/phoneValidation';

const HospitalSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    hospitalName: '',
    contactNumber: '',
    emergencyContact: '',
    email: '',
    address: '',
    timezone: 'Asia/Kolkata',
    appointmentSettings: {
      slotDurationMinutes: 30,
      maxAppointmentsPerDay: 50,
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      advanceBookingDays: 30,
      allowPatientCancellation: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingService.getSettings();
      if (res.data?.settings) {
        setSettings({
          ...res.data.settings,
          appointmentSettings: {
            ...settings.appointmentSettings,
            ...res.data.settings.appointmentSettings
          }
        });
      }
    } catch (err) {
      toast.error('Failed to fetch hospital settings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPhoneNumber(settings.contactNumber)) {
      return toast.warning('Official Contact Number: ' + PHONE_ERROR_MSG);
    }
    if (settings.emergencyContact && !isValidOptionalPhone(settings.emergencyContact)) {
      return toast.warning('Emergency Hotline: ' + PHONE_ERROR_MSG);
    }

    setSaving(true);

    try {
      const res = await settingService.updateSettings(settings);
      toast.success('Hospital configuration successfully saved.');
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating hospital configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-secondary" style={{ fontSize: '0.88rem' }}>Loading hospital configurations...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Hospital Enterprise Settings"
        subtitle="Configure hospital legal entity profiles, contact lines, outpatient schedules, and consultation policies"
      />

      <form onSubmit={handleSubmit}>
        <div className="row g-4 mb-4">
          {/* General Hospital Identity & Contact Information */}
          <div className="col-12 col-lg-6">
            <GlassCard style={{ height: '100%' }}>
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoBusinessOutline size={20} color="var(--primary-blue)" />
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Hospital Profile & Contact Information
                </h5>
              </div>

              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label-custom">Hospital Legal Name <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={settings.hospitalName}
                    onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                    className="form-control-custom"
                    placeholder="e.g. Hospital Management System"
                  />
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">Official Contact Number <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                        <IoCallOutline color="var(--text-secondary)" />
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        pattern={PHONE_PATTERN}
                        title={PHONE_TITLE}
                        value={settings.contactNumber}
                        onChange={(e) => setSettings({ ...settings, contactNumber: handlePhoneInput(e.target.value) })}
                        className="form-control form-control-custom border-start-0"
                        placeholder={PHONE_PLACEHOLDER}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">Emergency 24x7 Hotline</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                        <IoCallOutline color="var(--danger)" />
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        pattern={PHONE_PATTERN}
                        title={PHONE_TITLE}
                        value={settings.emergencyContact}
                        onChange={(e) => setSettings({ ...settings, emergencyContact: handlePhoneInput(e.target.value) })}
                        className="form-control form-control-custom border-start-0"
                        placeholder={PHONE_PLACEHOLDER}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Hospital Primary Email <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                      <IoMailOutline color="var(--text-secondary)" />
                    </span>
                    <input
                      type="email"
                      required
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="form-control form-control-custom border-start-0"
                      placeholder="contact@hospitalmanagement.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Physical Campus Address <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                      <IoLocationOutline color="var(--text-secondary)" />
                    </span>
                    <textarea
                      rows={3}
                      required
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="form-control form-control-custom border-start-0"
                      placeholder="Building, Street, Medical Enclave, City, Postal Code"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Operating Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="form-select-custom"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                    <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                    <option value="Europe/London">Europe/London (GMT - UTC+00:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Appointment Scheduling Policies */}
          <div className="col-12 col-lg-6">
            <GlassCard style={{ height: '100%' }}>
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <IoCalendarOutline size={20} color="var(--primary-blue)" />
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Outpatient Appointment Policies
                </h5>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">Slot Duration (Minutes) <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={settings.appointmentSettings?.slotDurationMinutes || 30}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointmentSettings: {
                            ...settings.appointmentSettings,
                            slotDurationMinutes: Number(e.target.value)
                          }
                        })
                      }
                      className="form-select-custom"
                    >
                      <option value="15">15 Minutes (Express Consultation)</option>
                      <option value="20">20 Minutes</option>
                      <option value="30">30 Minutes (Standard Clinic)</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes (Comprehensive Review)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">Max Daily Appts Per Doctor <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={settings.appointmentSettings?.maxAppointmentsPerDay || 50}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointmentSettings: {
                            ...settings.appointmentSettings,
                            maxAppointmentsPerDay: Number(e.target.value)
                          }
                        })
                      }
                      className="form-control-custom"
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">OPD Clinic Start Time <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="time"
                      required
                      value={settings.appointmentSettings?.workingHoursStart || '09:00'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointmentSettings: {
                            ...settings.appointmentSettings,
                            workingHoursStart: e.target.value
                          }
                        })
                      }
                      className="form-control-custom"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">OPD Clinic End Time <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="time"
                      required
                      value={settings.appointmentSettings?.workingHoursEnd || '18:00'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointmentSettings: {
                            ...settings.appointmentSettings,
                            workingHoursEnd: e.target.value
                          }
                        })
                      }
                      className="form-control-custom"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Advance Booking Window (Days) <span className="req-star" style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={settings.appointmentSettings?.advanceBookingDays || 30}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appointmentSettings: {
                          ...settings.appointmentSettings,
                          advanceBookingDays: Number(e.target.value)
                        }
                      })
                    }
                    className="form-control-custom"
                  />
                  <small className="text-secondary" style={{ fontSize: '0.74rem' }}>
                    Maximum number of calendar days in advance a patient can reserve an appointment slot.
                  </small>
                </div>

                <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(244, 247, 251, 0.75)', borderColor: 'var(--border-subtle)' }}>
                  <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="allowCancellation"
                      checked={settings.appointmentSettings?.allowPatientCancellation ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointmentSettings: {
                            ...settings.appointmentSettings,
                            allowPatientCancellation: e.target.checked
                          }
                        })
                      }
                      style={{ cursor: 'pointer', width: 38, height: 20 }}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="allowCancellation" style={{ cursor: 'pointer', fontSize: '0.86rem' }}>
                      Allow Patient Self-Cancellation
                    </label>
                  </div>
                  <div className="text-secondary small mt-1 ps-1">
                    Permits patients to cancel pending or confirmed appointments through their patient portal.
                  </div>
                </div>

                <div className="p-3 rounded mt-auto" style={{ backgroundColor: 'var(--mint)', border: '1px solid var(--border-subtle)' }}>
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--primary-green)', fontWeight: 700, fontSize: '0.84rem' }}>
                    <IoShieldCheckmarkOutline size={18} />
                    <span>Server-Side Policy Enforcement</span>
                  </div>
                  <div className="text-secondary small mt-1">
                    All schedule boundaries and booking limits are validated on the Node.js/Mongoose API level to prevent scheduling conflicts.
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Action Save Banner */}
        <div className="d-flex justify-content-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary-custom px-4 py-2"
            style={{ fontSize: '0.92rem' }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Saving to Database...
              </>
            ) : (
              <>
                <IoSaveOutline size={18} /> Save Hospital Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HospitalSettings;
