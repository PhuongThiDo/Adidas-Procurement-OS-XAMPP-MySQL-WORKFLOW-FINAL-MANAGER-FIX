import React, { useState } from "react";
import { PurchaseRequisition, Supplier, User } from "../../types";
import { Modal } from "../Common/Modal";

interface PRQueueProps {
  prs: PurchaseRequisition[];
  suppliers: Supplier[];
  user: User;
  onGroupPRsToRFQ: (payload: {
    prIds: string[];
    title: string;
    createdById: string;
    createdByName: string;
    dueDate?: string;
    invitedVendorIds?: string[];
  }) => Promise<void>;
}

export const PRQueue: React.FC<PRQueueProps> = ({
  prs,
  suppliers,
  user,
  onGroupPRsToRFQ,
}) => {
  const [selectedPrIds, setSelectedPrIds] = useState<string[]>([]);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [rfqTitle, setRfqTitle] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10)
  );
  const [invitedVendorIds, setInvitedVendorIds] = useState<string[]>(
    suppliers.map((s) => s.id)
  );

  // Filter PRs with status "Submitted"
  const submittedPRs = prs.filter((p) => p.status === "Submitted");

  const handleToggleSelectAll = () => {
    if (selectedPrIds.length === submittedPRs.length) {
      setSelectedPrIds([]);
    } else {
      setSelectedPrIds(submittedPRs.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedPrIds.includes(id)) {
      setSelectedPrIds(selectedPrIds.filter((pId) => pId !== id));
    } else {
      setSelectedPrIds([...selectedPrIds, id]);
    }
  };

  const handleOpenConsolidate = () => {
    setActionError(null);
    if (selectedPrIds.length === 0) {
      alert("Please select at least one PR to group into an RFQ.");
      return;
    }
    setRfqTitle(`Sourcing RFQ for Requisitions (${selectedPrIds.join(", ")})`);
    setIsConsolidateModalOpen(true);
  };

  const handleConfirmConsolidate = async () => {
    setActionError(null);
    if (!rfqTitle.trim()) {
      setActionError("RFQ title is required.");
      return;
    }
    if (invitedVendorIds.length === 0) {
      setActionError("Select at least one invited vendor.");
      return;
    }
    try {
      setIsGenerating(true);
      await onGroupPRsToRFQ({
        prIds: selectedPrIds,
        title: rfqTitle.trim(),
        createdById: user.id,
        createdByName: user.fullName,
        dueDate,
        invitedVendorIds,
      });
      setIsConsolidateModalOpen(false);
      setSelectedPrIds([]);
    } catch (err: any) {
      setActionError(err?.message || "Unable to generate the RFQ. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Consolidated items preview
  const consolidatedItemsMap: { [matId: string]: { code: string; name: string; uom: string; totalQty: number } } = {};
  selectedPrIds.forEach((pId) => {
    const pr = prs.find((p) => p.id === pId);
    if (pr) {
      pr.items.forEach((item) => {
        if (!consolidatedItemsMap[item.materialId]) {
          consolidatedItemsMap[item.materialId] = {
            code: item.materialCode,
            name: item.materialName,
            uom: item.uom,
            totalQty: 0,
          };
        }
        consolidatedItemsMap[item.materialId].totalQty += item.quantity;
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            PURCHASE REQUISITION QUEUE
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Incoming submitted PRs from Supply Chain Planners ready for RFQ consolidation
          </p>
        </div>

        <button
          onClick={handleOpenConsolidate}
          disabled={selectedPrIds.length === 0}
          className="bg-black hover:bg-gray-800 text-white font-mono text-xs font-bold px-6 py-2.5 uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-2 border-black"
        >
          GROUP SELECTED PRS TO RFQ ({selectedPrIds.length}) &rarr;
        </button>
      </div>

      {/* PR Table Queue */}
      <div className="bg-white border border-gray-300 shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="font-mono font-black text-xs uppercase text-black">
            SUBMITTED REQUISITIONS WAITING SOURCING ({submittedPRs.length})
          </span>
          <span className="font-mono text-xs text-gray-500 font-bold">
            {selectedPrIds.length} SELECTED FOR CONSOLIDATION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-black text-white uppercase text-[11px]">
                <th className="p-3 border-b border-black w-10">
                  <input
                    type="checkbox"
                    checked={submittedPRs.length > 0 && selectedPrIds.length === submittedPRs.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer"
                  />
                </th>
                <th className="p-3 border-b border-black">PR ID</th>
                <th className="p-3 border-b border-black">Planner</th>
                <th className="p-3 border-b border-black">Request Date</th>
                <th className="p-3 border-b border-black">Required Delivery</th>
                <th className="p-3 border-b border-black">Materials Summary</th>
                <th className="p-3 border-b border-black">Est Value</th>
                <th className="p-3 border-b border-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submittedPRs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 italic">
                    No submitted PRs in queue.
                  </td>
                </tr>
              ) : (
                submittedPRs.map((pr) => {
                  const isSelected = selectedPrIds.includes(pr.id);
                  return (
                    <tr
                      key={pr.id}
                      className={`hover:bg-gray-50 transition ${isSelected ? "bg-amber-50" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(pr.id)}
                          className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-black">{pr.id}</td>
                      <td className="p-3 font-medium">{pr.creatorName}</td>
                      <td className="p-3">{pr.requestDate}</td>
                      <td className="p-3 font-bold text-black">{pr.requiredDeliveryDate}</td>
                      <td className="p-3 text-gray-700">
                        {pr.items?.map((i) => `${i.materialCode} (${i.quantity} ${i.uom})`).join(", ")}
                      </td>
                      <td className="p-3 font-bold">
                        ${(pr.totalEstimatedCost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-900 border border-blue-500 text-[10px] uppercase font-bold px-2 py-0.5">
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consolidation Modal View */}
      <Modal
        isOpen={isConsolidateModalOpen}
        onClose={() => setIsConsolidateModalOpen(false)}
        title="CONSOLIDATION VIEW: GROUP PRs TO RFQ"
        maxWidth="4xl"
      >
        <div className="space-y-6 text-xs font-mono">
          {actionError && <div className="border-2 border-red-500 bg-red-50 p-3 font-bold text-red-800">{actionError}</div>}
          <div className="bg-amber-50 border border-amber-400 p-3 text-amber-900">
            <strong>CONSOLIDATION LOGIC:</strong> System will combine line item quantities across selected PRs ({selectedPrIds.join(", ")}) into a single RFQ document and set original PR status to "Processed".
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold uppercase mb-1">RFQ Title *</label>
              <input
                type="text"
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Bidding Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Invited Vendors</label>
                <div className="border border-gray-300 p-2 bg-gray-50 max-h-24 overflow-y-auto space-y-1">
                  {suppliers.map((s) => (
                    <label key={s.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={invitedVendorIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setInvitedVendorIds([...invitedVendorIds, s.id]);
                          else setInvitedVendorIds(invitedVendorIds.filter((id) => id !== s.id));
                        }}
                      />
                      <span>{s.name} ({s.vendorCode})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1 mb-2">
              CONSOLIDATED MATERIAL QUANTITIES
            </h4>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white uppercase text-[11px]">
                  <th className="p-2 border border-black">Material ID</th>
                  <th className="p-2 border border-black">Material Name</th>
                  <th className="p-2 border border-black">UoM</th>
                  <th className="p-2 border border-black">Aggregated Bidding Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(consolidatedItemsMap).map(([matId, details]) => (
                  <tr key={matId}>
                    <td className="p-2 font-bold border border-gray-200">{details.code}</td>
                    <td className="p-2 border border-gray-200">{details.name}</td>
                    <td className="p-2 border border-gray-200 font-bold text-gray-600">{details.uom}</td>
                    <td className="p-2 border border-gray-200 font-black text-black">
                      {(details.totalQty ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
            <button
              onClick={() => setIsConsolidateModalOpen(false)}
              className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmConsolidate}
              disabled={isGenerating}
              className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "GENERATING RFQ..." : "GENERATE RFQ NOW →"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
