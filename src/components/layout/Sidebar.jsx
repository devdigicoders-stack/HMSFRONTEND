import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard,
  MdPeople,
  MdLocalHospital,
  MdEventNote,
  MdBiotech,
  MdBarChart,
  MdHistory,
  MdPerson,
  MdSchedule,
  MdAssignment,
  MdListAlt,
  MdSettings,
  MdDomain,
  MdLogout
} from 'react-icons/md';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import HospitalBrandLogo from '../common/HospitalBrandLogo';

const Sidebar = ({ mobileOpen, closeMobile, collapsed, toggleCollapsed }) => {
  const { role, user, logout, confirmLogout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // When user collapsed sidebar, hovering temporarily expands it!
  const isExpanded = !collapsed || isHovered;

  // Role specific navigation grouped by clinical department
  const getNavSections = () => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Overview',
            items: [
              { name: 'Dashboard', path: '/admin/dashboard', icon: MdDashboard }
            ]
          },
          {
            title: 'Clinical Operations',
            items: [
              { name: 'Doctors & Staff', path: '/admin/doctors', icon: MdLocalHospital },
              { name: 'Departments', path: '/admin/departments', icon: MdDomain },
              { name: 'Patient Directory', path: '/admin/patients', icon: MdPerson },
              { name: 'Appointments Docket', path: '/admin/appointments', icon: MdEventNote }
            ]
          },
          {
            title: 'Diagnostics & System',
            items: [
              { name: 'Laboratory Suite', path: '/admin/laboratory', icon: MdBiotech },
              { name: 'User Management', path: '/admin/users', icon: MdPeople },
              { name: 'Reports & Audit', path: '/admin/reports', icon: MdBarChart },
              { name: 'Hospital Settings', path: '/admin/settings', icon: MdSettings }
            ]
          },
          {
            title: 'My Account',
            items: [
              { name: 'Admin Profile', path: '/admin/profile', icon: MdPerson }
            ]
          }
        ];
      case 'doctor':
        return [
          {
            title: 'Physician Console',
            items: [
              { name: 'Dashboard', path: '/doctor/dashboard', icon: MdDashboard },
              { name: 'Appointments', path: '/doctor/appointments', icon: MdEventNote },
              { name: 'My Patients', path: '/doctor/patients', icon: MdPeople }
            ]
          },
          {
            title: 'Clinical Orders',
            items: [
              { name: 'Prescriptions', path: '/doctor/prescriptions', icon: MdAssignment },
              { name: 'Lab Test Requests', path: '/doctor/lab-requests', icon: MdBiotech }
            ]
          },
          {
            title: 'Schedule & Profile',
            items: [
              { name: 'Availability & Hours', path: '/doctor/schedule', icon: MdSchedule },
              { name: 'Doctor Profile', path: '/doctor/profile', icon: MdPerson }
            ]
          }
        ];
      case 'patient':
        return [
          {
            title: 'Patient Portal',
            items: [
              { name: 'Dashboard', path: '/patient/dashboard', icon: MdDashboard },
              { name: 'Find Doctors', path: '/patient/doctors', icon: MdLocalHospital },
              { name: 'Book Appointment', path: '/patient/book', icon: MdEventNote },
              { name: 'My Appointments', path: '/patient/appointments', icon: MdSchedule }
            ]
          },
          {
            title: 'Health Records',
            items: [
              { name: 'Consultation Records', path: '/patient/medical-records', icon: MdHistory },
              { name: 'Lab Reports', path: '/patient/lab-reports', icon: MdBiotech }
            ]
          },
          {
            title: 'My Account',
            items: [
              { name: 'Profile & Settings', path: '/patient/profile', icon: MdPerson }
            ]
          }
        ];
      case 'lab':
        return [
          {
            title: 'Pathology Desk',
            items: [
              { name: 'Lab Dashboard', path: '/lab/dashboard', icon: MdDashboard }
            ]
          },
          {
            title: 'Diagnostics Workflow',
            items: [
              { name: 'Specimen Work Queue', path: '/lab/queue', icon: MdListAlt },
              { name: 'Result Entry & Review', path: '/lab/results', icon: MdBiotech }
            ]
          },
          {
            title: 'Catalog',
            items: [
              { name: 'Test Catalog', path: '/lab/catalog', icon: MdBiotech }
            ]
          },
          {
            title: 'My Account',
            items: [
              { name: 'Staff Profile', path: '/lab/profile', icon: MdPerson }
            ]
          }
        ];
      default:
        return [];
    }
  };

  const navSections = getNavSections();

  return (
    <aside
      onMouseEnter={() => {
        if (collapsed) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (collapsed) setIsHovered(false);
      }}
      className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out select-none bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 shadow-2xl text-slate-400 ${mobileOpen ? 'left-0' : '-left-[290px] lg:left-0'
        } ${isExpanded ? 'w-[266px]' : 'w-[76px]'} ${isHovered && collapsed ? 'shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/15' : ''
        }`}
    >
      {/* Brand & Logo Header */}
      <div className="h-[70px] min-h-[70px] border-b border-white/10 flex items-center bg-slate-900/80 backdrop-blur-md px-3.5">
        {!isExpanded ? (
          <div
            className="flex flex-col items-center justify-center w-full py-2 gap-1 cursor-pointer group"
            onClick={toggleCollapsed}
            title="Click to expand sidebar"
          >
            <HospitalBrandLogo size={32} className="group-hover:scale-105 transition-transform" />
            <div className="flex items-center justify-center w-5.5 h-4 rounded bg-white/10 border border-white/15 text-slate-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 group-hover:text-emerald-400 transition-all">
              <IoChevronForward size={11} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
              <HospitalBrandLogo size={32} />
              <div className="overflow-hidden leading-tight min-w-0">
                <div className="font-bold text-sm text-white tracking-tight truncate">
                  LifeCare Hospital
                </div>
                <div className="text-[11px] font-semibold text-emerald-400 tracking-wider truncate">
                  Management Console
                </div>
              </div>
            </div>

            {/* Desktop Collapse / Pin Toggle Button */}
            {toggleCollapsed && (
              <button
                onClick={() => {
                  toggleCollapsed();
                  if (collapsed) setIsHovered(false);
                }}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all shrink-0 cursor-pointer ml-2"
                title={collapsed ? "Click to lock expanded" : "Collapse sidebar"}
                aria-label="Toggle sidebar collapse"
              >
                <IoChevronBack size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${!isExpanded ? 'p-2' : 'p-3'}`}>
        {navSections.map((sec, secIdx) => (
          <div key={secIdx} className="mb-2">
            {!isExpanded ? (
              secIdx > 0 && <div className="w-8 h-px bg-white/10 my-2 mx-auto" />
            ) : (
              <div className="text-[10.5px] font-semibold uppercase text-slate-500 tracking-wider my-2 px-2">
                {sec.title}
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {sec.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => {
                      closeMobile();
                      if (collapsed) setIsHovered(false);
                    }}
                    title={!isExpanded ? item.name : undefined}
                    style={{ textDecoration: 'none' }}
                    className={({ isActive }) =>
                      !isExpanded
                        ? `relative group w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all cursor-pointer ${isActive
                          ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
                          : '!text-slate-400 hover:!text-white hover:bg-white/5'
                        }`
                        : `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 !text-white font-semibold shadow-xs'
                          : '!text-slate-400 hover:!text-white hover:bg-white/5 font-medium'
                        }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={20}
                          className={`shrink-0 transition-all ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''
                            }`}
                        />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                        {!isExpanded && (
                          <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                            {item.name}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Helpline & User Footprint */}
      <div className={`border-t border-white/10 bg-slate-950/85 backdrop-blur-md ${!isExpanded ? 'py-3 px-1 flex flex-col items-center justify-center gap-2' : 'p-3.5'}`}>
        {!isExpanded ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-lg ring-2 ring-white/15 cursor-pointer overflow-hidden"
              title={`${user?.name || 'User'} (${role})`}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <button
              onClick={confirmLogout || logout}
              className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <MdLogout size={16} />
            </button>
          </div>
        ) : (
          /* User Card & Logout */
          <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white/10 shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="overflow-hidden leading-tight min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize truncate font-medium">
                    {role}
                  </div>
                </div>
              </div>

              <button
                onClick={confirmLogout || logout}
                className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white hover:scale-105 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <MdLogout size={16} />
              </button>
            </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
