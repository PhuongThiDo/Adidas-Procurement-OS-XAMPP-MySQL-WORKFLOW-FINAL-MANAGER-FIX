import React from "react";
import { UserRole, User } from "../types";

interface NavItem {
  id: string;
  label: string;
  category?: string;
}

interface SidebarProps {
  role?: UserRole;
  currentUser?: User | null;
  activeTab: string;
  onSelectTab?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  planner: [
    { id: "demand-forecast", label: "Demand Planning & MRP", category: "Operational Planning" },
    { id: "create-pr", label: "Create Purchase Requisition", category: "Operational Planning" },
    { id: "pr-history", label: "Requisition Tracking", category: "Operational Planning" },
    { id: "material-master", label: "Material Master (Stock / Lead Time)", category: "Master Data" },
    { id: "supplier-master", label: "Approved Supplier List (ASL)", category: "Master Data" },
  ],
  sourcing: [
    { id: "pr-queue", label: "PR Worklist & Assignment", category: "Sourcing & Procurement" },
    { id: "rfq-manager", label: "RFQ & Bid Comparison", category: "Sourcing & Procurement" },
    { id: "convert-po", label: "Purchase Order Workbench", category: "Sourcing & Procurement" },
    { id: "vendor-form", label: "Vendor Qualification Form", category: "Supplier Management" },
    { id: "supplier-master", label: "Supplier Directory", category: "Supplier Management" },
    { id: "material-master", label: "Material Master (Purchasing)", category: "Master Data" },
  ],
  manager: [
    { id: "po-approval", label: "PO Release / Approval Queue", category: "Approvals & Governance" },
    { id: "executive-dashboard", label: "Executive Spend & OTIF Analytics", category: "Spend Analytics" },
    { id: "supplier-master", label: "Vendor Performance Scorecards", category: "Governance" },
    { id: "material-master", label: "Material Catalog", category: "Master Data" },
  ],
  warehouse: [
    { id: "incoming-deliveries", label: "Inbound Shipments (ASN)", category: "Inbound Logistics" },
    { id: "goods-receipt", label: "Goods Receipt Execution (GR/MIGO)", category: "Inbound Logistics" },
    { id: "discrepancy-logs", label: "Quarantine & Discrepancy Logs", category: "Inventory Control" },
    { id: "material-master", label: "Warehouse Stock & Storage Bins", category: "Master Data" },
  ],
  accountant: [
    { id: "three-way-match", label: "3-Way Invoice Matching (MIRO)", category: "Accounts Payable (AP)" },
    { id: "payments", label: "Payment Execution (F110)", category: "Accounts Payable (AP)" },
    { id: "discrepancy-logs", label: "Invoice Variance Hold Queue", category: "Audit & Exception" },
  ],
  admin: [
    { id: "user-management", label: "User Access & SoD Matrix", category: "Security & Access" },
    { id: "audit-logs", label: "Immutable Audit Trail Logs", category: "Security & Access" },
    { id: "material-master", label: "Material Master Governance", category: "Master Data" },
    { id: "supplier-master", label: "Supplier Master Governance", category: "Master Data" },
  ],
  vendor: [
    { id: "vendor-rfq-inbox", label: "RFQ Bidding & Quotation", category: "Supplier Collaboration" },
    { id: "vendor-po-deliveries", label: "PO Confirmation & Dispatch (ASN)", category: "Order Fulfillment" },
    { id: "vendor-submit-invoice", label: "E-Invoice Submission", category: "Billing" },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentUser,
  activeTab,
  onSelectTab,
  onTabChange,
}) => {
  const effectiveRole: UserRole = role || currentUser?.role || "planner";
  const handleTabClick = onSelectTab || onTabChange || (() => {});
  const items = roleNavItems[effectiveRole] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-[#fcfcfb]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-black font-sans">
            NAVIGATION MENU
          </h3>
          <span className="text-[10px] bg-[#c6f135] text-black font-mono font-black px-1.5 py-0.2 rounded-sm">
            {effectiveRole.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 font-medium font-mono mt-0.5">
          Role Workspace
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item, idx) => {
          const isActive = activeTab === item.id;
          const showHeader = idx === 0 || items[idx - 1].category !== item.category;

          return (
            <React.Fragment key={item.id}>
              {item.category && showHeader && (
                <div className="pt-4 pb-1 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                  {item.category}
                </div>
              )}
              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left px-3 py-2.5 text-xs font-bold transition uppercase tracking-wide cursor-pointer flex items-center justify-between rounded-lg ${
                  isActive
                    ? "bg-black text-[#c6f135] shadow-sm font-black"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="text-[9px] font-mono bg-[#c6f135] text-black font-black px-1.5 py-0.2 rounded-sm">
                    ACTIVE
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 text-[10px] text-gray-500 font-mono text-center bg-[#fcfcfb]">
        <div className="font-bold text-black uppercase">ADIDAS PROCUREMENT OS</div>
        <div className="text-[9px] text-[#7ca800]">CONNECTED ECOSYSTEM &bull; 2026</div>
      </div>
    </aside>
  );
};
