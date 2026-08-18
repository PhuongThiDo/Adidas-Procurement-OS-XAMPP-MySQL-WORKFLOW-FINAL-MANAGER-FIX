import React, { useState } from "react";
import { PurchaseRequisition, Material } from "../../types";
import { DataTable, Column } from "../Common/DataTable";
import { Modal } from "../Common/Modal";

interface PRHistoryProps {
  prs: PurchaseRequisition[];
  materials: Material[];
  onUpdatePR: (id: string, pr: Partial<PurchaseRequisition>) => Promise<void>;
  onDeletePR: (id: string) => Promise<void>;
}

export const PRHistory: React.FC<PRHistoryProps> = ({
  prs,
  materials,
  onUpdatePR,
  onDeletePR,
}) => {
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [editingPR, setEditingPR] = useState<PurchaseRequisition | null>(null);

  const columns: Column<PurchaseRequisition>[] = [
    { key: "id", header: "PR ID" },
    { key: "creatorName", header: "Planner / Creator" },
    { key: "requestDate", header: "Request Date" },
    { key: "requiredDeliveryDate", header: "Delivery Date" },
    {
      key: "items",
      header: "Line Items Count",
      render: (r) => `${r.items?.length || 0} items`,
    },
    {
      key: "totalEstimatedCost",
      header: "Total Cost ($)",
      render: (r) => `$${(r.totalEstimatedCost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        let cls = "bg-gray-100 text-gray-800 border-gray-300";
        if (r.status === "Submitted") cls = "bg-blue-100 text-blue-900 border-blue-500 font-bold";
        if (r.status === "Processed") cls = "bg-green-100 text-green-900 border-green-500 font-bold";
        if (r.status === "Draft") cls = "bg-amber-100 text-amber-900 border-amber-500 font-bold";

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
        <div className="flex space-x-2 font-mono text-xs">
          <button
            onClick={() => setSelectedPR(r)}
            className="text-black font-bold border border-black px-2 py-0.5 hover:bg-black hover:text-white cursor-pointer uppercase"
          >
            VIEW
          </button>

          {/* Business Rule: Only allow Edit / Delete if PR Status is Draft */}
          {r.status === "Draft" ? (
            <>
              <button
                onClick={() => setEditingPR(r)}
                className="text-blue-700 font-bold border border-blue-700 px-2 py-0.5 hover:bg-blue-700 hover:text-white cursor-pointer uppercase"
              >
                EDIT DRAFT
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete draft PR ${r.id}?`)) {
                    await onDeletePR(r.id);
                  }
                }}
                className="text-red-600 font-bold border border-red-600 px-2 py-0.5 hover:bg-red-600 hover:text-white cursor-pointer uppercase"
              >
                DELETE
              </button>
            </>
          ) : (
            <span className="text-[10px] text-gray-400 italic self-center">
              LOCKED ({r.status})
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            MY PURCHASE REQUISITION HISTORY
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Log of created requisitions and status tracking through Sourcing processing
          </p>
        </div>
      </div>

      <DataTable
        title="Purchase Requisition History List"
        columns={columns}
        data={prs}
        exportFilename="adidas_pr_history"
        searchPlaceholder="Search PR ID or planner..."
      />

      {/* View PR Modal */}
      <Modal
        isOpen={!!selectedPR}
        onClose={() => setSelectedPR(null)}
        title={`PURCHASE REQUISITION DETAILS: ${selectedPR?.id}`}
        maxWidth="4xl"
      >
        {selectedPR && (
          <div className="space-y-6 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-300">
              <div>
                <span className="text-gray-500 font-bold uppercase block">PR ID</span>
                <span className="font-bold text-black">{selectedPR.id}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Creator</span>
                <span className="font-bold text-black">{selectedPR.creatorName}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Request Date</span>
                <span className="font-bold text-black">{selectedPR.requestDate}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Delivery Date</span>
                <span className="font-bold text-black">{selectedPR.requiredDeliveryDate}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1 mb-2">
                REQUISITION LINE ITEMS
              </h4>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-black text-white font-mono text-[11px] uppercase">
                    <th className="p-2 border border-black">Material Code</th>
                    <th className="p-2 border border-black">Material Name</th>
                    <th className="p-2 border border-black">UoM</th>
                    <th className="p-2 border border-black">Quantity</th>
                    <th className="p-2 border border-black">Est Unit Price</th>
                    <th className="p-2 border border-black">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedPR.items?.map((i) => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-200 font-bold">{i.materialCode}</td>
                      <td className="p-2 border border-gray-200">{i.materialName}</td>
                      <td className="p-2 border border-gray-200 font-bold text-gray-600">{i.uom}</td>
                      <td className="p-2 border border-gray-200 font-bold">{(i.quantity ?? 0).toLocaleString()}</td>
                      <td className="p-2 border border-gray-200">${(i.estimatedUnitPrice ?? 0).toFixed(2)}</td>
                      <td className="p-2 border border-gray-200 font-bold">${((i.quantity ?? 0) * (i.estimatedUnitPrice ?? 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* If Draft, allow Submit from view */}
            {selectedPR.status === "Draft" && (
              <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
                <button
                  onClick={async () => {
                    await onUpdatePR(selectedPR.id, { status: "Submitted" });
                    setSelectedPR(null);
                  }}
                  className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer"
                >
                  SUBMIT DRAFT PR NOW &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Draft PR Modal */}
      <Modal
        isOpen={!!editingPR}
        onClose={() => setEditingPR(null)}
        title={`EDIT DRAFT PR: ${editingPR?.id}`}
        maxWidth="4xl"
      >
        {editingPR && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onUpdatePR(editingPR.id, {
                requiredDeliveryDate: editingPR.requiredDeliveryDate,
                items: editingPR.items,
                totalEstimatedCost: editingPR.items.reduce((a, b) => a + b.quantity * b.estimatedUnitPrice, 0),
              });
              setEditingPR(null);
            }}
            className="space-y-4 text-xs font-mono"
          >
            <div>
              <label className="block font-bold uppercase mb-1">Required Delivery Date</label>
              <input
                type="date"
                required
                value={editingPR.requiredDeliveryDate}
                onChange={(e) =>
                  setEditingPR({ ...editingPR, requiredDeliveryDate: e.target.value })
                }
                className="border border-gray-300 p-2 font-bold text-black"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingPR(null)}
                className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer"
              >
                SAVE DRAFT CHANGES
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
