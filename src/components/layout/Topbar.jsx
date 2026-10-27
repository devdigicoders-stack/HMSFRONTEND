import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoMenu,
  IoLogOutOutline,
  IoPersonOutline,
  IoSettingsOutline,
  IoChevronDown
} from 'react-icons/io5';

const Topbar = ({ toggleMobile }) => {
  const { user, role, logout, confirmLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Compute title from pathname
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    const last = parts[parts.length - 1];
    if (last.toLowerCase() === 'dashboard') return 'Dashboard';
    return last
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getUserDisplayName = (fullName) => {
    if (!fullName) return 'User';
    const clean = fullName.replace(/\s*\(.*?\)\s*/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts[0].toLowerCase().startsWith('dr') && parts.length > 1) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  const getUserInitial = (fullName) => {
    if (!fullName) return 'U';
    const clean = fullName.replace(/^dr\.?\s+/i, '').replace(/\s*\(.*?\)\s*/g, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : fullName.charAt(0).toUpperCase();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="h-[70px] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 bg-white/85 backdrop-blur-md border-b border-slate-200/70 shadow-xs">
      {/* Left side: mobile toggle + page title */}
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={toggleMobile}
          className="btn btn-sm d-lg-none btn-light border"
          style={{ width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Toggle Navigation Menu"
        >
          <IoMenu size={22} color="var(--primary-green)" />
        </button>

        {/* Page Title */}
        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {getPageTitle()}
        </div>
      </div>

      {/* Right side: profile */}
      <div className="d-flex align-items-center gap-2">

        {/* User Profile Pill & Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="d-flex align-items-center gap-2 px-2 py-1 rounded-pill border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: showProfileMenu ? 'var(--primary-green, #059669)' : 'var(--border-subtle, #E2E8F0)',
              boxShadow: showProfileMenu ? '0 0 0 2px rgba(16, 185, 129, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-green, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.84rem',
                boxShadow: '0 2px 5px rgba(5, 150, 105, 0.25)',
                overflow: 'hidden'
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getUserInitial(user?.name)
              )}
            </div>
            <div className="d-none d-sm-block text-start" style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0F172A)', whiteSpace: 'nowrap' }}>
                {getUserDisplayName(user?.name)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748B)', textTransform: 'capitalize', fontWeight: 500 }}>
                {role}
              </div>
            </div>
            <IoChevronDown
              size={13}
              color="#94A3B8"
              style={{
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              className="glass-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 270,
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 14px 35px -4px rgba(15, 23, 42, 0.16), 0 6px 14px -2px rgba(15, 23, 42, 0.08)',
                padding: '0.6rem',
                zIndex: 1050
              }}
            >
              <div
                className="p-2.5 mb-2 rounded"
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A', lineHeight: 1.3 }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                  {user?.email}
                </div>
                <div
                  className="mt-1.5 d-inline-block px-2 py-0.5 rounded-pill"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7'
                  }}
                >
                  {role} Portal
                </div>
              </div>

              <div className="d-flex flex-column gap-1">
                {role === 'patient' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/patient/profile');
                    }}
                    className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                    style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <IoPersonOutline size={16} color="var(--primary-green, #059669)" /> My Medical Profile
                  </button>
                )}

                {role === 'doctor' && (
                  <>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/doctor/profile');
                      }}
                      className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                      style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IoPersonOutline size={16} color="var(--primary-green, #059669)" /> Physician Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/doctor/schedule');
                      }}
                      className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                      style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IoSettingsOutline size={16} color="#64748B" /> Schedule & Hours
                    </button>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/admin/profile');
                      }}
                      className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                      style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IoPersonOutline size={16} color="var(--primary-green, #059669)" /> Admin Profile & Security
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/admin/settings');
                      }}
                      className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                      style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IoSettingsOutline size={16} color="#64748B" /> Hospital Settings
                    </button>
                  </>
                )}

                {role === 'lab' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/lab/profile');
                    }}
                    className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded border-0"
                    style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 550, transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <IoPersonOutline size={16} color="var(--primary-green, #059669)" /> Staff Profile & Security
                  </button>
                )}

                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '0.2rem 0' }} />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (confirmLogout) confirmLogout();
                    else logout();
                  }}
                  className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded text-danger border-0"
                  style={{ fontSize: '0.82rem', fontWeight: 600, transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <IoLogOutOutline size={16} /> Sign Out of Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
