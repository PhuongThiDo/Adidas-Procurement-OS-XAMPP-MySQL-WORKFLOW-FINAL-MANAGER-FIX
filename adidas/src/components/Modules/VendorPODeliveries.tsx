import React, { useState } from "react";
import { PurchaseOrder, Shipment, User } from "../../types";
import { Modal } from "../Common/Modal";
import { Truck, CheckCircle2, PackageCheck, AlertCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";

interface VendorPODeliveriesProps {
  pos: PurchaseOrder[];
  shipments: Shipment[];
  user: User;
  onAcceptPO: (poId: string) => Promise<void>;
  onCreateShipment: (payload: any) => Promise<void>;
}

export const VendorPODeliveries: React.FC<VendorPODeliveriesProps> = ({
  pos,
  shipments,
  user,
  onAcceptPO,
  onCreateShipment,
}) => {
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Shipment Form
  const [carrierName, setCarrierName] = useState("DHL Supply Chain Global");
  const [trackingNumber, setTrackingNumber] = useState(
    `TRK-AD-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [shipDate, setShipDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10)
  );

  const handleOpenShipment = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setCarrierName("DHL Supply Chain Global");
    setTrackingNumber(`DHL-AD-${Math.floor(100000 + Math.random() * 900000)}`);
    setShipDate(new Date().toISOString().substring(0, 10));
    setEstimatedDeliveryDate(new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10));
  };

  const handleAcceptPO = async (poId: string) => {
    try {
      setIsAcceptingId(poId);
      await onAcceptPO(poId);
      setToastMsg(`Purchase Order ${poId} accepted successfully! Ready to dispatch logistics.`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      alert("Error accepting Purchase Order: " + (err?.message || "Unknown error"));
    } finally {
      setIsAcceptingId(null);
    }
  };

  const handleSubmitShipment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPo) return;

    try {
      setIsSubmitting(true);
      await onCreateShipment({
        poId: selectedPo.id,
        vendorId: selectedPo.vendorId || user.vendorId,
        vendorName: selectedPo.vendorName || user.fullName,
        carrierName,
        trackingNumber,
        shipDate,
        estimatedDeliveryDate,
        notes: `Dispatched via ${carrierName} (Tracking: ${trackingNumber})`,
      });

      setToastMsg(`Logistics shipment ${trackingNumber} dispatched successfully for PO ${selectedPo.id}! Synchronized with Warehouse in real-time.`);
      setTimeout(() => setToastMsg(null), 6000);
      setSelectedPo(null);
    } catch (err: any) {
      alert("Error dispatching shipment: " + (err?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter POs relevant to vendor
  const vendorPos = pos.filter((po) => {
    if (user.vendorId) {
      return po.vendorId === user.vendorId || String(po.vendorName || "").toLowerCase().includes("prime") || !po.vendorId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight flex items-center space-x-2">
            <Truck className="h-6 w-6 text-black" />
            <span>VENDOR PURCHASE ORDER & LOGISTICS DISPATCH</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Supplier portal: Accept awarded Purchase Orders, dispatch ASN cargo, and sync real-time tracking with Adidas Warehouse
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-green-50 border border-green-300 px-3 py-1.5 text-green-800">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>REAL-TIME ERP ASN INTEGRATION</span>
        </div>
      </div>

      {/* Real-time Toast Feedback */}
      {toastMsg && (
        <div className="bg-green-50 border-2 border-green-600 p-4 font-mono text-xs text-green-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="font-bold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="font-bold text-green-800 hover:text-green-950">
            DISMISS
          </button>
        </div>
      )}

      {/* PURCHASE ORDERS GRID */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <h3 className="font-bold uppercase text-black flex items-center space-x-2">
            <PackageCheck className="h-4 w-4 text-black" />
            <span>AWARDED PURCHASE ORDERS ({vendorPos.length})</span>
          </h3>
          <span className="text-gray-500">Live sync active with Warehouse & Sourcing</span>
        </div>

        {vendorPos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-300">
            No purchase orders currently assigned to your vendor account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendorPos.map((po) => {
              const shipment = shipments.find((s) => s.poId === po.id);
              const isShipped = po.status === "Shipped" || po.status === "Completed" || po.status === "Partially Received" || !!shipment;

              return (
                <div
                  key={po.id}
                  className="border-2 border-black p-5 space-y-4 bg-gray-50 flex flex-col justify-between shadow-sm hover:shadow transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-bold text-black text-sm">{po.id}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                        po.status === "Shipped" || po.status === "Completed"
                          ? "bg-blue-100 text-blue-900 border-blue-500"
                          : po.status === "Approved"
                          ? "bg-green-100 text-green-900 border-green-500"
                          : "bg-yellow-100 text-yellow-900 border-yellow-500"
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <div className="space-y-1 mt-3 text-gray-700">
                      <div><span className="font-bold text-gray-900">Supplier:</span> {po.vendorName}</div>
                      <div><span className="font-bold text-gray-900">Issue Date:</span> {po.issueDate}</div>
                      <div><span className="font-bold text-gray-900">Payment Terms:</span> {po.paymentTerms}</div>
                      <div className="font-black text-black text-sm mt-1">
                        Grand Total: ${Number(po.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {po.currency}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 mt-3">
                      <span className="font-bold text-black uppercase block mb-1">SPECIFIED LINE ITEMS:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                        {po.items?.map((i) => (
                          <li key={i.id}>
                            <span className="font-semibold">{i.materialName}</span>: {Number(i.quantity || 0).toLocaleString()} {i.uom} @ ${i.unitPrice}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {shipment && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-blue-900 text-[11px] space-y-0.5">
                        <div className="font-bold flex items-center space-x-1">
                          <Truck className="h-3.5 w-3.5 text-blue-700" />
                          <span>Active ASN: {shipment.trackingNumber}</span>
                        </div>
                        <div>Carrier: {shipment.carrierName} | ETA: {shipment.estimatedDeliveryDate}</div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-300 space-y-2">
                    {po.status === "Approved" && !po.vendorAcceptedDate && (
                      <button
                        onClick={() => handleAcceptPO(po.id)}
                        disabled={isAcceptingId === po.id}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        {isAcceptingId === po.id ? (
                          <span>ACCEPTING PO...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>ACCEPT PURCHASE ORDER</span>
                          </>
                        )}
                      </button>
                    )}

                    {po.status === "Confirmed" && !isShipped ? (
                      <button
                        onClick={() => handleOpenShipment(po)}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 uppercase tracking-wider cursor-pointer border-2 border-blue-800 flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Truck className="h-4 w-4" />
                        <span>CREATE LOGISTICS SHIPMENT &rarr;</span>
                      </button>
                    ) : po.status === "Approved" ? (
                      <div className="bg-amber-50 border border-amber-400 p-2 text-center text-amber-900 font-bold uppercase">
                        Accept this purchase order before creating its shipment.
                      </div>
                    ) : (
                      <div className="bg-blue-100 border border-blue-500 p-2 text-center text-blue-900 font-bold uppercase flex items-center justify-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4 text-blue-700" />
                        <span>SHIPMENT DISPATCHED & TRACKED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shipment Modal */}
      <Modal
        isOpen={!!selectedPo}
        onClose={() => !isSubmitting && setSelectedPo(null)}
        title={`CREATE LOGISTICS SHIPMENT FOR PO: ${selectedPo?.id}`}
        maxWidth="2xl"
      >
        {selectedPo && (
          <form onSubmit={handleSubmitShipment} className="space-y-4 font-mono text-xs">
            <div className="bg-gray-100 p-3 border border-gray-300 space-y-1">
              <div className="font-bold text-black uppercase">Purchase Order Summary:</div>
              <div><span className="font-semibold">Vendor:</span> {selectedPo.vendorName}</div>
              <div><span className="font-semibold">Items:</span> {selectedPo.items?.map(i => `${i.materialName} (${i.quantity} ${i.uom})`).join(", ")}</div>
              <div><span className="font-semibold">Grand Total:</span> ${selectedPo.grandTotal?.toLocaleString()} {selectedPo.currency}</div>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Logistics Carrier Name *</label>
              <select
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full border border-gray-300 p-2 font-bold text-black bg-white"
              >
                <option value="DHL Supply Chain Global">DHL Supply Chain Global</option>
                <option value="FedEx Trade Networks">FedEx Trade Networks</option>
                <option value="Kuehne + Nagel Logistics">Kuehne + Nagel Logistics</option>
                <option value="Maersk Inbound Freight">Maersk Inbound Freight</option>
                <option value="DB Schenker Multimodal">DB Schenker Multimodal</option>
                <option value="Nippon Express Air & Ocean">Nippon Express Air & Ocean</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Tracking Number (ASN Reference) *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 border border-gray-300 p-2 font-bold text-black font-mono"
                  placeholder="e.g. DHL-889977001"
                />
                <button
                  type="button"
                  onClick={() => setTrackingNumber(`TRK-AD-${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="px-3 py-1 bg-gray-200 border border-gray-400 font-bold uppercase hover:bg-gray-300 text-[11px]"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase mb-1">Dispatched Ship Date *</label>
                <input
                  type="date"
                  required
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-bold text-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Estimated Arrival Date (ETA) *</label>
                <input
                  type="date"
                  required
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-bold text-black"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedPo(null)}
                className="border border-gray-300 px-4 py-2 font-bold uppercase hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white px-8 py-2 font-bold uppercase hover:bg-gray-800 cursor-pointer border-2 border-black flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>DISPATCHING...</span>
                ) : (
                  <>
                    <span>CONFIRM SHIPMENT DISPATCH</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
