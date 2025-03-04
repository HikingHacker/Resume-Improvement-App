// components/ui/table.js
import React from 'react';

export const Table = ({ className, ...props }) => (
  <div className="w-full overflow-auto">
    <table 
      className={`w-full border-collapse ${className}`} 
      {...props} 
    />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={className} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={className} {...props} />
);

export const TableFooter = ({ className, ...props }) => (
  <tfoot className={`bg-gray-50 ${className}`} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr 
    className={`border-b hover:bg-gray-50 ${className}`}
    {...props} 
  />
);

export const TableHead = ({ className, ...props }) => (
  <th
    className={`text-left p-2 font-medium border ${className}`}
    {...props}
  />
);

export const TableCell = ({ className, ...props }) => (
  <td
    className={`p-2 border ${className}`}
    {...props}
  />
);