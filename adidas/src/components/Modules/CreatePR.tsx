import React, { useState } from "react";
import { Material, User, PRDetailItem } from "../../types";

interface CreatePRProps {
  user?: User | null;
  materials: Material[];
  initialLowStockItems?: Material[];
  onSubmitPR: (prData: any) => Promise<void>;
  onCancel: () => void;
}

export const CreatePR: React.FC<CreatePRProps> = ({
  user,
  materials,
  initialLowStockItems,
  onSubmitPR,
  onCancel,
}) => {
  const [prId] = useState(`PR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [requestDate] = useState(new Date().toISOString().substring(0, 10));
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10)
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize line items
  const [items, setItems] = useState<PRDetailItem[]>(() => {
    if (initialLowStockItems && initialLowStockItems.length > 0) {
      return initialLowStockItems.map((mat, idx) => ({
        id: `pr-line-${idx + 1}`,
        materialId: mat.id,
        materialCode: mat.materialCode,
        materialName: mat.name,
        uom: mat.uom,
        quantity: Math.max(mat.safetyStockQty * 2 - mat.currentStockQty, 1000),
        estimatedUnitPrice: mat.standardCost,
      }));
    }
    // Default 1 line
    const first = materials[0];
    return [
      {
        id: "pr-line-1",
        materialId: first?.id || "",
        materialCode: first?.materialCode || "",
        materialName: first?.name || "",
        uom: first?.uom || "METERS",
        quantity: 1000,
        estimatedUnitPrice: first?.standardCost || 10,
      },
    ];
  });

  const handleMaterialChange = (lineId: string, materialId: string) => {
    const selectedMat = materials.find((m) => m.id === materialId);
    if (!selectedMat) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              materialId: selectedMat.id,
              materialCode: selectedMat.materialCode,
              materialName: selectedMat.name,
              uom: selectedMat.uom,
              estimatedUnitPrice: selectedMat.standardCost,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (lineId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, quantity: qty } : item))
    );
  };

  const handleAddLine = () => {
    const first = materials[0];
    setItems((prev) => [
      ...prev,
      {
        id: `pr-line-${Date.now()}`,
        materialId: first?.id || "",
        materialCode: first?.materialCode || "",
        materialName: first?.name || "",
        uom: first?.uom || "METERS",
        quantity: 1000,
        estimatedUnitPrice: first?.standardCost || 10,
      },
    ]);
  };

  const handleDeleteLine = (lineId: string) => {
    if (items.length === 1) {
      alert("At least one material line item is required.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== lineId));
  };

  const calculateTotal = () => {
    return items.reduce((acc, i) => acc + (i.quantity || 0) * (i.estimatedUnitPrice || 0), 0);
  };

  const handleSave = async (status: "Draft" | "Submitted") => {
    setValidationError(null);
    setSuccessMsg(null);

    // Business Rules Validation
    const todayStr = new Date().toISOString().substring(0, 10);
    if (requiredDeliveryDate < todayStr) {
      setValidationError("Required Delivery Date cannot be prior to today's date.");
      return;
    }

    if (!items || items.length === 0) {
      setValidationError("At least one material item is required to create a PR.");
      return;
    }

    for (const line of items) {
      if (!line.materialId) {
        setValidationError("Please select a valid material for all line items.");
        return;
      }
      if (!line.quantity || line.quantity <= 0) {
        setValidationError(`Quantity for material "${line.materialName || 'item'}" must be greater than 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: prId,
        creatorId: user?.id || "usr-101",
        creatorName: user?.fullName || "John Planner",
        requestDate,
        requiredDeliveryDate,
        status,
        items,
        totalEstimatedCost: calculateTotal(),
      };

      await onSubmitPR(payload);
      setSuccessMsg(
        status === "Submitted"
          ? `Purchase Requisition ${prId} was submitted to the Sourcing queue.`
          : `Purchase Requisition ${prId} was saved as a draft.`
      );
      setIsSubmitting(false);
      window.setTimeout(onCancel, 900);
    } catch (err: any) {
      setValidationError(err.message || "Failed to submit Purchase Requisition. Please try again.");
      setSuccessMsg(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            CREATE PURCHASE REQUISITION (PR)
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Internal material demand requisition form for Sourcing team processing
          </p>
        </div>
        <button
          onClick={onCancel}
          className="border border-gray-400 text-black px-3 py-1 font-mono font-bold text-xs uppercase hover:bg-gray-100 cursor-pointer"
        >
          CANCEL
        </button>
      </div>

      {successMsg && (
        <div className="bg-[#c6f135]/20 border-2 border-[#88b500] p-4 text-xs font-mono font-bold text-black flex items-center justify-between">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {validationError && (
        <div className="bg-red-50 border-2 border-red-500 p-3 text-xs font-mono font-bold text-red-700 uppercase">
          ERROR: {validationError}
        </div>
      )}

      {/* General Header Section */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 text-xs font-mono">
        <h3 className="font-bold uppercase text-black border-b border-gray-200 pb-2">
          REQUISITION GENERAL INFORMATION
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-500 uppercase font-bold mb-1">PR ID (Auto)</label>
            <input
              type="text"
              readOnly
              value={prId}
              className="w-full bg-gray-100 border border-gray-300 p-2 font-bold text-black cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-500 uppercase font-bold mb-1">Creator</label>
            <input
              type="text"
              readOnly
              value={user?.fullName || "John Planner"}
              className="w-full bg-gray-100 border border-gray-300 p-2 font-bold text-black cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-500 uppercase font-bold mb-1">Request Date</label>
            <input
              type="text"
              readOnly
              value={requestDate}
              className="w-full bg-gray-100 border border-gray-300 p-2 font-bold text-black cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-black uppercase font-bold mb-1">Required Delivery Date *</label>
            <input
              type="date"
              required
              value={requiredDeliveryDate}
              onChange={(e) => setRequiredDeliveryDate(e.target.value)}
              className="w-full border border-black p-2 font-bold text-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="font-bold uppercase text-black">REQUISITION LINE ITEMS</h3>
          <button
            onClick={handleAddLine}
            className="bg-black hover:bg-gray-800 text-white font-bold px-3 py-1 uppercase text-xs cursor-pointer"
          >
            + ADD MATERIAL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white font-mono text-[11px] uppercase">
                <th className="p-3">Material Selection</th>
                <th className="p-3">Material Name</th>
                <th className="p-3">UoM</th>
                <th className="p-3">Quantity *</th>
                <th className="p-3">Est Unit Price</th>
                <th className="p-3">Est Total</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((line) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="p-2">
                    <select
                      value={line.materialId}
                      onChange={(e) => handleMaterialChange(line.id, e.target.value)}
                      className="border border-gray-300 p-1.5 w-full font-bold text-black"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.materialCode} - {m.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 font-medium">{line.materialName}</td>

                  <td className="p-2 font-mono font-bold text-gray-600">{line.uom}</td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleQuantityChange(line.id, Number(e.target.value))}
                      className="border border-gray-300 p-1.5 w-28 font-bold text-black"
                    />
                  </td>

                  <td className="p-2 font-mono">${Number(line.estimatedUnitPrice ?? 0).toFixed(2)}</td>

                  <td className="p-2 font-bold font-mono text-black">
                    ${(Number(line.quantity ?? 0) * Number(line.estimatedUnitPrice ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-2">
                    <button
                      onClick={() => handleDeleteLine(line.id)}
                      className="text-red-600 font-bold border border-red-600 px-2 py-0.5 hover:bg-red-600 hover:text-white cursor-pointer uppercase text-[10px]"
                    >
                      DELETE LINE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Cost Summary */}
        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <div className="bg-gray-50 p-4 border border-gray-300 text-right space-y-1">
            <span className="text-gray-500 font-bold uppercase text-[11px]">TOTAL ESTIMATED COST:</span>
            <div className="text-xl font-black text-black font-mono">
              ${(calculateTotal() ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave("Draft")}
          className="border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-mono font-bold text-xs uppercase px-6 py-3 cursor-pointer"
        >
          {isSubmitting ? "SAVING..." : "SAVE DRAFT"}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave("Submitted")}
          className="bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase px-8 py-3 cursor-pointer border-2 border-black"
        >
          {isSubmitting ? "SUBMITTING..." : "SUBMIT PR TO SOURCING \u2192"}
        </button>
      </div>
    </div>
  );
};
