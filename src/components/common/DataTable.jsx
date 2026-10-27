import React from 'react';

const DataTable = ({
  columns,
  data,
  keyField = '_id',
  emptyMessage = 'No records found matching criteria.',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-4 text-center text-muted" style={{ fontSize: '0.9rem' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-5 text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="custom-table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={col.style || {}}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row[keyField] || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={col.cellStyle || {}}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
