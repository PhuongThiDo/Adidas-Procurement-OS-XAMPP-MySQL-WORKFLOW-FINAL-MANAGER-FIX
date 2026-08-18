import React, { useState, useEffect } from "react";
import { User, SystemRole, Material, Supplier, PurchaseRequisition, RFQ, VendorQuotation, PurchaseOrder, GoodsReceipt, DiscrepancyTicket, Invoice, Payment, AuditLog, Shipment, POApprovalHistory } from "./types";
import { api } from "./services/api";

// Components
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";

// Module Components
import { MaterialMaster } from "./components/Modules/MaterialMaster";
import { SupplierMaster } from "./components/Modules/SupplierMaster";
import { VendorForm } from "./components/Modules/VendorForm";
import { DemandForecast } from "./components/Modules/DemandForecast";
import { CreatePR } from "./components/Modules/CreatePR";
import { PRHistory } from "./components/Modules/PRHistory";
import { PRQueue } from "./components/Modules/PRQueue";
import { RFQManager } from "./components/Modules/RFQManager";
import { PurchaseOrderWorkbench } from "./components/Modules/PurchaseOrderWorkbench";
import { POApprovalDetail } from "./components/Modules/POApprovalDetail";
import { ExecutiveDashboard } from "./components/Modules/ExecutiveDashboard";
import { IncomingDeliveries } from "./components/Modules/IncomingDeliveries";
import { GoodsReceipt as GoodsReceiptModule } from "./components/Modules/GoodsReceipt";
import { DiscrepancyLogs } from "./components/Modules/DiscrepancyLogs";
import { ThreeWayMatch } from "./components/Modules/ThreeWayMatch";
import { Payments } from "./components/Modules/Payments";
import { UserManagement } from "./components/Modules/UserManagement";
import { AuditLogViewer } from "./components/Modules/AuditLogViewer";
import { VendorRFQInbox } from "./components/Modules/VendorRFQInbox";
import { VendorPODeliveries } from "./components/Modules/VendorPODeliveries";
import { VendorSubmitInvoice } from "./components/Modules/VendorSubmitInvoice";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());
  const defaultTabForRole = (role?: string) => {
    switch (String(role || "").toLowerCase()) {
      case "planner": return "demand-forecast";
      case "sourcing": return "pr-queue";
      case "manager": return "po-approval";
      case "warehouse": return "incoming-deliveries";
      case "accountant": return "three-way-match";
      case "admin": return "user-management";
      case "vendor": return "vendor-rfq-inbox";
      default: return "demand-forecast";
    }
  };
  const [activeTab, setActiveTab] = useState<string>(() => defaultTabForRole(api.getCurrentUser()?.role));

  // App Data States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [prs, setPRs] = useState<PurchaseRequisition[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [discrepancyTickets, setDiscrepancyTickets] = useState<DiscrepancyTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<POApprovalHistory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Low stock trigger PR state
  const [lowStockForPR, setLowStockForPR] = useState<Material[]>([]);

  // Fetch initial data & Real-time Synchronization
  const toNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeData = (raw: any) => {
    const data = raw || {};
    const materials = (data.materials || []).map((m: any) => ({ ...m, forecastQty: toNumber(m.forecastQty), currentStockQty: toNumber(m.currentStockQty), safetyStockQty: toNumber(m.safetyStockQty), standardCost: toNumber(m.standardCost) }));
    const suppliers = (data.suppliers || []).map((s: any) => ({ ...s, rating: toNumber(s.rating) }));
    const prs = (data.prs || []).map((p: any) => ({ ...p, totalEstimatedCost: toNumber(p.totalEstimatedCost), items: (p.items || []).map((i: any) => ({ ...i, quantity: toNumber(i.quantity), estimatedUnitPrice: toNumber(i.estimatedUnitPrice) })) }));
    const rfqs = (data.rfqs || []).map((r: any) => ({ ...r, items: (r.items || []).map((i: any) => ({ ...i, quantity: toNumber(i.quantity), targetPrice: i.targetPrice == null ? undefined : toNumber(i.targetPrice) })) }));
    const quotations = (data.quotations || []).map((q: any) => ({ ...q, totalAmount: toNumber(q.totalAmount), leadTimeDays: toNumber(q.leadTimeDays), costScore: toNumber(q.costScore), qualityScore: toNumber(q.qualityScore), deliveryScore: toNumber(q.deliveryScore), totalScore: toNumber(q.totalScore), items: (q.items || []).map((i: any) => ({ ...i, unitPrice: toNumber(i.unitPrice), leadTimeDays: toNumber(i.leadTimeDays), lineTotal: toNumber(i.lineTotal) })) }));
    const pos = (data.pos || []).map((p: any) => ({ ...p, subtotal: toNumber(p.subtotal), taxAmount: toNumber(p.taxAmount), grandTotal: toNumber(p.grandTotal), items: (p.items || []).map((i: any) => ({ ...i, quantity: toNumber(i.quantity), unitPrice: toNumber(i.unitPrice), taxRatePercent: toNumber(i.taxRatePercent), taxAmount: toNumber(i.taxAmount), lineTotal: toNumber(i.lineTotal) })) }));
    const goodsReceipts = (data.goodsReceipts || []).map((g: any) => ({ ...g, items: (g.items || []).map((i: any) => ({ ...i, orderedQty: toNumber(i.orderedQty), receivedQty: toNumber(i.receivedQty), rejectedQty: toNumber(i.rejectedQty) })) }));
    const invoices = (data.invoices || []).map((i: any) => ({ ...i, subtotal: toNumber(i.subtotal), taxAmount: toNumber(i.taxAmount), grandTotal: toNumber(i.grandTotal), items: (i.items || []).map((x: any) => ({ ...x, invoicedQty: toNumber(x.invoicedQty), unitPrice: toNumber(x.unitPrice), taxAmount: toNumber(x.taxAmount), lineTotal: toNumber(x.lineTotal) })) }));
    const payments = (data.payments || []).map((p: any) => ({ ...p, amount: toNumber(p.amount) }));
    return { ...data, materials, suppliers, prs, rfqs, quotations, pos, goodsReceipts, invoices, payments, discrepancyTickets: data.discrepancyTickets || [], users: data.users || [], auditLogs: data.auditLogs || [], shipments: data.shipments || [], approvalHistory: data.approvalHistory || [] };
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      const data = normalizeData(await api.getInitialData());
      setMaterials(data.materials);
      setSuppliers(data.suppliers);
      setPRs(data.prs);
      setRFQs(data.rfqs);
      setQuotations(data.quotations);
      setPOs(data.pos);
      setGoodsReceipts(data.goodsReceipts);
      setDiscrepancyTickets(data.discrepancyTickets);
      setInvoices(data.invoices);
      setPayments(data.payments);
      setUsers(data.users);
      setAuditLogs(data.auditLogs);
      setShipments(data.shipments);
      setApprovalHistory(data.approvalHistory);
      setDataError(null);
    } catch (err: any) {
      console.error("Failed to load initial data", err);
      setDataError(err?.message || "Cannot load data from MySQL/API. Check that MySQL is running and the server is connected.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadData();

    // 1. Real-time Server-Sent Events (SSE) Listener
    const unsubscribe = api.subscribeToEvents(() => {
      loadData();
    });

    // 2. Tab Focus & Visibility Change Refetch
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Fallback Interval (every 10s)
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    if (currentUser) {
      await api.logout(currentUser);
    }
    setCurrentUser(null);
    setActiveTab("demand-forecast");
  };

  const handleSelectRole = (userOrRole: User | string) => {
    if (!userOrRole) return;
    let targetUser: User | undefined;
    if (typeof userOrRole === "string") {
      targetUser = users.find((u) => u.role === userOrRole) || currentUser || undefined;
      if (targetUser) {
        targetUser = { ...targetUser, role: userOrRole as any };
      }
    } else {
      targetUser = userOrRole;
    }

    if (!targetUser) return;
    setCurrentUser(targetUser);
    api.setCurrentUser(targetUser);

    setActiveTab(defaultTabForRole(targetUser.role));
  };

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>(undefined);

  const handleLogin = async (username: string, password: string, role: any): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(undefined);
    try {
      const res = await api.login(username, password, role);
      setAuthLoading(false);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        handleSelectRole(res.user);
        return true;
      } else {
        setAuthError(res.error || "Login failed");
        return false;
      }
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err.message || "Authentication error");
      return false;
    }
  };

  if (!currentUser) {
    return (
      <LandingPage
        onLogin={handleLogin}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-black">
      {/* Top Bar */}
      <Navbar
        user={currentUser}
        activeModule={activeTab.replace(/-/g, " ").toUpperCase()}
        onLogout={handleLogout}
        onSwitchRole={(role) => handleSelectRole(role)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setLowStockForPR([]);
          }}
        />

        {/* Main Content Dashboard View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-100">
          {dataError && (
            <div className="mb-6 border-2 border-red-600 bg-red-50 p-4 text-red-900 font-mono text-xs">
              <div className="font-black uppercase">DATA CONNECTION ERROR</div>
              <div className="mt-1">{dataError}</div>
              <button onClick={loadData} className="mt-3 bg-black text-white px-4 py-2 font-bold uppercase">RETRY</button>
            </div>
          )}
          {dataLoading && !dataError && (
            <div className="mb-4 bg-white border border-gray-300 px-4 py-2 text-xs font-mono font-bold">LOADING LIVE DATA FROM MYSQL...</div>
          )}
          {/* Module Router */}
          {activeTab === "material-master" && (
            <MaterialMaster
              materials={materials}
              suppliers={suppliers}
              onCreateMaterial={async (mat) => {
                await api.createMaterial(mat);
                await loadData();
              }}
              onCreatePRForMaterial={(["planner", "admin"].includes(currentUser.role)) ? ((material) => {
                setLowStockForPR([material]);
                setActiveTab("create-pr");
              }) : undefined}
              onUpdateMaterial={async (id, mat) => {
                await api.updateMaterial(id, mat);
                await loadData();
              }}
              onDeleteMaterial={async (id) => {
                await api.deleteMaterial(id);
                await loadData();
              }}
            />
          )}

          {activeTab === "supplier-master" && (
            <SupplierMaster
              suppliers={suppliers}
              onCreateSupplier={async (supp) => {
                await api.createSupplier(supp);
                await loadData();
              }}
              onUpdateSupplier={async (id, supp) => {
                await api.updateSupplier(id, supp);
                await loadData();
              }}
              onDeleteSupplier={async (id) => {
                await api.deleteSupplier(id);
                await loadData();
              }}
            />
          )}

          {activeTab === "vendor-form" && (
            <VendorForm
              suppliers={suppliers}
              onCreateSupplier={async (supp) => {
                await api.createSupplier(supp);
                await loadData();
              }}
              onUpdateSupplier={async (id, supp) => {
                await api.updateSupplier(id, supp);
                await loadData();
              }}
            />
          )}

          {activeTab === "demand-forecast" && (
            <DemandForecast
              materials={materials}
              onCreatePRForLowStock={(lowStockItems) => {
                setLowStockForPR(lowStockItems);
                setActiveTab("create-pr");
              }}
            />
          )}

          {activeTab === "create-pr" && (
            <CreatePR
              user={currentUser}
              materials={materials}
              initialLowStockItems={lowStockForPR}
              onSubmitPR={async (prData) => {
                await api.createPR(prData);
                await loadData();
                setLowStockForPR([]);
              }}
              onCancel={() => {
                setLowStockForPR([]);
                setActiveTab("pr-history");
              }}
            />
          )}

          {activeTab === "pr-history" && (
            <PRHistory
              prs={prs}
              materials={materials}
              onUpdatePR={async (id, pr) => {
                await api.updatePR(id, pr);
                await loadData();
              }}
              onDeletePR={async (id) => {
                await api.deletePR(id);
                await loadData();
              }}
            />
          )}

          {activeTab === "pr-queue" && (
            <PRQueue
              prs={prs}
              suppliers={suppliers}
              user={currentUser}
              onGroupPRsToRFQ={async (payload) => {
                await api.groupPRsToRFQ(payload);
                await loadData();
                setActiveTab("rfq-manager");
              }}
            />
          )}

          {activeTab === "rfq-manager" && (
            <RFQManager
              rfqs={rfqs}
              quotations={quotations}
              user={currentUser}
              onSelectWinningQuotation={async (quotId) => {
                await api.selectWinningQuotation(quotId);
                await loadData();
              }}
              onConvertToPO={async (quotId, taxRate) => {
                await api.convertToPO(quotId, taxRate, currentUser);
                await loadData();
                setActiveTab("convert-po");
              }}
            />
          )}

          {activeTab === "convert-po" && (
            <PurchaseOrderWorkbench
              pos={pos}
              quotations={quotations}
              rfqs={rfqs}
              suppliers={suppliers}
              materials={materials}
              user={currentUser}
              onConvertToPO={async (quotId, taxRate) => {
                await api.convertToPO(quotId, taxRate, currentUser);
                await loadData();
              }}
              onDeletePO={async (poId) => {
                await api.deletePurchaseOrder(poId, currentUser);
                await loadData();
              }}
            />
          )}

          {activeTab === "po-approval" && (
            <POApprovalDetail
              pos={pos}
              quotations={quotations}
              approvalHistory={approvalHistory}
              user={currentUser}
              onApproveOrRejectPO={async (poId, decision, comments, approverId, approverName) => {
                await api.approveOrRejectPO(poId, decision, comments, approverId, approverName);
                await loadData();
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "executive-dashboard" && (
            <ExecutiveDashboard
              pos={pos}
              suppliers={suppliers}
              materials={materials}
              goodsReceipts={goodsReceipts}
            />
          )}

          {activeTab === "incoming-deliveries" && (
            <IncomingDeliveries shipments={shipments} />
          )}

          {activeTab === "goods-receipt" && (
            <GoodsReceiptModule
              pos={pos.filter((p) => ["Shipped", "Partially Received"].includes(p.status) || shipments.some((s) => s.poId === p.id && ["Shipped", "Delivered"].includes(s.status)))}
              user={currentUser}
              onPostGoodsReceipt={async (payload) => {
                await api.postGoodsReceipt(payload);
                await loadData();
              }}
            />
          )}

          {activeTab === "discrepancy-logs" && (
            <DiscrepancyLogs
              tickets={discrepancyTickets}
              onUpdateTicket={async (id, updates) => {
                await api.updateDiscrepancyTicket(id, updates, currentUser);
                await loadData();
              }}
            />
          )}

          {activeTab === "three-way-match" && (
            <ThreeWayMatch
              invoices={invoices}
              pos={pos}
              goodsReceipts={goodsReceipts}
              onApproveMatch={async (invoiceId) => {
                await api.approve3WayMatch(invoiceId, currentUser);
                await loadData();
                alert("3-Way match approved! Invoice status updated to Verified.");
              }}
              onRaiseDiscrepancy={async (invoiceId, vendorName, desc) => {
                await api.raiseDiscrepancy(invoiceId, vendorName, desc, currentUser);
                await loadData();
                alert("Discrepancy ticket created.");
              }}
            />
          )}

          {activeTab === "payments" && (
            <Payments
              invoices={invoices}
              payments={payments}
              user={currentUser}
              onExecutePayment={async (payload) => {
                await api.executePayment(payload);
                await loadData();
              }}
            />
          )}

          {activeTab === "user-management" && (
            <UserManagement
              users={users}
              pos={pos}
              suppliers={suppliers}
              materials={materials}
              onCreateUser={async (usr) => {
                await api.createUser(usr);
                await loadData();
              }}
              onUpdateUser={async (id, usr) => {
                await api.updateUser(id, usr);
                await loadData();
              }}
              onDeleteUser={async (id) => {
                await api.deleteUser(id);
                await loadData();
              }}
            />
          )}

          {activeTab === "audit-logs" && (
            <AuditLogViewer logs={auditLogs} />
          )}


          {activeTab === "vendor-rfq-inbox" && (
            <VendorRFQInbox
              rfqs={rfqs}
              quotations={quotations}
              user={currentUser}
              onSubmitQuotation={async (payload) => {
                await api.submitVendorQuotation(payload, currentUser);
                await loadData();
                alert("Quotation bid submitted successfully.");
              }}
            />
          )}

          {activeTab === "vendor-po-deliveries" && (
            <VendorPODeliveries
              pos={pos}
              shipments={shipments}
              user={currentUser}
              onAcceptPO={async (poId) => {
                await api.acceptPO(poId, currentUser);
                await loadData();
              }}
              onCreateShipment={async (payload) => {
                await api.createShipment(payload);
                await loadData();
                alert("Logistics shipment generated.");
              }}
            />
          )}

          {activeTab === "vendor-submit-invoice" && (
            <VendorSubmitInvoice
              pos={pos}
              invoices={invoices}
              user={currentUser}
              onSubmitInvoice={async (payload) => {
                await api.submitVendorInvoice(payload, currentUser);
                await loadData();
              }}
              onDeleteInvoice={async (id) => {
                await api.deleteInvoice(id, currentUser);
                await loadData();
              }}
            />
          )}

          {!((([
            "material-master", "supplier-master", "vendor-form", "demand-forecast", "create-pr", "pr-history",
            "pr-queue", "rfq-manager", "convert-po", "po-approval", "executive-dashboard", "incoming-deliveries",
            "goods-receipt", "discrepancy-logs", "three-way-match", "payments", "user-management", "audit-logs",
            "vendor-rfq-inbox", "vendor-po-deliveries", "vendor-submit-invoice"
          ] as string[]).includes(activeTab))) && (
            <div className="bg-white border-2 border-amber-500 p-8 max-w-3xl mx-auto">
              <h1 className="text-xl font-black uppercase">Page not found</h1>
              <p className="mt-2 text-sm text-gray-600">The selected module is not registered. Return to the role workspace and continue from a valid module.</p>
              <button onClick={() => setActiveTab(defaultTabForRole(currentUser.role))} className="mt-5 bg-black text-white px-5 py-2 text-xs font-bold uppercase">Return to workspace</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
