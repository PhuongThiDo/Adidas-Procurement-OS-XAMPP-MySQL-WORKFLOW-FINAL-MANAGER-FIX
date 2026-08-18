import React, { useEffect, useState } from "react";
import { Material, Supplier } from "../../types";
import { DataTable, Column } from "../Common/DataTable";
import { Modal } from "../Common/Modal";

interface MaterialMasterProps {
  materials: Material[];
  suppliers: Supplier[];
  onCreateMaterial: (mat: Partial<Material>) => Promise<void>;
  onUpdateMaterial: (id: string, mat: Partial<Material>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onCreatePRForMaterial?: (material: Material) => void;
}

export const MaterialMaster: React.FC<MaterialMasterProps> = ({
  materials,
  suppliers,
  onCreateMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onCreatePRForMaterial,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<Material | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    materialCode: "",
    name: "",
    category: "Textile",
    uom: "METERS",
    forecastQty: 10000,
    currentStockQty: 5000,
    safetyStockQty: 2000,
    standardCost: 10.0,
    supplierId: suppliers[0]?.id || "",
  });

  useEffect(() => {
    if (!form.supplierId && suppliers.length > 0) {
      setForm((prev) => ({ ...prev, supplierId: suppliers[0].id }));
    }
  }, [suppliers, form.supplierId]);

  const handleOpenCreate = () => {
    setEditingMat(null);
    setActionFeedback(null);
    setForm({
      materialCode: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      category: "Textile",
      uom: "METERS",
      forecastQty: 10000,
      currentStockQty: 5000,
      safetyStockQty: 2000,
      standardCost: 10.0,
      supplierId: suppliers[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: Material) => {
    setEditingMat(mat);
    setActionFeedback(null);
    setForm({
      materialCode: mat.materialCode,
      name: mat.name,
      category: mat.category,
      uom: mat.uom,
      forecastQty: mat.forecastQty,
      currentStockQty: mat.currentStockQty,
      safetyStockQty: mat.safetyStockQty,
      standardCost: mat.standardCost,
      supplierId: mat.supplierId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (editingMat) {
        await onUpdateMaterial(editingMat.id, form);
        setActionFeedback({ type: "success", message: `Material ${form.name} (${form.materialCode}) updated successfully.` });
      } else {
        await onCreateMaterial({ ...form, id: form.materialCode });
        setActionFeedback({ type: "success", message: `New material ${form.name} (${form.materialCode}) created and added to database.` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Operation failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<Material>[] = [
    { key: "materialCode", header: "Material ID" },
    { key: "name", header: "Material Name" },
    { key: "category", header: "Category" },
    { key: "uom", header: "UoM" },
    { key: "forecastQty", header: "Forecast Qty", render: (r) => Number(r.forecastQty ?? 0).toLocaleString() },
    {
      key: "currentStockQty",
      header: "Stock Qty",
      render: (r) => {
        const isLow = Number(r.currentStockQty ?? 0) < Number(r.safetyStockQty ?? 0);
        return (
          <span className={`font-mono font-bold ${isLow ? "text-red-600 bg-red-50 px-1 border border-red-300" : "text-black"}`}>
            {Number(r.currentStockQty ?? 0).toLocaleString()} {isLow && "[LOW STOCK]"}
          </span>
        );
      },
    },
    { key: "safetyStockQty", header: "Safety Stock", render: (r) => Number(r.safetyStockQty ?? 0).toLocaleString() },
    { key: "standardCost", header: "Std Cost ($)", render: (r) => `$${Number(r.standardCost ?? 0).toFixed(2)}` },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (r) => (
        <div className="flex space-x-2 font-mono text-xs">
          <button
            onClick={() => handleOpenEdit(r)}
            className="text-black font-bold border border-black px-2 py-0.5 hover:bg-black hover:text-white cursor-pointer uppercase"
          >
            EDIT
          </button>
          {onCreatePRForMaterial && (
            <button
              onClick={() => onCreatePRForMaterial(r)}
              className="text-[#5f7800] font-black border border-[#88b500] px-2 py-0.5 hover:bg-[#c6f135] hover:text-black cursor-pointer uppercase"
            >
              CREATE PR
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm(`Are you sure you want to delete ${r.name} (${r.materialCode})?`)) {
                try {
                  await onDeleteMaterial(r.id);
                  setActionFeedback({ type: "success", message: `Material ${r.name} (${r.materialCode}) was deleted.` });
                } catch (err: any) {
                  setActionFeedback({ type: "error", message: `Delete failed: ${err.message}` });
                }
              }
            }}
            className="text-red-600 font-bold border border-red-600 px-2 py-0.5 hover:bg-red-600 hover:text-white cursor-pointer uppercase"
          >
            DELETE
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            MATERIAL MASTER DATA
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Central repository of all Adidas raw materials, fibers, and footwear components
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 text-xs font-mono font-bold uppercase rounded border-2 flex items-center justify-between ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-500"
              : "bg-red-50 text-red-900 border-red-500"
          }`}
        >
          <span>{actionFeedback.type === "success" ? "✓" : "⚠"} {actionFeedback.message}</span>
          <button onClick={() => setActionFeedback(null)} className="text-gray-400 hover:text-black">
            ✕
          </button>
        </div>
      )}

      <DataTable
        title="Material Catalog List"
        columns={columns}
        data={materials}
        exportFilename="adidas_material_master"
        searchPlaceholder="Search material by code or name..."
        actions={
          <button
            onClick={handleOpenCreate}
            className="bg-black hover:bg-gray-800 text-[#c6f135] font-mono text-xs font-black px-3.5 py-2 uppercase tracking-wider cursor-pointer flex items-center space-x-1 border border-black shadow-sm"
          >
            <span>+ ADD MATERIAL</span>
          </button>
        }
      />

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMat ? `EDIT MATERIAL: ${editingMat.materialCode}` : "CREATE NEW MATERIAL"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Material ID Code</label>
              <input
                type="text"
                required
                value={form.materialCode}
                onChange={(e) => setForm({ ...form, materialCode: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Material Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              >
                <option value="Yarn & Fiber">Yarn & Fiber</option>
                <option value="Textile">Textile</option>
                <option value="Polymers">Polymers</option>
                <option value="Outsoles">Outsoles</option>
                <option value="Plastics">Plastics</option>
                <option value="Insoles">Insoles</option>
                <option value="Hardware & Accessories">Hardware & Accessories</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Unit of Measure (UoM)</label>
              <select
                value={form.uom}
                onChange={(e) => setForm({ ...form, uom: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              >
                <option value="METERS">METERS</option>
                <option value="KG">KG</option>
                <option value="PAIRS">PAIRS</option>
                <option value="PCS">PCS</option>
                <option value="ROLLS">ROLLS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Forecast Qty</label>
              <input
                type="number"
                required
                value={form.forecastQty}
                onChange={(e) => setForm({ ...form, forecastQty: Number(e.target.value) })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Current Stock Qty</label>
              <input
                type="number"
                required
                value={form.currentStockQty}
                onChange={(e) => setForm({ ...form, currentStockQty: Number(e.target.value) })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Safety Stock Qty</label>
              <input
                type="number"
                required
                value={form.safetyStockQty}
                onChange={(e) => setForm({ ...form, safetyStockQty: Number(e.target.value) })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Standard Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.standardCost}
                onChange={(e) => setForm({ ...form, standardCost: Number(e.target.value) })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Primary Supplier</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.vendorCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer"
            >
              SAVE MATERIAL
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
