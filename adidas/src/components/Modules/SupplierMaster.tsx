import React, { useState } from "react";
import { Supplier, TariffImpactLevel } from "../../types";
import { DataTable, Column } from "../Common/DataTable";
import { Modal } from "../Common/Modal";

interface SupplierMasterProps {
  suppliers: Supplier[];
  onCreateSupplier: (supp: Partial<Supplier>) => Promise<void>;
  onUpdateSupplier: (id: string, supp: Partial<Supplier>) => Promise<void>;
  onDeleteSupplier?: (id: string) => Promise<void>;
}

export const SupplierMaster: React.FC<SupplierMasterProps> = ({
  suppliers,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupp, setEditingSupp] = useState<Supplier | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    vendorCode: "",
    name: "",
    taxId: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    companyCode: "ADVN",
    purchasingOrg: "SOUR",
    reconAccount: "300700 - Accounts Payable",
    currency: "USD" as "USD" | "EUR" | "VND",
    paymentTerms: "Net 30" as "Net 30" | "Net 60" | "COD",
    tariffImpactLevel: "Medium" as TariffImpactLevel,
    status: "Active" as "Active" | "Pending Approval" | "Inactive",
  });

  const handleOpenCreate = () => {
    setEditingSupp(null);
    setForm({
      vendorCode: `VEND-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      taxId: `TX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      companyCode: "ADVN",
      purchasingOrg: "SOUR",
      reconAccount: "300700 - Accounts Payable",
      currency: "USD",
      paymentTerms: "Net 30",
      tariffImpactLevel: "Medium",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supp: Supplier) => {
    setEditingSupp(supp);
    setForm({
      vendorCode: supp.vendorCode,
      name: supp.name,
      taxId: supp.taxId,
      address: supp.address,
      contactPerson: supp.contactPerson,
      phone: supp.phone,
      email: supp.email,
      companyCode: supp.companyCode,
      purchasingOrg: supp.purchasingOrg,
      reconAccount: supp.reconAccount,
      currency: supp.currency,
      paymentTerms: supp.paymentTerms,
      tariffImpactLevel: supp.tariffImpactLevel || "Medium",
      status: supp.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupp) {
      await onUpdateSupplier(editingSupp.id, form);
      setActionFeedback(`Supplier "${form.name}" (${form.vendorCode}) updated successfully.`);
    } else {
      await onCreateSupplier({ ...form, id: form.vendorCode });
      setActionFeedback(`Supplier "${form.name}" registered successfully with status ${form.status}.`);
    }
    setIsModalOpen(false);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const columns: Column<Supplier>[] = [
    { key: "vendorCode", header: "Vendor Code" },
    { key: "name", header: "Supplier Name" },
    { key: "taxId", header: "Tax ID" },
    { key: "contactPerson", header: "Contact Person" },
    { key: "email", header: "Email" },
    { key: "companyCode", header: "Co Code" },
    { key: "reconAccount", header: "Recon Account" },
    { key: "currency", header: "Currency" },
    { key: "paymentTerms", header: "Terms" },
    {
      key: "tariffImpactLevel",
      header: "Tariff Impact 2026",
      render: (r) => {
        const level = r.tariffImpactLevel || "Medium";
        let badgeCls = "bg-amber-100 text-amber-900 border-amber-500 font-bold";
        if (level === "High") badgeCls = "bg-red-100 text-red-900 border-red-500 font-bold";
        if (level === "Low") badgeCls = "bg-emerald-100 text-emerald-900 border-emerald-500 font-bold";

        return (
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${badgeCls}`}>
            {level === "High" && "🔴 "}
            {level === "Medium" && "🟡 "}
            {level === "Low" && "🟢 "}
            {level}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        let cls = "bg-gray-100 text-gray-800 border-gray-300";
        if (r.status === "Active") cls = "bg-green-100 text-green-900 border-green-500 font-bold";
        if (r.status === "Pending Approval") cls = "bg-amber-100 text-amber-900 border-amber-500 font-bold";
        if (r.status === "Inactive") cls = "bg-red-100 text-red-900 border-red-500 font-bold";

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
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => handleOpenEdit(r)}
            className="text-black font-bold border border-black px-2 py-0.5 hover:bg-black hover:text-white cursor-pointer uppercase"
          >
            EDIT
          </button>
          {r.status === "Active" ? (
            <button
              onClick={async () => {
                if (confirm(`Deactivate supplier ${r.name}? Status will change to Inactive.`)) {
                  await onUpdateSupplier(r.id, { status: "Inactive" });
                  setActionFeedback(`Supplier "${r.name}" has been deactivated.`);
                  setTimeout(() => setActionFeedback(null), 3000);
                }
              }}
              className="text-amber-600 font-bold border border-amber-600 px-2 py-0.5 hover:bg-amber-600 hover:text-white cursor-pointer uppercase"
            >
              DEACTIVATE
            </button>
          ) : (
            <button
              onClick={async () => {
                await onUpdateSupplier(r.id, { status: "Active" });
                setActionFeedback(`Supplier "${r.name}" is now Active.`);
                setTimeout(() => setActionFeedback(null), 3000);
              }}
              className="text-green-700 font-bold border border-green-700 px-2 py-0.5 hover:bg-green-700 hover:text-white cursor-pointer uppercase"
            >
              ACTIVATE
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm(`Are you sure you want to permanently delete supplier "${r.name}" (${r.vendorCode})?`)) {
                if (onDeleteSupplier) {
                  await onDeleteSupplier(r.id);
                  setActionFeedback(`Supplier "${r.name}" deleted successfully.`);
                  setTimeout(() => setActionFeedback(null), 3000);
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
            SUPPLIER MASTER DATA
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Registered global vendor database, finance configuration, and compliance setup
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="bg-green-50 border-2 border-green-600 text-green-900 px-4 py-2 text-xs font-mono font-bold uppercase flex items-center justify-between">
          <span>✓ {actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-gray-500 hover:text-black text-sm">&times;</button>
        </div>
      )}

      <DataTable
        title="Supplier Vendor Registry"
        columns={columns}
        data={suppliers}
        exportFilename="adidas_supplier_master"
        searchPlaceholder="Search vendor by code, name, or tax ID..."
        actions={
          <button
            onClick={handleOpenCreate}
            className="bg-black hover:bg-gray-800 text-white font-mono text-xs font-bold px-3 py-1.5 uppercase tracking-wider cursor-pointer"
          >
            + REGISTER SUPPLIER
          </button>
        }
      />

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupp ? `EDIT SUPPLIER: ${editingSupp.vendorCode}` : "REGISTER NEW SUPPLIER"}
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-mono">
          {/* Section 1 */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1">
              SECTION 1: GENERAL INFORMATION
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Tax ID (Unique) *</label>
                <input
                  type="text"
                  required
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Registered Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase text-black border-b border-gray-300 pb-1">
              SECTION 2: FINANCE & ERP CONFIGURATION
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Company Code</label>
                <select
                  value={form.companyCode}
                  onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                >
                  <option value="ADVN">ADVN (Adidas Vietnam Ltd)</option>
                  <option value="ADDE">ADDE (Adidas AG Germany)</option>
                  <option value="ADUS">ADUS (Adidas America Inc)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Purchasing Org</label>
                <select
                  value={form.purchasingOrg}
                  onChange={(e) => setForm({ ...form, purchasingOrg: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                >
                  <option value="SOUR">SOUR (Global Sourcing Hub)</option>
                  <option value="REG1">REG1 (Regional Sourcing Hub)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Recon Account</label>
                <input
                  type="text"
                  required
                  value={form.reconAccount}
                  onChange={(e) => setForm({ ...form, reconAccount: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VND">VND (₫)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Payment Terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value as any })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                >
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="COD">Cash On Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full border border-gray-300 p-2 text-black font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Tariff Compliance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-300 pb-1">
              <h4 className="font-bold uppercase text-black">
                SECTION 3: TARIFF COMPLIANCE & RISK MANAGEMENT
              </h4>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase">
                2026 TARIFF CONTEXT
              </span>
            </div>
            <div>
              <label className="block font-bold uppercase mb-1">
                Tariff Impact Level (TariffImpactLevel) *
              </label>
              <select
                value={form.tariffImpactLevel}
                onChange={(e) => setForm({ ...form, tariffImpactLevel: e.target.value as any })}
                className="w-full border-2 border-black p-2 text-black font-bold bg-white"
              >
                <option value="High">🔴 High (High Exposure - Strict protective tariffs)</option>
                <option value="Medium">🟡 Medium (Medium Exposure - Standard tariff rates)</option>
                <option value="Low">🟢 Low (Low Exposure - Tariff exemptions / FTA / Section 122)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1 font-sans">
                Classify procurement cost exposure under 2026 international trade tariffs for Adidas footwear raw material suppliers.
              </p>
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
              SAVE & REQUEST APPROVAL
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
