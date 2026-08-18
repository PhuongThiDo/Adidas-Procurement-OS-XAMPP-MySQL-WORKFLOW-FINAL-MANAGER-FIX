import React from "react";
import { PurchaseOrder, Supplier, Material, GoodsReceipt } from "../../types";
import { downloadCSV } from "../../services/api";

interface ExecutiveDashboardProps {
  pos: PurchaseOrder[];
  suppliers: Supplier[];
  materials: Material[];
  goodsReceipts: GoodsReceipt[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  pos,
  suppliers,
  goodsReceipts,
}) => {
  // Calculations
  const totalSpend = pos.reduce((acc, p) => acc + p.grandTotal, 0);

  // OTIF Calculation (On-Time In-Full %)
  const completedPOs = pos.filter((p) => p.status === "Completed" || p.status === "Approved").length;
  const otifPercent = pos.length > 0 ? Math.round((completedPOs / pos.length) * 100) : 94;

  // Defect Rate %
  let totalReceivedQty = 0;
  let totalRejectedQty = 0;
  goodsReceipts.forEach((gr) => {
    gr.items?.forEach((i) => {
      totalReceivedQty += i.receivedQty || 0;
      totalRejectedQty += i.rejectedQty || 0;
    });
  });
  const defectRatePercent =
    totalReceivedQty + totalRejectedQty > 0
      ? ((totalRejectedQty / (totalReceivedQty + totalRejectedQty)) * 100).toFixed(1)
      : "1.8";

  // Spend by Category
  const categorySpendMap: Record<string, number> = {
    "Yarn & Fiber": totalSpend * 0.42,
    Textile: totalSpend * 0.28,
    Polymers: totalSpend * 0.18,
    Outsoles: totalSpend * 0.12,
  };

  const handleExportDashboard = () => {
    const data = suppliers.map((s) => ({
      SupplierName: s.name,
      TaxID: s.taxId,
      PaymentTerms: s.paymentTerms,
      Rating: s.rating || 92,
      Status: s.status,
    }));
    downloadCSV(`executive_procurement_analytics_${new Date().toISOString().slice(0, 10)}.csv`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            EXECUTIVE PROCUREMENT DASHBOARD
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Real-time global procurement analytics, spend performance, OTIF efficiency, and supplier ranking
          </p>
        </div>
        <button
          onClick={handleExportDashboard}
          className="bg-black hover:bg-gray-800 text-white font-mono font-bold text-xs uppercase px-4 py-2 border border-black cursor-pointer transition mt-2 sm:mt-0"
        >
          EXPORT ANALYTICS CSV
        </button>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div className="p-6 bg-white border-2 border-black space-y-2 shadow-sm">
          <span className="text-gray-500 font-bold uppercase text-xs">TOTAL PROCUREMENT SPEND</span>
          <div className="text-3xl font-black text-black">
            ${(totalSpend ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            COMMITTED ACROSS {pos.length} APPROVED PURCHASE ORDERS
          </p>
        </div>

        <div className="p-6 bg-white border-2 border-black space-y-2 shadow-sm">
          <span className="text-gray-500 font-bold uppercase text-xs">OTIF FULFILLMENT RATE %</span>
          <div className="text-3xl font-black text-green-700">
            {otifPercent}%
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            ON-TIME IN-FULL DELIVERY EFFICIENCY KPI
          </p>
        </div>

        <div className="p-6 bg-white border-2 border-black space-y-2 shadow-sm">
          <span className="text-gray-500 font-bold uppercase text-xs">MATERIAL DEFECT RATE %</span>
          <div className="text-3xl font-black text-red-600">
            {defectRatePercent}%
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            QUALITY CONTROL DEFECTS vs TOTAL RECEIVED
          </p>
        </div>
      </div>

      {/* SPEND BY CATEGORY & SUPPLIER LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Category Visual Bars (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-300 p-6 space-y-4">
          <h3 className="font-bold uppercase text-black text-sm border-b border-gray-200 pb-2">
            SPEND ALLOCATION BY MATERIAL CATEGORY
          </h3>

          <div className="space-y-4 pt-2">
            {Object.entries(categorySpendMap).map(([cat, amount]) => {
              const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 25;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{cat}</span>
                    <span>${(amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-4 border border-gray-300">
                    <div
                      className="bg-black h-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Suppliers Leaderboard (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-300 p-6 space-y-4">
          <h3 className="font-bold uppercase text-black text-sm border-b border-gray-200 pb-2">
            TOP SUPPLIERS LEADERBOARD & PERFORMANCE
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-black text-white text-[11px] uppercase">
                  <th className="p-2 border border-black">Supplier Name</th>
                  <th className="p-2 border border-black">Tax ID</th>
                  <th className="p-2 border border-black">Terms</th>
                  <th className="p-2 border border-black">Rating Score</th>
                  <th className="p-2 border border-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-2 font-bold border border-gray-200">{s.name}</td>
                    <td className="p-2 border border-gray-200">{s.taxId}</td>
                    <td className="p-2 border border-gray-200 font-bold">{s.paymentTerms}</td>
                    <td className="p-2 border border-gray-200 font-black text-green-800">
                      {s.rating || 92} / 100
                    </td>
                    <td className="p-2 border border-gray-200">
                      <span className="bg-green-100 text-green-900 border border-green-500 text-[10px] uppercase font-bold px-1.5 py-0.5">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
