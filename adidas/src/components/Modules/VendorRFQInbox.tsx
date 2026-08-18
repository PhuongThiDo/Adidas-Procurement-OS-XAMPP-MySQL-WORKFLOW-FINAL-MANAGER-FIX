import React, { useState } from "react";
import { RFQ, VendorQuotation, User } from "../../types";
import { Modal } from "../Common/Modal";

interface VendorRFQInboxProps {
  rfqs: RFQ[];
  quotations: VendorQuotation[];
  user: User;
  onSubmitQuotation: (payload: any) => Promise<void>;
}

export const VendorRFQInbox: React.FC<VendorRFQInboxProps> = ({
  rfqs,
  quotations,
  user,
  onSubmitQuotation,
}) => {
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  // Form for quotation submission
  const [unitPrices, setUnitPrices] = useState<{ [matId: string]: number }>({});
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "VND">("USD");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleOpenBid = (rfq: RFQ) => {
    setFeedback(null);
    setSelectedRfq(rfq);
    const initialPrices: { [matId: string]: number } = {};
    rfq.items.forEach((item) => {
      initialPrices[item.materialId] = item.targetPrice || 10;
    });
    setUnitPrices(initialPrices);
  };

  const handlePriceChange = (matId: string, price: number) => {
    setUnitPrices((prev) => ({ ...prev, [matId]: price }));
  };

  const handleSubmit = async () => {
    if (!selectedRfq) return;

    const itemsPayload = selectedRfq.items.map((item) => ({
      materialId: item.materialId,
      unitPrice: unitPrices[item.materialId] || 10,
    }));

    let totalAmount = 0;
    selectedRfq.items.forEach((item) => {
      totalAmount += item.quantity * (unitPrices[item.materialId] || 10);
    });

    try {
      setIsSubmitting(true);
      await onSubmitQuotation({
        rfqId: selectedRfq.id,
        vendorId: user.vendorId,
        vendorName: user.fullName,
        items: itemsPayload,
        totalAmount,
        currency,
        leadTimeDays,
        validUntil,
        notes,
      });
      setFeedback({ type: "success", message: `Quotation for ${selectedRfq.id} submitted successfully.` });
      setSelectedRfq(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Unable to submit quotation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          VENDOR RFQ BIDDING INBOX
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Supplier portal for reviewing Adidas sourcing RFQs and submitting competitive quotations
        </p>
      </div>
      {feedback && <div className={`border-2 p-3 text-xs font-mono font-bold ${feedback.type === "success" ? "bg-green-50 border-green-500 text-green-900" : "bg-red-50 border-red-500 text-red-900"}`}>{feedback.message}</div>}

      <div className="bg-white border border-gray-300 p-6 space-y-4 font-mono text-xs">
        <h3 className="font-bold uppercase text-black border-b border-gray-200 pb-2">
          OPEN BIDDING REQUESTS FOR QUOTATION ({rfqs.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rfqs.map((rfq) => {
            const myQuot = quotations.find((q) => q.rfqId === rfq.id && q.vendorId === user.vendorId);
            return (
              <div
                key={rfq.id}
                className="border-2 border-black p-5 space-y-4 bg-gray-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="font-bold text-black text-sm">{rfq.id}</span>
                    <span className="bg-blue-100 text-blue-900 border border-blue-500 text-[10px] uppercase font-bold px-2 py-0.5">
                      {rfq.status}
                    </span>
                  </div>

                  <p className="font-bold text-black mt-2">{rfq.title}</p>

                  <div className="space-y-1 mt-3 text-gray-600">
                    <div>Issue Date: {rfq.issueDate}</div>
                    <div className="font-bold text-black">Bidding Due Date: {rfq.dueDate}</div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <span className="font-bold text-black uppercase block mb-1">
                      REQUESTED MATERIALS ({rfq.items.length}):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                      {rfq.items.map((i) => (
                        <li key={i.materialId}>
                          {i.materialName} - {(i.quantity ?? 0).toLocaleString()} {i.uom}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-300">
                  {myQuot ? (
                    <div className="bg-green-100 border border-green-500 p-3 text-center font-bold text-green-900 uppercase">
                      BID SUBMITTED: ${((myQuot.totalAmount ?? 0)).toLocaleString()} ({myQuot.status})
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenBid(rfq)}
                      className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2.5 uppercase tracking-wider cursor-pointer border-2 border-black"
                    >
                      SUBMIT QUOTATION BID &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Quotation Modal */}
      <Modal
        isOpen={!!selectedRfq}
        onClose={() => setSelectedRfq(null)}
        title={`SUBMIT QUOTATION BID FOR RFQ: ${selectedRfq?.id}`}
        maxWidth="3xl"
      >
        {selectedRfq && (
          <div className="space-y-6 font-mono text-xs">
            <div className="space-y-3">
              <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1">
                ENTER UNIT PRICES PER MATERIAL
              </h4>

              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-black text-white text-[11px] uppercase">
                    <th className="p-2 border border-black">Material</th>
                    <th className="p-2 border border-black">Quantity</th>
                    <th className="p-2 border border-black">Unit Price Bid ($) *</th>
                    <th className="p-2 border border-black">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedRfq.items.map((item) => {
                    const price = unitPrices[item.materialId] || 10;
                    return (
                      <tr key={item.materialId}>
                        <td className="p-2 border border-gray-200 font-bold">{item.materialName}</td>
                        <td className="p-2 border border-gray-200">{(item.quantity ?? 0).toLocaleString()} {item.uom}</td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={price}
                            onChange={(e) => handlePriceChange(item.materialId, Number(e.target.value))}
                            className="border border-black p-1 w-28 font-bold text-black"
                          />
                        </td>
                        <td className="p-2 border border-gray-200 font-bold">
                          ${((item.quantity ?? 0) * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Delivery Lead Time (Days) *</label>
                <input
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2 font-bold text-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full border border-gray-300 p-2 font-bold text-black"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VND">VND (₫)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Quotation Valid Until *</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-bold text-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Supplier Notes / Compliance Terms</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter quality guarantee terms or shipping comments..."
                className="w-full border border-gray-300 p-2 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedRfq(null)}
                className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-black text-white px-8 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer border-2 border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "SUBMITTING BID..." : "SUBMIT BINDING QUOTATION BID →"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
