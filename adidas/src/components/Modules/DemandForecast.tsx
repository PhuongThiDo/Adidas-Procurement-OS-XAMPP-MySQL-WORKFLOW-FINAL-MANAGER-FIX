import React, { useState } from "react";
import { Material } from "../../types";
import { DataTable, Column } from "../Common/DataTable";

interface DemandForecastProps {
  materials: Material[];
  onCreatePRForLowStock: (lowStockItems: Material[]) => void;
}

export const DemandForecast: React.FC<DemandForecastProps> = ({
  materials,
  onCreatePRForLowStock,
}) => {
  const [planPeriod, setPlanPeriod] = useState("Q3-2026");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const lowStockItems = materials.filter((m) => m.currentStockQty < m.safetyStockQty);

  const filteredMaterials = materials.filter((m) => {
    if (categoryFilter === "ALL") return true;
    return m.category === categoryFilter;
  });

  const columns: Column<Material>[] = [
    { key: "materialCode", header: "Material ID" },
    { key: "name", header: "Material Name" },
    { key: "category", header: "Category" },
    { key: "uom", header: "UoM" },
    {
      key: "forecastQty",
      header: "Production Forecast",
      render: (r) => `${(r.forecastQty ?? 0).toLocaleString()} ${r.uom || ''}`,
    },
    {
      key: "currentStockQty",
      header: "Current Stock",
      render: (r) => {
        const stock = r.currentStockQty ?? 0;
        const safety = r.safetyStockQty ?? 0;
        const isLow = stock < safety;
        return (
          <span
            className={`font-mono font-bold ${
              isLow ? "text-red-600 bg-red-50 border border-red-300 px-1 py-0.5" : "text-black"
            }`}
          >
            {stock.toLocaleString()} {r.uom || ''} {isLow && "[LOW STOCK]"}
          </span>
        );
      },
    },
    {
      key: "safetyStockQty",
      header: "Safety Stock Level",
      render: (r) => `${(r.safetyStockQty ?? 0).toLocaleString()} ${r.uom || ''}`,
    },
    {
      key: "variance",
      header: "Stock vs Safety Gap",
      render: (r) => {
        const diff = (r.currentStockQty ?? 0) - (r.safetyStockQty ?? 0);
        const isNeg = diff < 0;
        return (
          <span className={`font-mono font-bold ${isNeg ? "text-red-600" : "text-green-700"}`}>
            {isNeg ? `DEFICIT: ${Math.abs(diff).toLocaleString()}` : `SURPLUS: +${diff.toLocaleString()}`}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            DEMAND & FORECAST PLANNING
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Production requirement forecasts vs real-time warehouse inventory safety levels
          </p>
        </div>

        {/* Low Stock Banner & Trigger Button */}
        <div className="flex items-center space-x-3 bg-gray-50 p-3 border border-gray-300">
          <div className="text-xs font-mono">
            <span className="font-bold uppercase text-black">LOW STOCK ALERT:</span>{" "}
            <span className="font-bold text-red-600 font-mono">{lowStockItems.length} MATERIALS</span>
          </div>
          <button
            onClick={() => onCreatePRForLowStock(lowStockItems)}
            className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold px-3 py-1.5 uppercase tracking-wider cursor-pointer"
          >
            CREATE PR FOR LOW STOCK ({lowStockItems.length})
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-300 p-4 flex flex-wrap items-center gap-4 text-xs font-mono">
        <div>
          <label className="block font-bold text-gray-600 uppercase mb-1">Plan Period</label>
          <select
            value={planPeriod}
            onChange={(e) => setPlanPeriod(e.target.value)}
            className="border border-gray-300 bg-white text-black font-bold p-1.5 text-xs outline-none"
          >
            <option value="MONTH-08-2026">August 2026 (Monthly)</option>
            <option value="Q3-2026">Q3 2026 (Quarterly)</option>
            <option value="YEAR-2026">Year 2026 (Annual)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-600 uppercase mb-1">Material Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 bg-white text-black font-bold p-1.5 text-xs outline-none"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="Yarn & Fiber">Yarn & Fiber</option>
            <option value="Textile">Textile</option>
            <option value="Polymers">Polymers</option>
            <option value="Outsoles">Outsoles</option>
            <option value="Plastics">Plastics</option>
            <option value="Insoles">Insoles</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        title={`Forecast & Inventory Safety Matrix [${planPeriod}]`}
        columns={columns}
        data={filteredMaterials}
        exportFilename="adidas_demand_forecast"
        searchPlaceholder="Search material forecast..."
      />
    </div>
  );
};
