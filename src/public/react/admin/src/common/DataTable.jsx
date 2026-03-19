// src/components/common/DataTable.jsx
import React from 'react';

const DataTable = ({ headers, children, className = '' }) => {
  return (
    <div className="table-container">
      <table className={`data-table ${className}`}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default DataTable;