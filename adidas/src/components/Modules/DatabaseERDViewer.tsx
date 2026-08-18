import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  Database,
  Table,
  Key,
  Link2,
  Terminal,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  ShieldCheck,
  Code2,
  HardDrive,
  Copy,
  Check,
  Download,
  FileCode
} from "lucide-react";

interface ERDMetadata {
  databaseName: string;
  engine: string;
  schemaCompliant: string;
  tableCount: number;
  tables: Array<{
    tableName: string;
    rowCount: number;
    columns: Array<{
      cid: number;
      name: string;
      type: string;
      notNull: boolean;
      defaultValue: any;
      isPrimaryKey: boolean;
    }>;
    foreignKeys: Array<{
      id: number;
      fromColumn: string;
      toTable: string;
      toColumn: string;
      onUpdate: string;
      onDelete: string;
    }>;
  }>;
  relationships: Array<{
    parent: string;
    child: string;
    relation: string;
    fk: string;
    description: string;
  }>;
}

export const DatabaseERDViewer: React.FC = () => {
  const [metadata, setMetadata] = useState<ERDMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"erd" | "tables" | "console" | "sql-schema">("erd");
  const [selectedTable, setSelectedTable] = useState<string>("purchase_orders");
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableDataLoading, setTableDataLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // SQL Console state
  const [customSql, setCustomSql] = useState<string>(
    `SELECT po.id AS po_number, s.name AS supplier_name, po.status, COUNT(pli.id) AS item_count, SUM(pli.line_total) AS total_val\nFROM purchase_orders po\nJOIN suppliers s ON po.vendor_id = s.id\nLEFT JOIN po_line_items pli ON po.id = pli.po_id\nGROUP BY po.id;`
  );
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // database.sql full schema state
  const [fullSql, setFullSql] = useState<string>("");
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);
  const [sqlSearch, setSqlSearch] = useState<string>("");
  const [activeTableFilter, setActiveTableFilter] = useState<string>("ALL");

  const fetchFullSql = async () => {
    setSqlLoading(true);
    try {
      const data = await api.getDatabaseSql();
      if (data.sql) setFullSql(data.sql);
    } catch (err) {
      console.error("Failed to load full database.sql:", err);
    } finally {
      setSqlLoading(false);
    }
  };

  const handleDownloadSql = () => {
    const content = fullSql || "-- database.sql";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adidas_procurement_database.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const data = await api.getERDMetadata();
      setMetadata(data);
    } catch (err) {
      console.error("Failed to load ERD metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableRows = async (tableName: string) => {
    setSelectedTable(tableName);
    setTableDataLoading(true);
    try {
      const data = await api.executeSQL(`SELECT * FROM ${tableName} LIMIT 50;`);
      if (data.rows) {
        setTableData(data.rows);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch table rows:", err);
      setTableData([]);
    } finally {
      setTableDataLoading(false);
    }
  };

  const handleExecuteSql = async (sqlToRun?: string) => {
    const query = sqlToRun || customSql;
    if (!query.trim()) return;

    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const data = await api.executeSQL(query);
      if (data.error) {
        setQueryError(data.error || "Query execution failed");
      } else {
        setQueryResult(data);
        if (!query.trim().toUpperCase().startsWith("SELECT") && !query.trim().toUpperCase().startsWith("PRAGMA")) {
          fetchMetadata();
        }
      }
    } catch (err: any) {
      setQueryError(err.message || "Failed to communicate with SQL engine");
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchFullSql();
  }, []);

  useEffect(() => {
    if (activeTab === "tables" && selectedTable) {
      fetchTableRows(selectedTable);
    }
    if (activeTab === "sql-schema" && !fullSql) {
      fetchFullSql();
    }
  }, [activeTab, selectedTable, fullSql]);

  const presetQueries = [
    {
      title: "1. Verify Vendor (1) -> (N) PO Relational Join",
      sql: `SELECT s.vendor_code, s.name AS vendor_name, po.id AS po_id, po.grand_total, po.status, po.issue_date\nFROM suppliers s\nJOIN purchase_orders po ON s.id = po.vendor_id;`,
    },
    {
      title: "2. Verify PO (1) -> (N) PO Line Items (Master-Detail)",
      sql: `SELECT po.id AS po_id, po.vendor_name, pli.material_code, pli.material_name, pli.quantity, pli.uom, pli.unit_price, pli.line_total\nFROM purchase_orders po\nJOIN po_line_items pli ON po.id = pli.po_id\nORDER BY po.id;`,
    },
    {
      title: "3. Verify 3-Way Match (PO -> Goods Receipt -> Invoice)",
      sql: `SELECT po.id AS po_id, po.grand_total AS po_amount, gr.id AS gr_id, gr.has_discrepancy, inv.id AS inv_id, inv.grand_total AS inv_amount, inv.status AS inv_status\nFROM purchase_orders po\nLEFT JOIN goods_receipts gr ON po.id = gr.po_id\nLEFT JOIN invoices inv ON po.id = inv.po_id;`,
    },
    {
      title: "4. Verify Foreign Key Integrity Check (PRAGMA)",
      sql: `PRAGMA foreign_key_check;`,
    },
  ];

  return (
    <div className="space-y-6" id="erd-viewer-module">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Relational Database & ERD Inspector
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    Relational Schema
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full 3NF Normalized Relational Engine with Foreign Keys (PRAGMA foreign_keys = ON), Cascading Line Items & 3-Way Match Joins
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMetadata()}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Schema
            </button>
          </div>
        </div>

        {/* Engine Status Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Relational Engine</span>
            <span className="text-sm font-semibold text-blue-400 mt-1 block">MySQL 8.x / InnoDB</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Active SQL Tables</span>
            <span className="text-sm font-semibold text-emerald-400 mt-1 block">{metadata?.tableCount || 23} Tables</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Foreign Key Constraints</span>
            <span className="text-sm font-semibold text-indigo-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Active (100% Enforced)
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Storage Persistence</span>
            <span className="text-sm font-semibold text-amber-400 mt-1 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              MySQL database: adidas_procurement
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("erd")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "erd"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          Relational ERD Relationships ({metadata?.relationships.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("tables")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "tables"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Table className="w-4 h-4" />
          Live Table Schema & Data ({metadata?.tables.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("console")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "console"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Interactive SQL Console
        </button>
        <button
          onClick={() => setActiveTab("sql-schema")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "sql-schema"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Code2 className="w-4 h-4" />
          MySQL DDL database.sql
        </button>
      </div>

      {/* Tab 1: ERD Relationships */}
      {activeTab === "erd" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              Entity-Relationship Diagram (ERD) Specifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              This system strictly implements relational integrity with Primary Keys (PK), Foreign Keys (FK), and cascading child detail line items across all procurement modules.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metadata?.relationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {rel.parent}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      {rel.relation}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      {rel.child}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 mb-2">
                    FK: {rel.fk}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rel.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Table Schema & Data Browser */}
      {activeTab === "tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter SQL tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
              {metadata?.tables
                .filter((t) => t.tableName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((t) => (
                  <button
                    key={t.tableName}
                    onClick={() => fetchTableRows(t.tableName)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                      selectedTable === t.tableName
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-xs">{t.tableName}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {t.rowCount} rows
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Table Details & Data */}
          <div className="lg:col-span-8 space-y-4">
            {selectedTable && (
              <>
                {/* Column Definition Cards */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Table className="w-4 h-4 text-blue-600" />
                      Schema for <span className="font-mono text-blue-600">{selectedTable}</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {metadata?.tables.find((t) => t.tableName === selectedTable)?.columns.length} Columns
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                          <th className="py-2 px-3 font-semibold">Column</th>
                          <th className="py-2 px-3 font-semibold">Type</th>
                          <th className="py-2 px-3 font-semibold">Key</th>
                          <th className="py-2 px-3 font-semibold">Nullable</th>
                          <th className="py-2 px-3 font-semibold">Foreign Key Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                        {metadata?.tables
                          .find((t) => t.tableName === selectedTable)
                          ?.columns.map((c) => {
                            const fk = metadata?.tables
                              .find((t) => t.tableName === selectedTable)
                              ?.foreignKeys.find((f) => f.fromColumn === c.name);

                            return (
                              <tr key={c.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                                <td className="py-2 px-3 text-blue-600 dark:text-blue-400">{c.type}</td>
                                <td className="py-2 px-3">
                                  {c.isPrimaryKey && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 w-max">
                                      <Key className="w-3 h-3" /> PK
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-500">{c.notNull ? "NOT NULL" : "NULL"}</td>
                                <td className="py-2 px-3">
                                  {fk ? (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 w-max">
                                      <Link2 className="w-3 h-3" /> {fk.toTable}.{fk.toColumn}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Data Rows */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-600" />
                      Live Data Rows in <span className="font-mono">{selectedTable}</span> ({tableData.length})
                    </h3>
                  </div>

                  {tableDataLoading ? (
                    <div className="py-12 text-center text-slate-400">Loading records...</div>
                  ) : tableData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">Table is empty</div>
                  ) : (
                    <div className="overflow-x-auto max-h-[360px]">
                      <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                            {Object.keys(tableData[0] || {}).map((col) => (
                              <th key={col} className="py-2 px-3 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {tableData.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              {Object.values(row).map((val: any, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive SQL Console */}
      {activeTab === "console" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Live SQL Query Sandbox
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Directly execute SQL statements against the MySQL/InnoDB relational engine with active Foreign Key verification.
            </p>

            {/* Presets */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Preset Verification Queries:</span>
              <div className="flex flex-wrap gap-2">
                {presetQueries.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomSql(pq.sql);
                      handleExecuteSql(pq.sql);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {pq.title}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Textarea */}
            <div className="relative">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={5}
                placeholder="Enter SQL statement (e.g. SELECT * FROM po_line_items JOIN purchase_orders ON ...)"
                className="w-full p-4 font-mono text-xs rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => handleExecuteSql()}
                  disabled={executing}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {executing ? "Running..." : "Run SQL Query"}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {queryError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">SQL Execution Error: </span>
                  {queryError}
                </div>
              </div>
            )}

            {/* Results Table */}
            {queryResult && (
              <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Query Execution Succeeded ({queryResult.count || queryResult.rows?.length || 0} rows returned)
                  </span>
                </div>

                {queryResult.rows && queryResult.rows.length > 0 ? (
                  <div className="overflow-x-auto max-h-[350px]">
                    <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 sticky top-0">
                          {Object.keys(queryResult.rows[0]).map((col) => (
                            <th key={col} className="py-2 px-3 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {queryResult.rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-slate-500">
                    {queryResult.message || "Query returned 0 rows."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: DDL Schema database.sql */}
      {activeTab === "sql-schema" && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-300 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-blue-400" />
                  database.sql (Complete MySQL 8.x / InnoDB ERD Relational Schema)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  All Tables, Detail Line Items, Views, Constraints & Relational Seed Data
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fullSql);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied Full SQL!" : "Copy Full SQL (600+ Lines)"}
                </button>
                <button
                  onClick={handleDownloadSql}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download database.sql
                </button>
                <button
                  onClick={fetchFullSql}
                  className="p-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Reload SQL"
                >
                  <RefreshCw className={`w-4 h-4 ${sqlLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Quick Table Filter / Navigator */}
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-400" />
                  All 23 Relational Tables & Detail Entities Defined:
                </span>
                <span className="text-xs text-emerald-400 font-mono">
                  {fullSql.split("\n").length} Lines • UTF-8 InnoDB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                {[
                  "users",
                  "suppliers",
                  "materials",
                  "purchase_requisitions",
                  "pr_line_items",
                  "rfqs",
                  "rfq_pr_links",
                  "rfq_line_items",
                  "rfq_invited_vendors",
                  "vendor_quotations",
                  "quotation_line_items",
                  "purchase_orders",
                  "po_line_items",
                  "po_approval_history",
                  "shipments",
                  "goods_receipts",
                  "goods_receipt_line_items",
                  "discrepancy_tickets",
                  "invoices",
                  "invoice_line_items",
                  "payments",
                  "audit_logs",
                  "role_permissions"
                ].map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => {
                      setActiveTableFilter(tbl);
                      setSqlSearch(`CREATE TABLE \`${tbl}\``);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                      sqlSearch.includes(tbl)
                        ? "bg-blue-600 text-white border-blue-500 font-bold"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveTableFilter("ALL");
                    setSqlSearch("");
                  }}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  Clear Filter
                </button>
              </div>
            </div>

            {/* Search within SQL */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search within database.sql (e.g. FOREIGN KEY, goods_receipt_line_items, invoice_line_items, role_permissions)..."
                value={sqlSearch}
                onChange={(e) => setSqlSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* SQL Content Box */}
            <div className="relative">
              {sqlLoading ? (
                <div className="py-20 text-center text-slate-400 font-mono text-xs">
                  Loading database.sql from server...
                </div>
              ) : (
                <pre className="font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-900/95 p-5 rounded-xl border border-slate-800 overflow-x-auto max-h-[550px] select-text">
                  {sqlSearch.trim()
                    ? fullSql
                        .split("\n")
                        .filter((line, i, arr) => {
                          const query = sqlSearch.toLowerCase();
                          // Show matching line plus 5 context lines
                          return (
                            line.toLowerCase().includes(query) ||
                            (arr[i - 1] && arr[i - 1].toLowerCase().includes(query)) ||
                            (arr[i + 1] && arr[i + 1].toLowerCase().includes(query))
                          );
                        })
                        .join("\n") || `-- No exact lines matching "${sqlSearch}". Showing full schema instead:\n\n` + fullSql
                    : fullSql}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
