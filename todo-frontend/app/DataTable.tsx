import React, { useState } from "react";

export interface TableColumn<T> {
  name: string;
  selector?: (row: T) => any;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  pagination?: boolean;
  paginationPerPage?: number;
  progressPending?: boolean;
  highlightOnHover?: boolean;
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  pagination = false,
  paginationPerPage = 10,
  progressPending = false,
  highlightOnHover = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const column = columns.find(col => col.name === sortField);
    if (!column?.selector) return 0;
    const aVal = column.selector(a);
    const bVal = column.selector(b);
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * paginationPerPage, currentPage * paginationPerPage)
    : sortedData;

  const totalPages = Math.ceil(sortedData.length / paginationPerPage);

  if (progressPending)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  onClick={() => column.sortable && column.selector && handleSort(column.name)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" : ""
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    {column.sortable && sortField === column.name && (
                      <span className="text-blue-600">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className={highlightOnHover ? "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" : ""}
              >
                {columns.map((column, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {column.cell ? column.cell(row) : column.selector ? column.selector(row) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * paginationPerPage) + 1} to {Math.min(currentPage * paginationPerPage, sortedData.length)} of {sortedData.length} entries
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {paginatedData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}