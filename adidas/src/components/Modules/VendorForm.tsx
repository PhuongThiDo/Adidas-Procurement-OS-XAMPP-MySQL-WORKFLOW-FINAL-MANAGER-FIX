import React, { useState } from "react";
import { Supplier, TariffImpactLevel } from "../../types";

interface VendorFormProps {
  suppliers: Supplier[];
  onCreateSupplier: (supp: Partial<Supplier>) => Promise<void>;
  onUpdateSupplier: (id: string, supp: Partial<Supplier>) => Promise<void>;
}

export const VendorForm: React.FC<VendorFormProps> = ({
  suppliers,
  onCreateSupplier,
  onUpdateSupplier,
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("NEW");

  const [form, setForm] = useState({
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
    currency: "USD" as "USD" | "EUR" | "VND",
    paymentTerms: "Net 30" as "Net 30" | "Net 60" | "COD",
    tariffImpactLevel: "Medium" as TariffImpactLevel,
    status: "Active" as "Active" | "Pending Approval" | "Inactive",
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectVendor = (id: string) => {
    setSelectedVendorId(id);
    setSuccessMsg(null);
    if (id === "NEW") {
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
    } else {
      const s = suppliers.find((supp) => supp.id === id);
      if (s) {
        setForm({
          vendorCode: s.vendorCode,
          name: s.name,
          taxId: s.taxId,
          address: s.address,
          contactPerson: s.contactPerson,
          phone: s.phone,
          email: s.email,
          companyCode: s.companyCode,
          purchasingOrg: s.purchasingOrg,
          reconAccount: s.reconAccount,
          currency: s.currency,
          paymentTerms: s.paymentTerms,
          tariffImpactLevel: s.tariffImpactLevel || "Medium",
          status: s.status,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVendorId === "NEW") {
      await onCreateSupplier({ ...form, id: form.vendorCode });
      setSuccessMsg(`Vendor ${form.name} registered successfully with status Pending Approval.`);
    } else {
      await onUpdateSupplier(selectedVendorId, form);
      setSuccessMsg(`Vendor ${form.name} updated successfully.`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            VENDOR MASTER FORM
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Sourcing specialist form for registering new suppliers and editing compliance records
          </p>
        </div>

        {/* Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="font-bold uppercase">SELECT VENDOR:</span>
          <select
            value={selectedVendorId}
            onChange={(e) => handleSelectVendor(e.target.value)}
            className="border-2 border-black bg-white text-black font-bold p-1.5 outline-none"
          >
            <option value="NEW">+ CREATE NEW VENDOR</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.vendorCode} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-2 border-green-500 p-3 text-xs font-mono font-bold text-green-900 uppercase">
          SUCCESS: {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-6 space-y-6 text-xs font-mono">
        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-black border-b border-gray-300 pb-1">
            SECTION 1: GENERAL VENDOR INFORMATION
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Vendor Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
                placeholder="e.g. Prime Fabrics Co"
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
            <label className="block font-bold uppercase mb-1">Registered Business Address</label>
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
              <label className="block font-bold uppercase mb-1">Email Address</label>
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
          <h3 className="font-bold uppercase text-black border-b border-gray-300 pb-1">
            SECTION 2: FINANCE & ERP CONFIGURATION
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Company Code</label>
              <select
                value={form.companyCode}
                onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              >
                <option value="ADVN">ADVN (Adidas Vietnam)</option>
                <option value="ADDE">ADDE (Adidas Germany)</option>
                <option value="ADUS">ADUS (Adidas USA)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Purchasing Org</label>
              <select
                value={form.purchasingOrg}
                onChange={(e) => setForm({ ...form, purchasingOrg: e.target.value })}
                className="w-full border border-gray-300 p-2 text-black font-medium"
              >
                <option value="SOUR">SOUR (Global Sourcing)</option>
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

          <div className="grid grid-cols-2 gap-4">
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
                <option value="COD">COD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Tariff Compliance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1">
            <h3 className="font-bold uppercase text-black">
              SECTION 3: TARIFF COMPLIANCE & RISK MANAGEMENT
            </h3>
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

        <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
          <button
            type="submit"
            className="bg-black text-white font-bold uppercase text-xs px-8 py-3 hover:bg-gray-800 cursor-pointer border-2 border-black"
          >
            SAVE & REQUEST APPROVAL
          </button>
        </div>
      </form>
    </div>
  );
};
