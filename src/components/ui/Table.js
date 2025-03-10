// components/ui/table.js
import React from 'react';

export const Table = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: '',
    striped: 'table-striped',
    bordered: 'table-bordered',
    compact: 'table-compact',
  };

  return (
    <div className="w-full overflow-auto rounded-lg">
      <table 
        className={`w-full border-collapse ${variants[variant]} ${className}`}
        role="table"
        {...props} 
      />
    </div>
  );
};

export const TableHeader = ({ className, ...props }) => (
  <thead 
    className={`bg-gray-50 dark:bg-gray-800 ${className}`} 
    role="rowgroup"
    {...props} 
  />
);

export const TableBody = ({ className, loading, ...props }) => (
  <tbody 
    className={`relative ${className}`} 
    role="rowgroup"
    {...props} 
  >
    {loading && (
      <tr className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80">
        <td className="text-center p-4">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        </td>
      </tr>
    )}
    {props.children}
  </tbody>
);

export const TableFooter = ({ className, ...props }) => (
  <tfoot 
    className={`bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}
    role="rowgroup" 
    {...props} 
  />
);

export const TableRow = ({ className, selected, disabled, interactive, ...props }) => (
  <tr 
    className={`
      border-b dark:border-gray-700 
      ${interactive ? 'cursor-pointer' : ''}
      ${selected ? 'bg-primary-50 dark:bg-primary-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} 
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      transition-colors duration-150
      ${className}
    `}
    aria-selected={selected}
    aria-disabled={disabled}
    role="row"
    {...props} 
  />
);

export const TableHead = ({ className, sorted, sortDirection, ...props }) => (
  <th
    className={`
      text-left p-3 font-medium text-gray-700 dark:text-gray-300
      ${sorted ? 'bg-gray-100 dark:bg-gray-700' : ''}
      ${className}
    `}
    aria-sort={sorted ? sortDirection : undefined}
    role="columnheader"
    scope="col"
    {...props}
  >
    <div className="flex items-center">
      {props.children}
      {sorted && (
        <span className="ml-1">
          {sortDirection === 'ascending' ? '↑' : '↓'}
        </span>
      )}
    </div>
  </th>
);

export const TableCell = ({ className, ...props }) => (
  <td
    className={`p-3 text-gray-900 dark:text-gray-100 ${className}`}
    role="cell"
    {...props}
  />
);