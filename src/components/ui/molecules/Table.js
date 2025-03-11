import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/utils';

/**
 * Table component that wraps all table elements
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Table content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Table style variant
 * @returns {JSX.Element} Table component
 */
const Table = ({ 
  children, 
  className = '', 
  variant = 'default', 
  ...props 
}) => {
  const variants = {
    default: '',
    striped: 'table-striped',
    bordered: 'table-bordered',
    compact: 'table-compact',
  };

  return (
    <div className="w-full overflow-auto rounded-lg">
      <table 
        className={cn(
          "w-full border-collapse", 
          variants[variant], 
          className
        )}
        role="table"
        {...props} 
      >
        {children}
      </table>
    </div>
  );
};

/**
 * Table header component for column headers
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} TableHeader component
 */
const TableHeader = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <thead 
    className={cn("bg-gray-50 dark:bg-gray-800", className)} 
    role="rowgroup"
    {...props} 
  >
    {children}
  </thead>
);

/**
 * Table body component for table content
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Body content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.loading - Whether the table is loading data
 * @returns {JSX.Element} TableBody component
 */
const TableBody = ({ 
  children, 
  className = '', 
  loading = false, 
  ...props 
}) => (
  <tbody 
    className={cn("relative", className)} 
    role="rowgroup"
    {...props} 
  >
    {loading && (
      <tr className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80">
        <td className="text-center p-4">
          <div className="inline-flex items-center">
            <svg 
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        </td>
      </tr>
    )}
    {children}
  </tbody>
);

/**
 * Table footer component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} TableFooter component
 */
const TableFooter = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <tfoot 
    className={cn(
      "bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700", 
      className
    )}
    role="rowgroup" 
    {...props} 
  >
    {children}
  </tfoot>
);

/**
 * Table row component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Row content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.selected - Whether the row is selected
 * @param {boolean} props.disabled - Whether the row is disabled
 * @param {boolean} props.interactive - Whether the row is clickable
 * @returns {JSX.Element} TableRow component
 */
const TableRow = ({ 
  children, 
  className = '', 
  selected = false, 
  disabled = false, 
  interactive = false, 
  ...props 
}) => (
  <tr 
    className={cn(
      "border-b dark:border-gray-700 transition-colors duration-150",
      interactive && "cursor-pointer",
      selected 
        ? "bg-primary-50 dark:bg-primary-900" 
        : "hover:bg-gray-50 dark:hover:bg-gray-800",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
    aria-selected={selected}
    aria-disabled={disabled}
    role="row"
    {...props} 
  >
    {children}
  </tr>
);

/**
 * Table head component for column headers
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header cell content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.sorted - Whether the column is sorted
 * @param {'ascending'|'descending'|'none'} props.sortDirection - Sort direction
 * @returns {JSX.Element} TableHead component
 */
const TableHead = ({ 
  children, 
  className = '', 
  sorted = false, 
  sortDirection = 'none', 
  ...props 
}) => (
  <th
    className={cn(
      "text-left p-3 font-medium text-gray-700 dark:text-gray-300",
      sorted && "bg-gray-100 dark:bg-gray-700",
      className
    )}
    aria-sort={sorted ? sortDirection : undefined}
    role="columnheader"
    scope="col"
    {...props}
  >
    <div className="flex items-center">
      {children}
      {sorted && (
        <span className="ml-1" aria-hidden="true">
          {sortDirection === 'ascending' ? '↑' : '↓'}
        </span>
      )}
    </div>
  </th>
);

/**
 * Table cell component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Cell content
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} TableCell component
 */
const TableCell = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <td
    className={cn("p-3 text-gray-900 dark:text-gray-100", className)}
    role="cell"
    {...props}
  >
    {children}
  </td>
);

// PropTypes
Table.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'striped', 'bordered', 'compact']),
};

TableHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableBody.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  loading: PropTypes.bool,
};

TableFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

TableRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  interactive: PropTypes.bool,
};

TableHead.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  sorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
};

TableCell.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

// Export all components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell
};

export default Table;