import {
  User,
  Material,
  Supplier,
  PurchaseRequisition,
  RFQ,
  VendorQuotation,
  PurchaseOrder,
  Shipment,
  GoodsReceipt,
  DiscrepancyTicket,
  Invoice,
  Payment,
  AuditLog,
  RolePermission,
} from "../types";

const API_BASE = "";

let activeUser: User | null = null;

// Initialize from localStorage if available
try {
  const saved = localStorage.getItem("gpos_user");
  if (saved) {
    activeUser = JSON.parse(saved);
  }
} catch (e) {
  // Ignore storage errors
}

export function setApiUser(user: User | null) {
  activeUser = user;
  if (user) {
    try {
      localStorage.setItem("gpos_user", JSON.stringify(user));
    } catch (e) {}
  } else {
    try {
      localStorage.removeItem("gpos_user");
    } catch (e) {}
  }
}

export function getApiUser(): User | null {
  return activeUser;
}

/**
 * Universal Auth Fetch Wrapper
 * Automatically passes x-user-id, x-user-role, x-user-name and handles 403/401 RBAC errors
 */
async function authFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Attach RBAC Headers
  if (activeUser) {
    headers["x-user-id"] = activeUser.id || "";
    headers["x-user-role"] = activeUser.role || "";
    headers["x-user-name"] = activeUser.fullName || activeUser.username || "Unknown";
  } else {
    try {
      const saved = localStorage.getItem("gpos_user");
      if (saved) {
        const u = JSON.parse(saved);
        headers["x-user-id"] = u.id || "";
        headers["x-user-role"] = u.role || "";
        headers["x-user-name"] = u.fullName || u.username || "Unknown";
      }
    } catch (e) {}
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  let data: any = null;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { text };
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${res.status} error occurred on ${url}`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Set current user context
  setCurrentUser(user: User | null) {
    setApiUser(user);
  },

  getCurrentUser() {
    return getApiUser();
  },

  // Login
  async login(username: string, password: string, role?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Login failed" };
      if (data.user) {
        setApiUser(data.user);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  },

  // Full DB Sync
  async getFullDB() {
    return await authFetch(`${API_BASE}/api/db/full`);
  },

  async getInitialData() {
    return await this.getFullDB();
  },

  async getERDMetadata() {
    return await authFetch<any>(`${API_BASE}/api/erd-metadata`);
  },

  async getDatabaseSql() {
    return await authFetch<{ success: boolean; sql: string }>(`${API_BASE}/api/database-sql`);
  },

  async executeSQL(sql: string) {
    return await authFetch<any>(`${API_BASE}/api/execute-sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await authFetch<Material[]>(`${API_BASE}/api/materials`);
  },

  async createMaterial(mat: Partial<Material>): Promise<Material> {
    const data = await authFetch<{ success: boolean; material: Material }>(`${API_BASE}/api/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mat),
    });
    return data.material;
  },

  async updateMaterial(id: string, mat: Partial<Material>): Promise<Material> {
    const data = await authFetch<{ success: boolean; material: Material }>(`${API_BASE}/api/materials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mat),
    });
    return data.material;
  },

  async deleteMaterial(id: string): Promise<boolean> {
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/materials/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await authFetch<Supplier[]>(`${API_BASE}/api/suppliers`);
  },

  async createSupplier(supp: Partial<Supplier>): Promise<Supplier> {
    const data = await authFetch<{ success: boolean; supplier: Supplier }>(`${API_BASE}/api/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supp),
    });
    return data.supplier;
  },

  async updateSupplier(id: string, supp: Partial<Supplier>): Promise<Supplier> {
    const data = await authFetch<{ success: boolean; supplier: Supplier }>(`${API_BASE}/api/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supp),
    });
    return data.supplier;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/suppliers/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  // PRs
  async getPRs(): Promise<PurchaseRequisition[]> {
    return await authFetch<PurchaseRequisition[]>(`${API_BASE}/api/prs`);
  },

  async createPR(pr: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> {
    const data = await authFetch<{ success: boolean; pr: PurchaseRequisition }>(`${API_BASE}/api/prs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pr),
    });
    return data.pr;
  },

  async updatePR(id: string, pr: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> {
    const data = await authFetch<{ success: boolean; pr: PurchaseRequisition }>(`${API_BASE}/api/prs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pr),
    });
    return data.pr;
  },

  async deletePR(id: string): Promise<boolean> {
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/prs/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  // RFQs & Grouping
  async getRFQs(): Promise<RFQ[]> {
    return await authFetch<RFQ[]>(`${API_BASE}/api/rfqs`);
  },

  async groupPRsToRFQ(payload: {
    prIds: string[];
    title: string;
    createdById: string;
    createdByName: string;
    dueDate?: string;
    invitedVendorIds?: string[];
  }): Promise<RFQ> {
    const data = await authFetch<{ success: boolean; rfq: RFQ }>(`${API_BASE}/api/rfqs/group-prs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.rfq;
  },

  // Quotations
  async getQuotations(): Promise<VendorQuotation[]> {
    return await authFetch<VendorQuotation[]>(`${API_BASE}/api/quotations`);
  },

  async submitQuotation(quot: Partial<VendorQuotation>): Promise<VendorQuotation> {
    const data = await authFetch<{ success: boolean; quotation: VendorQuotation }>(`${API_BASE}/api/quotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quot),
    });
    return data.quotation;
  },

  async selectWinningQuotation(quotationId: string): Promise<{ winningQuotation: VendorQuotation; rfq: RFQ }> {
    return await authFetch<{ winningQuotation: VendorQuotation; rfq: RFQ }>(
      `${API_BASE}/api/quotations/${quotationId}/select-winner`,
      { method: "POST" }
    );
  },

  // Purchase Orders
  async getPOs(): Promise<PurchaseOrder[]> {
    return await authFetch<PurchaseOrder[]>(`${API_BASE}/api/pos`);
  },

  async convertFromQuotation(
    quotationId: string,
    createdById: string,
    createdByName: string,
    taxRatePercent?: number
  ): Promise<PurchaseOrder> {
    const data = await authFetch<{ success: boolean; po: PurchaseOrder }>(`${API_BASE}/api/pos/convert-from-quotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationId, createdById, createdByName, taxRatePercent }),
    });
    return data.po;
  },

  async approveOrRejectPO(
    poId: string,
    decision: "Approved" | "Rejected",
    comments: string,
    approverId: string,
    approverName: string
  ) {
    return await authFetch(`${API_BASE}/api/pos/${poId}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comments, approverId, approverName }),
    });
  },

  async vendorAcceptPO(poId: string): Promise<PurchaseOrder> {
    const data = await authFetch<{ success: boolean; po: PurchaseOrder }>(`${API_BASE}/api/pos/${poId}/accept`, {
      method: "POST",
    });
    return data.po;
  },

  async deletePurchaseOrder(id: string, user?: User): Promise<boolean> {
    if (user) setApiUser(user);
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/purchase-orders/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  // Shipments
  async getShipments(): Promise<Shipment[]> {
    return await authFetch<Shipment[]>(`${API_BASE}/api/shipments`);
  },

  async createShipment(ship: Partial<Shipment>): Promise<Shipment> {
    const data = await authFetch<{ success: boolean; shipment: Shipment }>(`${API_BASE}/api/shipments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ship),
    });
    return data.shipment;
  },

  // Goods Receipt
  async getGoodsReceipts(): Promise<GoodsReceipt[]> {
    return await authFetch<GoodsReceipt[]>(`${API_BASE}/api/goods-receipts`);
  },

  async postGoodsReceipt(payload: {
    poId: string;
    receivedByUserId: string;
    receivedByUserName: string;
    receiptDate: string;
    items: any[];
    notes?: string;
  }): Promise<GoodsReceipt> {
    const data = await authFetch<{ success: boolean; goodsReceipt: GoodsReceipt }>(`${API_BASE}/api/goods-receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.goodsReceipt;
  },

  // Discrepancy Tickets
  async getDiscrepancies(): Promise<DiscrepancyTicket[]> {
    return await authFetch<DiscrepancyTicket[]>(`${API_BASE}/api/discrepancies`);
  },

  async updateDiscrepancy(
    id: string,
    payload: { status?: string; resolutionNotes?: string }
  ): Promise<DiscrepancyTicket> {
    const data = await authFetch<{ success: boolean; discrepancy?: DiscrepancyTicket; ticket?: DiscrepancyTicket }>(
      `${API_BASE}/api/discrepancies/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return data.discrepancy || data.ticket!;
  },

  // Invoices & 3-Way Match
  async getInvoices(): Promise<Invoice[]> {
    return await authFetch<Invoice[]>(`${API_BASE}/api/invoices`);
  },

  async uploadFile(file: File): Promise<{ filename: string; url: string }> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });
    const result = await authFetch<{ success: boolean; filename: string; url: string }>(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, data }),
    });
    return { filename: result.filename, url: result.url };
  },

  async createInvoice(inv: Partial<Invoice>): Promise<Invoice> {
    const data = await authFetch<{ success: boolean; invoice: Invoice }>(`${API_BASE}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inv),
    });
    return data.invoice;
  },

  async deleteInvoice(id: string, user?: User): Promise<boolean> {
    if (user) setApiUser(user);
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/invoices/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  async verifyThreeWayMatch(
    invoiceId: string,
    verifiedBy: string,
    raisesDiscrepancy: boolean,
    discrepancyNote?: string
  ): Promise<Invoice> {
    const data = await authFetch<{ success: boolean; invoice: Invoice }>(`${API_BASE}/api/invoices/${invoiceId}/verify-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verifiedBy, raisesDiscrepancy, discrepancyNote }),
    });
    return data.invoice;
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await authFetch<Payment[]>(`${API_BASE}/api/payments`);
  },

  async executePayment(payload: {
    invoiceId: string;
    reconAccount: string;
    paymentMethod: string;
    paymentDate?: string;
    processedByUserId: string;
    processedByUserName: string;
  }): Promise<Payment> {
    const data = await authFetch<{ success: boolean; payment: Payment }>(`${API_BASE}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.payment;
  },

  // Users & Roles (Admin)
  async getUsers(): Promise<User[]> {
    return await authFetch<User[]>(`${API_BASE}/api/users`);
  },

  async createUser(u: Partial<User>): Promise<User> {
    const data = await authFetch<{ success: boolean; user: User }>(`${API_BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u),
    });
    return data.user;
  },

  async updateUser(id: string, u: Partial<User>): Promise<User> {
    const data = await authFetch<{ success: boolean; user: User }>(`${API_BASE}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u),
    });
    return data.user;
  },

  async deleteUser(id: string): Promise<boolean> {
    const data = await authFetch<{ success: boolean }>(`${API_BASE}/api/users/${id}`, {
      method: "DELETE",
    });
    return data.success;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return await authFetch<AuditLog[]>(`${API_BASE}/api/audit-logs`);
  },

  // Role Permissions
  async getRolePermissions(): Promise<RolePermission[]> {
    return await authFetch<RolePermission[]>(`${API_BASE}/api/role-permissions`);
  },

  async updateRolePermissions(perms: RolePermission[]): Promise<RolePermission[]> {
    const data = await authFetch<{ success: boolean; rolePermissions: RolePermission[] }>(
      `${API_BASE}/api/role-permissions`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perms),
      }
    );
    return data.rolePermissions;
  },

  // App.tsx alias functions
  async convertToPO(quotationId: string, taxRatePercent?: number, user?: User) {
    return await this.convertFromQuotation(
      quotationId,
      user?.id || activeUser?.id || "usr-2",
      user?.fullName || activeUser?.fullName || "Sourcing Specialist",
      taxRatePercent
    );
  },
  async updateDiscrepancyTicket(id: string, payload: any, _user?: User) {
    return await this.updateDiscrepancy(id, payload);
  },
  async approve3WayMatch(invoiceId: string, user?: User) {
    return await this.verifyThreeWayMatch(
      invoiceId,
      user?.fullName || activeUser?.fullName || "Accountant",
      false
    );
  },
  async raiseDiscrepancy(poId: string, _vendorName: string, desc: string, user?: User) {
    return await this.verifyThreeWayMatch(
      poId,
      user?.fullName || activeUser?.fullName || "Accountant",
      true,
      desc
    );
  },
  async submitVendorQuotation(payload: any, _user?: User) {
    return await this.submitQuotation(payload);
  },
  async acceptPO(poId: string, _user?: User) {
    return await this.vendorAcceptPO(poId);
  },
  async submitVendorInvoice(payload: any, _user?: User) {
    return await this.createInvoice(payload);
  },

  async logout(user?: User | null) {
    const targetUser = user || activeUser;
    if (targetUser) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: targetUser.id,
            userName: targetUser.fullName || targetUser.username,
            role: targetUser.role,
          }),
        });
      } catch (e) {}
    }
    setApiUser(null);
  },

  // Real-Time Event Subscription (SSE)
  subscribeToEvents(onEvent: (data: any) => void): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isClosed = false;

    function connect() {
      if (isClosed) return;
      try {
        eventSource = new EventSource(`${API_BASE}/api/events`);
        
        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            onEvent(data);
          } catch {
            onEvent({ raw: e.data });
          }
        };

        eventSource.addEventListener("db_mutation", (e: any) => {
          try {
            const data = JSON.parse(e.data);
            onEvent(data);
          } catch {
            onEvent({ type: "db_mutation" });
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isClosed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  },
};

// CSV Download Helper Utility
export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert("No data available to download.");
    return;
  }

  const headers = Array.from(
    new Set(
      rows.flatMap((r) =>
        Object.keys(r).filter(
          (k) => typeof r[k] !== "object" || r[k] === null
        )
      )
    )
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
