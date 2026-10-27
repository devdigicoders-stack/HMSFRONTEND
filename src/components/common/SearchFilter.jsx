import React from 'react';
import { IoSearchOutline, IoCloseCircleOutline } from 'react-icons/io5';

const SearchFilter = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search records...',
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = 'All Statuses',
  extraFilterValue,
  onExtraFilterChange,
  extraFilterOptions = [],
  extraFilterLabel = 'All Categories',
  onReset
}) => {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      {/* Search Input */}
      <div
        className="d-flex align-items-center gap-2 flex-grow-1"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '10px',
          padding: '0.35rem 0.75rem',
          minWidth: 200,
          maxWidth: 380,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#10B981';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
        }}
      >
        <IoSearchOutline size={16} color="#10B981" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '0.8rem',
            fontWeight: 450,
            color: '#1E293B',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}
            title="Clear search"
          >
            <IoCloseCircleOutline size={16} />
          </button>
        )}
      </div>

      {/* Primary Filter Dropdown */}
      {filterOptions.length > 0 && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="form-select-custom"
          style={{
            width: 'auto',
            minWidth: 130,
            height: 36,
            fontSize: '0.78rem',
            padding: '0.35rem 2rem 0.35rem 0.7rem'
          }}
        >
          <option value="">{filterLabel}</option>
          {filterOptions.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
      )}

      {/* Extra Filter Dropdown */}
      {extraFilterOptions.length > 0 && (
        <select
          value={extraFilterValue}
          onChange={(e) => onExtraFilterChange(e.target.value)}
          className="form-select-custom"
          style={{
            width: 'auto',
            minWidth: 130,
            height: 36,
            fontSize: '0.78rem',
            padding: '0.35rem 2rem 0.35rem 0.7rem'
          }}
        >
          <option value="">{extraFilterLabel}</option>
          {extraFilterOptions.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
      )}

      {/* Reset Filter Button */}
      {onReset && (searchQuery || filterValue || extraFilterValue) && (
        <button
          onClick={onReset}
          style={{
            height: 36,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0 0.75rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default SearchFilter;
