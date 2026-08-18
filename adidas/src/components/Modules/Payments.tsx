import React, { useState } from "react";
import { Invoice, Payment, User } from "../../types";
import { DataTable, Column } from "../Common/DataTable";

interface PaymentsProps {
  invoices: Invoice[];
  payments: Payment[];
  user: User;
  onExecutePayment: (payload: {
    invoiceId: string;
    reconAccount: string;
    paymentMethod: "Wire Transfer" | "Bank Transfer" | "Check";
    paymentDate: string;
    processedByUserId: string;
    processedByUserName: string;
  }) => Promise<void>;
}

export const Payments: React.FC<PaymentsProps> = ({
  invoices,
  payments,
  user,
  onExecutePayment,
}) => {
  const verifiedInvoices = invoices.filter((i) => i.status === "Verified");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    verifiedInvoices[0]?.id || ""
  );

  const [reconAccount, setReconAccount] = useState("300700 - Accounts Payable");
  const [paymentMethod, setPaymentMethod] = useState<"Wire Transfer" | "Bank Transfer" | "Check">("Wire Transfer");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handlePay = async () => {
    setFeedback(null);
    if (!selectedInvoice) return;

    try {
      await onExecutePayment({
        invoiceId: selectedInvoice.id,
        reconAccount,
        paymentMethod,
        paymentDate,
        processedByUserId: user.id,
        processedByUserName: user.fullName,
      });
      setFeedback({ type: "success", message: `Payment executed successfully for Invoice ${selectedInvoice.vendorInvoiceNumber} (${selectedInvoice.vendorName}). Status set to PAID.` });
      setSelectedInvoiceId("");
    } catch (err: any) {
      setFeedback({ type: "error", message: `Payment was not executed: ${err?.message || "Unknown error"}` });
    }
  };

  const invoiceColumns: Column<Invoice>[] = [
    { key: "vendorInvoiceNumber", header: "Invoice No" },
    { key: "poId", header: "PO Ref" },
    { key: "vendorName", header: "Vendor Name" },
    { key: "invoiceDate", header: "Invoice Date" },
    {
      key: "grandTotal",
      header: "Disbursement Amount",
      render: (r) => `$${(r.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${r.currency}`,
    },
    {
      key: "status",
      header: "Match Status",
      render: (r) => (
        <span className="bg-green-100 text-green-900 border border-green-500 font-bold uppercase text-[10px] px-2 py-0.5">
          {r.status}
        </span>
      ),
    },
  ];

  const paymentLogColumns: Column<Payment>[] = [
    { key: "id", header: "Payment Voucher ID" },
    { key: "invoiceId", header: "Invoice Ref" },
    { key: "vendorName", header: "Vendor Name" },
    { key: "paymentDate", header: "Payment Date" },
    { key: "paymentMethod", header: "Method" },
    { key: "reconAccount", header: "Recon Account" },
    {
      key: "amount",
      header: "Amount Paid",
      render: (r) => `$${(r.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${r.currency}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="bg-black text-white font-mono font-bold uppercase text-[10px] px-2 py-0.5">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          ACCOUNTS PAYABLE DISBURSEMENT & PAYMENT EXECUTION
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Finance disbursement portal for processing payments against 3-way verified supplier invoices
        </p>
      </div>

      {feedback && (
        <div className={`border-2 p-3 text-xs font-mono font-bold uppercase ${feedback.type === "success" ? "bg-green-50 border-green-500 text-green-900" : "bg-red-50 border-red-500 text-red-900"}`}>
          {feedback.type === "success" ? "SUCCESS" : "ERROR"}: {feedback.message}
        </div>
      )}

      {/* PAYMENT EXECUTION FORM */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 font-mono text-xs">
        <h3 className="font-bold uppercase text-black border-b border-gray-200 pb-2">
          EXECUTE SUPPLIER PAYMENT DISBURSEMENT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-bold uppercase mb-1">Select Verified Invoice *</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold text-black"
            >
              <option value="">-- Choose Verified Invoice --</option>
              {verifiedInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.vendorInvoiceNumber} - {inv.vendorName} (${(inv.grandTotal ?? 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Recon Account</label>
            <input
              type="text"
              readOnly
              value={reconAccount}
              className="w-full border border-gray-300 bg-gray-100 p-2 font-bold text-black cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border border-gray-300 p-2 font-bold text-black"
            >
              <option value="Wire Transfer">Wire Transfer (Swift / Telegraphic)</option>
              <option value="Bank Transfer">Bank ACH Transfer</option>
              <option value="Check">Certified Corporate Check</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Disbursement Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 p-2 font-bold text-black"
            />
          </div>
        </div>

        {selectedInvoice && (
          <div className="p-4 bg-gray-50 border border-gray-300 flex items-center justify-between">
            <div>
              <span className="text-gray-500 font-bold uppercase block">DISBURSEMENT AMOUNT:</span>
              <span className="text-xl font-black text-black">
                ${(selectedInvoice.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedInvoice.currency}
              </span>
            </div>

            <button
              onClick={handlePay}
              className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 uppercase tracking-wider cursor-pointer border-2 border-black"
            >
              EXECUTE PAYMENT DISBURSEMENT &rarr;
            </button>
          </div>
        )}
      </div>

      {/* VERIFIED INVOICES WAITING PAYMENT */}
      <DataTable
        title="Verified Invoices Queue (Awaiting Payment)"
        columns={invoiceColumns}
        data={verifiedInvoices}
        exportFilename="adidas_verified_invoices_queue"
        searchPlaceholder="Search invoice..."
      />

      {/* PAYMENT VOUCHER HISTORIC LOGS */}
      <DataTable
        title="Payment Disbursement Audit Logs"
        columns={paymentLogColumns}
        data={payments}
        exportFilename="adidas_payment_vouchers"
        searchPlaceholder="Search payment voucher..."
      />
    </div>
  );
};
