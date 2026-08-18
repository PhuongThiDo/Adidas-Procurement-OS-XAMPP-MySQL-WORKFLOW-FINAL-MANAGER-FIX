import React, { useState } from "react";
import { RFQ, VendorQuotation, PurchaseOrder, User } from "../../types";
import { Modal } from "../Common/Modal";
import { Trophy, CheckCircle2, Award, ArrowRight, DollarSign, Clock, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

interface RFQManagerProps {
  rfqs: RFQ[];
  quotations: VendorQuotation[];
  user: User;
  onSelectWinningQuotation: (quotationId: string) => Promise<void>;
  onConvertToPO: (quotationId: string, taxRatePercent: number) => Promise<void>;
}

export const RFQManager: React.FC<RFQManagerProps> = ({
  rfqs,
  quotations,
  user,
  onSelectWinningQuotation,
  onConvertToPO,
}) => {
  const [selectedRfqId, setSelectedRfqId] = useState<string>(rfqs[0]?.id || "");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedWinningQuot, setSelectedWinningQuot] = useState<VendorQuotation | null>(null);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeRfq = rfqs.find((r) => r.id === selectedRfqId) || rfqs[0];
  const rfqQuotations = quotations.filter((q) => q.rfqId === activeRfq?.id);

  const winningQuotation = rfqQuotations.find((q) => q.status === "Accepted" || q.id === activeRfq?.winningQuotationId);

  const handleSelectWinner = async (quot: VendorQuotation) => {
    try {
      setIsSelectingId(quot.id);
      setToastMsg(null);
      await onSelectWinningQuotation(quot.id);
      setToastMsg(`Successfully selected ${quot.vendorName} (${quot.id}) as the winning supplier bid!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      alert("Failed to select winning quotation: " + (err?.message || "Unknown error"));
    } finally {
      setIsSelectingId(null);
    }
  };

  const handleOpenConvertToPO = (quot: VendorQuotation) => {
    setSelectedWinningQuot(quot);
    setTaxRatePercent(10);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvertToPO = async () => {
    if (!selectedWinningQuot) return;
    try {
      await onConvertToPO(selectedWinningQuot.id, taxRatePercent);
      setIsConvertModalOpen(false);
      setSelectedWinningQuot(null);
      setToastMsg(`Purchase Order generated and submitted for Executive Manager approval!`);
    } catch (err: any) {
      alert("Error converting to PO: " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-black" />
            <span>RFQ & QUOTATION COMPARISON MATRIX</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Evaluate supplier bids, score matrix, award winning quotation, and generate Purchase Order
          </p>
        </div>

        {/* RFQ Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="font-bold uppercase text-gray-700">ACTIVE RFQ:</span>
          <select
            value={activeRfq?.id || ""}
            onChange={(e) => setSelectedRfqId(e.target.value)}
            className="border-2 border-black bg-white text-black font-bold p-2 outline-none shadow-sm cursor-pointer"
          >
            {rfqs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} - {r.title.substring(0, 35)}... ({r.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-[#c6f135]/20 border-2 border-[#88b500] p-4 rounded-lg flex items-center justify-between font-mono text-xs text-black shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-[#88b500] flex-shrink-0" />
            <div>
              <span className="font-black uppercase block">REAL-TIME UPDATE</span>
              <span>{toastMsg}</span>
            </div>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs font-bold text-gray-600 hover:text-black">✕</button>
        </div>
      )}

      {activeRfq && (
        <div className="bg-white border border-gray-300 p-6 space-y-6 text-xs font-mono shadow-sm">
          {/* RFQ Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 border border-gray-300 rounded">
            <div>
              <span className="text-gray-500 font-bold uppercase block text-[10px]">RFQ ID</span>
              <span className="font-bold text-black text-sm">{activeRfq.id}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase block text-[10px]">Issue Date</span>
              <span className="font-bold text-black">{activeRfq.issueDate}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase block text-[10px]">Bidding Due Date</span>
              <span className="font-bold text-black">{activeRfq.dueDate}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase block text-[10px]">RFQ Lifecycle Status</span>
              <span className={`font-black uppercase px-2 py-0.5 inline-block mt-0.5 text-[11px] rounded ${
                activeRfq.status === "Awarded"
                  ? "bg-[#c6f135] text-black border border-[#88b500]"
                  : "bg-blue-100 text-blue-900 border border-blue-400"
              }`}>
                {activeRfq.status} {activeRfq.status === "Awarded" && "✓"}
              </span>
            </div>
          </div>

          {/* QUOTATION COMPARISON MATRIX */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
              <h3 className="font-bold uppercase text-black flex items-center space-x-2 text-sm">
                <Award className="w-4 h-4 text-black" />
                <span>SUPPLIER BIDS COMPARISON & EVALUATION MATRIX</span>
              </h3>
              <span className="text-[11px] text-gray-500 font-mono">
                {rfqQuotations.length} Bids Submitted
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rfqQuotations.length === 0 ? (
                <div className="p-8 border border-gray-300 text-center text-gray-500 italic col-span-3 bg-gray-50 rounded">
                  No supplier quotations submitted yet for this RFQ. Switch to the Vendor role to submit a bid.
                </div>
              ) : (
                rfqQuotations.map((quot) => {
                  const isWinner = quot.status === "Accepted" || activeRfq.winningQuotationId === quot.id;
                  const isPending = isSelectingId === quot.id;

                  return (
                    <div
                      key={quot.id}
                      className={`border-2 p-5 space-y-4 flex flex-col justify-between transition-all rounded-lg ${
                        isWinner
                          ? "border-[#88b500] bg-lime-50/60 shadow-md ring-2 ring-[#c6f135]/50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div>
                        {/* Vendor Name & Status */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <div>
                            <span className="font-black text-black text-sm uppercase block">
                              {quot.vendorName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Quotation #{quot.id}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded ${
                              isWinner
                                ? "bg-[#c6f135] text-black border-[#88b500] font-black"
                                : quot.status === "Rejected"
                                ? "bg-gray-100 text-gray-600 border-gray-300"
                                : "bg-blue-100 text-blue-900 border-blue-400"
                            }`}
                          >
                            {isWinner ? "✓ WINNER" : quot.status}
                          </span>
                        </div>

                        {/* Bid Metrics */}
                        <div className="space-y-2 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">Total Bid Amount:</span>
                            <span className="font-black text-black text-base font-mono">
                              ${(quot.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quot.currency}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">Lead Time:</span>
                            <span className="font-bold text-black">{quot.leadTimeDays || 14} Days</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">Valid Until:</span>
                            <span>{quot.validUntil || "2026-09-30"}</span>
                          </div>
                        </div>

                        {/* Automated Score Panel */}
                        <div className="bg-gray-50 border border-gray-200 p-3 mt-4 space-y-1 rounded">
                          <span className="font-bold text-[10px] uppercase text-gray-500 block mb-1">
                            AUTOMATED EVALUATION SCORES
                          </span>
                          <div className="grid grid-cols-3 text-center gap-1 text-[11px]">
                            <div className="bg-white border border-gray-200 p-1 rounded">
                              <span className="block text-[9px] text-gray-500">COST</span>
                              <span className="font-black text-black">{quot.costScore || 90}</span>
                            </div>
                            <div className="bg-white border border-gray-200 p-1 rounded">
                              <span className="block text-[9px] text-gray-500">QUALITY</span>
                              <span className="font-black text-black">{quot.qualityScore || 95}</span>
                            </div>
                            <div className="bg-white border border-gray-200 p-1 rounded">
                              <span className="block text-[9px] text-gray-500">DELIVERY</span>
                              <span className="font-black text-black">{quot.deliveryScore || 92}</span>
                            </div>
                          </div>
                          <div className="pt-2 text-center border-t border-gray-200 mt-2 flex justify-between items-center">
                            <span className="text-[10px] text-gray-600 font-bold uppercase">TOTAL SCORE: </span>
                            <span className="font-black text-black text-sm bg-white px-2 py-0.5 border border-gray-300 rounded font-mono">
                              {quot.totalScore || 92} / 100
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        {!isWinner ? (
                          <button
                            disabled={isPending}
                            onClick={() => handleSelectWinner(quot)}
                            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-2.5 uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-1.5 transition rounded"
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#c6f135]" />
                            <span>{isPending ? "AWARDING..." : winningQuotation ? "SWITCH TO THIS WINNER" : "SELECT WINNING QUOTATION"}</span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="bg-[#c6f135] text-black font-black py-1.5 text-center uppercase tracking-wide text-[11px] border border-[#88b500] rounded">
                              ✓ WINNING BID AWARDED
                            </div>
                            <button
                              onClick={() => handleOpenConvertToPO(quot)}
                              className="w-full bg-black hover:bg-gray-800 text-[#c6f135] font-black py-2.5 uppercase tracking-wider cursor-pointer border-2 border-black flex items-center justify-center space-x-2 transition rounded shadow"
                            >
                              <span>CONVERT WINNING BID TO PO</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert to PO Modal Form */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title={`CONVERT WINNING QUOTATION TO PURCHASE ORDER (PO)`}
        maxWidth="4xl"
      >
        {selectedWinningQuot && (
          <div className="space-y-6 text-xs font-mono">
            {/* Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 border border-gray-300 rounded">
              <div>
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Vendor Name</span>
                <span className="font-bold text-black text-sm">{selectedWinningQuot.vendorName}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Quotation Reference</span>
                <span className="font-bold text-black">{selectedWinningQuot.id}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Tax Rate Input (%) *</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="border-2 border-black p-1.5 font-bold text-black w-28 bg-white"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1 mb-2">
                PURCHASE ORDER LINE ITEMS PREVIEW
              </h4>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-black text-white uppercase text-[11px]">
                    <th className="p-2 border border-black">Material Reference</th>
                    <th className="p-2 border border-black">Unit Price</th>
                    <th className="p-2 border border-black">Tax Rate</th>
                    <th className="p-2 border border-black">Tax Amount</th>
                    <th className="p-2 border border-black text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedWinningQuot.items?.map((item) => {
                    const lineSubtotal = Number(item.lineTotal || 0);
                    const lineTax = lineSubtotal * (taxRatePercent / 100);
                    return (
                      <tr key={item.materialId} className="hover:bg-gray-50">
                        <td className="p-2 font-bold border border-gray-200">{item.materialId}</td>
                        <td className="p-2 border border-gray-200">${(item.unitPrice ?? 0).toFixed(2)}</td>
                        <td className="p-2 border border-gray-200">{taxRatePercent}%</td>
                        <td className="p-2 border border-gray-200">${(lineTax ?? 0).toFixed(2)}</td>
                        <td className="p-2 font-bold border border-gray-200 text-right font-mono">
                          ${((lineSubtotal ?? 0) + (lineTax ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="border border-gray-300 px-4 py-2.5 font-bold uppercase hover:bg-gray-100 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmConvertToPO}
                className="bg-black text-[#c6f135] px-6 py-2.5 font-bold uppercase hover:bg-gray-800 cursor-pointer flex items-center space-x-1.5"
              >
                <span>SUBMIT PO TO MANAGER FOR APPROVAL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
