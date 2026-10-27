import React from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  const navBtnStyle = (disabled) => ({
    width: 32,
    height: 32,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    border: '1.5px solid #E2E8F0',
    borderRadius: '8px',
    color: disabled ? '#CBD5E1' : '#475569',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1
  });

  const pageBtnStyle = (isActive) => ({
    width: 32,
    height: 32,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: isActive ? 700 : 500,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: isActive
      ? 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)'
      : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#334155',
    border: isActive ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: isActive ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none'
  });

  return (
    <div
      className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3"
      style={{ borderTop: '1px solid #F1F5F9' }}
    >
      <div style={{
        fontSize: '0.73rem',
        color: '#64748B',
        fontWeight: 500,
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        Showing{' '}
        <span style={{ fontWeight: 650, color: '#1E293B' }}>{startItem}</span>
        {' '}to{' '}
        <span style={{ fontWeight: 650, color: '#1E293B' }}>{endItem}</span>
        {totalItems > 0 && (
          <>
            {' '}of{' '}
            <span style={{ fontWeight: 650, color: '#1E293B' }}>{totalItems}</span>
            {' '}records
          </>
        )}
      </div>

      <div className="d-flex align-items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={navBtnStyle(currentPage === 1)}
          title="Previous page"
        >
          <IoChevronBack size={14} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={pageBtnStyle(p === currentPage)}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={navBtnStyle(currentPage === totalPages)}
          title="Next page"
        >
          <IoChevronForward size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
