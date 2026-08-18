import React, { useState } from "react";
import { Invoice, PurchaseOrder, User } from "../../types";
import {
  CheckCircle2,
  FileText,
  Upload,
  AlertCircle,
  ArrowRight,
  Plus,
  Eye,
  Trash2,
  Download,
  Filter,
  Search,
  Receipt,
  Calendar,
  Clock,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Modal } from "../Common/Modal";
import { api } from "../../services/api";

interface VendorSubmitInvoiceProps {
  pos: PurchaseOrder[];
  invoices?: Invoice[];
  user: User;
  onSubmitInvoice: (payload: any) => Promise<void>;
  onDeleteInvoice?: (id: string) => Promise<void>;
}

export const VendorSubmitInvoice: React.FC<VendorSubmitInvoiceProps> = ({
  pos,
  invoices = [],
  user,
  onSubmitInvoice,
  onDeleteInvoice,
}) => {
  // Main view state: "history" (Trang chủ E-Invoice danh sách) vs "create" (Tạo hóa đơn mới)
  const [activeView, setActiveView] = useState<"history" | "create">("history");

  // Available POs for vendor invoicing
  const availablePOs = pos.length > 0 ? pos : [];
  const [selectedPoId, setSelectedPoId] = useState<string>(availablePOs[0]?.id || "");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail Modal State
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Search & Filter State in History List
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const selectedPO = availablePOs.find((p) => p.id === selectedPoId) || availablePOs[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10MB limit");
      const uploaded = await api.uploadFile(file);
      setAttachedFileName(file.name);
      setAttachmentUrl(uploaded.url);
    } catch (err: any) {
      setAttachedFileName(null);
      setAttachmentUrl(null);
      setErrorMsg(err?.message || "Upload failed");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedPO && availablePOs.length === 0) {
      setErrorMsg("No Purchase Order available to submit invoice against. Please ensure a PO exists.");
      return;
    }

    const currentPO = selectedPO || availablePOs[0];
    if (!currentPO) { setErrorMsg("Please select a Purchase Order."); return; }
    const poTotal = Number(currentPO.grandTotal || 0);
    const poTax = Number(currentPO.taxAmount || currentPO.items?.reduce((acc, i) => acc + Number(i.taxAmount || 0), 0) || 0);
    const poSub = Number(currentPO.subtotal ?? (poTotal - poTax));

    try {
      setIsSubmitting(true);
      await onSubmitInvoice({
        poId: currentPO.id,
        vendorId: currentPO.vendorId || user.vendorId,
        vendorName: currentPO.vendorName || user.fullName,
        vendorInvoiceNumber: invoiceNumber,
        invoiceNumber,
        invoiceDate,
        currency: currentPO?.currency || "USD",
        subtotal: poSub,
        taxAmount: poTax,
        grandTotal: poTotal,
        totalAmount: poTotal,
        attachmentUrl: attachmentUrl || null,
        items: currentPO?.items && currentPO.items.length > 0 ? currentPO.items.map((i) => ({
          materialId: i.materialId,
          materialCode: i.materialCode,
          materialName: i.materialName,
          invoicedQty: i.quantity,
          unitPrice: i.unitPrice,
          taxAmount: i.taxAmount,
          lineTotal: i.lineTotal,
        })) : [],
      });

      const submittedNum = invoiceNumber;
      setSuccessMsg(`Invoice ${submittedNum} submitted successfully to Adidas Finance for 3-Way Match verification.`);
      setInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      setAttachedFileName(null);
      setAttachmentUrl(null);
      // Auto-return to home/history view of vendor in e-invoice submission
      setActiveView("history");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (invoiceId: string, invoiceNum: string) => {
    if (!onDeleteInvoice) return;
    if (window.confirm(`Are you sure you want to delete Invoice ${invoiceNum}? This will permanently remove it from the system.`)) {
      try {
        await onDeleteInvoice(invoiceId);
        setSuccessMsg(`Invoice ${invoiceNum} was deleted successfully.`);
        if (selectedInvoiceForModal?.id === invoiceId) {
          setIsDetailModalOpen(false);
          setSelectedInvoiceForModal(null);
        }
      } catch (err: any) {
        setErrorMsg(`Failed to delete invoice: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Filter invoices for current vendor
  const vendorInvoices = user.role === "vendor"
    ? invoices.filter((inv) => inv.vendorId === user.vendorId)
    : invoices;

  const filteredInvoices = vendorInvoices.filter((inv) => {
    const matchesSearch =
      (inv.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.vendorInvoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      inv.status === statusFilter ||
      inv.matchStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalInvoicesCount = vendorInvoices.length;
  const totalInvoicedValue = vendorInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const pendingMatchCount = vendorInvoices.filter((i) => i.matchStatus === "Pending Match" || i.status === "Submitted").length;
  const verifiedCount = vendorInvoices.filter((i) => i.matchStatus === "Matched" || i.status === "Verified" || i.status === "Paid").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-black" />
            <span>VENDOR E-INVOICE MANAGEMENT & SUBMISSION</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Electronic billing portal for Adidas Tier-1 & Tier-2 manufacturing partners
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveView("history");
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer ${
              activeView === "history"
                ? "bg-black text-[#c6f135] shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SUBMITTED INVOICES ({totalInvoicesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView("create");
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer ${
              activeView === "create"
                ? "bg-black text-[#c6f135] shadow-sm"
                : "bg-[#c6f135] text-black hover:bg-[#b5e028]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ CREATE NEW E-INVOICE</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-lg flex items-start space-x-3 text-xs font-mono text-emerald-900 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-black uppercase text-sm">ACTION COMPLETED</div>
            <p className="mt-1 font-medium">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-gray-400 hover:text-gray-600 text-xs uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg flex items-start space-x-3 text-xs font-mono text-red-900 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-black uppercase">ERROR ENCOUNTERED</div>
            <p className="mt-1 font-medium">{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-gray-400 hover:text-gray-600 text-xs uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* VIEW 1: TRANG CHỦ / SUBMITTED INVOICES HISTORY */}
      {activeView === "history" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <span className="text-gray-400 text-[10px] font-bold uppercase block">TOTAL SUBMITTED INVOICES</span>
              <div className="text-2xl font-black text-black mt-1">{totalInvoicesCount}</div>
              <span className="text-[10px] text-gray-500 block mt-1">Stored persistently in database</span>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <span className="text-gray-400 text-[10px] font-bold uppercase block">TOTAL INVOICED VALUE</span>
              <div className="text-2xl font-black text-black mt-1">
                ${totalInvoicedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">USD Invoiced Total</span>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <span className="text-gray-400 text-[10px] font-bold uppercase block">PENDING 3-WAY MATCH</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingMatchCount}</div>
              <span className="text-[10px] text-amber-700 block mt-1">Awaiting AP verification</span>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <span className="text-gray-400 text-[10px] font-bold uppercase block">VERIFIED & SETTLED</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</div>
              <span className="text-[10px] text-emerald-700 block mt-1">Matched 100% / Paid</span>
            </div>
          </div>

          {/* Filter and Action Bar */}
          <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-sm">
            <div className="flex items-center space-x-2 w-full sm:w-80 border border-gray-300 px-3 py-2 rounded bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Invoice #, PO ID, Vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-black placeholder-gray-400 text-xs"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-500 uppercase text-[11px]">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 bg-white p-1.5 rounded font-bold text-black outline-none cursor-pointer"
                >
                  <option value="ALL">ALL STATUSES</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Verified">Verified / Matched</option>
                  <option value="Paid">Paid</option>
                  <option value="Discrepancy">Discrepancy</option>
                  <option value="Pending Match">Pending Match</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("create")}
                className="bg-black hover:bg-gray-800 text-white font-bold px-4 py-2 uppercase text-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ NEW INVOICE</span>
              </button>
            </div>
          </div>

          {/* Table of Invoices */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <th className="p-3.5">INVOICE ID</th>
                    <th className="p-3.5">VENDOR INVOICE #</th>
                    <th className="p-3.5">PO REFERENCE</th>
                    <th className="p-3.5">DATE</th>
                    <th className="p-3.5 text-right">SUBTOTAL</th>
                    <th className="p-3.5 text-right">TAX</th>
                    <th className="p-3.5 text-right">GRAND TOTAL</th>
                    <th className="p-3.5 text-center">MATCH STATUS</th>
                    <th className="p-3.5 text-center">STATUS</th>
                    <th className="p-3.5 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                        No invoices found matching the selected criteria.
                        <button
                          onClick={() => setActiveView("create")}
                          className="block mx-auto mt-2 text-black font-bold underline cursor-pointer"
                        >
                          Submit your first invoice now
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const matchColor =
                        inv.matchStatus === "Matched" || inv.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : inv.matchStatus === "Variance Detected" || inv.status === "Discrepancy"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-amber-100 text-amber-800 border-amber-300";

                      const statusColor =
                        inv.status === "Paid"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : inv.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : inv.status === "Discrepancy"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-gray-100 text-gray-800 border-gray-300";

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition">
                          <td className="p-3.5 font-bold text-black">{inv.id}</td>
                          <td className="p-3.5 font-bold text-gray-900">
                            {inv.vendorInvoiceNumber || inv.id}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-black">{inv.poId}</span>
                          </td>
                          <td className="p-3.5 text-gray-600">{inv.invoiceDate}</td>
                          <td className="p-3.5 text-right font-mono">
                            ${(inv.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono text-gray-500">
                            ${(inv.taxAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-bold font-mono text-black">
                            ${(inv.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency || "USD"}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${matchColor}`}>
                              {inv.matchStatus || "Pending Match"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>
                              {inv.status || "Submitted"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                title="View Details"
                                onClick={() => {
                                  setSelectedInvoiceForModal(inv);
                                  setIsDetailModalOpen(true);
                                }}
                                className="bg-black hover:bg-[#88b500] hover:text-black text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>VIEW</span>
                              </button>

                              {onDeleteInvoice && (
                                <button
                                  type="button"
                                  title="Delete Invoice"
                                  onClick={() => handleDelete(inv.id, inv.vendorInvoiceNumber || inv.id)}
                                  className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TẠO HÓA ĐƠN MỚI (CREATE INVOICE) */}
      {activeView === "create" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveView("history")}
            className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-gray-600 hover:text-black uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&larr; BACK TO SUBMITTED INVOICES OVERVIEW</span>
          </button>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-6 space-y-6 font-mono text-xs shadow-sm rounded-lg">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold uppercase text-black text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-black" />
                <span>SUBMIT ELECTRONIC INVOICE (E-INVOICE)</span>
              </h3>
              <span className="text-[10px] font-bold uppercase bg-[#c6f135] text-black px-2 py-0.5 rounded font-mono">
                PORTAL: {user.fullName || "VENDOR"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1 text-black">Select Awarded PO *</label>
                {availablePOs.length > 0 ? (
                  <select
                    value={selectedPoId || availablePOs[0]?.id}
                    onChange={(e) => setSelectedPoId(e.target.value)}
                    className="w-full border-2 border-black p-2 font-bold text-black bg-white cursor-pointer"
                  >
                    {availablePOs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - ${(p.grandTotal ?? 0).toLocaleString()} ({p.vendorName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border border-amber-300 p-2 font-bold text-amber-800 bg-amber-50">
                    No approved Purchase Order is available for this vendor.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase mb-1 text-black">Vendor Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-bold text-black focus:border-black outline-none"
                  placeholder="INV-XXXXXX"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1 text-black">Invoice Date *</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-bold text-black focus:border-black outline-none"
                />
              </div>
            </div>

            {selectedPO && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 border border-gray-200 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-gray-500 font-bold uppercase block text-[10px]">PO REFERENCE TOTAL AMOUNT:</span>
                    <span className="text-xl font-black text-black">
                      ${(selectedPO.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedPO.currency}
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">
                      Subtotal: ${(selectedPO.subtotal ?? 0).toLocaleString()} | Tax: ${(selectedPO.taxAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold uppercase block text-[10px]">PAYMENT TERMS:</span>
                    <span className="font-bold text-black bg-white border border-gray-300 px-2.5 py-1 rounded inline-block">
                      {selectedPO.paymentTerms || "Net 30"}
                    </span>
                  </div>
                </div>

                {/* Line Items Preview */}
                {selectedPO.items && selectedPO.items.length > 0 && (
                  <div className="border border-gray-200 p-3 bg-[#fcfcfb] rounded">
                    <div className="font-bold uppercase text-[10px] text-gray-500 mb-2">PO Line Items to Invoice</div>
                    <div className="space-y-1">
                      {selectedPO.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-gray-100 last:border-0">
                          <span className="font-bold text-black">{item.materialName} ({item.quantity} {item.uom})</span>
                          <span className="font-mono font-bold">${(item.lineTotal ?? (item.quantity * item.unitPrice)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated File Upload */}
                <div className="border-2 border-dashed border-gray-300 p-6 text-center space-y-2 bg-gray-50 rounded-lg">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <span className="font-bold uppercase block text-black">
                    ATTACH ELECTRONIC INVOICE PDF / TAX E-DOCUMENT
                  </span>
                  <p className="text-gray-500 text-[11px]">
                    Supported formats: PDF, XML e-Invoice (Max 10MB)
                  </p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="invoiceFile"
                    accept=".pdf,.xml,.png,.jpg"
                  />
                  <label
                    htmlFor="invoiceFile"
                    className="inline-flex items-center space-x-1.5 bg-black text-white px-4 py-2 font-bold uppercase text-xs cursor-pointer hover:bg-gray-800 transition"
                  >
                    <span>{attachedFileName ? `ATTACHED: ${attachedFileName}` : "BROWSE FILE"}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-300 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView("history")}
                className="border border-gray-400 text-gray-700 px-5 py-2.5 uppercase font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold px-8 py-3 uppercase tracking-wider cursor-pointer border-2 border-black flex items-center space-x-2 transition shadow-md"
              >
                <span>{isSubmitting ? "TRANSMITTING INVOICE..." : "SUBMIT INVOICE TO ADIDAS FINANCE \u2192"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW INVOICE DETAILS MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`E-INVOICE DETAILS: ${selectedInvoiceForModal?.vendorInvoiceNumber || selectedInvoiceForModal?.id}`}
        maxWidth="3xl"
      >
        {selectedInvoiceForModal && (
          <div className="space-y-6 font-mono text-xs">
            {/* Header Status Bar */}
            <div className="bg-gray-50 p-4 border border-gray-200 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px]">INVOICE SYSTEM ID</span>
                <span className="text-base font-black text-black">{selectedInvoiceForModal.id}</span>
                <span className="text-xs text-gray-600 block mt-0.5">
                  Vendor Ref: <strong className="text-black">{selectedInvoiceForModal.vendorInvoiceNumber}</strong>
                </span>
              </div>

              <div className="flex flex-col sm:items-end gap-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase">MATCHING & LIFECYCLE</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#c6f135] px-2 py-0.5 text-[10px] font-black uppercase rounded">
                    STATUS: {selectedInvoiceForModal.status}
                  </span>
                  <span className="bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase rounded">
                    3-WAY: {selectedInvoiceForModal.matchStatus || "Pending Match"}
                  </span>
                </div>
              </div>
            </div>

            {/* Parties & Purchase Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px] mb-1">SUPPLIER / ISSUER</span>
                <p className="font-bold text-black">{selectedInvoiceForModal.vendorName}</p>
                <p className="text-gray-600">Vendor ID: {selectedInvoiceForModal.vendorId}</p>
                <p className="text-gray-600">Invoice Date: {selectedInvoiceForModal.invoiceDate}</p>
              </div>

              <div>
                <span className="text-gray-400 font-bold uppercase block text-[10px] mb-1">BILL TO / RECIPIENT</span>
                <p className="font-bold text-black">Adidas Global Procurement AG</p>
                <p className="text-gray-600">PO Reference: <strong className="text-black">{selectedInvoiceForModal.poId}</strong></p>
                <p className="text-gray-600">Verified By: {selectedInvoiceForModal.verifiedBy || "Pending AP Verification"}</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div>
              <span className="font-bold uppercase text-gray-700 block mb-2">INVOICED LINE ITEMS:</span>
              <table className="w-full border border-gray-300 text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-300">
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-right">Invoiced Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Tax Amount</th>
                    <th className="p-2.5 text-right">Line Total ({selectedInvoiceForModal.currency || "USD"})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedInvoiceForModal.items && selectedInvoiceForModal.items.length > 0 ? (
                    selectedInvoiceForModal.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold">
                          {item.materialName} <span className="text-gray-400 font-normal">({item.materialCode})</span>
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.invoicedQty}</td>
                        <td className="p-2.5 text-right font-mono">${(item.unitPrice ?? 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-gray-500">${(item.taxAmount ?? 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-black">${(item.lineTotal ?? 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                        No itemized lines recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-72 bg-gray-50 p-4 border border-gray-200 rounded space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-bold">${(selectedInvoiceForModal.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Amount:</span>
                  <span className="font-bold">${(selectedInvoiceForModal.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-black text-black">
                  <span>Grand Total:</span>
                  <span>
                    ${(selectedInvoiceForModal.grandTotal ?? 0).toFixed(2)} {selectedInvoiceForModal.currency || "USD"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {selectedInvoiceForModal.attachmentUrl && (
                <a
                  href={selectedInvoiceForModal.attachmentUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="border border-black text-black hover:bg-black hover:text-white px-4 py-2 font-mono font-bold text-xs uppercase transition cursor-pointer flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD ATTACHMENT</span>
                </a>
              )}
              {onDeleteInvoice && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedInvoiceForModal.id, selectedInvoiceForModal.vendorInvoiceNumber || selectedInvoiceForModal.id)}
                  className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 font-mono font-bold text-xs uppercase transition cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE INVOICE</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
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
