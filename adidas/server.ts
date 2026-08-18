import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { procurementRepo } from "./src/server/procurementRepo";
import { getRelationalDB } from "./src/server/relationalDb";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Verify the MySQL connection before accepting application traffic.
getRelationalDB()
  .then(() => console.log(`MySQL database "${process.env.DB_NAME || "adidas_procurement"}" connected on ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}.`))
  .catch((err) => console.error("MySQL initialization error:", err));

// ==================== REAL-TIME SYNCHRONIZATION (SSE) ====================
const sseClients = new Set<express.Response>();

export function broadcastRealtimeEvent(eventType: string, data: any = {}) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), ...data })}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Server-Sent Events Endpoint
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Automatic Mutation Notification Interceptor
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        broadcastRealtimeEvent("db_mutation", {
          path: req.path,
          method: req.method,
          time: new Date().toISOString(),
        });
      }
    });
  }
  next();
});

// ==================== SYSTEM & SCHEMA ROUTES ====================

// RBAC Server Authorization Middleware
function getRequestUser(req: express.Request) {
  const userId = String(req.headers["x-user-id"] || req.headers["user-id"] || "").trim();
  const role = String(req.headers["x-user-role"] || req.headers["role"] || "").toLowerCase().trim();
  const userName = String(req.headers["x-user-name"] || "").trim();
  return { userId, role, userName };
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { userId, role, userName } = getRequestUser(req);
  if (!userId || !role) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await procurementRepo.getUserById(userId);
    if (!user || !user.active || user.role.toLowerCase() !== role) return res.status(401).json({ error: "Invalid or inactive user session" });
    (req as any).userId = user.id;
    (req as any).userRole = user.role.toLowerCase();
    (req as any).userName = user.fullName || userName || user.username;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Authentication lookup failed" });
  }
}

function requireRole(allowedRoles: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { userId, role, userName } = getRequestUser(req);
    if (!userId || !role) return res.status(401).json({ error: "Authentication required" });
    if (!allowedRoles.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ error: `Role '${role}' is not allowed for this action` });
    }
    try {
      const user = await procurementRepo.getUserById(userId);
      if (!user || !user.active || user.role.toLowerCase() !== role) {
        return res.status(401).json({ error: "Invalid or inactive user session" });
      }
      (req as any).userId = user.id;
      (req as any).userRole = user.role.toLowerCase();
      (req as any).userName = user.fullName || userName || user.username;
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Authorization lookup failed" });
    }
  };
}

// 1. Full State Synchronization (both /api/state and /api/db/full)
app.get(["/api/state", "/api/db/full"], requireAuth, async (req, res) => {
  try {
    const state = await procurementRepo.getFullState((req as any).userRole, (req as any).userId);
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load state" });
  }
});

// 2. Authentication Login & Logout
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ success: false, error: "Username, password and role are required" });
    const user = await procurementRepo.authenticateUser(username, password, role);
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials or inactive account" });
    await procurementRepo.addAuditLog(user.employeeId || user.id, user.fullName || user.username, user.role, "LOGIN", "users", user.id, `User ${user.username} successfully logged in`);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const { userId, userName, role } = req.body;
    if (userId) {
      await procurementRepo.addAuditLog(
        userId,
        userName || "User",
        role || "user",
        "LOGOUT",
        "users",
        userId,
        `User session terminated`,
        undefined
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: true });
  }
});

// 3. Reset Database to Seed State
app.post("/api/reset", requireRole(["admin"]), async (req, res) => {
  try {
    await procurementRepo.reset();
    const state = await procurementRepo.getFullState();
    res.json({ success: true, message: "Database reset to relational seed state", state });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reset database" });
  }
});

// 3. ERD & Schema Metadata Route
app.get("/api/erd-metadata", requireAuth, async (req, res) => {
  try {
    const metadata = await procurementRepo.getERDMetadata();
    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch ERD metadata" });
  }
});

// 4. Raw Full database.sql Schema Route
app.get("/api/database-sql", requireAuth, async (req, res) => {
  try {
    const sqlPath = path.join(process.cwd(), "database.sql");
    if (fs.existsSync(sqlPath)) {
      const sqlContent = await fs.promises.readFile(sqlPath, "utf-8");
      res.json({ success: true, sql: sqlContent });
    } else {
      res.status(404).json({ error: "database.sql not found on server" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read database.sql" });
  }
});

// 5. Custom SQL Query Execution Sandbox
app.post("/api/execute-sql", requireRole(["admin"]), async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== "string") {
      return res.status(400).json({ error: "Missing SQL query string" });
    }
    const result = await procurementRepo.executeCustomQuery(sql);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "SQL Execution Error" });
  }
});

