import React, { useEffect, useMemo, useState } from "react";
import { PurchaseOrder, POApprovalHistory, VendorQuotation, User } from "../../types";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, LayoutDashboard, FileText, Download, Truck } from "lucide-react";
import { downloadCSV } from "../../services/api";

interface POApprovalDetailProps {
  pos: PurchaseOrder[];
  quotations: VendorQuotation[];
  approvalHistory: POApprovalHistory[];
  user: User;
  onApproveOrRejectPO: (
    poId: string,
    decision: "Approved" | "Rejected",
    comments: string,
    approverId: string,
    approverName: string
  ) => Promise<void>;
  onNavigateTab?: (tabId: string) => void;
}

export const POApprovalDetail: React.FC<POApprovalDetailProps> = ({
  pos,
  quotations,
  approvalHistory,
  user,
  onApproveOrRejectPO,
  onNavigateTab,
}) => {
  const [filterMode, setFilterMode] = useState<"pending" | "all">("pending");
  const normalizeStatus = (status: unknown) => String(status || "").trim().toLowerCase();
  const pendingPOs = useMemo(() => pos.filter((p) => normalizeStatus(p.status) === "pending approval"), [pos]);
  const processedPOs = useMemo(() => pos.filter((p) => normalizeStatus(p.status) !== "pending approval"), [pos]);
  const displayedPOs = filterMode === "pending" ? pendingPOs : pos;

  const [selectedPoId, setSelectedPoId] = useState<string>(pendingPOs[0]?.id || pos[0]?.id || "");

  // Keep the selected PO valid whenever the filter or database data changes.
  useEffect(() => {
    if (!displayedPOs.length) {
      setSelectedPoId("");
      return;
    }
    if (!displayedPOs.some((p) => p.id === selectedPoId)) {
      setSelectedPoId(displayedPOs[0].id);
    }
  }, [filterMode, displayedPOs, selectedPoId]);

  const activePO = displayedPOs.find((p) => p.id === selectedPoId) || displayedPOs[0];
  const linkedQuot = quotations.find((q) => q.id === activePO?.quotationId);

  const [comments, setComments] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);

  const handleAction = async (decision: "Approved" | "Rejected") => {
    setErrorMsg(null);
    setSuccessToast(null);
    if (!activePO) {
      setErrorMsg("No Purchase Order is selected.");
      return;
    }

    if (normalizeStatus(activePO.status) !== "pending approval") {
      setErrorMsg(`PO ${activePO.id} is already ${activePO.status}. Only Pending Approval POs can be approved or rejected.`);
      return;
    }

    // QA Validation Rule: Require comments when rejecting
    if (decision === "Rejected" && (!comments || comments.trim() === "")) {
      setErrorMsg("Manager comments are strictly required when rejecting a Purchase Order.");
      return;
    }

    try {
      setIsSubmitting(true);
      const currentPoId = activePO.id;
      await onApproveOrRejectPO(
        currentPoId,
        decision,
        comments || `Manager ${decision.toLowerCase()} the purchase order for dispatch.`,
        user.id,
        user.fullName
      );
      setComments("");
      setIsOverriding(false);
      setSuccessToast(`Purchase Order ${currentPoId} has been ${decision.toUpperCase()} successfully and released to workflow.`);

      // App refreshes from MySQL. Select the next pending record if one exists.
      const remainingPending = pendingPOs.filter((p) => p.id !== currentPoId);
      setSelectedPoId(remainingPending[0]?.id || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Approval action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPending = () => {
    const next = pendingPOs.find((p) => p.id !== activePO?.id);
    if (next) {
      setSelectedPoId(next.id);
      setComments("");
      setErrorMsg(null);
      setSuccessToast(null);
      setIsOverriding(false);
    } else {
      alert("No other pending Purchase Orders currently awaiting manager approval.");
    }
  };

  const handleExportSinglePO = () => {
    if (!activePO) return;
    const rows = (activePO.items || []).map((item) => ({
      "PO ID": activePO.id,
      "Vendor": activePO.vendorName,
      "Status": activePO.status,
      "Issue Date": activePO.issueDate,
      "Material Code": item.materialCode,
      "Material Name": item.materialName,
      "Quantity": item.quantity,
      "Unit Price": item.unitPrice,
      "Tax Amount": item.taxAmount,
      "Line Total": item.lineTotal,
      "PO Grand Total": activePO.grandTotal,
    }));
    downloadCSV(`PO_Approval_${activePO.id}`, rows);
  };

  const poHistoryList = approvalHistory.filter((h) => h.poId === activePO?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight flex items-center space-x-2">
            <span>PURCHASE ORDER APPROVAL & OVERSIGHT</span>
            {pendingPOs.length > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-sm">
                {pendingPOs.length} PENDING
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Procurement Manager executive review, split-view quotation verification, and immutable audit logging
          </p>
        </div>

        {/* PO Filter & Selector */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex border border-black">
            <button
              onClick={() => setFilterMode("pending")}
              className={`px-3 py-1.5 font-bold uppercase transition ${
                filterMode === "pending"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              PENDING ({pendingPOs.length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 font-bold uppercase transition border-l border-black ${
                filterMode === "all"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              ALL POS ({pos.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold uppercase">SELECT PO:</span>
            <select
              value={selectedPoId}
              onChange={(e) => {
                setSelectedPoId(e.target.value);
                setComments("");
                setErrorMsg(null);
                setSuccessToast(null);
                setIsOverriding(false);
              }}
              className="border-2 border-black bg-white text-black font-bold p-2 outline-none cursor-pointer"
            >
              {filterMode === "pending" && pendingPOs.length > 0 && (
                <optgroup label={`⏳ Pending Approvals (${pendingPOs.length})`}>
                  {pendingPOs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.vendorName} [${(p.grandTotal ?? 0).toLocaleString()}] (PENDING)
                    </option>
                  ))}
                </optgroup>
              )}
              {filterMode === "all" && processedPOs.length > 0 && (
                <optgroup label={`✓ Processed & Historical POs (${processedPOs.length})`}>
                  {processedPOs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.vendorName} [${(p.grandTotal ?? 0).toLocaleString()}] ({p.status})
                    </option>
                  ))}
                </optgroup>
              )}
              {displayedPOs.length === 0 && (
                <option value="" disabled>
                  {filterMode === "pending" ? "No POs Pending Approval" : "No Purchase Orders Found"}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-[#c6f135]/20 border-2 border-[#88b500] p-4 rounded-lg flex items-center justify-between font-mono text-xs text-black shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-[#88b500] flex-shrink-0" />
            <div>
              <p className="font-bold">{successToast}</p>
              <p className="text-gray-600 text-[11px]">Database records, audit log trail, and workflow statuses have been updated.</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-gray-500 hover:text-black font-bold text-sm px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500 p-3 text-xs font-mono font-bold text-red-700 uppercase">
          ERROR: {errorMsg}
        </div>
      )}

      {activePO ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
          {/* PANEL LEFT: PO SUMMARY & LINE ITEMS (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-300 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold uppercase text-black text-sm">
                  PO GENERAL SUMMARY & LINE ITEMS
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportSinglePO}
                  className="border border-gray-300 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-black font-bold uppercase text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>EXPORT CSV</span>
                </button>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                    activePO.status === "Approved" || activePO.status === "Confirmed"
                      ? "bg-green-100 text-green-900 border-green-500"
                      : activePO.status === "Rejected"
                      ? "bg-red-100 text-red-900 border-red-500"
                      : "bg-amber-100 text-amber-900 border-amber-500"
                  }`}
                >
                  {activePO.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 border border-gray-200">
              <div>
                <span className="text-gray-500 font-bold uppercase block">PO ID</span>
                <span className="font-bold text-black">{activePO.id}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Vendor</span>
                <span className="font-bold text-black">{activePO.vendorName}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Issue Date</span>
                <span className="font-bold text-black">{activePO.issueDate}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Payment Terms</span>
                <span className="font-bold text-black">{activePO.paymentTerms}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Currency</span>
                <span className="font-bold text-black">{activePO.currency}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block">Grand Total</span>
                <span className="font-black text-black text-sm">
                  ${(activePO.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-bold uppercase text-black mb-2">PO LINE ITEMS</h4>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-black text-white text-[10px] uppercase">
                    <th className="p-2 border border-black">Material Code</th>
                    <th className="p-2 border border-black">Material Name</th>
                    <th className="p-2 border border-black">Qty</th>
                    <th className="p-2 border border-black">Unit Price</th>
                    <th className="p-2 border border-black">Tax</th>
                    <th className="p-2 border border-black">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activePO.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border border-gray-200 font-bold">{item.materialCode}</td>
                      <td className="p-2 border border-gray-200">{item.materialName}</td>
                      <td className="p-2 border border-gray-200 font-bold">{(item.quantity ?? 0).toLocaleString()}</td>
                      <td className="p-2 border border-gray-200">${(item.unitPrice ?? 0).toFixed(2)}</td>
                      <td className="p-2 border border-gray-200">${(item.taxAmount ?? 0).toFixed(2)}</td>
                      <td className="p-2 font-bold border border-gray-200">${(item.lineTotal ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Approval History */}
            {poHistoryList.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-bold uppercase text-black mb-2">APPROVAL HISTORY LOG</h4>
                <div className="space-y-2">
                  {poHistoryList.map((h) => (
                    <div key={h.id} className="p-3 bg-gray-50 border border-gray-200 text-[11px]">
                      <div className="flex justify-between font-bold">
                        <span>{h.approverName} ({h.decision})</span>
                        <span className="text-gray-500">{h.decisionDate}</span>
                      </div>
                      <p className="text-gray-600 mt-1 italic">{h.comments || "No comments provided."}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PANEL RIGHT: QUOTATION VERIFICATION & MANAGER ACTIONS (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-300 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                <h3 className="font-bold uppercase text-black text-sm">
                  EMBEDDED QUOTATION VERIFICATION
                </h3>
                {linkedQuot && (
                  <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                    SCORE: {linkedQuot.totalScore}/100
                  </span>
                )}
              </div>

              {linkedQuot ? (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <div className="flex justify-between font-bold border-b border-gray-200 pb-2">
                    <span>Vendor: {linkedQuot.vendorName}</span>
                    <span>Ref: {linkedQuot.id}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center font-bold text-[10px]">
                    <div className="bg-white border p-1">COST: {linkedQuot.costScore}</div>
                    <div className="bg-white border p-1">QUALITY: {linkedQuot.qualityScore}</div>
                    <div className="bg-white border p-1">DELIVERY: {linkedQuot.deliveryScore}</div>
                  </div>

                  <p className="text-gray-600 italic text-[11px] bg-white p-2 border border-gray-200">
                    "{linkedQuot.notes || "Supplier quotation terms verified."}"
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 text-gray-500 italic">
                  Quotation document reference loaded.
                </div>
              )}

              {/* Comments Textarea (when pending or overriding) */}
              {(activePO.status === "Pending Approval" || isOverriding) && (
                <div className="space-y-2">
                  <label className="block font-bold uppercase text-black">
                    MANAGER COMMENTS & JUSTIFICATION
                  </label>
                  <textarea
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter approval comments or mandatory rejection reason..."
                    className="w-full border border-gray-300 p-2 text-black font-medium focus:border-black focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Manager Action Buttons & Post-Finalized Navigation Controls */}
            {activePO.status === "Pending Approval" || isOverriding ? (
              <div className="space-y-2 pt-4 border-t border-gray-300">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleAction("Approved")}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 uppercase tracking-wider cursor-pointer border-2 border-black disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#c6f135]" />
                  <span>{isSubmitting ? "PROCESSING..." : "APPROVE PURCHASE ORDER"}</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleAction("Rejected")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 uppercase tracking-wider cursor-pointer border-2 border-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? "PROCESSING..." : "REJECT PURCHASE ORDER"}</span>
                </button>

                {isOverriding && (
                  <button
                    onClick={() => setIsOverriding(false)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 uppercase text-[11px] cursor-pointer"
                  >
                    CANCEL OVERRIDE
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-gray-300">
                <div className="bg-gray-100 p-4 border border-gray-300 text-center text-gray-700 font-bold uppercase rounded-sm">
                  <div className="flex items-center justify-center space-x-2">
                    {activePO.status === "Approved" || activePO.status === "Confirmed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>PO DECISION FINALIZED: {activePO.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-normal mt-1 lowercase first-letter:uppercase">
                    Authorized and recorded into Relational Audit Trail.
                  </p>
                </div>

                {/* Direct Action & Next Steps Navigation */}
                <div className="space-y-2">
                  {filterMode === "pending" && pendingPOs.length > 0 && (
                    <button
                      onClick={handleNextPending}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-2.5 px-3 uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 border border-amber-600 text-xs"
                    >
                      <span>REVIEW NEXT PENDING PO ({pendingPOs.length})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {onNavigateTab && (
                    <>
                      <button
                        onClick={() => onNavigateTab("goods-receipt")}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-3 uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 text-xs"
                      >
                        <Truck className="w-4 h-4 text-[#c6f135]" />
                        <span>PROCEED TO GOODS RECEIPT (WAREHOUSE)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onNavigateTab("executive-dashboard")}
                        className="w-full bg-white hover:bg-gray-50 text-black border-2 border-black font-bold py-2 px-3 uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 text-xs"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>VIEW IN EXECUTIVE DASHBOARD</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setIsOverriding(true);
                      setComments(activePO.status === "Approved" ? "Re-evaluating decision" : "");
                    }}
                    className="w-full text-gray-600 hover:text-black font-bold py-1.5 uppercase text-[10px] flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>MODIFY / RE-EVALUATE DECISION</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 font-mono italic">
          No Purchase Orders available for approval.
        </div>
      )}
    </div>
  );
};
