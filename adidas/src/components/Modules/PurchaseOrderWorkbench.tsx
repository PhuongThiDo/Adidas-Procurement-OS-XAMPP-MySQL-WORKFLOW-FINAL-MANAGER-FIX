import React, { useState } from "react";
import { PurchaseOrder, VendorQuotation, RFQ, User, Supplier, Material } from "../../types";
import { Modal } from "../Common/Modal";
import { AdidasThreeBars } from "../Common/AdidasBrandLogos";
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building,
  Truck,
  DollarSign,
  AlertCircle,
  Eye,
} from "lucide-react";
import { downloadCSV } from "../../services/api";

interface PurchaseOrderWorkbenchProps {
  pos: PurchaseOrder[];
  quotations: VendorQuotation[];
  rfqs: RFQ[];
  suppliers: Supplier[];
  materials: Material[];
  user: User;
  onConvertToPO: (quotationId: string, taxRatePercent: number) => Promise<void>;
  onDeletePO?: (poId: string) => Promise<void>;
}

export const PurchaseOrderWorkbench: React.FC<PurchaseOrderWorkbenchProps> = ({
  pos,
  quotations,
  rfqs,
  suppliers,
  materials,
  user,
  onConvertToPO,
  onDeletePO,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"convert" | "all-pos">("convert");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Conversion state
  const [selectedWinningQuot, setSelectedWinningQuot] = useState<VendorQuotation | null>(null);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter Awarded Quotations that don't have a PO generated yet
  const awardedQuotations = quotations.filter(
    (q) => (q.status === "Accepted" || q.status === "Awarded") && !pos.some((p) => p.quotationId === q.id)
  );

  // Filter POs
  const filteredPOs = pos.filter((po) => {
    const matchesSearch =
      String(po.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(po.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(po.rfqId || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenConvert = (quot: VendorQuotation) => {
    setSelectedWinningQuot(quot);
    setTaxRatePercent(10);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedWinningQuot) return;
    try {
      setIsProcessing(true);
      await onConvertToPO(selectedWinningQuot.id, taxRatePercent);
      setIsConvertModalOpen(false);
      setSelectedWinningQuot(null);
      setActiveSubTab("all-pos");
    } catch (err: any) {
      alert("Error generating PO: " + (err?.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = pos.map((p) => ({
      "PO Number": p.id,
      "Quotation Ref": p.quotationId,
      "RFQ Ref": p.rfqId,
      "Vendor ID": p.vendorId,
      "Vendor Name": p.vendorName,
      "Issue Date": p.issueDate,
      "Payment Terms": p.paymentTerms,
      "Currency": p.currency,
      "Subtotal": p.subtotal,
      "Tax Amount": p.taxAmount,
      "Grand Total": p.grandTotal,
      "Status": p.status,
      "Created By": p.createdByName,
    }));
    downloadCSV("Adidas_Purchase_Orders_Master", exportData);
  };

  // KPIs
  const totalSpend = pos.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
  const pendingApprovalCount = pos.filter((p) => p.status === "Pending Approval").length;
  const approvedCount = pos.filter((p) => p.status === "Approved" || p.status === "Confirmed" || p.status === "Shipped" || p.status === "Completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[#88b500] font-mono text-xs font-black">///</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">
              SOURCING & PROCUREMENT WORKBENCH
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
            PURCHASE ORDER WORKBENCH
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Convert awarded supplier bids into formal legal POs, configure purchasing lines, and track release lifecycle.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white border border-gray-300 hover:border-black text-black font-mono text-xs font-bold px-3 py-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT POS (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-mono font-bold uppercase">
            <span>Ready for PO Conversion</span>
            <CheckCircle2 className="w-4 h-4 text-[#88b500]" />
          </div>
          <p className="text-2xl font-black text-black font-mono mt-2">{awardedQuotations.length}</p>
          <span className="text-[11px] text-gray-400 font-mono">Awarded Sourcing Bids</span>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-mono font-bold uppercase">
            <span>Pending Manager Release</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono mt-2">{pendingApprovalCount}</p>
          <span className="text-[11px] text-gray-400 font-mono">Awaiting Level-1/2 Sign-off</span>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-mono font-bold uppercase">
            <span>Active & Executed POs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-black font-mono mt-2">{approvedCount}</p>
          <span className="text-[11px] text-gray-400 font-mono">Dispatched to Vendors</span>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-mono font-bold uppercase">
            <span>Total Committed Spend</span>
            <DollarSign className="w-4 h-4 text-black" />
          </div>
          <p className="text-2xl font-black text-black font-mono mt-2">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-gray-400 font-mono">Across {pos.length} Purchase Orders</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-300 font-mono text-xs">
        <button
          onClick={() => setActiveSubTab("convert")}
          className={`px-5 py-3 font-bold uppercase transition-all flex items-center space-x-2 border-b-2 -mb-px ${
            activeSubTab === "convert"
              ? "border-black text-black bg-white"
              : "border-transparent text-gray-500 hover:text-black"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>AWARDED BIDS CONVERSION ({awardedQuotations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("all-pos")}
          className={`px-5 py-3 font-bold uppercase transition-all flex items-center space-x-2 border-b-2 -mb-px ${
            activeSubTab === "all-pos"
              ? "border-black text-black bg-white"
              : "border-transparent text-gray-500 hover:text-black"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>ALL PURCHASE ORDERS ({pos.length})</span>
        </button>
      </div>

      {/* TAB 1: AWARDED BIDS READY TO CONVERT TO PO */}
      {activeSubTab === "convert" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start space-x-3 text-xs font-mono text-blue-900">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase block">PO Creation Step in Procure-to-Pay (P2P):</span>
              When an RFQ bid is evaluated and marked as <strong className="text-green-700 font-black">Accepted</strong> in the RFQ Matrix, Sourcing Specialists use this workbench to generate the legally binding Purchase Order (PO), apply standard tax/VAT rates, and route the document to the Procurement Manager for formal sign-off.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awardedQuotations.length === 0 ? (
              <div className="col-span-3 bg-white border border-gray-200 p-12 text-center rounded-xl space-y-3">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-mono font-bold text-gray-700 uppercase">No Awarded Quotations Pending PO</h3>
                <p className="text-xs text-gray-500 font-mono max-w-md mx-auto">
                  Go to <strong className="text-black">RFQ & Bid Comparison</strong> to review supplier proposals and award a winning bidder.
                </p>
              </div>
            ) : (
              awardedQuotations.map((quot) => {
                const parentRfq = rfqs.find((r) => r.id === quot.rfqId);
                const supplierInfo = suppliers.find((s) => s.id === quot.vendorId || s.name === quot.vendorName);
                const alreadyHasPO = pos.some((p) => p.quotationId === quot.id);

                return (
                  <div
                    key={quot.id}
                    className="bg-white border-2 border-black rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4 font-mono text-xs relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-[#88b500] text-black font-black text-[10px] px-3 py-1 uppercase tracking-wider">
                      AWARDED BID
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">
                          {quot.id} • {parentRfq?.id || quot.rfqId}
                        </span>
                        <h3 className="text-lg font-black text-black uppercase mt-0.5">{quot.vendorName}</h3>
                        {parentRfq && (
                          <span className="text-[11px] text-gray-600 block line-clamp-1 mt-0.5">
                            {parentRfq.title}
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Bid Amount:</span>
                          <span className="font-black text-black text-sm">
                            ${(quot.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quot.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Lead Time:</span>
                          <span className="font-bold text-black">{quot.leadTimeDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Score Rating:</span>
                          <span className="font-bold text-emerald-700">{quot.totalScore} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Terms:</span>
                          <span className="font-bold text-black">{supplierInfo?.paymentTerms || "Net 30"}</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="border-t border-gray-100 pt-2 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Line Items:</span>
                        {quot.items.slice(0, 3).map((item, idx) => {
                          const mat = materials.find((m) => m.id === item.materialId);
                          return (
                            <div key={idx} className="flex justify-between text-[11px] text-gray-700">
                              <span>{mat?.name || item.materialId}</span>
                              <span className="font-bold font-mono">
                                ${(item.unitPrice ?? 0).toFixed(2)}/u
                              </span>
                            </div>
                          );
                        })}
                        {quot.items.length > 3 && (
                          <span className="text-[10px] text-gray-400 italic block">
                            +{quot.items.length - 3} more items...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      {alreadyHasPO ? (
                        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded text-center font-bold text-[11px] flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PO GENERATED & SUBMITTED</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenConvert(quot)}
                          className="w-full bg-black hover:bg-[#88b500] hover:text-black text-white font-bold py-2.5 px-4 rounded uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                        >
                          <span>CONFIGURE & ISSUE PO</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL PURCHASE ORDERS WORKLIST */}
      {activeSubTab === "all-pos" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-5 font-mono text-xs">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-300 px-3 py-1.5 rounded flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO Number, Vendor, RFQ Ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-black placeholder-gray-400 text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-gray-500 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 bg-white p-1.5 rounded font-bold text-black outline-none"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-y border-gray-200">
                  <th className="p-3">PO NUMBER</th>
                  <th className="p-3">VENDOR</th>
                  <th className="p-3">ISSUE DATE</th>
                  <th className="p-3">PAYMENT TERMS</th>
                  <th className="p-3 text-right">NET TOTAL</th>
                  <th className="p-3 text-right">TAX</th>
                  <th className="p-3 text-right">GRAND TOTAL</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 italic">
                      No Purchase Orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const statusColor =
                      po.status === "Approved" || po.status === "Confirmed"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : po.status === "Pending Approval"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : po.status === "Shipped" || po.status === "Completed"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : po.status === "Rejected"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-gray-100 text-gray-800 border-gray-300";

                    return (
                      <tr key={po.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-bold text-black">{po.id}</td>
                        <td className="p-3">
                          <span className="font-bold block text-black">{po.vendorName}</span>
                          <span className="text-[10px] text-gray-400">{po.rfqId}</span>
                        </td>
                        <td className="p-3 text-gray-600">{po.issueDate}</td>
                        <td className="p-3 font-medium text-gray-700">{po.paymentTerms}</td>
                        <td className="p-3 text-right font-mono">
                          ${(po.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500">
                          ${(po.taxAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-bold font-mono text-black">
                          ${(po.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {po.currency}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedPO(po);
                              setIsViewModalOpen(true);
                            }}
                            className="bg-black hover:bg-[#88b500] hover:text-black text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 mx-auto transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>VIEW PO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONVERT TO PO MODAL */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="GENERATE OFFICIAL PURCHASE ORDER (PO)"
        maxWidth="3xl"
      >
        {selectedWinningQuot && (
          <div className="space-y-6 font-mono text-xs">
            {/* Header info */}
            <div className="bg-gray-50 p-4 border border-gray-200 rounded grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px]">Vendor Name</span>
                <span className="font-black text-black text-sm">{selectedWinningQuot.vendorName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px]">Quotation Ref</span>
                <span className="font-bold text-black">{selectedWinningQuot.id}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px]">RFQ Reference</span>
                <span className="font-bold text-black">{selectedWinningQuot.rfqId}</span>
              </div>
            </div>

            {/* Config Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block uppercase mb-1">
                  Tax / VAT Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="w-full border-2 border-black p-2 font-bold text-black rounded"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Standard Adidas Global Procurement VAT rate (10%)
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block uppercase mb-1">
                  Sourcing Specialist
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${user.fullName} (${user.department})`}
                  className="w-full border border-gray-300 bg-gray-100 p-2 text-gray-600 rounded"
                />
              </div>
            </div>

            {/* Line items preview */}
            <div>
              <span className="font-bold uppercase text-gray-700 block mb-2">PO Line Items Breakdown:</span>
              <table className="w-full border border-gray-200 text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600 border-b">
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Est. Tax ({taxRatePercent}%)</th>
                    <th className="p-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedWinningQuot.items.map((item, idx) => {
                    const mat = materials.find((m) => m.id === item.materialId);
                    const itemTax = (item.lineTotal * taxRatePercent) / 100;
                    return (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{mat?.name || item.materialId}</td>
                        <td className="p-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">${Number(itemTax || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-bold font-mono">
                          ${(Number(item.lineTotal || 0) + Number(itemTax || 0)).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grand Total Summary */}
            {(() => {
              const subtotal = selectedWinningQuot.totalAmount;
              const tax = (subtotal * taxRatePercent) / 100;
              const grand = subtotal + tax;
              return (
                <div className="bg-gray-900 text-white p-4 rounded space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Net Subtotal:</span>
                    <span>${Number(subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">VAT / Tax ({taxRatePercent}%):</span>
                    <span>${Number(tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-gray-700 pt-2 text-[#88b500]">
                    <span>Grand Total Value:</span>
                    <span>${Number(grand || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedWinningQuot.currency}</span>
                  </div>
                </div>
              );
            })()}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2 border border-gray-300 font-bold uppercase hover:bg-gray-100 transition rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                disabled={isProcessing}
                className="px-6 py-2 bg-black hover:bg-[#88b500] hover:text-black text-white font-bold uppercase tracking-wider rounded transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isProcessing ? "GENERATING PO..." : "CONFIRM & SUBMIT FOR APPROVAL"}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* PO DETAIL DOCUMENT MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`PURCHASE ORDER DOCUMENT: ${selectedPO?.id}`}
        maxWidth="4xl"
      >
        {selectedPO && (
          <div className="space-y-6 font-mono text-xs p-2">
            {/* Header branding */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4">
              <div>
                <AdidasThreeBars className="w-12 h-12" />
                <h2 className="text-xl font-black uppercase tracking-tight mt-1">ADIDAS GLOBAL PROCUREMENT</h2>
                <span className="text-[10px] text-gray-500 block">Enterprise Procure-to-Pay System (ERP)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">PURCHASE ORDER NO.</span>
                <span className="text-xl font-black text-black font-mono">{selectedPO.id}</span>
                <span className="text-[11px] text-gray-600 block mt-0.5">Date: {selectedPO.issueDate}</span>
                <span className="inline-block mt-1 bg-black text-[#88b500] px-2.5 py-0.5 text-[10px] font-black uppercase">
                  STATUS: {selectedPO.status}
                </span>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">VENDOR / SUPPLIER</span>
                <p className="font-bold text-sm text-black">{selectedPO.vendorName}</p>
                <p className="text-gray-600">Vendor ID: {selectedPO.vendorId}</p>
                <p className="text-gray-600">Payment Terms: {selectedPO.paymentTerms}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">PURCHASER / BUYER</span>
                <p className="font-bold text-sm text-black">Adidas Procurement Vietnam Ltd.</p>
                <p className="text-gray-600">Buyer: {selectedPO.createdByName}</p>
                <p className="text-gray-600">Quotation Ref: {selectedPO.quotationId}</p>
                <p className="text-gray-600">RFQ Ref: {selectedPO.rfqId}</p>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <span className="font-bold uppercase text-gray-700 block mb-2">ORDERED ITEMS:</span>
              <table className="w-full border border-gray-300 text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-300">
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Material Description</th>
                    <th className="p-2.5 text-center">UOM</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Tax %</th>
                    <th className="p-2.5 text-right">Total ({selectedPO.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedPO.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 font-bold">{item.materialCode}</td>
                      <td className="p-2.5">{item.materialName}</td>
                      <td className="p-2.5 text-center">{item.uom}</td>
                      <td className="p-2.5 text-right font-bold">{item.quantity}</td>
                      <td className="p-2.5 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right text-gray-500">{item.taxRatePercent}%</td>
                      <td className="p-2.5 text-right font-bold font-mono">${Number(item.lineTotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div className="flex justify-end">
              <div className="w-72 bg-gray-50 p-4 border border-gray-200 rounded space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal (Excl. Tax):</span>
                  <span className="font-bold">${(selectedPO.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Amount:</span>
                  <span className="font-bold">${(selectedPO.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-black text-black">
                  <span>Grand Total:</span>
                  <span>${(selectedPO.grandTotal ?? 0).toFixed(2)} {selectedPO.currency}</span>
                </div>
              </div>
            </div>

            {/* Footer comments */}
            {selectedPO.managerComments && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-900">
                <span className="font-bold uppercase text-[10px] block">Procurement Manager Release Note:</span>
                <p className="mt-0.5">{selectedPO.managerComments}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {onDeletePO && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete Purchase Order ${selectedPO.id}? This action cannot be undone.`)) {
                      try {
                        await onDeletePO(selectedPO.id);
                        setIsViewModalOpen(false);
                        setSelectedPO(null);
                      } catch (err: any) {
                        alert(`Failed to delete PO: ${err.message || 'Unknown error'}`);
                      }
                    }
                  }}
                  className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 font-mono font-bold text-xs uppercase transition cursor-pointer"
                >
                  DELETE PURCHASE ORDER
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="ml-auto bg-black text-white px-6 py-2 font-mono font-bold text-xs uppercase hover:bg-gray-800 transition cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
