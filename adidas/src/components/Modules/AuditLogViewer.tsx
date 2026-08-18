import React from "react";
import { AuditLog } from "../../types";
import { DataTable, Column } from "../Common/DataTable";

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const columns: Column<AuditLog>[] = [
    { key: "timestamp", header: "Timestamp Date/Time" },
    {
      key: "actionType",
      header: "Action Type",
      render: (r) => {
        let cls = "bg-gray-100 text-gray-800 border-gray-300";
        if (r.actionType.includes("CREATE") || r.actionType.includes("POST")) cls = "bg-green-100 text-green-900 border-green-500 font-bold";
        if (r.actionType.includes("APPROVE")) cls = "bg-blue-100 text-blue-900 border-blue-500 font-bold";
        if (r.actionType.includes("DELETE") || r.actionType.includes("REJECT")) cls = "bg-red-100 text-red-900 border-red-500 font-bold";

        return (
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${cls}`}>
            {r.actionType}
          </span>
        );
      },
    },
    { key: "userName", header: "Executed User" },
    { key: "userRole", header: "Role Context" },
    { key: "targetTable", header: "Target Entity" },
    { key: "targetId", header: "Document Ref ID" },
    { key: "newValue", header: "Audit Trail Details", render: (r) => r.newValue || r.oldValue || "N/A" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          ENTERPRISE IMMUTABLE AUDIT LOG TRAIL
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Read-only audit trail logging every system action, state mutation, and approval authorization
        </p>
      </div>

      <DataTable
        title="Audit Logs Registry"
        columns={columns}
        data={logs}
        exportFilename="adidas_procurement_audit_logs"
        searchPlaceholder="Filter audit logs by user, entity or document ID..."
      />
    </div>
  );
};
