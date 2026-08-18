import React, { useState } from "react";
import { DiscrepancyTicket } from "../../types";
import { DataTable, Column } from "../Common/DataTable";
import { Modal } from "../Common/Modal";

interface DiscrepancyLogsProps {
  tickets: DiscrepancyTicket[];
  onUpdateTicket: (id: string, updates: Partial<DiscrepancyTicket>) => Promise<void>;
}

export const DiscrepancyLogs: React.FC<DiscrepancyLogsProps> = ({
  tickets,
  onUpdateTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<DiscrepancyTicket | null>(null);
  const [status, setStatus] = useState<any>("Open");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleOpenEdit = (t: DiscrepancyTicket) => {
    setSelectedTicket(t);
    setStatus(t.status);
    setResolutionNotes(t.resolutionNotes || "");
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    await onUpdateTicket(selectedTicket.id, {
      status,
      resolutionNotes,
    });
    setSelectedTicket(null);
  };

  const columns: Column<DiscrepancyTicket>[] = [
    { key: "id", header: "Ticket ID" },
    { key: "poId", header: "PO Reference" },
    { key: "vendorName", header: "Supplier Vendor" },
    { key: "issueType", header: "Issue Type" },
    { key: "createdDate", header: "Log Date" },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        let cls = "bg-amber-100 text-amber-900 border-amber-500 font-bold";
        if (r.status === "Resolved" || r.status === "Closed") {
          cls = "bg-green-100 text-green-900 border-green-500 font-bold";
        }
        return (
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${cls}`}>
            {r.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (r) => (
        <button
          onClick={() => handleOpenEdit(r)}
          className="text-black font-bold border border-black px-2 py-0.5 hover:bg-black hover:text-white cursor-pointer uppercase font-mono text-xs"
        >
          MANAGE TICKET
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          QUALITY & QUANTITY DISCREPANCY LOGS
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Central quality control ticket logs automatically triggered during defective receiving or invoice mismatches
        </p>
      </div>

      <DataTable
        title="Discrepancy Tickets Registry"
        columns={columns}
        data={tickets}
        exportFilename="adidas_discrepancy_logs"
        searchPlaceholder="Search ticket ID or vendor..."
      />

      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`MANAGE DISCREPANCY TICKET: ${selectedTicket?.id}`}
        maxWidth="2xl"
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs font-mono">
            <div className="bg-gray-50 p-4 border border-gray-300 space-y-2">
              <div className="flex justify-between font-bold">
                <span>Vendor: {selectedTicket.vendorName}</span>
                <span>PO ID: {selectedTicket.poId}</span>
              </div>
              <div className="text-red-600 font-bold">
                ISSUE TYPE: {selectedTicket.issueType}
              </div>
              <p className="text-gray-700 font-medium">
                DESCRIPTION: {selectedTicket.description}
              </p>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Update Ticket Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-gray-300 p-2 font-bold text-black"
              >
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Resolution & Corrective Notes</label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter corrective action details or vendor credit memo agreement..."
                className="w-full border border-gray-300 p-2 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer"
              >
                UPDATE DISCREPANCY TICKET
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
