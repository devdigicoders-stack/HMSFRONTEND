import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import {
  IoDownloadOutline,
  IoFilterOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoSearchOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
  IoKeyOutline
} from 'react-icons/io5';
import config from '../../config/appConfig';

const ReportsSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'audit'

  // Report Generator State
  const [reportType, setReportType] = useState('appointments');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // System Audit Trail State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditRoleFilter, setAuditRoleFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // Generate Report
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setReportLoading(true);
    try {
      const res = await reportService.getSummary({
        reportType,
        startDate,
        endDate
      });
      setReportData(res.data.data);
      toast.success('Clinical operational report compiled.', { title: 'Report Ready' });
    } catch (err) {
      toast.error('Failed to compile filtered report.', { title: 'Error' });
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await reportService.getAuditLogs({
        page: auditPage,
        limit: 15,
        action: auditActionFilter,
        role: auditRoleFilter
      });
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch system audit logs.', { title: 'Audit Log Error' });
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditPage, auditActionFilter, auditRoleFilter]);

  // Export Report to CSV
  const handleExportReportCSV = () => {
    if (!reportData) return toast.warning('Generate a report first before exporting.');

    let headers = [];
    let rows = [];
    let filename = `Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'appointments') {
      const appts = reportData.appointments || [];
      if (appts.length === 0) return toast.warning('No appointments to export.');
      headers = ['Appt ID', 'Patient', 'Patient Phone', 'Doctor', 'Date', 'Time Slot', 'Status', 'Reason'];
      rows = appts.map((a) => [
        `APT-${a._id.substring(18).toUpperCase()}`,
        `"${a.patient?.name || ''}"`,
        `"${a.patient?.phone || ''}"`,
        `"Dr. ${a.doctor?.name || ''}"`,
        new Date(a.appointmentDate).toLocaleDateString(),
        `"${a.timeSlot?.start || ''} - ${a.timeSlot?.end || ''}"`,
        a.status,
        `"${(a.reasonForVisit || '').replace(/"/g, '""')}"`
      ]);
    } else if (reportType === 'lab') {
      const labs = reportData.labRequests || [];
      if (labs.length === 0) return toast.warning('No lab orders to export.');
      headers = ['Order ID', 'Patient', 'Test Name', 'Doctor', 'Priority', 'Status', 'Date'];
      rows = labs.map((l) => [
        `LAB-${l._id.substring(18).toUpperCase()}`,
        `"${l.patient?.name || ''}"`,
        `"${l.labTest?.testName || ''}"`,
        `"Dr. ${l.doctor?.name || 'OPD'}"`,
        l.priority || 'Normal',
        l.status,
        new Date(l.createdAt).toLocaleDateString()
      ]);
    } else {
      const patients = reportData.patients || [];
      if (patients.length === 0) return toast.warning('No patients to export.');
      headers = ['Patient ID', 'Name', 'Email', 'Phone', 'Registered Date', 'Status'];
      rows = patients.map((p) => [
        `PAT-${p._id.substring(18).toUpperCase()}`,
        `"${p.name || ''}"`,
        p.email,
        p.phone || '',
        new Date(p.createdAt).toLocaleDateString(),
        p.status
      ]);
    }

    downloadCSV(headers, rows, filename);
    toast.success('Report downloaded as CSV!', { title: 'Export Ready' });
  };

  // Export Audit Logs to CSV
  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) return toast.warning('No audit logs to export.');
    const headers = ['Action Code', 'Performed By', 'Role', 'Target Entity', 'Target ID', 'IP Address', 'Timestamp'];
    const rows = auditLogs.map((log) => [
      log.action,
      `"${log.performedBy?.name || 'System'}"`,
      log.role,
      log.targetEntity || '',
      log.targetId || '',
      log.ipAddress || '127.0.0.1',
      new Date(log.createdAt).toLocaleString()
    ]);
    downloadCSV(headers, rows, `System_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('System audit trail exported to CSV!', { title: 'Audit Exported' });
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    const action = log.action?.toLowerCase() || '';
    const user = log.performedBy?.name?.toLowerCase() || '';
    const email = log.performedBy?.email?.toLowerCase() || '';
    const target = log.targetEntity?.toLowerCase() || '';
    return action.includes(term) || user.includes(term) || email.includes(term) || target.includes(term);
  });

  // Audit Table Columns
  const auditColumns = [
    {
      header: 'Event Action',
      render: (log) => {
        const isSecurity = log.action.includes('PASSWORD') || log.action.includes('DELETED');
        const isCreate = log.action.includes('CREATED') || log.action.includes('BOOKED');
        return (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.22rem 0.55rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              backgroundColor: isSecurity ? '#FEF2F2' : isCreate ? '#ECFDF5' : '#EFF6FF',
              color: isSecurity ? '#DC2626' : isCreate ? '#059669' : '#2563EB',
              border: `1px solid ${isSecurity ? '#FCA5A5' : isCreate ? '#A7F3D0' : '#BFDBFE'}`
            }}
          >
            {log.action}
          </span>
        );
      }
    },
    {
      header: 'Performed By',
      render: (log) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>
            {log.performedBy?.name || 'System / Auto'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            {log.performedBy?.email || `Role: ${log.role}`}
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      render: (log) => (
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: '#F1F5F9',
            color: '#475569'
          }}
        >
          {log.role}
        </span>
      )
    },
    {
      header: 'Target Entity',
      render: (log) => (
        <div>
          <strong style={{ fontSize: '0.82rem', color: '#334155' }}>
            {log.targetEntity || 'System'}
          </strong>
          {log.targetId && (
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
              #{log.targetId.substring(18)}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'IP Address',
      render: (log) => (
        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748B' }}>
          {log.ipAddress || '127.0.0.1'}
        </span>
      )
    },
    {
      header: 'Timestamp',
      render: (log) => (
        <div style={{ fontSize: '0.82rem', color: '#334155' }}>
          <div>{new Date(log.createdAt).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {new Date(log.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Analytics & Enterprise Audit Suite"
        subtitle="Extract multi-dimensional clinical reports, export operational datasets, and monitor immutable security audit logs"
        actionButton={
          <div className="d-flex gap-2 flex-wrap">
            {activeTab === 'reports' ? (
              <button
                type="button"
                onClick={handleExportReportCSV}
                className="btn btn-primary-custom d-flex align-items-center gap-2"
              >
                <IoDownloadOutline size={18} /> Export Current Dataset (CSV)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExportAuditCSV}
                className="btn btn-primary-custom d-flex align-items-center gap-2"
              >
                <IoDownloadOutline size={18} /> Export Audit Trail (CSV)
              </button>
            )}
          </div>
        }
      />

      {/* Primary Tab Navigation */}
      <div className="d-flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('reports')}
          className={activeTab === 'reports' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.86rem', fontWeight: 650 }}
        >
          <IoDocumentTextOutline className="me-1" /> Clinical Operational Reports
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={activeTab === 'audit' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          style={{ fontSize: '0.86rem', fontWeight: 650 }}
        >
          <IoShieldCheckmarkOutline className="me-1" /> System Audit Trail ({auditTotal})
        </button>
      </div>

      {activeTab === 'reports' ? (
        <div className="row g-4 mb-4">
          {/* Report Filter & Generator Card */}
          <div className="col-12 col-lg-8">
            <GlassCard>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IoFilterOutline size={20} color="var(--primary-blue)" />
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Operational Report Generator
                </h5>
              </div>

              <form onSubmit={handleGenerateReport}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label-custom">Report Dataset</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="form-select-custom"
                    >
                      <option value="appointments">Appointments & OPD Intake</option>
                      <option value="lab">Laboratory Orders & Diagnostics</option>
                      <option value="patients">Patient Registrations Directory</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label-custom">From Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label-custom">To Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="btn-primary-custom"
                  >
                    {reportLoading ? 'Compiling Report...' : 'Compile Operational Report'}
                  </button>
                </div>
              </form>

              {/* Generated Report Summary Table */}
              {reportData && (
                <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                      Compiled Report Dataset ({reportType.toUpperCase()})
                    </h6>
                    <button
                      type="button"
                      onClick={handleExportReportCSV}
                      className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem', fontWeight: 650 }}
                    >
                      <IoDownloadOutline size={15} /> Download CSV
                    </button>
                  </div>

                  {reportType === 'appointments' && reportData.appointments && (
                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Token ID</th>
                            <th>Patient</th>
                            <th>Attending Physician</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.appointments.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-secondary">
                                No appointments found for the specified date window.
                              </td>
                            </tr>
                          ) : (
                            reportData.appointments.map((a) => (
                              <tr key={a._id}>
                                <td>
                                  <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem' }}>
                                    #{a._id.substring(18).toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 650 }}>{a.patient?.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    {a.patient?.phone}
                                  </div>
                                </td>
                                <td>Dr. {a.doctor?.name}</td>
                                <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                                <td>
                                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>
                                    {a.timeSlot?.start} - {a.timeSlot?.end}
                                  </span>
                                </td>
                                <td>
                                  <StatusBadge status={a.status} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === 'lab' && reportData.labRequests && (
                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Order Ref</th>
                            <th>Patient</th>
                            <th>Diagnostic Test</th>
                            <th>Ordering Doctor</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.labRequests.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-secondary">
                                No lab specimen requests found for the specified window.
                              </td>
                            </tr>
                          ) : (
                            reportData.labRequests.map((l) => (
                              <tr key={l._id}>
                                <td>
                                  <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem' }}>
                                    LAB-{l._id.substring(18).toUpperCase()}
                                  </span>
                                </td>
                                <td>{l.patient?.name}</td>
                                <td>
                                  <strong>{l.labTest?.testName}</strong>
                                </td>
                                <td>Dr. {l.doctor?.name || 'OPD'}</td>
                                <td>
                                  <StatusBadge status={l.status} />
                                </td>
                                <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === 'patients' && reportData.patients && (
                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Patient ID</th>
                            <th>Full Name</th>
                            <th>Email Address</th>
                            <th>Phone</th>
                            <th>Registered Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.patients.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-secondary">
                                No patient registrations found.
                              </td>
                            </tr>
                          ) : (
                            reportData.patients.map((p) => (
                              <tr key={p._id}>
                                <td>
                                  <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem' }}>
                                    PAT-{p._id.substring(18).toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <strong>{p.name}</strong>
                                </td>
                                <td>{p.email}</td>
                                <td>{p.phone || '—'}</td>
                                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <StatusBadge status={p.status} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* System Profile & Compliance Card */}
          <div className="col-12 col-lg-4">
            <GlassCard style={{ height: '100%' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IoSettingsOutline size={20} color="var(--primary-blue)" />
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Enterprise System Architecture
                </h5>
              </div>

              <div className="d-flex flex-column gap-3" style={{ fontSize: '0.85rem' }}>
                <div>
                  <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>
                    HOSPITAL LEGAL ENTITY
                  </span>
                  <strong>{config.hospitalFullName}</strong>
                </div>

                <div>
                  <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>
                    CONFIGURED TIMEZONE
                  </span>
                  <strong>Asia/Kolkata (UTC+05:30)</strong>
                </div>

                <div>
                  <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>
                    API SECURITY & HASHING
                  </span>
                  <span className="badge-status badge-status-success">JWT + Bcrypt (Salt 10)</span>
                </div>

                <div>
                  <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>
                    AUDIT LOG RETENTION
                  </span>
                  <strong>Infinite MongoDB Audit Collection</strong>
                </div>

                <div>
                  <span className="text-secondary d-block" style={{ fontSize: '0.74rem' }}>
                    ROLE ISOLATION COMPLIANCE
                  </span>
                  <strong className="text-success">Admin / Doctor / Patient / Lab Staff</strong>
                </div>

                <div className="pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    All user creations, appointments, status modifications and password resets are automatically signed and stored in the immutable AuditLog collection.
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* ==================== AUDIT TRAIL TAB ==================== */
        <GlassCard>
          <div className="row g-3 align-items-center mb-3">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--border-subtle)' }}>
                  <IoSearchOutline color="var(--text-secondary)" />
                </span>
                <input
                  type="text"
                  placeholder="Search by action, administrator, user name, or entity..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="form-control form-control-custom border-start-0"
                />
              </div>
            </div>

            <div className="col-6 col-md-4">
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="form-select-custom"
              >
                <option value="all">Action: All Audit Events</option>
                <option value="ADMIN_CREATED_USER">ADMIN_CREATED_USER</option>
                <option value="ADMIN_RESET_PASSWORD">ADMIN_RESET_PASSWORD</option>
                <option value="USER_UPDATED">USER_UPDATED</option>
                <option value="APPOINTMENT_BOOKED">APPOINTMENT_BOOKED</option>
                <option value="APPOINTMENT_STATUS_UPDATED">APPOINTMENT_STATUS_UPDATED</option>
                <option value="LAB_TEST_CATALOG_UPDATED">LAB_TEST_CATALOG_UPDATED</option>
                <option value="LAB_TEST_STATUS_TOGGLED">LAB_TEST_STATUS_TOGGLED</option>
                <option value="LAB_TEST_DELETED">LAB_TEST_DELETED</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                value={auditRoleFilter}
                onChange={(e) => {
                  setAuditRoleFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="form-select-custom"
              >
                <option value="all">Role: All Actor Roles</option>
                <option value="admin">Admin Actions Only</option>
                <option value="doctor">Doctor Actions Only</option>
                <option value="patient">Patient Actions Only</option>
                <option value="lab">Lab Staff Actions Only</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={auditColumns}
            data={filteredAuditLogs}
            loading={auditLoading}
            emptyMessage="No audit trail events matching query."
          />

          {/* Audit Pagination */}
          <div
            className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top"
            style={{ borderColor: 'var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
          >
            <div>
              Total Audit Entries: <strong>{auditTotal}</strong>
            </div>
            <div className="d-flex gap-2">
              <button
                disabled={auditPage <= 1}
                onClick={() => setAuditPage(auditPage - 1)}
                className="btn btn-sm btn-light border"
              >
                Previous
              </button>
              <span className="align-self-center px-2">
                Page {auditPage} of {Math.max(Math.ceil(auditTotal / 15), 1)}
              </span>
              <button
                disabled={auditPage * 15 >= auditTotal}
                onClick={() => setAuditPage(auditPage + 1)}
                className="btn btn-sm btn-light border"
              >
                Next
              </button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ReportsSettings;
