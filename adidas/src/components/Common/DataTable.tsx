import React, { useState, useMemo } from "react";
import { downloadCSV } from "../../services/api";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, any>> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  exportFilename?: string;
  searchPlaceholder?: string;
  searchKey?: keyof T | (keyof T)[];
  actions?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  exportFilename = "export_data",
  searchPlaceholder = "Search records...",
  searchKey,
  actions,
  pageSize = 10,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKey) {
        if (Array.isArray(searchKey)) {
          return searchKey.some((k) => String(row[k] || "").toLowerCase().includes(term));
        }
        return String(row[searchKey] || "").toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        String(val || "").toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleExportCSV = () => {
    downloadCSV(exportFilename, sortedData);
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm">
      {/* Table Header / Action Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50">
        <div>
          {title && (
            <h2 className="text-sm font-black uppercase tracking-wider text-black font-mono">
              {title}
            </h2>
          )}
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Showing {filteredData.length} total entries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="bg-white border border-gray-300 text-xs text-black px-3 py-1.5 focus:outline-none focus:border-black w-48 sm:w-64 font-medium"
            />
          </div>

          {/* Download CSV Button */}
          <button
            onClick={handleExportCSV}
            className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider cursor-pointer font-mono"
            title="Download records as CSV"
          >
            EXPORT CSV
          </button>

          {/* Additional Actions */}
          {actions}
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-black text-white font-mono text-[11px] uppercase tracking-wider border-b border-black">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`p-3 font-bold select-none ${
                    col.sortable !== false ? "cursor-pointer hover:bg-gray-900" : ""
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {sortKey === col.key && (
                      <span className="text-amber-400 font-bold font-mono">
                        {sortDirection === "asc" ? " [ASC]" : " [DESC]"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-gray-500 font-medium italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-gray-50 transition border-b border-gray-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-gray-900 font-medium">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs font-mono">
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-gray-300 text-black font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
            >
              PREVIOUS
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-gray-300 text-black font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
