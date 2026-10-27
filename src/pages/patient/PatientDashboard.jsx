import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { patientService, appointmentService, labService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { AreaChartCard, DonutChartCard, BarChartCard } from '../../components/common/DashboardCharts';
import ActionBtn from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OpdTokenSlipModal from '../../components/common/OpdTokenSlipModal';
import {
  MdEventNote,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdLocalHospital,
  MdBiotech,
  MdPerson,
  MdHistory,
  MdArrowForward,
  MdRefresh,
  MdPhone,
  MdLocationOn,
  MdCalendarMonth
} from 'react-icons/md';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoMedkitOutline,
  IoDocumentTextOutline,
  IoCloseCircleOutline,
  IoCheckmarkDoneCircleOutline,
  IoPrintOutline,
  IoFlaskOutline
} from 'react-icons/io5';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [cancelApptTarget, setCancelApptTarget] = useState(null);
  const [selectedTokenAppt, setSelectedTokenAppt] = useState(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const fetchDashboard = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError('');
      const res = await patientService.getDashboard(user.id);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching patient dashboard:', err);
      // Fallback: If dashboard endpoint has issues, fetch via individual services
      try {
        const [apptsRes, labsRes] = await Promise.all([
          appointmentService.getAppointments({ limit: 100 }),
          labService.getRequests({ limit: 100 })
        ]);

        const appointments = apptsRes.data.appointments || [];
        const labs = labsRes.data.requests || [];
        const today = new Date().setHours(0, 0, 0, 0);

        const upcomingList = appointments.filter(
          (a) => ['Confirmed', 'Pending'].includes(a.status) && new Date(a.appointmentDate) >= today
        );
        const completed = appointments.filter((a) => a.status === 'Completed').length;
        const cancelled = appointments.filter((a) => ['Cancelled', 'Rejected'].includes(a.status)).length;

        // Dynamic 6-month trends fallback
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrends = [];
        const monthlyAttendance = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth();
          const label = monthNames[m];
          const startM = new Date(y, m, 1, 0, 0, 0, 0);
          const endM = new Date(y, m + 1, 0, 23, 59, 59, 999);

          const mAppts = appointments.filter((a) => {
            const ad = new Date(a.appointmentDate);
            return ad >= startM && ad <= endM;
          });
          const mComp = mAppts.filter((a) => a.status === 'Completed').length;
          const mLabs = labs.filter((l) => {
            const ld = new Date(l.createdAt);
            return ld >= startM && ld <= endM;
          }).length;

          monthlyTrends.push({
            label,
            encounters: mAppts.length + mLabs,
            appointments: mAppts.length,
            completed: mComp,
            labs: mLabs
          });

          monthlyAttendance.push({
            label,
            val1: mAppts.length,
            val2: mComp
          });
        }

        const deptMap = {};
        appointments.forEach((a) => {
          const dept = a.doctor?.specialization || a.doctor?.department || 'General Care';
          if (!deptMap[dept]) deptMap[dept] = { scheduled: 0, completed: 0 };
          deptMap[dept].scheduled += 1;
          if (a.status === 'Completed') deptMap[dept].completed += 1;
        });

        const departmentBreakdown = Object.keys(deptMap).map((dept) => ({
          label: dept.length > 9 ? dept.substring(0, 8) + '…' : dept,
          fullName: dept,
          val1: deptMap[dept].scheduled,
          val2: deptMap[dept].completed
        }));

        if (departmentBreakdown.length === 0) {
          departmentBreakdown.push(
            { label: 'General', fullName: 'General Medicine', val1: 0, val2: 0 },
            { label: 'Cardio', fullName: 'Cardiology', val1: 0, val2: 0 },
            { label: 'OPD', fullName: 'Outpatient Care', val1: 0, val2: 0 },
            {
              label: 'Lab/Diag',
              fullName: 'Diagnostics',
              val1: labs.length,
              val2: labs.filter((l) => ['Completed', 'Published'].includes(l.status)).length
            }
          );
        }

        const labStatusBreakdown = [
          {
            label: 'Published / Ready',
            value: labs.filter((l) => ['Completed', 'Published', 'Reviewed'].includes(l.status)).length,
            color: '#10B981'
          },
          {
            label: 'Sample Processing',
            value: labs.filter((l) => ['Processing', 'Sample Collected', 'Accepted'].includes(l.status)).length,
            color: '#0E9FAD'
          },
          {
            label: 'Pending Request',
            value: labs.filter((l) => l.status === 'Requested').length,
            color: '#F59E0B'
          },
          {
            label: 'Cancelled',
            value: labs.filter((l) => ['Cancelled', 'Rejected'].includes(l.status)).length,
            color: '#F43F5E'
          }
        ];

        setDashboardData({
          stats: {
            totalAppointments: appointments.length,
            upcomingAppointments: upcomingList.length,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
            totalLabRequests: labs.length,
            totalPrescriptions: 0
          },
          charts: {
            monthlyTrends,
            monthlyAttendance,
            departmentBreakdown,
            labStatusBreakdown,
            badgeText: 'Care Track Active',
            badgePositive: true
          },
          nextUpcoming: upcomingList[0] || null,
          upcomingAppointments: upcomingList,
          recentActivity: appointments.slice(0, 5),
          assignedDoctors: [],
          recentLabReports: labs.slice(0, 5)
        });
        toast.error(err.response?.data?.message || 'Failed to load live dashboard data. Using local cache.', {
          title: 'Dashboard Notice'
        });
      } catch (fallbackErr) {
        toast.error('Failed to load live dashboard data. Please try again.', { title: 'Dashboard Notice' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setActionLoadingId(appointmentId);
      await appointmentService.updateStatus(appointmentId, {
        status: 'Cancelled',
        cancellationReason: 'Cancelled by patient from portal dashboard.'
      });
      toast.success('Your appointment has been cancelled successfully.', {
        title: 'Appointment Cancelled'
      });
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel appointment.', {
        title: 'Cancellation Failed'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrintToken = (appt) => {
    setSelectedTokenAppt(appt);
    setIsTokenModalOpen(true);
  };

  const stats = dashboardData?.stats || {
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalLabRequests: 0,
    totalPrescriptions: 0
  };

  const charts = dashboardData?.charts || {};
  const monthlyTrends = charts.monthlyTrends || [];
  const monthlyAttendance = charts.monthlyAttendance || [];
  const departmentBreakdown = charts.departmentBreakdown || [];
  const labStatusBreakdown = charts.labStatusBreakdown || [];

  const encounterTrendData = monthlyTrends.map((m) => m.encounters);
  const encounterTrendLabels = monthlyTrends.map((m) => m.label);

  const labTrendData = monthlyTrends.map((m) => m.labs);
  const labTrendLabels = monthlyTrends.map((m) => m.label);

  const healthcareSegments = [
    { label: 'Upcoming Visits', value: stats.upcomingAppointments || 0, color: '#10B981' },
    { label: 'Completed Visits', value: stats.completedAppointments || 0, color: '#0E9FAD' },
    { label: 'Lab Reports', value: stats.totalLabRequests || 0, color: '#8B5CF6' },
    { label: 'Prescriptions', value: stats.totalPrescriptions || 0, color: '#EA580C' },
    { label: 'Cancelled', value: stats.cancelledAppointments || 0, color: '#F43F5E' }
  ];

  const nextUpcoming = dashboardData?.nextUpcoming;
  const recentActivity = dashboardData?.recentActivity || [];
  const assignedDoctors = dashboardData?.assignedDoctors || [];
  const recentLabReports = dashboardData?.recentLabReports || [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || 'Patient'}`}
        subtitle="Access your verified medical consultations, laboratory reports, and healthcare providers"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchDashboard}
              className="btn btn-secondary-custom d-flex align-items-center gap-1"
              disabled={loading}
              title="Refresh Dashboard Data"
            >
              <MdRefresh size={18} className={loading ? 'spin-animation' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
            <Link to="/patient/book" className="btn-primary-custom d-flex align-items-center gap-2">
              <IoCalendarOutline size={17} /> Schedule Appointment
            </Link>
          </div>
        }
      />

      {/* Real-time Metric Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Upcoming Consultations"
            value={loading ? '...' : stats.upcomingAppointments}
            icon={MdSchedule}
            variant="primary"
            subtext="Confirmed or pending visits"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Appointments"
            value={loading ? '...' : stats.totalAppointments}
            icon={MdEventNote}
            variant="info"
            subtext="Lifetime consultation record"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Completed Visits"
            value={loading ? '...' : stats.completedAppointments}
            icon={MdCheckCircle}
            variant="success"
            subtext="Care encounters finished"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Cancelled / Rescheduled"
            value={loading ? '...' : stats.cancelledAppointments}
            icon={MdCancel}
            variant="warning"
            subtext="Inactive bookings"
          />
        </div>
      </div>

      {/* Patient Dynamic Health Analytics & Clinical Charts */}
      {/* 1. Primary Activity Trend & Healthcare Resource Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <AreaChartCard
            title="My Health Encounters & Checkup Frequency"
            subtitle="Clinical visits and diagnostic procedures tracked over the past months in real-time"
            data={encounterTrendData.length ? encounterTrendData : [0, 0, 0, 0, 0, 0]}
            labels={encounterTrendLabels.length ? encounterTrendLabels : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']}
            unit="Encounters"
            color="#0E9FAD"
            gradientId="patientHealthGrad"
            badgeText={charts.badgeText || 'Care Track Active'}
            badgePositive={charts.badgePositive !== false}
          />
        </div>
        <div className="col-12 col-lg-4">
          <DonutChartCard
            title="My Healthcare Breakdown"
            subtitle="Lifetime consultations, diagnostics & prescriptions"
            totalLabel="Records"
            segments={healthcareSegments}
          />
        </div>
      </div>

      {/* 2. Medical Specialty Utilization & Monthly Attendance Comparison */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <BarChartCard
            title="Consultations by Medical Specialty"
            subtitle="Scheduled vs completed visits across clinical departments"
            bars={
              departmentBreakdown.length > 0
                ? departmentBreakdown
                : [
                    { label: 'General', val1: 0, val2: 0 },
                    { label: 'Cardio', val1: 0, val2: 0 },
                    { label: 'OPD', val1: 0, val2: 0 },
                    { label: 'Lab/Diag', val1: 0, val2: 0 }
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
            title="Monthly Consultation Attendance"
            subtitle="Booked appointments vs completed visits over the last 6 months"
            bars={
              monthlyAttendance.length > 0
                ? monthlyAttendance
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

      {/* 3. Diagnostic Investigations Status & Pathology Timeline */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-4">
          <DonutChartCard
            title="Diagnostic Lab Tests Status"
            subtitle="Current status of pathology orders & investigations"
            totalLabel="Lab Tests"
            segments={
              labStatusBreakdown.length > 0
                ? labStatusBreakdown
                : [
                    { label: 'Published / Ready', value: 0, color: '#10B981' },
                    { label: 'Sample Processing', value: 0, color: '#0E9FAD' },
                    { label: 'Pending Request', value: 0, color: '#F59E0B' },
                    { label: 'Cancelled', value: 0, color: '#F43F5E' }
                  ]
            }
          />
        </div>

        <div className="col-12 col-lg-8">
          <AreaChartCard
            title="Diagnostic Investigations & Lab Volume"
            subtitle="Monthly pathology tests and diagnostic orders over 6 months"
            data={labTrendData.length ? labTrendData : [0, 0, 0, 0, 0, 0]}
            labels={labTrendLabels.length ? labTrendLabels : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']}
            unit="Tests"
            color="#8B5CF6"
            gradientId="patientLabGrad"
            badgeText={`${stats.totalLabRequests} Total Tests`}
            badgePositive={stats.totalLabRequests > 0}
          />
        </div>
      </div>



      {/* Assigned Doctor Details Where Available */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
              Your Attending Care Team
            </h5>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Specialists and consultants assigned to your active clinical records
            </span>
          </div>
          <Link to="/patient/doctors" className="btn-light-custom d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
            <span>Browse All Doctors</span> <MdArrowForward size={14} />
          </Link>
        </div>

        {loading ? (
          <GlassCard className="text-center py-4 text-secondary" style={{ fontSize: '0.88rem' }}>
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
            Loading assigned doctor information...
          </GlassCard>
        ) : assignedDoctors.length === 0 ? (
          <GlassCard className="p-4 text-center">
            <IoMedkitOutline size={38} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h6 style={{ fontWeight: 700, margin: 0 }}>No Primary Doctors Assigned Yet</h6>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.25rem 0 1rem' }}>
              Once you book an appointment with any of our board-certified physicians, their contact and room coordinates will appear here.
            </p>
            <Link to="/patient/doctors" className="btn-primary-custom btn-sm">
              Explore Doctor Directory
            </Link>
          </GlassCard>
        ) : (
          <div className="row g-3">
            {assignedDoctors.map((doc, idx) => (
              <div key={idx} className="col-12 col-md-6 col-xl-4">
                <GlassCard className="h-100 p-3">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--light-blue)',
                        color: 'var(--primary-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}
                    >
                      {doc.avatar ? (
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                        />
                      ) : (
                        <MdLocalHospital />
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                        {doc.specialization}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {doc.department}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-subtle)', fontSize: '0.76rem' }}>
                    <span className="text-secondary d-flex align-items-center gap-1">
                      <MdLocationOn size={14} className="text-danger" /> Room: <strong>{doc.roomNumber}</strong>
                    </span>
                    <span className="text-secondary">
                      Fee: <strong>₹{doc.consultationFee}</strong>
                    </span>
                  </div>

                  <div className="mt-3">
                    <Link
                      to={`/patient/book?doctorId=${doc.doctorId}`}
                      className="btn btn-sm btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-1"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0' }}
                    >
                      <IoCalendarOutline size={14} /> Schedule Follow-up
                    </Link>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        appointment={selectedTokenAppt}
      />

      {/* Appointment Cancellation Confirmation Alert */}
      <ConfirmDialog
        isOpen={!!cancelApptTarget}
        onClose={() => setCancelApptTarget(null)}
        onConfirm={() => {
          if (cancelApptTarget) {
            handleCancelAppointment(cancelApptTarget._id);
          }
          setCancelApptTarget(null);
        }}
        title="Cancel Scheduled Appointment"
        message={`Are you sure you want to cancel your appointment with Dr. ${cancelApptTarget?.doctor?.name || 'the physician'} on ${cancelApptTarget ? new Date(cancelApptTarget.appointmentDate).toLocaleDateString() : ''}?`}
        confirmText="Yes, Cancel Appointment"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PatientDashboard;
