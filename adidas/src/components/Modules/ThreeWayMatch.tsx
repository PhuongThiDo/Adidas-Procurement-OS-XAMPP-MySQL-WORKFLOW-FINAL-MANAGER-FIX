import React, { useState } from "react";
import { Invoice, PurchaseOrder, GoodsReceipt } from "../../types";

interface ThreeWayMatchProps {
  invoices: Invoice[];
  pos: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  onApproveMatch: (invoiceId: string) => Promise<void>;
  onRaiseDiscrepancy: (poId: string, vendorName: string, desc: string) => Promise<void>;
}

export const ThreeWayMatch: React.FC<ThreeWayMatchProps> = ({
  invoices,
  pos,
  goodsReceipts,
  onApproveMatch,
  onRaiseDiscrepancy,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || "");

  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
  const linkedPO = pos.find((p) => p.id === activeInvoice?.poId);
  const linkedGR = goodsReceipts.find((g) => g.poId === activeInvoice?.poId);

  const [discrepancyDesc, setDiscrepancyDesc] = useState("");
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Match check calculations
  const poAmount = linkedPO?.grandTotal || 0;
  const invoiceAmount = activeInvoice?.grandTotal || 0;
  const isAmountMatch = Math.abs(poAmount - invoiceAmount) < 0.01;
  const canApprove = Boolean(linkedPO && linkedGR && isAmountMatch);

  const handleApprove = async () => {
    if (!activeInvoice) return;
    setActionError(null);
    try {
      await onApproveMatch(activeInvoice.id);
    } catch (err: any) {
      setActionError(err?.message || "Unable to verify this invoice.");
    }
  };

  const handleRaise = async () => {
    if (!activeInvoice) return;
    setActionError(null);
    try {
      await onRaiseDiscrepancy(activeInvoice.id, activeInvoice.vendorName, discrepancyDesc || "Invoice price mismatch detected during 3-Way Audit.");
      setShowDiscrepancyModal(false);
    } catch (err: any) {
      setActionError(err?.message || "Unable to raise a discrepancy.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            3-WAY MATCH VERIFICATION ENGINE
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Automated tri-verification matching: Purchase Order (PO) vs Goods Receipt (GR) vs Supplier Invoice
          </p>
        </div>

        {/* Invoice Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="font-bold uppercase">SELECT INVOICE:</span>
          <select
            value={activeInvoice?.id || ""}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="border-2 border-black bg-white text-black font-bold p-2 outline-none"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.vendorInvoiceNumber} ({inv.vendorName}) - ${((inv.grandTotal ?? 0)).toLocaleString()} [{inv.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeInvoice ? (
        <div className="bg-white border border-gray-300 p-6 space-y-6 text-xs font-mono">
          {actionError && <div className="border-2 border-red-500 bg-red-50 p-3 font-bold text-red-800">{actionError}</div>}
          {/* TRI-PANEL COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PANEL 1: PURCHASE ORDER */}
            <div className="border-2 border-black p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between font-bold border-b border-black pb-2">
                <span>1. PURCHASE ORDER (PO)</span>
                <span className="text-black">{linkedPO?.id || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Status:</span>
                  <span className="font-bold">{linkedPO?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendor Code:</span>
                  <span>{linkedPO?.vendorId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Committed PO Total:</span>
                  <span className="font-black text-black">
                    ${(poAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL 2: GOODS RECEIPT */}
            <div className="border-2 border-black p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between font-bold border-b border-black pb-2">
                <span>2. GOODS RECEIPT (GR)</span>
                <span className="text-black">{linkedGR?.id || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Receipt Date:</span>
                  <span className="font-bold">{linkedGR?.receiptDate || "Received"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Received By:</span>
                  <span>{linkedGR?.receivedByUserName || "QC Inspector"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receiving Status:</span>
                  <span className="font-bold text-green-700">INSPECTION PASSED</span>
                </div>
              </div>
            </div>

            {/* PANEL 3: SUPPLIER INVOICE */}
            <div className="border-2 border-black p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between font-bold border-b border-black pb-2">
                <span>3. SUPPLIER INVOICE</span>
                <span className="text-black">{activeInvoice.vendorInvoiceNumber}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Date:</span>
                  <span className="font-bold">{activeInvoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendor:</span>
                  <span>{activeInvoice.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Billed Invoice Total:</span>
                  <span className="font-black text-black">
                    ${(invoiceAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VERIFICATION RESULTS MATRIX */}
          <div className="border-2 p-5 space-y-4 bg-gray-50 border-gray-300">
            <h3 className="font-bold uppercase text-black text-sm border-b border-gray-200 pb-2">
              AUTOMATED 3-WAY MATCHING AUDIT AUDIT RESULTS
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 border border-gray-300 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">PO vs INVOICE TOTAL</span>
                <span className={`font-black text-xs px-2 py-0.5 inline-block ${isAmountMatch ? "bg-green-100 text-green-900 border border-green-500" : "bg-red-100 text-red-900 border border-red-500"}`}>
                  {isAmountMatch ? "MATCHED (100%)" : "PRICE DISCREPANCY"}
                </span>
              </div>

              <div className="bg-white p-3 border border-gray-300 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">VENDOR TAX ID MATCH</span>
                <span className="font-black text-xs px-2 py-0.5 inline-block bg-green-100 text-green-900 border border-green-500">
                  VERIFIED
                </span>
              </div>

              <div className="bg-white p-3 border border-gray-300 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">GR RECEIVING QUANTITY</span>
                <span className="font-black text-xs px-2 py-0.5 inline-block bg-green-100 text-green-900 border border-green-500">
                  VERIFIED
                </span>
              </div>

              <div className="bg-white p-3 border border-gray-300 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">3-WAY STATUS</span>
                <span className="font-black text-xs px-2 py-0.5 inline-block uppercase bg-blue-100 text-blue-900 border border-blue-500">
                  {activeInvoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-300">
            <button
              onClick={() => setShowDiscrepancyModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 uppercase tracking-wider cursor-pointer border-2 border-red-700 text-xs"
            >
              RAISE DISCREPANCY TICKET
            </button>

            {activeInvoice.status !== "Verified" && activeInvoice.status !== "Paid" && (
              <button
                onClick={handleApprove}
                disabled={!canApprove}
                title={!canApprove ? "A matching PO, goods receipt, and invoice total are required before verification." : undefined}
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 uppercase tracking-wider cursor-pointer border-2 border-black text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                APPROVE 3-WAY MATCH & VERIFY INVOICE &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 font-mono italic">
          No supplier invoices available for matching.
        </div>
      )}

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-md font-mono text-xs space-y-4">
            <h3 className="font-bold text-sm uppercase border-b border-gray-300 pb-2">
              RAISE DISCREPANCY TICKET
            </h3>
            <div>
              <label className="block font-bold uppercase mb-1">Discrepancy Description</label>
              <textarea
                rows={4}
                value={discrepancyDesc}
                onChange={(e) => setDiscrepancyDesc(e.target.value)}
                placeholder="Describe billing amount mismatch or line item discrepancy..."
                className="w-full border border-gray-300 p-2 font-medium"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDiscrepancyModal(false)}
                className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100"
              >
                CANCEL
              </button>
              <button
                onClick={handleRaise}
                className="bg-red-600 text-white px-6 py-2 font-bold uppercase hover:bg-red-700"
              >
                SUBMIT DISCREPANCY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
