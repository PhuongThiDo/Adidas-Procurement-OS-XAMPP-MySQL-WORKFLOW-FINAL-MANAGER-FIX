import React from "react";
import { Shipment } from "../../types";
import { DataTable, Column } from "../Common/DataTable";

interface IncomingDeliveriesProps {
  shipments: Shipment[];
}

export const IncomingDeliveries: React.FC<IncomingDeliveriesProps> = ({ shipments }) => {
  const columns: Column<Shipment>[] = [
    { key: "id", header: "Shipment ID" },
    { key: "poId", header: "PO Reference" },
    { key: "vendorName", header: "Supplier Vendor" },
    { key: "carrierName", header: "Logistics Carrier" },
    { key: "trackingNumber", header: "Tracking Number" },
    { key: "shipDate", header: "Ship Date" },
    { key: "estimatedDeliveryDate", header: "Est Arrival Date" },
    {
      key: "status",
      header: "Shipping Status",
      render: (r) => (
        <span className="bg-blue-100 text-blue-900 border border-blue-500 font-bold uppercase text-[10px] px-2 py-0.5">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
          INCOMING DELIVERIES TRACKING
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Logistics shipments en route to Adidas warehouse hubs awaiting goods receipt execution
        </p>
      </div>

      <DataTable
        title="Incoming Shipments Queue"
        columns={columns}
        data={shipments}
        exportFilename="adidas_incoming_deliveries"
        searchPlaceholder="Search shipment by PO ID, carrier or tracking..."
      />
    </div>
  );
};