// ==================== MASTER DATA ROUTES ====================

// Materials Master
app.get("/api/materials", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getMaterials();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/materials", requireRole(["planner", "sourcing", "warehouse", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const material = await procurementRepo.createMaterial(req.body, userId);
    res.json({ success: true, material });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/materials/:id", requireRole(["planner", "sourcing", "warehouse", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const material = await procurementRepo.updateMaterial(req.params.id, req.body, userId);
    res.json({ success: true, material });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/materials/:id", requireRole(["planner", "sourcing", "warehouse", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    await procurementRepo.deleteMaterial(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers Master
app.get("/api/suppliers", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getSuppliers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/suppliers", requireRole(["planner", "sourcing", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const supplier = await procurementRepo.createSupplier(req.body, userId);
    res.json({ success: true, supplier });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/suppliers/:id", requireRole(["planner", "sourcing", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const supplier = await procurementRepo.updateSupplier(req.params.id, req.body, userId);
    res.json({ success: true, supplier });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/suppliers/:id", requireRole(["planner", "sourcing", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    await procurementRepo.deleteSupplier(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TRANSACTIONAL PROCUREMENT ROUTES ====================

// Purchase Requisitions (1:N with pr_line_items)
app.get("/api/prs", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getPRs();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/prs", requireRole(["planner", "admin"]), async (req, res) => {
  try {
    const pr = await procurementRepo.createPR({ ...req.body, creatorId: (req as any).userId, creatorName: (req as any).userName });
    res.json({ success: true, pr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/prs/:id", requireRole(["planner", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const pr = await procurementRepo.updatePR(req.params.id, req.body, userId);
    res.json({ success: true, pr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/prs/:id", requireRole(["planner", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    await procurementRepo.deletePR(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RFQs (1:N with rfq_line_items, rfq_pr_links, rfq_invited_vendors)
app.get("/api/rfqs", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getRFQs((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rfqs/group-prs", requireRole(["sourcing", "admin"]), async (req, res) => {
  try {
    const rfq = await procurementRepo.groupPRsToRFQ(req.body);
    res.json({ success: true, rfq });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vendor Quotations (1:N with quotation_line_items)
app.get("/api/quotations", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getQuotations((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/quotations", requireRole(["vendor", "sourcing", "admin"]), async (req, res) => {
  try {
    const quotation = await procurementRepo.createQuotation(req.body, (req as any).userId, (req as any).userRole);
    res.json({ success: true, quotation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/quotations/:id/select-winner", requireRole(["sourcing", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const result = await procurementRepo.selectWinningQuotation(req.params.id, userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase Orders (1:N with po_line_items, po_approval_history)
app.get("/api/pos", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getPOs((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post(["/api/pos/convert-from-quotation", "/api/pos/convert-quotation"], requireRole(["sourcing", "admin"]), async (req, res) => {
  try {
    const po = await procurementRepo.convertQuotationToPO(req.body);
    res.json({ success: true, po });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PO APPROVAL: STRICTLY RESTRICTED TO MANAGER & ADMIN
app.post(["/api/pos/:id/approval", "/api/pos/:id/approve"], requireRole(["manager", "admin"]), async (req, res) => {
  try {
    const decision = req.body?.decision === "Approved" || req.body?.decision === "Rejected" ? req.body.decision : null;
    if (!decision) return res.status(400).json({ error: "Decision must be Approved or Rejected" });

    // Never trust approver identity sent by the browser. Use the authenticated session.
    const payload = {
      decision,
      comments: String(req.body?.comments || "").trim(),
      approverId: (req as any).userId,
      approverName: (req as any).userName,
    };
    if (decision === "Rejected" && !payload.comments) {
      return res.status(400).json({ error: "Manager comments are required when rejecting a Purchase Order" });
    }

    const result = await procurementRepo.approvePO(req.params.id, payload);
    res.json(result);
  } catch (err: any) {
    const message = err?.message || "PO approval failed";
    const status = /not found|only.*pending|already|comments.*required/i.test(message) ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/pos/:id/accept", requireRole(["vendor", "admin"]), async (req, res) => {
  try {
    const result = await procurementRepo.acceptPO(req.params.id, (req as any).userId, (req as any).userRole);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/purchase-orders/:id", requireRole(["sourcing", "manager", "admin"]), async (req, res) => {
  try {
    await procurementRepo.deletePurchaseOrder(req.params.id, (req as any).userId, (req as any).userRole);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// File upload (stored locally under uploads/)
app.post("/api/uploads", requireAuth, async (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!filename || !data || typeof data !== "string") return res.status(400).json({ error: "filename and base64 data are required" });
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(safeName).toLowerCase();
    if (!['.pdf','.xml','.png','.jpg','.jpeg'].includes(ext)) return res.status(400).json({ error: "Unsupported file type" });
    const raw = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(raw, "base64");
    if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: "File exceeds 10MB limit" });
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName}`;
    await fs.promises.writeFile(path.join(uploadDir, storedName), buffer);
    res.json({ success: true, filename: storedName, url: `/uploads/${storedName}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Upload failed" });
  }
});

// Shipments
app.get("/api/shipments", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getShipments((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/shipments", requireRole(["vendor", "warehouse", "admin"]), async (req, res) => {
  try {
    const shipment = await procurementRepo.createShipment(req.body, (req as any).userId, (req as any).userRole);
    res.json({ success: true, shipment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Goods Receipts (1:N with goods_receipt_line_items): STRICTLY RESTRICTED TO WAREHOUSE & ADMIN
app.get("/api/goods-receipts", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getGoodsReceipts((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goods-receipts", requireRole(["warehouse", "admin"]), async (req, res) => {
  try {
    const goodsReceipt = await procurementRepo.createGoodsReceipt({ ...req.body, receivedByUserId: (req as any).userId, receivedByUserName: (req as any).userName });
    res.json({ success: true, goodsReceipt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Discrepancy Tickets
app.get("/api/discrepancies", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getDiscrepancies((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/discrepancies/:id", requireRole(["warehouse", "accountant", "manager", "admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    const discrepancy = await procurementRepo.updateDiscrepancy(req.params.id, req.body, userId);
    res.json({ success: true, discrepancy });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invoices & 3-Way Match (1:N with invoice_line_items)
app.get("/api/invoices", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getInvoices((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/invoices", requireRole(["vendor", "accountant", "admin"]), async (req, res) => {
  try {
    const invoice = await procurementRepo.createInvoice(req.body, (req as any).userId, (req as any).userRole);
    res.json({ success: true, invoice });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/invoices/:id", requireRole(["vendor", "accountant", "admin"]), async (req, res) => {
  try {
    await procurementRepo.deleteInvoice(req.params.id, (req as any).userId, (req as any).userRole);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3-WAY MATCH VERIFICATION: STRICTLY RESTRICTED TO ACCOUNTANT & ADMIN
app.post(["/api/invoices/:id/verify-match", "/api/invoices/:id/verify-3way-match"], requireRole(["accountant", "admin"]), async (req, res) => {
  try {
    const result = await procurementRepo.verify3WayMatch(req.params.id, req.body, (req as any).userId, (req as any).userRole);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments: STRICTLY RESTRICTED TO ACCOUNTANT & ADMIN
app.get("/api/payments", requireAuth, async (req, res) => {
  try {
    const data = await procurementRepo.getPayments((req as any).userRole, (req as any).userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/payments", requireRole(["accountant", "admin"]), async (req, res) => {
  try {
    const payment = await procurementRepo.createPayment({ ...req.body, processedByUserId: (req as any).userId, processedByUserName: (req as any).userName });
    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users & Permissions (Admin)
app.get("/api/users", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const data = await procurementRepo.getUsers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", requireRole(["admin"]), async (req, res) => {
  try {
    const user = await procurementRepo.createUser(req.body);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const user = await procurementRepo.updateUser(req.params.id, req.body);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "SYS";
    await procurementRepo.deleteUser(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
app.get("/api/audit-logs", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const data = await procurementRepo.getAuditLogs();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Role Permissions
app.get("/api/role-permissions", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const data = await procurementRepo.getRolePermissions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/role-permissions", requireRole(["admin"]), async (req, res) => {
  try {
    const rolePermissions = await procurementRepo.updateRolePermissions(req.body);
    res.json({ success: true, rolePermissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Middleware for Development & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Adidas Procurement OS running at http://localhost:${PORT}`);
  });
}

startServer();
