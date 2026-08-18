import React, { useState } from "react";
import { User, SystemRole, PurchaseOrder, Supplier, Material } from "../../types";
import { DataTable, Column } from "../Common/DataTable";
import { Modal } from "../Common/Modal";

interface UserManagementProps {
  users: User[];
  pos?: PurchaseOrder[];
  suppliers?: Supplier[];
  materials?: Material[];
  onCreateUser: (usr: Partial<User>) => Promise<void>;
  onUpdateUser: (id: string, usr: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  pos = [],
  suppliers = [],
  materials = [],
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    role: SystemRole.Planner,
    active: true,
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({
      username: "",
      fullName: "",
      email: "",
      role: SystemRole.Planner,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      active: u.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await onUpdateUser(editingUser.id, {
        ...editingUser,
        username: form.username,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        active: form.active,
      });
      setActionFeedback(`User "${form.username}" updated successfully.`);
    } else {
      await onCreateUser({
        ...form,
        id: `usr-${Date.now()}`,
        active: form.active,
        department: form.role === SystemRole.Planner ? "FOOTWEAR-PLANNING" : form.role === SystemRole.Sourcing ? "GLOBAL-SOURCING" : form.role === SystemRole.Warehouse ? "DC-LOGISTICS" : form.role === SystemRole.Accountant ? "FINANCE-AP" : "MANAGEMENT",
      });
      setActionFeedback(`User "${form.username}" created successfully.`);
    }
    setIsModalOpen(false);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const columns: Column<User>[] = [
    { key: "username", header: "Username" },
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email Address" },
    {
      key: "role",
      header: "Assigned System Role",
      render: (r) => (
        <span className="bg-black text-white font-mono font-bold uppercase text-[10px] px-2 py-0.5">
          {r.role}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (r) => {
        const isActive = r.active !== false;
        return (
          <span
            className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 border ${
              isActive
                ? "bg-green-100 text-green-900 border-green-500"
                : "bg-red-100 text-red-900 border-red-500"
            }`}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (r) => {
        const isActive = r.active !== false;
        return (
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => handleOpenEdit(r)}
              className="text-black font-bold border border-black px-2 py-0.5 hover:bg-black hover:text-white cursor-pointer uppercase"
            >
              EDIT
            </button>
            {isActive ? (
              <button
                onClick={async () => {
                  if (confirm(`Deactivate user "${r.username}"?`)) {
                    await onUpdateUser(r.id, { ...r, active: false });
                    setActionFeedback(`User "${r.username}" has been deactivated.`);
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
                  await onUpdateUser(r.id, { ...r, active: true });
                  setActionFeedback(`User "${r.username}" is now active.`);
                  setTimeout(() => setActionFeedback(null), 3000);
                }}
                className="text-green-700 font-bold border border-green-700 px-2 py-0.5 hover:bg-green-700 hover:text-white cursor-pointer uppercase"
              >
                ACTIVATE
              </button>
            )}
            <button
              onClick={async () => {
                if (confirm(`Are you sure you want to delete user ${r.username}?`)) {
                  await onDeleteUser(r.id);
                  setActionFeedback(`User "${r.username}" deleted successfully.`);
                  setTimeout(() => setActionFeedback(null), 3000);
                }
              }}
              className="text-red-600 font-bold border border-red-600 px-2 py-0.5 hover:bg-red-600 hover:text-white cursor-pointer uppercase"
            >
              DELETE
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight">
            SYSTEM ADMIN CONTROL & RBAC DASHBOARD
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            System administration, user account governance, role permission matrix, and real-time operational health
          </p>
        </div>
        <div className="flex space-x-2 font-mono text-xs">
          <span className="bg-black text-white px-3 py-1 font-bold uppercase border border-black">
            STATUS: ONLINE (PORT 3000)
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="bg-green-50 border-2 border-green-600 text-green-900 px-4 py-2 text-xs font-mono font-bold uppercase flex items-center justify-between">
          <span>✓ {actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-gray-500 hover:text-black text-sm">&times;</button>
        </div>
      )}

      {/* ADMIN METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-black text-white p-4 border border-black shadow-sm">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">TOTAL COMMITMENT SPEND</span>
          <div className="text-2xl font-black mt-1">$1,845,200.00</div>
          <div className="text-[11px] text-green-400 font-bold mt-2 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
            <span>+14.2% YOY PROCUREMENT GROWTH</span>
          </div>
        </div>

        <div className="bg-white text-black p-4 border-2 border-black shadow-sm">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">ACTIVE PO VOLUME</span>
          <div className="text-2xl font-black mt-1">{pos.length || 18} ORDERS</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2">
            92.4% ON-TIME DELIVERIES (OTIF)
          </div>
        </div>

        <div className="bg-white text-black p-4 border-2 border-black shadow-sm">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">QUALIFIED VENDORS</span>
          <div className="text-2xl font-black mt-1">{suppliers.length || 6} ACTIVE</div>
          <div className="text-[11px] text-gray-600 font-medium mt-2">
            AVG EVALUATION: 94/100
          </div>
        </div>

        <div className="bg-white text-black p-4 border-2 border-black shadow-sm">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">3-WAY MATCH SETTLEMENT</span>
          <div className="text-2xl font-black mt-1">98.5% MATCHED</div>
          <div className="text-[11px] text-blue-700 font-bold mt-2">
            ZERO PAYMENT DISCREPANCIES
          </div>
        </div>
      </div>

      {/* ADMIN VISUAL CHARTS SECTION - FINANCIALS, VOLUMES & VENDORS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
        {/* CHART 1: QUARTERLY PROCUREMENT SPEND & BUDGET ALLOCATION */}
        <div className="lg:col-span-6 bg-white border border-gray-300 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-bold text-xs uppercase text-black">
                QUARTERLY PROCUREMENT SPEND VS BUDGET ($ USD)
              </h3>
              <p className="text-[10px] text-gray-500 font-sans">Budget allocation vs committed expenditure per fiscal quarter</p>
            </div>
            <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase">FY 2026</span>
          </div>

          <div className="pt-2 flex items-end justify-between h-44 border-b border-l border-black px-3 gap-3 bg-gray-50">
            {[
              { q: "Q1 2026", budget: 450, actual: 420 },
              { q: "Q2 2026", budget: 520, actual: 495 },
              { q: "Q3 2026", budget: 600, actual: 580 },
              { q: "Q4 (PROJ)", budget: 650, actual: 610 },
            ].map((item, idx) => {
              const bPct = Math.round((item.budget / 700) * 100);
              const aPct = Math.round((item.actual / 700) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="flex space-x-1 items-end w-full h-32 justify-center">
                    {/* Budget bar */}
                    <div className="w-1/2 bg-gray-300 relative flex justify-center items-center group-hover:bg-gray-400 transition" style={{ height: `${bPct}%` }}>
                      <span className="text-[8px] font-bold text-gray-800 rotate-90 sm:rotate-0 whitespace-nowrap">${item.budget}k</span>
                    </div>
                    {/* Actual bar */}
                    <div className="w-1/2 bg-black relative flex justify-center items-center group-hover:bg-gray-800 transition" style={{ height: `${aPct}%` }}>
                      <span className="text-[8px] font-bold text-white rotate-90 sm:rotate-0 whitespace-nowrap">${item.actual}k</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-black uppercase font-bold mt-1">{item.q}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-600 pt-1 border-t border-gray-100">
            <div className="flex space-x-3 font-bold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-gray-300 inline-block border border-gray-400"></span>
                <span>BUDGET ALLOCATION</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-black inline-block"></span>
                <span>ACTUAL SPEND</span>
              </span>
            </div>
            <span className="font-bold text-emerald-700">UNDER BUDGET (-3.2%)</span>
          </div>
        </div>

        {/* CHART 2: PURCHASE ORDER LIFECYCLE & STATUS VOLUME */}
        <div className="lg:col-span-6 bg-white border border-gray-300 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-bold text-xs uppercase text-black">
                PO LIFECYCLE STATUS & COMMITMENT VOLUME
              </h3>
              <p className="text-[10px] text-gray-500 font-sans">Active purchase order distribution by lifecycle stage</p>
            </div>
            <span className="text-[10px] text-gray-500 font-bold">TOTAL: 18 POs</span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { stage: "APPROVED & IN PRODUCTION", count: 8, val: "$740,500", pct: 52, color: "bg-emerald-600" },
              { stage: "DELIVERED & PENDING 3-WAY MATCH", count: 5, val: "$480,200", pct: 30, color: "bg-blue-600" },
              { stage: "PENDING MANAGER APPROVAL", count: 3, val: "$310,000", pct: 18, color: "bg-amber-600" },
              { stage: "DRAFT / SOURCING QUEUE", count: 2, val: "$114,500", pct: 10, color: "bg-gray-700" },
            ].map((stg, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-black uppercase">{stg.stage}</span>
                  <span className="text-gray-700">{stg.count} POs &bull; {stg.val}</span>
                </div>
                <div className="w-full bg-gray-100 h-3 border border-gray-300">
                  <div
                    className={`h-full ${stg.color} transition-all duration-500`}
                    style={{ width: `${stg.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
            <span>AVERAGE PO PROCESSING CYCLE: 1.8 DAYS</span>
            <span className="font-bold text-black">APPROVAL SLA PASS RATE: 99.1%</span>
          </div>
        </div>

        {/* CHART 3: VENDOR SHARE OF WALLET & OTIF SCORE RANKING */}
        <div className="lg:col-span-6 bg-white border border-gray-300 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-bold text-xs uppercase text-black">
                TOP SUPPLIER SPEND & OTIF PERFORMANCE RANKING
              </h3>
              <p className="text-[10px] text-gray-500 font-sans">Vendor spend commitment ($) and Quality & Delivery evaluation</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5">TIER-1 SUPPLIERS</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { vendor: "BASF Chemical & Polymer Europe", spend: "$580,000", score: 96, otif: "98%", category: "Polymers" },
              { vendor: "Continental Rubber Tread", spend: "$420,000", score: 94, otif: "96%", category: "Outsoles" },
              { vendor: "W.L. Gore & Associates Textile", spend: "$310,000", score: 95, otif: "95%", category: "Gore-Tex" },
              { vendor: "Horween Leather Tannery", spend: "$280,000", score: 92, otif: "91%", category: "Leather" },
              { vendor: "Yue Yuen Footwear Industrial", spend: "$255,000", score: 90, otif: "89%", category: "Assembly" },
            ].map((v, idx) => (
              <div key={idx} className="p-2.5 border border-gray-200 bg-gray-50 hover:bg-white transition space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-black uppercase">{v.vendor}</span>
                  <span className="font-black text-xs text-black">{v.spend}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-600 font-sans">
                  <span>Category: <strong>{v.category}</strong></span>
                  <div className="flex space-x-3 font-mono">
                    <span>EVAL SCORE: <strong className="text-black">{v.score}/100</strong></span>
                    <span>OTIF: <strong className="text-emerald-700">{v.otif}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 4: MATERIAL CATEGORY COMMITMENT SPEND */}
        <div className="lg:col-span-6 bg-white border border-gray-300 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-bold text-xs uppercase text-black">
                RAW MATERIAL SPEND BY CATEGORY ($ USD)
              </h3>
              <p className="text-[10px] text-gray-500 font-sans">Expenditure breakdown across footwear component categories</p>
            </div>
            <span className="text-[10px] text-gray-500 font-bold">5 CATEGORIES</span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { cat: "OUTSOLES & TREAD (CONTINENTAL)", spend: "$520,000", pct: 35, color: "bg-black" },
              { cat: "POLYMERS & MIDSOLE FOAM (BOOST)", spend: "$450,000", pct: 28, color: "bg-indigo-700" },
              { cat: "CARBON FIBER & ENERGYRODS", spend: "$340,000", pct: 20, color: "bg-blue-600" },
              { cat: "PREMIUM LEATHER & SUEDE (SAMBA)", spend: "$280,000", pct: 14, color: "bg-amber-700" },
              { cat: "TECHNICAL TEXTILES & GORE-TEX", spend: "$255,000", pct: 12, color: "bg-emerald-700" },
            ].map((c, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-black uppercase">{c.cat}</span>
                  <span className="text-gray-700">{c.spend} ({c.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-3 border border-gray-300">
                  <div
                    className={`h-full ${c.color} transition-all duration-500`}
                    style={{ width: `${c.pct * 2.2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
            <span>MOST EXPENSIVE CATEGORY: OUTSOLES ($15.80/PAIR)</span>
            <span className="font-bold text-black">SAFETY STOCK LEVEL: 100% COVERED</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Active System User Accounts"
        columns={columns}
        data={users}
        exportFilename="adidas_user_accounts"
        searchPlaceholder="Search user account..."
        actions={
          <button
            onClick={handleOpenCreate}
            className="bg-black hover:bg-gray-800 text-white font-mono text-xs font-bold px-3 py-1.5 uppercase tracking-wider cursor-pointer"
          >
            + CREATE USER ACCOUNT
          </button>
        }
      />

      {/* ROLE PERMISSIONS & SOD REFERENCE MATRIX */}
      <div className="bg-white border-2 border-black p-6 space-y-4 font-mono text-xs shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b-2 border-black pb-3">
          <div>
            <h3 className="font-black uppercase text-sm text-black tracking-tight">
              USER ROLES & SEGREGATION OF DUTIES (SOD) PERMISSIONS MATRIX
            </h3>
            <p className="text-[11px] text-gray-600 font-sans mt-0.5">
              Strict access control and Segregation of Duties configured across all procurement lifecycle endpoints
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold px-2.5 py-1 text-[11px] uppercase">
            STATUS: ENFORCED
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase text-black">
              SYSTEM AUTHORIZATION MATRIX
            </span>
            <span className="text-[10px] text-gray-500 font-sans">Enforced on all /api/* routes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white text-[10px] uppercase">
                  <th className="p-2 border border-black">Role Title</th>
                  <th className="p-2 border border-black">Master Data (/api/materials, /api/suppliers)</th>
                  <th className="p-2 border border-black">PR / Forecast (/api/prs)</th>
                  <th className="p-2 border border-black">RFQ & Sourcing (/api/rfqs, /api/quotations)</th>
                  <th className="p-2 border border-black">PO Approval (/api/pos/:id/approval)</th>
                  <th className="p-2 border border-black">Goods Receipt (/api/goods-receipts)</th>
                  <th className="p-2 border border-black">Invoices & Pay (/api/invoices, /api/payments)</th>
                  <th className="p-2 border border-black">Admin & Audit (/api/users, /api/audit-logs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Planner}</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">Full CRUD</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Sourcing}</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">Full CRUD</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read Queue</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">Full CRUD & Award</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Convert PO</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Manager}</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">Approve / Reject</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read Logs</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Warehouse}</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Material Stock</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">GR Execution</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Accountant}</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Vendor Recon</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                  <td className="p-2 border border-gray-200 text-gray-500">Read GR</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">3-Way Match & Pay</td>
                  <td className="p-2 border border-gray-200 text-gray-400">403 Blocked</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border border-gray-200">{SystemRole.Admin}</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700">Full Superuser</td>
                  <td className="p-2 border border-gray-200 font-bold text-emerald-700 bg-emerald-50">Full Admin & Logs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `EDIT USER: ${editingUser.username}` : "CREATE NEW USER"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold uppercase mb-1">Username *</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-300 p-2 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-gray-300 p-2 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 p-2 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Assigned Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as SystemRole })}
              className="w-full border border-gray-300 p-2 font-bold text-black"
            >
              <option value={SystemRole.Planner}>Supply Chain Planner</option>
              <option value={SystemRole.Sourcing}>Sourcing Specialist</option>
              <option value={SystemRole.Manager}>Procurement Manager</option>
              <option value={SystemRole.Warehouse}>Warehouse Clerk & QC</option>
              <option value={SystemRole.Accountant}>Finance Accountant</option>
              <option value={SystemRole.Admin}>System Administrator</option>
              <option value={SystemRole.Vendor}>Supplier Vendor Portal</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Account Status *</label>
            <select
              value={form.active ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
              className="w-full border border-gray-300 p-2 font-bold text-black"
            >
              <option value="active">Active (Full Login Access)</option>
              <option value="inactive">Inactive (Suspended / Deactivated)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-300 flex justify-end space-x-2">
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
              SAVE USER ACCOUNT
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
