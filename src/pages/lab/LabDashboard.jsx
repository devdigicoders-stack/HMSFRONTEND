import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { labService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { AreaChartCard, DonutChartCard, BarChartCard } from '../../components/common/DashboardCharts';
import {
  MdBiotech,
  MdHourglassEmpty,
  MdCheckCircle,
  MdScience,
  MdListAlt,
  MdRefresh,
  MdOutlineRuleFolder,
  MdCancel
} from 'react-icons/md';
import { IoFlaskOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

const LabDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingRequests: 0,
    sampleCollected: 0,
    processing: 0,
    completed: 0,
    awaitingReview: 0,
    published: 0,
    rejected: 0,
    catalogCount: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await labService.getDashboardStats();
      if (res.data?.success) {
        setData(res.data);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Error fetching lab dashboard metrics:', err);
      toast.error(err.response?.data?.message || 'Failed to load laboratory statistics.', { title: 'Laboratory Notice' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      <PageHeader
        title="Pathology Laboratory Console"
        subtitle="Specimen pipeline custody, clinical bench tests, supervisor verification, and certified electronic reports"
        actionButton={
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn-secondary-custom d-flex align-items-center gap-1"
              style={{ fontSize: '0.84rem' }}
            >
              <MdRefresh size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <Link to="/lab/queue" className="btn-primary-custom d-flex align-items-center gap-1">
              <MdListAlt size={16} /> Specimen Queue
            </Link>
          </div>
        }
      />

      {/* Primary KPI Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Assigned Tests"
            value={loading ? '...' : stats.totalAssigned}
            icon={MdBiotech}
            variant="primary"
            subtext="All lab work orders"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pending Intake"
            value={loading ? '...' : stats.pendingRequests}
            icon={MdHourglassEmpty}
            variant="warning"
            subtext="Awaiting sample collection"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Samples Collected"
            value={loading ? '...' : stats.sampleCollected}
            icon={IoFlaskOutline}
            variant="info"
            subtext="Ready for laboratory bench"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tests In Progress"
            value={loading ? '...' : stats.processing}
            icon={MdScience}
            variant="primary"
            subtext="Under active analysis"
          />
        </div>
      </div>

      {/* Secondary Workflow KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Completed (Drafts)"
            value={loading ? '...' : stats.completed}
            icon={MdCheckCircle}
            variant="info"
            subtext="Results recorded"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Awaiting Review / Release"
            value={loading ? '...' : stats.awaitingReview}
            icon={MdOutlineRuleFolder}
            variant="warning"
            subtext="Pending supervisor sign-off"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Released Reports"
            value={loading ? '...' : stats.published}
            icon={IoShieldCheckmarkOutline}
            variant="success"
            subtext="Dispatched to patients & doctors"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Rejected Specimens"
            value={loading ? '...' : stats.rejected}
            icon={MdCancel}
            variant="danger"
            subtext="Quality rejection logged"
          />
        </div>
      </div>

      {/* Chart Row 1: Weekly Specimen Pipeline Area Chart + Specimen Pipeline Stages Donut */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <AreaChartCard
            title="Weekly Specimen Intake & Pipeline Velocity"
            subtitle="Diagnostic test specimens admitted and reported over the last 7 clinical days"
            data={data?.charts?.weeklyPipeline?.data || [0, 0, 0, 0, 0, 0, stats.sampleCollected + stats.processing]}
            labels={data?.charts?.weeklyPipeline?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            unit="Specimens"
            color="#6366F1"
            gradientId="labWeeklyVelocityGrad"
            badgeText={data?.charts?.weeklyPipeline?.badgeText || `Released: ${stats.published}`}
            badgePositive={data?.charts?.weeklyPipeline?.badgePositive ?? true}
          />
        </div>
        <div className="col-12 col-lg-4">
          <DonutChartCard
            title="Specimen Pipeline Stages"
            subtitle="Real-time live custody and processing status"
            totalLabel="Specimens"
            segments={data?.charts?.pipelineStages || [
              { label: 'Intake / Pending', value: stats.pendingRequests, color: '#F59E0B' },
              { label: 'Sample Collected', value: stats.sampleCollected, color: '#0E9FAD' },
              { label: 'Bench Testing', value: stats.processing, color: '#6366F1' },
              { label: 'Awaiting Sign-off', value: stats.awaitingReview, color: '#3B82F6' },
              { label: 'Released / Dispatched', value: stats.published, color: '#10B981' },
              { label: 'Quality Rejected', value: stats.rejected, color: '#F43F5E' }
            ]}
          />
        </div>
      </div>

      {/* Chart Row 2: Monthly Diagnostic Intake & Report Release (Bar Chart) + 6-Month Rolling Trajectory (Area Chart) */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <BarChartCard
            title="Monthly Diagnostic Intake & Certified Reports"
            subtitle="Work orders admitted vs verified reports released over 6 months"
            bars={data?.charts?.monthlyCompletionBars?.length ? data.charts.monthlyCompletionBars : [
              { label: 'M1', val1: 0, val2: 0 },
              { label: 'M2', val1: 0, val2: 0 },
              { label: 'M3', val1: 0, val2: 0 },
              { label: 'M4', val1: 0, val2: 0 },
              { label: 'M5', val1: 0, val2: 0 },
              { label: 'M6', val1: stats.totalAssigned, val2: stats.published }
            ]}
            series={[
              { name: 'Intake Orders', color: '#6366F1' },
              { name: 'Released Reports', color: '#10B981' }
            ]}
          />
        </div>
        <div className="col-12 col-lg-6">
          <AreaChartCard
            title="6-Month Diagnostic Volume Trajectory"
            subtitle="Rolling historical trend of laboratory testing demand"
            data={data?.charts?.monthlyPipeline?.data || [0, 0, 0, 0, 0, stats.totalAssigned]}
            labels={data?.charts?.monthlyPipeline?.labels || ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']}
            unit="Orders"
            color="#0E9FAD"
            gradientId="labMonthlyVolumeGrad"
            badgeText="6-Mo Rolling Volume"
            badgePositive={true}
          />
        </div>
      </div>

      {/* Chart Row 3: Diagnostic Categories Donut + Urgency & Priority Breakdown Donut */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <DonutChartCard
            title="Diagnostic Test Categories"
            subtitle="Distribution of clinical pathology and diagnostic departments"
            totalLabel="Categories"
            segments={data?.charts?.categoriesDistribution || [
              { label: 'Hematology', value: stats.published || 1, color: '#0E9FAD' },
              { label: 'Biochemistry', value: stats.processing || 1, color: '#6366F1' }
            ]}
          />
        </div>
        <div className="col-12 col-lg-6">
          <DonutChartCard
            title="Clinical Test Priority & Urgency"
            subtitle="Routine normal, urgent priority & emergency stat requests"
            totalLabel="Orders"
            segments={data?.charts?.priorityDistribution || [
              { label: 'Routine (Normal)', value: stats.totalAssigned || 1, color: '#10B981' },
              { label: 'Urgent Priority', value: 0, color: '#F59E0B' },
              { label: 'Stat Emergency', value: 0, color: '#EF4444' }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;
