import React, { useEffect, useState } from 'react';
import { reportService, settingService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BookWalkInModal from '../../components/common/BookWalkInModal';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';
import { AreaChartCard, DonutChartCard, BarChartCard } from '../../components/common/DashboardCharts';
import {
  MdPeople,
  MdLocalHospital,
  MdEventNote,
  MdBiotech,
  MdCheckCircle,
  MdPendingActions,
  MdScience,
  MdDateRange
} from 'react-icons/md';
import {
  IoSettingsOutline,
  IoFlashOutline,
  IoPrintOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoPersonAddOutline,
  IoArrowForwardOutline
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const AdminDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hospital settings for slip branding
  const [hospitalSettings, setHospitalSettings] = useState(null);

  // Walk-in booking modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Print Token Slip modal state
  const [printAppt, setPrintAppt] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [reportRes, settingRes] = await Promise.all([
        reportService.getAdminDashboard(),
        settingService.getSettings()
      ]);
      setData(reportRes.data);
      if (settingRes.data?.settings) {
        setHospitalSettings(settingRes.data.settings);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleWalkInSuccess = (newAppt) => {
    fetchStats();
    if (newAppt) {
      setPrintAppt(newAppt);
      setIsPrintModalOpen(true);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Compiling hospital enterprise analytics..." />;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentAppointments = data?.recentAppointments || [];
  const daysTrend = charts.daysTrend || data?.daysTrend || [];

  return (
    <div>
      {/* Page Header with Action Shortcuts */}
      <PageHeader
        title="Hospital Administration Dashboard"
        subtitle="Real-time clinical operations, patient intake analytics, bed capacity, and department performance"
        actionButton={
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(true)}
              className="btn btn-primary-custom d-flex align-items-center gap-1.5"
              style={{ fontWeight: 700 }}
            >
              <IoFlashOutline size={17} /> Book Walk-in OPD
            </button>
            <Link to="/admin/doctors" className="btn-secondary-custom">
              <MdLocalHospital size={16} /> Manage Doctors
            </Link>
            <Link to="/admin/patients" className="btn-secondary-custom">
              <MdPeople size={16} /> Patient Directory
            </Link>
            <Link to="/admin/appointments" className="btn-secondary-custom">
              <MdEventNote size={16} /> All Appointments
            </Link>
            <Link to="/admin/settings" className="btn-light-custom">
              <IoSettingsOutline size={16} /> Hospital Settings
            </Link>
          </div>
        }
      />

      {/* Primary Key Metric Cards */}
      <div className="row g-3 mb-4 align-items-stretch">
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients ?? 0}
            icon={MdPeople}
            variant="info"
            subtext="Registered patients"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Total Doctors"
            value={stats.totalDoctors ?? 0}
            icon={MdLocalHospital}
            variant="success"
            subtext="Attending staff"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Lab Staff"
            value={stats.totalLabStaff ?? 0}
            icon={MdBiotech}
            variant="warning"
            subtext="Certified technicians"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Total Appts"
            value={stats.totalAppointments ?? 0}
            icon={MdEventNote}
            variant="primary"
            subtext="Scheduled to date"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Today's Appts"
            value={stats.todayAppointments ?? 0}
            icon={MdDateRange}
            variant="info"
            subtext="Today's schedule"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex">
          <StatCard
            title="Pending Appts"
            value={stats.pendingAppointments ?? 0}
            icon={MdPendingActions}
            variant="danger"
            subtext="Awaiting review"
          />
        </div>
      </div>

      {/* Enterprise Dynamic Analytics & Operational Charts */}
      {/* 1. Daily Clinical Intake & Department Mix */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <AreaChartCard
            title="Weekly Clinical Intake Analytics"
            subtitle="Real-time patient intake and consultation volume over the past 7 days"
            data={daysTrend.length > 0 ? daysTrend.map((d) => d.appointments) : [0, 0, 0, 0, 0, 0, 0]}
            labels={daysTrend.length > 0 ? daysTrend.map((d) => d.day) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            unit="Consultations"
            color="#10B981"
            gradientId="adminTrendGrad"
            badgeText={charts.badgeText || 'Live Sync Active'}
            badgePositive={charts.badgePositive !== false}
          />
        </div>
        <div className="col-12 col-lg-4">
          <DonutChartCard
            title="Clinical Department Mix"
            subtitle="Active patient load by department"
            totalLabel="Cases"
            segments={
              charts.departmentMix && charts.departmentMix.length > 0
                ? charts.departmentMix
                : [
                    { label: 'General Care', value: 0, color: '#10B981' },
                    { label: 'Cardiology', value: 0, color: '#0E9FAD' },
                    { label: 'Pediatrics', value: 0, color: '#6366F1' },
                    { label: 'Laboratory', value: 0, color: '#F59E0B' }
                  ]
            }
          />
        </div>
      </div>

      {/* 2. Department Throughput & Monthly Attendance Rate */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <BarChartCard
            title="Department Operational Throughput"
            subtitle="Scheduled vs completed consultations across clinical departments"
            bars={
              charts.departmentThroughput && charts.departmentThroughput.length > 0
                ? charts.departmentThroughput
                : [
                    { label: 'General', val1: 0, val2: 0 },
                    { label: 'Cardio', val1: 0, val2: 0 },
                    { label: 'Neuro', val1: 0, val2: 0 },
                    { label: 'OPD', val1: 0, val2: 0 }
                  ]
            }
            series={[
              { name: 'Scheduled', color: '#10B981' },
              { name: 'Completed', color: '#0E9FAD' }
            ]}
          />
        </div>

        <div className="col-12 col-lg-6">
          <BarChartCard
            title="Monthly Consultation Attendance Rate"
            subtitle="Booked appointments vs attended visits over the last 6 months"
            bars={
              charts.monthlyAttendance && charts.monthlyAttendance.length > 0
                ? charts.monthlyAttendance
                : [
                    { label: 'M1', val1: 0, val2: 0 },
                    { label: 'M2', val1: 0, val2: 0 },
                    { label: 'M3', val1: 0, val2: 0 },
                    { label: 'M4', val1: 0, val2: 0 },
                    { label: 'M5', val1: 0, val2: 0 },
                    { label: 'M6', val1: 0, val2: 0 }
                  ]
            }
            series={[
              { name: 'Booked', color: '#3B82F6' },
              { name: 'Completed', color: '#10B981' }
            ]}
          />
        </div>
      </div>

      {/* 3. Appointment Status Breakdown & 6-Month Inflow Trend */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-4">
          <DonutChartCard
            title="Appointment Operational Status"
            subtitle="Fulfillment and booking outcome distribution"
            totalLabel="Appointments"
            segments={
              charts.appointmentStatusMix && charts.appointmentStatusMix.length > 0
                ? charts.appointmentStatusMix
                : [
                    { label: 'Completed Visits', value: stats.completedAppointments || 0, color: '#10B981' },
                    { label: 'Pending Approval', value: stats.pendingAppointments || 0, color: '#F59E0B' },
                    { label: 'Cancelled / Rejected', value: stats.cancelledAppointments || 0, color: '#F43F5E' }
                  ]
            }
          />
        </div>

        <div className="col-12 col-lg-8">
          <AreaChartCard
            title="Monthly Hospital Patient Inflow & Diagnostic Volume"
            subtitle="Total clinical appointments and laboratory requests across the past 6 months"
            data={
              charts.monthlyIntake && charts.monthlyIntake.length > 0
                ? charts.monthlyIntake.map((m) => m.encounters)
                : [0, 0, 0, 0, 0, 0]
            }
            labels={
              charts.monthlyIntake && charts.monthlyIntake.length > 0
                ? charts.monthlyIntake.map((m) => m.label)
                : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']
            }
            unit="Encounters"
            color="#6366F1"
            gradientId="monthlyIntakeGrad"
            badgeText={`${stats.totalAppointments ?? 0} Total Lifetime`}
            badgePositive={true}
          />
        </div>
      </div>

      {/* 4. Diagnostic Lab Requisitions & Hospital User Demographics */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <DonutChartCard
            title="Diagnostic Lab Requisitions Pipeline"
            subtitle="Real-time status of pathology and laboratory investigations"
            totalLabel="Lab Orders"
            segments={
              charts.labStatusMix && charts.labStatusMix.length > 0
                ? charts.labStatusMix
                : [
                    { label: 'Published / Ready', value: stats.completedLabTests || 0, color: '#10B981' },
                    { label: 'Pending Order', value: stats.pendingLabTests || 0, color: '#F59E0B' }
                  ]
            }
          />
        </div>

        <div className="col-12 col-lg-6">
          <DonutChartCard
            title="Hospital User Population & Demographics"
            subtitle="Verified system accounts by role"
            totalLabel="Accounts"
            segments={
              charts.userDemographics && charts.userDemographics.length > 0
                ? charts.userDemographics
                : [
                    { label: 'Registered Patients', value: stats.totalPatients || 0, color: '#10B981' },
                    { label: 'Attending Doctors', value: stats.totalDoctors || 0, color: '#0E9FAD' },
                    { label: 'Laboratory Staff', value: stats.totalLabStaff || 0, color: '#8B5CF6' }
                  ]
            }
          />
        </div>
      </div>

      {/* Recent Appointments Table with Print Slip Action */}
      <GlassCard>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              Recent Appointment Queue
            </h5>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Latest patient consultations scheduled across departments
            </span>
          </div>
          <Link to="/admin/appointments" className="btn-light-custom" style={{ fontSize: '0.82rem' }}>
            Full Appointment Docket &rarr;
          </Link>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Patient Details</th>
                <th>Assigned Physician</th>
                <th>Scheduled Date</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th>Slip</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-secondary">
                    No recent appointments found.
                  </td>
                </tr>
              ) : (
                recentAppointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem' }}>
                        #{appt._id.substring(18).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{appt.patient?.name || 'Patient'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Registered Patient
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>Dr. {appt.doctor?.name || 'Physician'}</div>
                    </td>
                    <td>{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary-green)' }}>
                        {appt.timeSlot?.start} - {appt.timeSlot?.end}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintAppt(appt);
                          setIsPrintModalOpen(true);
                        }}
                        className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        title="Print OPD Token Slip"
                      >
                        <IoPrintOutline size={14} color="#059669" /> Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ==================== WALK-IN MODAL ==================== */}
      <BookWalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={handleWalkInSuccess}
      />

      {/* ==================== PRINT TOKEN SLIP MODAL ==================== */}
      <OpdTokenSlipModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        appointment={printAppt}
        hospitalSettings={hospitalSettings}
      />
    </div>
  );
};

export default AdminDashboard;
