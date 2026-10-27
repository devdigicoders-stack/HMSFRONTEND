import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { doctorService, appointmentService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { AreaChartCard, DonutChartCard, BarChartCard } from '../../components/common/DashboardCharts';
import ActionBtn from '../../components/common/ActionButtons';
import { Link } from 'react-router-dom';
import {
  MdEventNote,
  MdSchedule,
  MdCheckCircle,
  MdCancel,
  MdPeople,
  MdAssignment,
  MdBiotech,
  MdPerson,
  MdRefresh,
  MdPlayCircleFilled,
  MdAccessTime,
  MdLocationOn
} from 'react-icons/md';

const getPatientAvatarUrl = (patient) => {
  if (patient?.avatar && patient.avatar.trim() !== '') {
    return patient.avatar;
  }
  const name = patient?.name || 'Patient';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E9FAD&color=fff&bold=true&size=128`;
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getDashboard();
      if (res.data?.success) {
        setData(res.data);
      } else {
        toast.error('Failed to load doctor dashboard information.');
      }
    } catch (err) {
      console.error('Error fetching doctor dashboard:', err);
      toast.error(err.response?.data?.message || 'Failed to connect to clinical docket server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartConsultation = async (appointmentId) => {
    try {
      await appointmentService.updateStatus(appointmentId, { status: 'In Progress' });
      toast.success('Encounter initiated. Consultation is now In Progress.', {
        title: 'Consultation In Progress'
      });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update consultation status.', {
        title: 'Action Failed'
      });
    }
  };

  const metrics = data?.metrics || {
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalAssignedPatients: 0,
    prescriptionsCount: 0,
    labOrdersCount: 0,
    medicalRecordsCount: 0
  };

  const nextUpcoming = data?.nextUpcoming;
  const recentActivity = data?.recentActivity || [];
  const todayAppointments = data?.todayAppointments || [];
  const profile = data?.profile;

  return (
    <div>
      <PageHeader
        title={`Physician Console: Dr. ${user?.name || ''}`}
        subtitle="Live clinical docket, real-time outpatient queue, electronic health charts, and pharmacotherapy management"
        actionButton={
          <div className="d-flex gap-2">
            <button
              onClick={fetchDashboardData}
              className="btn-secondary-custom d-flex align-items-center gap-1"
              title="Refresh live metrics"
            >
              <MdRefresh size={17} /> Refresh
            </button>
            <Link to="/doctor/appointments" className="btn-primary-custom d-flex align-items-center gap-1">
              <MdEventNote size={17} /> View Schedule
            </Link>
          </div>
        }
      />

      {/* Loading Skeleton / State */}
      {loading ? (
        <div className="p-5 text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Synchronizing authorized clinical records and live appointment queue...
          </div>
        </div>
      ) : (
        <>
          {/* Top Real Metrics Grid */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Today's Appointments"
                value={metrics.todayCount}
                icon={MdEventNote}
                variant="primary"
                subtext="Scheduled for today"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Upcoming Visits"
                value={metrics.upcomingCount}
                icon={MdSchedule}
                variant="warning"
                subtext="Future scheduled slots"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Completed Consultations"
                value={metrics.completedCount}
                icon={MdCheckCircle}
                variant="success"
                subtext="Successfully discharged"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Cancelled Visits"
                value={metrics.cancelledCount}
                icon={MdCancel}
                variant="danger"
                subtext="Cancelled or revoked"
              />
            </div>
          </div>

          {/* Row 1: Weekly Consultations Area Chart + Clinical Visit Breakdown Donut */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-8">
              <AreaChartCard
                title="Weekly Patient Consultations & Encounters"
                subtitle="Live 7-day encounter timeline with day-by-day distribution"
                data={data?.charts?.weeklyTrend?.data || [0, 0, 0, 0, 0, 0, metrics.todayCount]}
                labels={data?.charts?.weeklyTrend?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                unit="Visits"
                color="#0D9488"
                gradientId="docConsultGrad"
                badgeText={data?.charts?.weeklyTrend?.badgeText || `Today OPD: ${metrics.todayCount}`}
                badgePositive={data?.charts?.weeklyTrend?.badgePositive ?? true}
              />
            </div>
            <div className="col-12 col-lg-4">
              <DonutChartCard
                title="Clinical Visit Breakdown"
                subtitle="Real-time status distribution of patient cases"
                totalLabel="Total Visits"
                segments={[
                  { label: 'Completed', value: metrics.completedCount, color: '#10B981' },
                  { label: 'Upcoming', value: metrics.upcomingCount, color: '#0E9FAD' },
                  { label: 'Today', value: metrics.todayCount, color: '#F59E0B' },
                  { label: 'Cancelled', value: metrics.cancelledCount, color: '#F43F5E' }
                ]}
              />
            </div>
          </div>

          {/* Row 2: Monthly Attendance / Completion (Bar Chart) + 6-Month Volume Trend (Area Chart) */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <BarChartCard
                title="Monthly Consultation Completion & Attendance"
                subtitle="Scheduled consultations vs successfully discharged visits"
                bars={data?.charts?.monthlyCompletionBars?.length ? data.charts.monthlyCompletionBars : [
                  { label: 'M1', val1: 0, val2: 0 },
                  { label: 'M2', val1: 0, val2: 0 },
                  { label: 'M3', val1: 0, val2: 0 },
                  { label: 'M4', val1: 0, val2: 0 },
                  { label: 'M5', val1: 0, val2: 0 },
                  { label: 'M6', val1: metrics.todayCount, val2: metrics.completedCount }
                ]}
                series={[
                  { name: 'Booked', color: '#0E9FAD' },
                  { name: 'Completed', color: '#10B981' }
                ]}
              />
            </div>
            <div className="col-12 col-lg-6">
              <AreaChartCard
                title="6-Month Patient Consultation Trajectory"
                subtitle="Rolling historical timeline of clinical patient volume"
                data={data?.charts?.monthlyTrend?.data || [0, 0, 0, 0, 0, metrics.completedCount]}
                labels={data?.charts?.monthlyTrend?.labels || ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']}
                unit="Consultations"
                color="#6366F1"
                gradientId="docMonthlyCurveGrad"
                badgeText="6-Mo Rolling History"
                badgePositive={true}
              />
            </div>
          </div>

          {/* Row 3: Diagnostic & Pharmacotherapy Orders Donut + Chief Complaints Distribution */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <DonutChartCard
                title="Clinical Outputs & Orders Breakdown"
                subtitle="Prescriptions, diagnostic investigations & encounter notes"
                totalLabel="Total Orders"
                segments={data?.charts?.clinicalOrdersDistribution || [
                  { label: 'Prescriptions', value: metrics.prescriptionsCount || 0, color: '#0E9FAD' },
                  { label: 'Diagnostic Orders', value: metrics.labOrdersCount || 0, color: '#8B5CF6' },
                  { label: 'Clinical Records', value: metrics.medicalRecordsCount || 0, color: '#3B82F6' },
                  { label: 'Completed Visits', value: metrics.completedCount, color: '#10B981' }
                ]}
              />
            </div>
            <div className="col-12 col-lg-6">
              <DonutChartCard
                title="Top Chief Complaints Distribution"
                subtitle="Frequent diagnostic reasons and presenting symptoms"
                totalLabel="Cases"
                segments={data?.charts?.complaintsDistribution || [
                  { label: 'Routine OPD Consultation', value: metrics.completedCount || 1, color: '#10B981' }
                ]}
              />
            </div>
          </div>

          {/* Next Immediate Patient Highlight Banner */}
          {nextUpcoming && (
            <GlassCard
              className="mb-4"
              style={{
                borderLeft: '4px solid #10B981',
                background: 'linear-gradient(135deg, rgba(232, 247, 241, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)'
              }}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={getPatientAvatarUrl(nextUpcoming.patient)}
                    alt={nextUpcoming.patient?.name || 'Assigned Patient'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nextUpcoming.patient?.name || 'Patient')}&background=0E9FAD&color=fff&bold=true&size=128`;
                    }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #10B981',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  />
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ backgroundColor: 'var(--primary-blue)', fontSize: '0.7rem' }}>
                        NEXT PATIENT IN QUEUE
                      </span>
                      <StatusBadge status={nextUpcoming.status} />
                    </div>
                    <h5 style={{ margin: '0.2rem 0', fontWeight: 650, color: '#0F172A', fontSize: '1.15rem' }}>
                      {nextUpcoming.patient?.name || 'Assigned Patient'}
                    </h5>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      <strong>Slot:</strong> {nextUpcoming.timeSlot?.start} - {nextUpcoming.timeSlot?.end} ({new Date(nextUpcoming.appointmentDate).toLocaleDateString()}) • <strong>Complaint:</strong> {nextUpcoming.reasonForVisit}
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  {nextUpcoming.status !== 'In Progress' && nextUpcoming.status !== 'Completed' && (
                    <ActionBtn
                      variant="start"
                      label="Start Encounter"
                      onClick={() => handleStartConsultation(nextUpcoming._id)}
                    />
                  )}
                  <Link to="/doctor/appointments" className="no-underline">
                    <ActionBtn variant="view" label="Open Clinical Chart" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Recent Clinical Appointment Activity */}
          <GlassCard className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  Recent Appointment Activity
                </h5>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Latest patient interactions and scheduled docket modifications
                </span>
              </div>
              <Link to="/doctor/appointments" className="btn-light-custom" style={{ fontSize: '0.8rem' }}>
                All Assigned Appointments &rarr;
              </Link>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Consultation Date</th>
                    <th>Time Slot</th>
                    <th>Chief Complaint</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                        No recent appointment activity recorded.
                      </td>
                    </tr>
                  ) : (
                    recentActivity.map((appt) => (
                      <tr key={appt._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={getPatientAvatarUrl(appt.patient)}
                              alt={appt.patient?.name || 'Patient'}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patient?.name || 'Patient')}&background=0E9FAD&color=fff&bold=true&size=128`;
                              }}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid rgba(14, 159, 173, 0.35)',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                {appt.patient?.name || 'Patient'}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                {appt.patient?.phone || 'No phone recorded'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{new Date(appt.appointmentDate).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '0.82rem' }}>
                            {appt.timeSlot?.start} - {appt.timeSlot?.end}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem' }}>{appt.reasonForVisit}</span>
                        </td>
                        <td>
                          <StatusBadge status={appt.status} />
                        </td>
                        <td>
                          <Link
                            to="/doctor/appointments"
                            className="btn btn-sm btn-light-custom"
                            style={{ fontSize: '0.76rem', padding: '0.25rem 0.55rem' }}
                          >
                            Open Chart
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
