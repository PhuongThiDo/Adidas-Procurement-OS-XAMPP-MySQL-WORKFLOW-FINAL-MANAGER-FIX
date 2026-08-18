import React, { useState } from "react";
import { PurchaseOrder, User, GoodsReceiptItem } from "../../types";

interface GoodsReceiptProps {
  pos: PurchaseOrder[];
  user: User;
  onPostGoodsReceipt: (payload: {
    poId: string;
    receivedByUserId: string;
    receivedByUserName: string;
    receiptDate: string;
    items: any[];
    notes?: string;
  }) => Promise<void>;
}

export const GoodsReceipt: React.FC<GoodsReceiptProps> = ({
  pos,
  user,
  onPostGoodsReceipt,
}) => {
  const [poSearchId, setPoSearchId] = useState("");
  const [fetchedPO, setFetchedPO] = useState<PurchaseOrder | null>(null);

  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFetchPO = (poIdToFetch?: string) => {
    setValidationError(null);
    setSuccessMsg(null);
    const targetId = poIdToFetch || poSearchId;
    const po = pos.find((p) => p.id === targetId);

    if (!po) {
      setValidationError(`Purchase Order "${targetId}" not found or invalid.`);
      setFetchedPO(null);
      return;
    }

    setFetchedPO(po);

    // Initialize line items
    const grItems: GoodsReceiptItem[] = po.items.map((i) => ({
      id: `gr-item-${i.id}`,
      poDetailId: i.id,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      uom: i.uom,
      orderedQty: i.quantity,
      receivedQty: i.quantity, // Default to ordered qty
      rejectedQty: 0,
      defectReason: "Frayed or Damaged Fibers",
    }));

    setItems(grItems);
  };

  const handleItemChange = (
    poDetailId: string,
    field: keyof GoodsReceiptItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.poDetailId === poDetailId ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmitGR = async () => {
    setValidationError(null);
    setSuccessMsg(null);

    if (!fetchedPO) return;

    // QA Validations
    for (const line of items) {
      if (line.receivedQty < 0 || line.rejectedQty < 0) {
        setValidationError(`Quantities cannot be negative for ${line.materialName}.`);
        return;
      }

      if (line.receivedQty + line.rejectedQty > line.orderedQty) {
        setValidationError(
          `HARD ERROR: (Received Qty ${line.receivedQty} + Rejected Qty ${line.rejectedQty}) exceeds Ordered Qty ${line.orderedQty} for material ${line.materialName}.`
        );
        return;
      }

      if (line.rejectedQty > 0 && (!line.defectReason || line.defectReason.trim() === "")) {
        setValidationError(
          `Defect Reason is mandatory for material ${line.materialName} when Rejected Qty > 0.`
        );
        return;
      }
    }

    const payload = {
      poId: fetchedPO.id,
      receivedByUserId: user.id,
      receivedByUserName: user.fullName,
      receiptDate,
      items,
      notes,
    };

    try {
      await onPostGoodsReceipt(payload);
      setSuccessMsg(`Goods Receipt posted successfully for PO ${fetchedPO.id}. Inventory stock updated!`);
      setFetchedPO(null);
      setPoSearchId("");
    } catch (err: any) {
      setValidationError(err?.message || "Unable to post the goods receipt.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          GOODS RECEIPT EXECUTION & QUALITY INSPECTION
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Warehouse receiving station for posting inventory receipts and quality defect logging
        </p>
      </div>

      {validationError && (
        <div className="bg-red-50 border-2 border-red-500 p-3 text-xs font-mono font-bold text-red-700 uppercase">
          ERROR: {validationError}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border-2 border-green-500 p-3 text-xs font-mono font-bold text-green-900 uppercase">
          SUCCESS: {successMsg}
        </div>
      )}

      {/* PO FETCH BAR */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 font-mono text-xs">
        <h3 className="font-bold uppercase text-black border-b border-gray-200 pb-2">
          1. SEARCH & FETCH APPROVED PURCHASE ORDER
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={poSearchId}
            onChange={(e) => setPoSearchId(e.target.value)}
            placeholder="Enter PO ID (e.g. PO-2026-001)..."
            className="border-2 border-black p-2.5 text-black font-bold text-xs w-full sm:w-80 focus:outline-none"
          />

          <button
            onClick={() => handleFetchPO()}
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 uppercase tracking-wider cursor-pointer border-2 border-black"
          >
            FETCH PO DATA &rarr;
          </button>

          <span className="text-gray-400 hidden sm:inline">OR QUICK SELECT:</span>

          <select
            onChange={(e) => {
              if (e.target.value) {
                setPoSearchId(e.target.value);
                handleFetchPO(e.target.value);
              }
            }}
            className="border border-gray-300 p-2 font-bold text-black text-xs"
          >
            <option value="">-- Select PO --</option>
            {pos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.vendorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GOODS RECEIPT FORM */}
      {fetchedPO && (
        <div className="bg-white border border-gray-300 p-6 space-y-6 font-mono text-xs">
          <h3 className="font-bold uppercase text-black border-b border-gray-200 pb-2">
            2. RECEIVING INSPECTION DETAILS FOR PO: {fetchedPO.id}
          </h3>

          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 border border-gray-200">
            <div>
              <span className="text-gray-500 font-bold uppercase block">Supplier Vendor</span>
              <span className="font-bold text-black">{fetchedPO.vendorName}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase block">Receipt Date</span>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="border border-gray-300 p-1 font-bold text-black"
              />
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase block">Receiving Inspector</span>
              <span className="font-bold text-black">{user.fullName}</span>
            </div>
          </div>

          {/* Line Items Receiving Table */}
          <div>
            <h4 className="font-bold uppercase text-black mb-2">
              MATERIAL LINE ITEMS RECEIVING MATRIX
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-black text-white text-[11px] uppercase">
                    <th className="p-2 border border-black">Material Code</th>
                    <th className="p-2 border border-black">Material Name</th>
                    <th className="p-2 border border-black">UoM</th>
                    <th className="p-2 border border-black">Ordered Qty</th>
                    <th className="p-2 border border-black">Received (Accepted) Qty *</th>
                    <th className="p-2 border border-black">Rejected (Defect) Qty *</th>
                    <th className="p-2 border border-black">Defect Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((line) => (
                    <tr key={line.poDetailId} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-200 font-bold">{line.materialCode}</td>
                      <td className="p-2 border border-gray-200">{line.materialName}</td>
                      <td className="p-2 border border-gray-200 font-bold text-gray-600">{line.uom}</td>
                      <td className="p-2 border border-gray-200 font-black text-black">
                        {(line.orderedQty ?? 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-gray-200">
                        <input
                          type="number"
                          min="0"
                          value={line.receivedQty}
                          onChange={(e) =>
                            handleItemChange(line.poDetailId, "receivedQty", Number(e.target.value))
                          }
                          className="border border-gray-300 p-1 w-24 font-bold text-black"
                        />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <input
                          type="number"
                          min="0"
                          value={line.rejectedQty}
                          onChange={(e) =>
                            handleItemChange(line.poDetailId, "rejectedQty", Number(e.target.value))
                          }
                          className="border border-gray-300 p-1 w-24 font-bold text-red-600"
                        />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <select
                          disabled={line.rejectedQty === 0}
                          value={line.defectReason}
                          onChange={(e) =>
                            handleItemChange(line.poDetailId, "defectReason", e.target.value)
                          }
                          className="border border-gray-300 p-1 w-full font-bold text-black disabled:opacity-40"
                        >
                          <option value="Frayed or Damaged Fibers">Frayed or Damaged Fibers</option>
                          <option value="Color Shift Deviation">Color Shift Deviation</option>
                          <option value="Specification Non-Compliance">Specification Non-Compliance</option>
                          <option value="Moisture Contamination">Moisture Contamination</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Receiving Inspection Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter optional notes..."
              className="w-full border border-gray-300 p-2 font-medium"
            />
          </div>

          <div className="pt-4 border-t border-gray-300 flex justify-end">
            <button
              onClick={handleSubmitGR}
              className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 uppercase tracking-wider cursor-pointer border-2 border-black"
            >
              POST GOODS RECEIPT & UPDATE STOCK &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
