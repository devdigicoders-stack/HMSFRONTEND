import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { doctorService } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MdSearch,
  MdLocalHospital,
  MdLocationOn,
  MdSchool,
  MdWorkHistory,
  MdSchedule,
  MdAttachMoney,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
  MdArrowForward,
  MdChevronLeft,
  MdChevronRight,
  MdInfoOutline
} from 'react-icons/md';
import {
  IoCalendarOutline,
  IoMedkitOutline,
  IoTimeOutline,
  IoPersonOutline
} from 'react-icons/io5';

const DoctorDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All'); // 'All', 'available_only'
  const [sortBy, setSortBy] = useState('experience'); // 'experience', 'fee_asc', 'fee_desc', 'name'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 6;

  // Doctor Details Modal
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        specialization: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
        isAvailable: availabilityFilter === 'available_only' ? 'true' : undefined,
        sortBy
      };

      const res = await doctorService.getDoctors(params);
      const docs = res.data.doctors || [];
      // Double check active filter
      const activeDocs = docs.filter(d => d.user && d.user.status === 'active');
      setDoctors(activeDocs);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || activeDocs.length);
    } catch (err) {
      console.error('Error fetching doctor directory:', err);
      toast.error('Unable to load hospital physicians directory. Please try again.', { title: 'Directory Notice' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, selectedSpecialty, availabilityFilter, sortBy]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchDoctors();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleOpenDoctorModal = (doctor) => {
    setSelectedDoctorModal(doctor);
    setIsModalOpen(true);
  };

  const handleBookDoctor = (doctorId) => {
    navigate(`/patient/book?doctorId=${doctorId}`);
  };

  const cleanDoctorName = (name) => {
    if (!name) return 'Physician';
    return name.replace(/^Dr\.?\s*/i, '');
  };

  const SPECIALTIES_LIST = [
    'All',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'General Medicine',
    'Dermatology',
    'Endocrinology',
    'Oncology'
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Specialist Directory"
        subtitle="Search verified physicians, check clinic availability, and schedule in-person outpatient consultations"
        actionButton={
          <Link to="/patient/book" className="btn-primary-custom d-flex align-items-center gap-2">
            <IoCalendarOutline size={16} /> Direct Appointment Booking
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <GlassCard className="mb-4 p-3">
        <div className="row g-3 align-items-center">
          {/* Search Field */}
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <MdSearch
                size={20}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-custom"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Specialty Dropdown */}
          <div className="col-6 col-md-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="All">All Specialties</option>
              {SPECIALTIES_LIST.filter(s => s !== 'All').map((spec, idx) => (
                <option key={idx} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="col-6 col-md-2">
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="All">All Doctors</option>
              <option value="available_only">Accepting Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="col-12 col-md-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="form-select-custom"
            >
              <option value="experience">Sort: Experience</option>
              <option value="fee_asc">Fee: Low to High</option>
              <option value="fee_desc">Fee: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Specialty Pills */}
        <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.25rem' }}>
            Popular:
          </span>
          {SPECIALTIES_LIST.slice(0, 6).map((spec, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedSpecialty(spec);
                setPage(1);
              }}
              className={`btn btn-sm ${selectedSpecialty === spec ? 'btn-primary-custom' : 'btn-light-custom'}`}
              style={{ fontSize: '0.76rem', borderRadius: '20px', padding: '0.2rem 0.75rem' }}
            >
              {spec}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Results Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-1">
        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{doctors.length}</strong> of <strong>{totalCount}</strong> eligible medical specialists
        </span>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('All');
              setAvailabilityFilter('All');
            }}
            className="btn btn-sm btn-link p-0 text-decoration-none"
            style={{ fontSize: '0.8rem' }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner text="Retrieving doctor profiles and clinic schedules..." />
      ) : doctors.length === 0 ? (
        /* Empty State */
        <GlassCard className="text-center py-5">
          <IoMedkitOutline size={54} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h5 style={{ fontWeight: 800, color: 'var(--text-main)' }}>No matching physicians found</h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 450, margin: '0 auto 1.5rem' }}>
            We could not find any active doctors matching your search query or specialty filter. Please adjust your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('All');
              setAvailabilityFilter('All');
            }}
            className="btn-primary-custom btn-sm"
          >
            Reset Filters
          </button>
        </GlassCard>
      ) : (
        /* Doctors Grid */
        <div className="row g-4 mb-4">
          {doctors.map((doctor) => {
            const isEligible = doctor.isAvailable !== false;
            const displayName = cleanDoctorName(doctor.user?.name);
            return (
              <div key={doctor._id} className="col-12 col-md-6 col-xl-4 d-flex">
                <div className="doctor-card p-4 w-100">
                  {/* Doctor Top Row: Avatar & Details */}
                  <div className="d-flex gap-3 align-items-start mb-3">
                    <div className="doctor-avatar-circle">
                      {doctor.user?.avatar ? (
                        <img
                          src={doctor.user.avatar}
                          alt={displayName}
                        />
                      ) : (
                        <IoPersonOutline />
                      )}
                    </div>

                    <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                          className={`badge-status ${isEligible ? 'badge-status-success' : 'badge-status-danger'}`}
                          style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}
                        >
                          {isEligible ? 'Accepting Patients' : 'Not Available'}
                        </span>
                      </div>

                      <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.08rem', color: 'var(--text-main)' }} className="text-truncate" title={`Dr. ${displayName}`}>
                        Dr. {displayName}
                      </h5>

                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '0.15rem' }} className="text-truncate" title={doctor.specialization}>
                        {doctor.specialization}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }} className="text-truncate" title={doctor.department}>
                        {doctor.department}
                      </div>
                    </div>
                  </div>

                  {/* Qualifications & Experience Badges */}
                  <div className="p-2.5 rounded-3 mb-3" style={{ backgroundColor: 'rgba(244, 247, 251, 0.75)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center gap-2 mb-1.5 text-truncate">
                      <MdSchool size={16} className="text-secondary flex-shrink-0" />
                      <span className="text-truncate" title={doctor.qualifications}>
                        {doctor.qualifications || 'Certified Medical Specialist'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="d-flex align-items-center gap-1 text-secondary">
                        <MdWorkHistory size={15} /> <strong>{doctor.experienceYears || 0} Years</strong> Experience
                      </span>
                      <span className="text-secondary">
                        Fee: <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>₹{doctor.consultationFee || 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Working Hours & Room */}
                  <div className="mb-3" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="d-flex align-items-center gap-1">
                        <IoTimeOutline size={14} className="text-primary flex-shrink-0" />
                        Hours: <strong>{doctor.workingHours?.start || '09:00'} - {doctor.workingHours?.end || '17:00'}</strong>
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <MdLocationOn size={14} className="text-danger flex-shrink-0" />
                        Room: <strong>{doctor.roomNumber || 'OPD'}</strong>
                      </span>
                    </div>

                    {/* Available Days */}
                    <div className="mt-1 text-truncate" title={doctor.availableDays?.join(', ') || 'Mon, Tue, Wed, Thu, Fri'}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Days: </span>
                      <span className="text-secondary">
                        {doctor.availableDays?.join(', ') || 'Mon, Tue, Wed, Thu, Fri'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto pt-3 border-top d-flex gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenDoctorModal(doctor)}
                      className="btn btn-sm btn-light-custom flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0' }}
                    >
                      <MdInfoOutline size={15} /> View Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookDoctor(doctor.user?._id)}
                      disabled={!isEligible}
                      className="btn btn-sm btn-primary-custom flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0' }}
                    >
                      <IoCalendarOutline size={15} /> Book Visit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn-sm btn-light-custom"
            style={{ width: 36, height: 36, padding: 0 }}
          >
            <MdChevronLeft size={20} />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`btn btn-sm ${page === i + 1 ? 'btn-primary-custom' : 'btn-light-custom'}`}
              style={{ width: 36, height: 36, padding: 0, fontWeight: 700 }}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-sm btn-light-custom"
            style={{ width: 36, height: 36, padding: 0 }}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Doctor Detailed Profile Modal */}
      {selectedDoctorModal && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Doctor Profile — Dr. ${cleanDoctorName(selectedDoctorModal.user?.name)}`}
        >
          <div>
            <div className="d-flex gap-3 align-items-center mb-4">
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--light-blue)',
                  color: 'var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: '3px solid var(--border-subtle)',
                  flexShrink: 0
                }}
              >
                {selectedDoctorModal.user?.avatar ? (
                  <img
                    src={selectedDoctorModal.user.avatar}
                    alt={cleanDoctorName(selectedDoctorModal.user.name)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <IoPersonOutline />
                )}
              </div>

              <div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem' }}>
                  Dr. {cleanDoctorName(selectedDoctorModal.user?.name)}
                </h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                  {selectedDoctorModal.specialization} • {selectedDoctorModal.department}
                </div>
                <div className="mt-1">
                  <span className={`badge-status ${selectedDoctorModal.isAvailable !== false ? 'badge-status-success' : 'badge-status-danger'}`}>
                    {selectedDoctorModal.isAvailable !== false ? 'Accepting Appointments' : 'Temporarily Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Biography */}
            {selectedDoctorModal.bio && (
              <div className="mb-3">
                <label className="form-label-custom">Clinical Biography & Speciality</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(244, 247, 251, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  {selectedDoctorModal.bio}
                </p>
              </div>
            )}

            {/* Medical Credentials Table */}
            <div className="row g-3 mb-4" style={{ fontSize: '0.84rem' }}>
              <div className="col-6">
                <span className="text-secondary d-block">Qualifications</span>
                <strong>{selectedDoctorModal.qualifications}</strong>
              </div>
              <div className="col-6">
                <span className="text-secondary d-block">Clinical Experience</span>
                <strong>{selectedDoctorModal.experienceYears} Years Practicing</strong>
              </div>
              <div className="col-6">
                <span className="text-secondary d-block">Consultation Fee</span>
                <strong style={{ color: 'var(--primary-blue)', fontSize: '1.05rem' }}>
                  ₹{selectedDoctorModal.consultationFee}
                </strong>
              </div>
              <div className="col-6">
                <span className="text-secondary d-block">OPD Chamber / Room</span>
                <strong>{selectedDoctorModal.roomNumber}</strong>
              </div>
              <div className="col-12">
                <span className="text-secondary d-block">Weekly Clinic Schedule</span>
                <strong>{selectedDoctorModal.availableDays?.join(', ')}</strong> ({selectedDoctorModal.workingHours?.start} - {selectedDoctorModal.workingHours?.end})
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary-custom"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleBookDoctor(selectedDoctorModal.user?._id || selectedDoctorModal._id);
                }}
                disabled={selectedDoctorModal.isAvailable === false}
                className="btn-primary-custom"
              >
                <IoCalendarOutline size={16} /> Schedule Appointment Now
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorDirectory;
