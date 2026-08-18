import crypto from "crypto";
import { getRelationalDB, queryAll, queryOne, executeSql, persistDB, resetRelationalDB } from "./relationalDb";

async function executeAndPersist(db: any, sql: string, params: any[] = []): Promise<void> {
  await executeSql(db, sql, params);
}

async function runTransaction<T>(db: any, fn: () => Promise<T> | T): Promise<T> {
  try {
    await db.beginTransaction();
    const result = await fn();
    await db.commit();
    return result;
  } catch (err: any) {
    try { await db.rollback(); } catch {}
    console.error("Database Transaction Error:", err?.message || err);
    throw err;
  }
}

async function resolveUserId(db: any, candidateId?: string, fallbackRole = "planner"): Promise<string> {
  if (candidateId) {
    const existing = await queryOne(db, `SELECT id FROM users WHERE id = ?`, [candidateId]);
    if (existing) return existing.id;
  }
  const byRole = await queryOne(db, `SELECT id FROM users WHERE role = ? LIMIT 1`, [fallbackRole]);
  if (byRole) return byRole.id;
  const anyUser = await queryOne(db, `SELECT id FROM users LIMIT 1`);
  return anyUser ? anyUser.id : "usr-101";
}

async function resolveSupplierId(db: any, candidateId?: string): Promise<string> {
  if (candidateId) {
    const existing = await queryOne(db, `SELECT id FROM suppliers WHERE id = ?`, [candidateId]);
    if (existing) return existing.id;
  }
  const anySupp = await queryOne(db, `SELECT id FROM suppliers LIMIT 1`);
  return anySupp ? anySupp.id : "VEND-001";
}

export const procurementRepo = {
  async reset() {
    await resetRelationalDB();
  },

  // Audit Logger
  async addAuditLog(
    employeeId: string,
    userName: string,
    userRole: string,
    actionType: string,
    targetTable: string,
    targetId: string,
    newValue?: string,
    oldValue?: string
  ) {
    const db = await getRelationalDB();
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    await executeAndPersist(
      db,
      `INSERT INTO audit_logs (id, timestamp, employee_id, user_name, user_role, action_type, target_table, target_id, new_value, old_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, now, employeeId || "SYSTEM", userName || "System", userRole || "system", actionType, targetTable, targetId, newValue || null, oldValue || null]
    );
  },

  // 1. Users
  async getUserById(id: string) {
    const db = await getRelationalDB();
    const u = await queryOne(db, `SELECT * FROM users WHERE id = ?`, [id]);
    if (!u) return null;
    return { id: u.id, employeeId: u.employee_id, username: u.username, fullName: u.full_name, email: u.email, role: u.role, portal: u.portal, department: u.department, vendorId: u.vendor_id, active: Boolean(u.active), createdAt: u.created_at };
  },

  async authenticateUser(username: string, password: string, role: string) {
    const db = await getRelationalDB();
    const hash = crypto.createHash("sha256").update(String(password)).digest("hex");
    const u = await queryOne(db, `SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND LOWER(role) = LOWER(?) AND active = 1 AND password_hash = ?`, [username, username, role, hash]);
    if (!u) return null;
    return { id: u.id, employeeId: u.employee_id, username: u.username, fullName: u.full_name, email: u.email, role: u.role, portal: u.portal, department: u.department, vendorId: u.vendor_id, active: Boolean(u.active), createdAt: u.created_at };
  },

  async getUsers() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM users ORDER BY created_at ASC`);
    return rows.map((u) => ({
      id: u.id,
      employeeId: u.employee_id,
      username: u.username,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      portal: u.portal,
      department: u.department,
      vendorId: u.vendor_id,
      active: Boolean(u.active),
      createdAt: u.created_at,
    }));
  },

  async createUser(u: any) {
    const db = await getRelationalDB();
    const id = u.id || `usr-${Date.now()}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    await executeAndPersist(
      db,
      `INSERT INTO users (id, employee_id, username, full_name, email, role, portal, department, vendor_id, active, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, u.employeeId || id, u.username, u.fullName, u.email, u.role, u.portal || "internal", u.department, u.vendorId || null, u.active !== false ? 1 : 0, u.passwordHash || crypto.createHash("sha256").update(String(u.password || "password123")).digest("hex"), now]
    );
    await this.addAuditLog("EMP-106", "Admin", "admin", "CREATE", "users", id, `Created user ${u.username}`);
    return { ...u, id, active: u.active !== false, createdAt: now };
  },

  async updateUser(id: string, u: any, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM users WHERE id = ?`, [id]);
    if (!existing) throw new Error("User not found");

    const username = u.username !== undefined ? u.username : existing.username;
    const fullName = u.fullName !== undefined ? u.fullName : existing.full_name;
    const email = u.email !== undefined ? u.email : existing.email;
    const role = u.role !== undefined ? u.role : existing.role;
    const department = u.department !== undefined ? u.department : existing.department;
    const vendorId = u.vendorId !== undefined ? u.vendorId : existing.vendor_id;
    const active = u.active !== undefined ? (u.active ? 1 : 0) : existing.active;
    const passwordHash = u.passwordHash || (u.password ? crypto.createHash("sha256").update(String(u.password)).digest("hex") : existing.password_hash);

    await executeAndPersist(
      db,
      `UPDATE users SET username = ?, full_name = ?, email = ?, role = ?, department = ?, vendor_id = ?, active = ?, password_hash = ? WHERE id = ?`,
      [username, fullName, email, role, department, vendorId, active, passwordHash, id]
    );
    await this.addAuditLog(userId, "Admin", "admin", "UPDATE", "users", id, `Updated user ${username}`);
    return {
      ...existing,
      id,
      username,
      fullName,
      email,
      role,
      department,
      vendorId,
      active: active === 1,
    };
  },

  async deleteUser(id: string, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM users WHERE id = ?`, [id]);
    if (!existing) throw new Error("User not found");
    const refs = await Promise.all([
      queryOne(db, `SELECT id FROM purchase_requisitions WHERE creator_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM goods_receipts WHERE received_by_user_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM payments WHERE processed_by_user_id = ? LIMIT 1`, [id]),
    ]);
    if (refs.some(Boolean)) {
      await executeAndPersist(db, `UPDATE users SET active = 0 WHERE id = ?`, [id]);
      await this.addAuditLog(userId, "Admin", "admin", "DEACTIVATE", "users", id, `Soft-deleted user ${existing.username} because dependent transactions exist`);
      return true;
    }
    await executeAndPersist(db, `DELETE FROM users WHERE id = ?`, [id]);
    await this.addAuditLog(userId, "Admin", "admin", "DELETE", "users", id);
    return true;
  },

  // 2. Suppliers / Vendors
  async getSuppliers() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM suppliers ORDER BY rating DESC`);
    return rows.map((s) => ({
      id: s.id,
      vendorCode: s.vendor_code,
      name: s.name,
      taxId: s.tax_id,
      address: s.address,
      contactPerson: s.contact_person,
      phone: s.phone,
      email: s.email,
      companyCode: s.company_code,
      purchasingOrg: s.purchasing_org,
      reconAccount: s.recon_account,
      currency: s.currency,
      paymentTerms: s.payment_terms,
      tariffImpactLevel: s.tariff_impact_level || (s.tariff_flag_122 ? "High" : "Low"),
      tariffFlag122: s.tariff_impact_level === "High" || Boolean(s.tariff_flag_122),
      status: s.status,
      rating: Number(s.rating || 0),
      createdAt: s.created_at,
    }));
  },

  async createSupplier(s: any, userId = "SYS") {
    const db = await getRelationalDB();
    const id = s.id || s.vendorCode || `VEND-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString().substring(0, 10);
    const tariffImpact = s.tariffImpactLevel || s.tariff_impact_level || (s.tariffFlag122 ? "High" : "Medium");
    await executeAndPersist(
      db,
      `INSERT INTO suppliers (id, vendor_code, name, tax_id, address, contact_person, phone, email, company_code, purchasing_org, recon_account, currency, payment_terms, tariff_impact_level, status, rating, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, s.vendorCode || id, s.name, s.taxId, s.address, s.contactPerson, s.phone, s.email, s.companyCode || "ADVN", s.purchasingOrg || "SOUR", s.reconAccount || "300700 - Accounts Payable", s.currency || "USD", s.paymentTerms || "Net 30", tariffImpact, s.status || "Active", s.rating || 90, now]
    );
    await this.addAuditLog(userId, "Sourcing User", "sourcing", "CREATE", "suppliers", id, s.name);
    return { ...s, id, tariffImpactLevel: tariffImpact, createdAt: now };
  },

  async updateSupplier(id: string, s: any, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM suppliers WHERE id = ?`, [id]);
    if (!existing) throw new Error("Supplier not found");

    const name = s.name !== undefined ? s.name : existing.name;
    const taxId = s.taxId !== undefined ? s.taxId : existing.tax_id;
    const address = s.address !== undefined ? s.address : existing.address;
    const contactPerson = s.contactPerson !== undefined ? s.contactPerson : existing.contact_person;
    const phone = s.phone !== undefined ? s.phone : existing.phone;
    const email = s.email !== undefined ? s.email : existing.email;
    const paymentTerms = s.paymentTerms !== undefined ? s.paymentTerms : existing.payment_terms;
    const tariffImpact = s.tariffImpactLevel !== undefined ? s.tariffImpactLevel : (s.tariff_impact_level !== undefined ? s.tariff_impact_level : (existing.tariff_impact_level || "Medium"));
    const status = s.status !== undefined ? s.status : existing.status;
    const rating = s.rating !== undefined ? s.rating : existing.rating;

    await executeAndPersist(
      db,
      `UPDATE suppliers SET name = ?, tax_id = ?, address = ?, contact_person = ?, phone = ?, email = ?, payment_terms = ?, tariff_impact_level = ?, status = ?, rating = ? WHERE id = ?`,
      [name, taxId, address, contactPerson, phone, email, paymentTerms, tariffImpact, status, rating, id]
    );
    await this.addAuditLog(userId, "Sourcing User", "sourcing", "UPDATE", "suppliers", id, `${name} (Status: ${status})`);
    return {
      ...existing,
      id,
      name,
      taxId,
      address,
      contactPerson,
      phone,
      email,
      paymentTerms,
      tariffImpactLevel: tariffImpact,
      status,
      rating,
    };
  },

  async deleteSupplier(id: string, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM suppliers WHERE id = ?`, [id]);
    if (!existing) throw new Error("Supplier not found");
    const materialRef = await queryOne(db, `SELECT id FROM materials WHERE supplier_id = ? LIMIT 1`, [id]);
    const downstream = await queryOne(db, `SELECT id FROM vendor_quotations WHERE vendor_id = ? LIMIT 1`, [id]);
    if (materialRef || downstream) {
      await executeAndPersist(db, `UPDATE suppliers SET status = 'Inactive' WHERE id = ?`, [id]);
      await this.addAuditLog(userId, "Sourcing User", "sourcing", "DEACTIVATE", "suppliers", id, `Soft-deleted supplier ${existing.name}`);
      return true;
    }
    await executeAndPersist(db, `DELETE FROM rfq_invited_vendors WHERE vendor_id = ?`, [id]);
    await executeAndPersist(db, `DELETE FROM suppliers WHERE id = ?`, [id]);
    await this.addAuditLog(userId, "Sourcing User", "sourcing", "DELETE", "suppliers", id);
    return true;
  },

  // 3. Materials
  // 3. Materials (Relational: FK -> suppliers)
  async getMaterials() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM materials ORDER BY material_code ASC`);
    return rows.map((m) => ({
      id: m.id,
      materialCode: m.material_code,
      name: m.name,
      category: m.category,
      uom: m.uom,
      forecastQty: Number(m.forecast_qty || 0),
      currentStockQty: Number(m.current_stock_qty || 0),
      safetyStockQty: Number(m.safety_stock_qty || 0),
      standardCost: Number(m.standard_cost || 0),
      supplierId: m.supplier_id,
      lastUpdated: m.last_updated,
    }));
  },

  async createMaterial(m: any, userId = "SYS") {
    const db = await getRelationalDB();
    const id = m.id || m.materialCode || `MAT-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString().substring(0, 10);
    const supplierId = await resolveSupplierId(db, m.supplierId);
    await executeAndPersist(
      db,
      `INSERT INTO materials (id, material_code, name, category, uom, forecast_qty, current_stock_qty, safety_stock_qty, standard_cost, supplier_id, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, m.materialCode || id, m.name, m.category, m.uom, m.forecastQty || 0, m.currentStockQty || 0, m.safetyStockQty || 0, m.standardCost || 0, supplierId, now]
    );
    await this.addAuditLog(userId, "Planner User", "planner", "CREATE", "materials", id, m.name);
    return { ...m, id, supplierId, lastUpdated: now };
  },

  async updateMaterial(id: string, m: any, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM materials WHERE id = ? OR material_code = ?`, [id, id]);
    if (!existing) throw new Error("Material not found");

    const targetId = existing.id;
    const now = new Date().toISOString().substring(0, 10);
    const supplierId = m.supplierId !== undefined ? await resolveSupplierId(db, m.supplierId) : existing.supplier_id;
    const name = m.name !== undefined ? m.name : existing.name;
    const category = m.category !== undefined ? m.category : existing.category;
    const uom = m.uom !== undefined ? m.uom : existing.uom;
    const forecastQty = m.forecastQty !== undefined ? m.forecastQty : existing.forecast_qty;
    const currentStockQty = m.currentStockQty !== undefined ? m.currentStockQty : existing.current_stock_qty;
    const safetyStockQty = m.safetyStockQty !== undefined ? m.safetyStockQty : existing.safety_stock_qty;
    const standardCost = m.standardCost !== undefined ? m.standardCost : existing.standard_cost;

    await executeAndPersist(
      db,
      `UPDATE materials SET name = ?, category = ?, uom = ?, forecast_qty = ?, current_stock_qty = ?, safety_stock_qty = ?, standard_cost = ?, supplier_id = ?, last_updated = ? WHERE id = ?`,
      [name, category, uom, forecastQty, currentStockQty, safetyStockQty, standardCost, supplierId, now, targetId]
    );
    await this.addAuditLog(userId, "Planner User", "planner", "UPDATE", "materials", targetId, `Updated material ${name}`);
    return {
      ...existing,
      id: targetId,
      name,
      category,
      uom,
      forecastQty,
      currentStockQty,
      safetyStockQty,
      standardCost,
      supplierId,
      lastUpdated: now,
    };
  },

  async deleteMaterial(id: string, userId = "SYS") {
    const db = await getRelationalDB();
    const existing = await queryOne(db, `SELECT * FROM materials WHERE id = ?`, [id]);
    if (!existing) throw new Error("Material not found");
    const refs = await Promise.all([
      queryOne(db, `SELECT id FROM pr_line_items WHERE material_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM rfq_line_items WHERE material_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM quotation_line_items WHERE material_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM po_line_items WHERE material_id = ? LIMIT 1`, [id]),
      queryOne(db, `SELECT id FROM invoice_line_items WHERE material_id = ? LIMIT 1`, [id]),
    ]);
    if (refs.some(Boolean)) throw new Error("Material is referenced by existing transactions and cannot be deleted. Update or archive the record instead.");
    await executeAndPersist(db, `DELETE FROM materials WHERE id = ?`, [id]);
    await this.addAuditLog(userId, "User", "system", "DELETE", "materials", id);
    return true;
  },

  // 4. Purchase Requisitions
  // 4. Purchase Requisitions (Relational Master-Detail: purchase_requisitions (1) -> (N) pr_line_items)
  async getPRs() {
    const db = await getRelationalDB();
    const prRows = await queryAll(db, `SELECT * FROM purchase_requisitions ORDER BY created_at DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM pr_line_items`);

    return prRows.map((pr) => {
      const items = lineItemRows
        .filter((item) => item.pr_id === pr.id)
        .map((item) => ({
          id: item.id,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          uom: item.uom,
          quantity: Number(item.quantity || 0),
          estimatedUnitPrice: item.estimated_unit_price,
        }));

      return {
        id: pr.id,
        creatorId: pr.creator_id,
        creatorName: pr.creator_name,
        requestDate: pr.request_date,
        requiredDeliveryDate: pr.required_delivery_date,
        status: pr.status,
        totalEstimatedCost: pr.total_estimated_cost,
        rfqId: pr.rfq_id,
        items,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
      };
    });
  },

  async createPR(pr: any) {
    const db = await getRelationalDB();
    const existing = await queryAll(db, `SELECT id FROM purchase_requisitions`);
    const existingIds = new Set(existing.map((e) => e.id));

    let id = pr.id;
    if (!id || existingIds.has(id)) {
      const count = existing.length + 1;
      const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
      id = `PR-2026-${pad}`;
      while (existingIds.has(id)) {
        id = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
      }
    }
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const creatorId = await resolveUserId(db, pr.creatorId, "planner");
    const creatorName = pr.creatorName || "John Planner";
    const status = pr.status || "Submitted";
    const totalCost = pr.totalEstimatedCost || (Array.isArray(pr.items) ? pr.items.reduce((sum: number, i: any) => sum + (i.quantity || 0) * (i.estimatedUnitPrice || 0), 0) : 0);

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO purchase_requisitions (id, creator_id, creator_name, request_date, required_delivery_date, status, total_estimated_cost, rfq_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, creatorId, creatorName, pr.requestDate || now.substring(0, 10), pr.requiredDeliveryDate || "2026-08-30", status, totalCost, pr.rfqId || null, now, now]
      );

      const items: any[] = [];
      if (Array.isArray(pr.items)) {
        await Promise.all(pr.items.map(async (item: any, idx: number) => {
          const itemId = `pr-item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          const lineTotal = (item.quantity || 0) * (item.estimatedUnitPrice || 0);
          await executeSql(
            db,
            `INSERT INTO pr_line_items (id, pr_id, material_id, material_code, material_name, uom, quantity, estimated_unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.materialId, item.materialCode || item.materialId, item.materialName || "Material", item.uom || "PCS", item.quantity || 0, item.estimatedUnitPrice || 0, lineTotal]
          );
          items.push({
            id: itemId,
            materialId: item.materialId,
            materialCode: item.materialCode || item.materialId,
            materialName: item.materialName || "Material",
            uom: item.uom || "PCS",
            quantity: item.quantity || 0,
            estimatedUnitPrice: item.estimatedUnitPrice || 0,
          });
        }))
      }

      await this.addAuditLog(creatorId, creatorName, "planner", "CREATE", "purchase_requisitions", id, `Created Requisition. Status: ${status}. Total: $${totalCost}`);
      return {
        id,
        creatorId,
        creatorName,
        requestDate: pr.requestDate || now.substring(0, 10),
        requiredDeliveryDate: pr.requiredDeliveryDate || "2026-08-30",
        status,
        totalEstimatedCost: totalCost,
        rfqId: pr.rfqId || null,
        items,
        createdAt: now,
        updatedAt: now,
      };
    });
  },

  async updatePR(id: string, pr: any, userId = "SYS") {
    const db = await getRelationalDB();
    const existingPR = await queryOne(db, `SELECT * FROM purchase_requisitions WHERE id = ?`, [id]);
    if (!existingPR) throw new Error("Purchase Requisition not found");
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    const status = pr.status || existingPR.status || "Draft";
    const requiredDeliveryDate = pr.requiredDeliveryDate || existingPR.required_delivery_date;
    const totalEstimatedCost = typeof pr.totalEstimatedCost === "number" ? pr.totalEstimatedCost : existingPR.total_estimated_cost;

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `UPDATE purchase_requisitions SET status = ?, required_delivery_date = ?, total_estimated_cost = ?, updated_at = ? WHERE id = ?`,
        [status, requiredDeliveryDate, totalEstimatedCost, now, id]
      );

      if (Array.isArray(pr.items) && pr.items.length > 0) {
        await executeSql(db, `DELETE FROM pr_line_items WHERE pr_id = ?`, [id]);
        await Promise.all(pr.items.map(async (item: any, idx: number) => {
          const itemId = `pr-item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          const lineTotal = (item.quantity || 0) * (item.estimatedUnitPrice || 0);
          await executeSql(
            db,
            `INSERT INTO pr_line_items (id, pr_id, material_id, material_code, material_name, uom, quantity, estimated_unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.materialId, item.materialCode || item.materialId, item.materialName || "Material", item.uom || "PCS", item.quantity || 0, item.estimatedUnitPrice || 0, lineTotal]
          );
        }))
      }

      await this.addAuditLog(userId, "Planner User", "planner", "UPDATE", "purchase_requisitions", id, `Updated PR ${id}. Status: ${status}`);
      return { ...pr, id, status, requiredDeliveryDate, totalEstimatedCost, updatedAt: now };
    });
  },

  async deletePR(id: string, userId = "SYS") {
    const db = await getRelationalDB();
    return await runTransaction(db, async () => {
      await executeSql(db, `DELETE FROM rfq_pr_links WHERE pr_id = ?`, [id]);
      await executeSql(db, `DELETE FROM pr_line_items WHERE pr_id = ?`, [id]);
      await executeSql(db, `DELETE FROM purchase_requisitions WHERE id = ?`, [id]);
      await this.addAuditLog(userId, "Planner User", "planner", "DELETE", "purchase_requisitions", id);
      return true;
    });
  },

  // 5. RFQs & Grouping (Relational: rfqs (1) -> (N) rfq_line_items, rfqs (1) -> (N) rfq_pr_links, rfqs (1) -> (N) rfq_invited_vendors)
  async getRFQs(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const rfqRows = vendorId
      ? await queryAll(db, `SELECT DISTINCT r.* FROM rfqs r JOIN rfq_invited_vendors iv ON iv.rfq_id = r.id WHERE iv.vendor_id = ? ORDER BY r.created_at DESC`, [vendorId])
      : await queryAll(db, `SELECT * FROM rfqs ORDER BY created_at DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM rfq_line_items`);
    const prLinkRows = await queryAll(db, `SELECT * FROM rfq_pr_links`);
    const invitedRows = await queryAll(db, `SELECT * FROM rfq_invited_vendors`);

    return rfqRows.map((r) => {
      const items = lineItemRows
        .filter((item) => item.rfq_id === r.id)
        .map((item) => ({
          id: item.id,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          uom: item.uom,
          quantity: Number(item.quantity || 0),
          targetPrice: item.target_price,
        }));

      const prIds = prLinkRows.filter((link) => link.rfq_id === r.id).map((link) => link.pr_id);
      const invitedVendorIds = invitedRows.filter((inv) => inv.rfq_id === r.id).map((inv) => inv.vendor_id);

      return {
        id: r.id,
        title: r.title,
        createdById: r.created_by_id,
        createdByName: r.created_by_name,
        issueDate: r.issue_date,
        dueDate: r.due_date,
        status: r.status,
        winningQuotationId: r.winning_quotation_id,
        items,
        prIds,
        invitedVendorIds,
        createdAt: r.created_at,
      };
    });
  },

  async groupPRsToRFQ(payload: {
    prIds: string[];
    title: string;
    createdById: string;
    createdByName: string;
    dueDate?: string;
    invitedVendorIds?: string[];
  }) {
    const db = await getRelationalDB();
    if (!Array.isArray(payload.prIds) || payload.prIds.length === 0) {
      throw new Error("Select at least one submitted Purchase Requisition");
    }
    const selectedPRs = await queryAll(
      db,
      `SELECT id, status FROM purchase_requisitions WHERE id IN (${payload.prIds.map(() => "?").join(",")})`,
      payload.prIds
    );
    if (selectedPRs.length !== payload.prIds.length) throw new Error("One or more selected Purchase Requisitions no longer exist");
    const unavailable = selectedPRs.find((pr) => pr.status !== "Submitted");
    if (unavailable) throw new Error(`Purchase Requisition ${unavailable.id} is ${unavailable.status} and cannot be added to a new RFQ`);
    const existing = await queryAll(db, `SELECT id FROM rfqs`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const id = `RFQ-2026-${pad}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const today = new Date().toISOString().substring(0, 10);
    const dueDate = payload.dueDate || "2026-08-30";
    const invited = payload.invitedVendorIds && payload.invitedVendorIds.length > 0 ? payload.invitedVendorIds : ["VEND-001", "VEND-002", "VEND-003"];
    const createdById = await resolveUserId(db, payload.createdById, "sourcing");
    const createdByName = payload.createdByName || "Sarah Sourcing";

    // Fetch material items from selected PRs
    const prItemRows = await queryAll(
      db,
      `SELECT * FROM pr_line_items WHERE pr_id IN (${payload.prIds.map(() => "?").join(",")})`,
      payload.prIds
    );

    const consolidatedMap: { [matId: string]: any } = {};
    prItemRows.forEach((item) => {
      if (!consolidatedMap[item.material_id]) {
        consolidatedMap[item.material_id] = {
          id: `rfq-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          uom: item.uom,
          quantity: 0,
          targetPrice: item.estimated_unit_price,
        };
      }
      consolidatedMap[item.material_id].quantity += Number(item.quantity || 0);
    });

    return await runTransaction(db, async () => {
      // 1. Insert RFQ Master
      await executeSql(
        db,
        `INSERT INTO rfqs (id, title, created_by_id, created_by_name, issue_date, due_date, status, winning_quotation_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, payload.title || `Consolidated RFQ for PRs (${payload.prIds.join(", ")})`, createdById, createdByName, today, dueDate, "Published", null, now]
      );

      // 2. Insert RFQ Links
      await Promise.all(payload.prIds.map(async (prId) => {
        await executeSql(db, `INSERT INTO rfq_pr_links (rfq_id, pr_id) VALUES (?, ?)`, [id, prId]);
        await executeSql(db, `UPDATE purchase_requisitions SET status = 'Processed', rfq_id = ? WHERE id = ?`, [id, prId]);
      }))

      // 3. Insert RFQ Line Items
      await Promise.all(Object.values(consolidatedMap).map(async (item) => {
        await executeSql(
          db,
          `INSERT INTO rfq_line_items (id, rfq_id, material_id, material_code, material_name, uom, quantity, target_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, id, item.materialId, item.materialCode, item.materialName, item.uom, item.quantity, item.targetPrice]
        );
      }))

      // 4. Insert Invited Vendors
      await Promise.all(invited.map(async (vendorId) => {
        const vId = await resolveSupplierId(db, vendorId);
        await executeSql(db, `INSERT INTO rfq_invited_vendors (rfq_id, vendor_id) VALUES (?, ?)`, [id, vId]);
      }))

      await this.addAuditLog(createdById, createdByName, "sourcing", "CREATE", "rfqs", id, `Grouped PRs: ${payload.prIds.join(", ")}`);

      return {
        id,
        title: payload.title,
        prIds: payload.prIds,
        createdById,
        createdByName,
        issueDate: today,
        dueDate,
        status: "Published",
        invitedVendorIds: invited,
        items: Object.values(consolidatedMap),
        createdAt: now,
      };
    });
  },

  // 6. Vendor Quotations (Relational: vendor_quotations (1) -> (N) quotation_line_items)
  async getQuotations(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const quotRows = vendorId ? await queryAll(db, `SELECT * FROM vendor_quotations WHERE vendor_id = ? ORDER BY submission_date DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM vendor_quotations ORDER BY submission_date DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM quotation_line_items`);

    return quotRows.map((q) => {
      const items = lineItemRows
        .filter((item) => item.quotation_id === q.id)
        .map((item) => ({
          materialId: item.material_id,
          unitPrice: Number(item.unit_price || 0),
          leadTimeDays: item.lead_time_days,
          lineTotal: Number(item.line_total || 0),
        }));

      return {
        id: q.id,
        rfqId: q.rfq_id,
        vendorId: q.vendor_id,
        vendorName: q.vendor_name,
        submissionDate: q.submission_date,
        validUntil: q.valid_until,
        currency: q.currency,
        leadTimeDays: Number(q.lead_time_days || 0),
        totalAmount: Number(q.total_amount || 0),
        costScore: Number(q.cost_score || 0),
        qualityScore: Number(q.quality_score || 0),
        deliveryScore: Number(q.delivery_score || 0),
        totalScore: Number(q.total_score || 0),
        status: q.status,
        notes: q.notes,
        items,
      };
    });
  },

  async createQuotation(quot: any, actorUserId?: string, actorRole?: string) {
    const db = await getRelationalDB();
    const rfq = await queryOne(db, `SELECT id, status FROM rfqs WHERE id = ?`, [quot.rfqId]);
    if (!rfq) throw new Error("RFQ not found");
    if (!["Published", "Under Review"].includes(rfq.status)) throw new Error(`RFQ is ${rfq.status} and is not open for quotations`);
    if (actorRole === "vendor") {
      const actor = await queryOne(db, `SELECT vendor_id FROM users WHERE id = ? AND active = 1`, [actorUserId]);
      if (!actor?.vendor_id) throw new Error("Vendor account is not linked to a supplier");
      const invited = await queryOne(db, `SELECT 1 AS allowed FROM rfq_invited_vendors WHERE rfq_id = ? AND vendor_id = ?`, [quot.rfqId, actor.vendor_id]);
      if (!invited) throw new Error("This supplier was not invited to this RFQ");
      quot = { ...quot, vendorId: actor.vendor_id };
    }
    const existing = await queryAll(db, `SELECT id FROM vendor_quotations`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const id = `QUOT-2026-${pad}`;
    const today = new Date().toISOString().substring(0, 10);
    const vendorId = await resolveSupplierId(db, quot.vendorId);
    const supp = await queryOne(db, `SELECT * FROM suppliers WHERE id = ?`, [vendorId]);
    const vendorName = quot.vendorName || supp?.name || "Supplier";
    if (!supp) throw new Error("Supplier not found");
    const duplicate = await queryOne(db, `SELECT id FROM vendor_quotations WHERE rfq_id = ? AND vendor_id = ?`, [quot.rfqId, vendorId]);
    if (duplicate) throw new Error("This supplier has already submitted a quotation for this RFQ");

    const costScore = quot.costScore || Math.floor(80 + Math.random() * 15);
    const qualityScore = quot.qualityScore || Math.floor(85 + Math.random() * 12);
    const deliveryScore = quot.deliveryScore || Math.floor(80 + Math.random() * 15);
    const totalScore = Math.round((costScore + qualityScore + deliveryScore) / 3);

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO vendor_quotations (id, rfq_id, vendor_id, vendor_name, submission_date, valid_until, currency, lead_time_days, total_amount, cost_score, quality_score, delivery_score, total_score, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, quot.rfqId, vendorId, vendorName, today, quot.validUntil || "2026-09-15", quot.currency || "USD", quot.leadTimeDays || 14, quot.totalAmount || 0, costScore, qualityScore, deliveryScore, totalScore, "Submitted", quot.notes || null]
      );

      if (Array.isArray(quot.items)) {
        await Promise.all(quot.items.map(async (item: any, idx: number) => {
          const itemId = `qitem-${Date.now()}-${idx}`;
          await executeSql(
            db,
            `INSERT INTO quotation_line_items (id, quotation_id, material_id, unit_price, lead_time_days, line_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.materialId, item.unitPrice, item.leadTimeDays || 14, item.lineTotal || 0]
          );
        }))
      }

      await executeSql(db, `UPDATE rfqs SET status = 'Under Review' WHERE id = ? AND status = 'Published'`, [quot.rfqId]);

      await this.addAuditLog(vendorId, vendorName, "vendor", "CREATE", "vendor_quotations", id, `Amount: $${quot.totalAmount}`);
      return { ...quot, id, vendorId, vendorName, submissionDate: today, costScore, qualityScore, deliveryScore, totalScore, status: "Submitted" };
    });
  },

  async selectWinningQuotation(quotId: string, userId = "SYS") {
    const db = await getRelationalDB();
    const quot = await queryOne(db, `SELECT * FROM vendor_quotations WHERE id = ?`, [quotId]);
    if (!quot) throw new Error("Quotation not found");

    return await runTransaction(db, async () => {
      await executeSql(db, `UPDATE vendor_quotations SET status = 'Rejected' WHERE rfq_id = ?`, [quot.rfq_id]);
      await executeSql(db, `UPDATE vendor_quotations SET status = 'Accepted' WHERE id = ?`, [quotId]);
      await executeSql(db, `UPDATE rfqs SET status = 'Awarded', winning_quotation_id = ? WHERE id = ?`, [quotId, quot.rfq_id]);
      await this.addAuditLog(userId, "Sarah Sourcing", "sourcing", "UPDATE", "vendor_quotations", quotId, `Awarded quotation to ${quot.vendor_name}`);
      return { success: true };
    });
  },

  // 7. Purchase Orders (Relational: purchase_orders (1) -> (N) po_line_items, purchase_orders (1) -> (N) po_approval_history)
  async getPOs(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const poRows = vendorId ? await queryAll(db, `SELECT * FROM purchase_orders WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM purchase_orders ORDER BY created_at DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM po_line_items`);

    return poRows.map((po) => {
      const items = lineItemRows
        .filter((item) => item.po_id === po.id)
        .map((item) => ({
          id: item.id,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          uom: item.uom,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unit_price || 0),
          taxRatePercent: Number(item.tax_rate_percent || 0),
          taxAmount: Number(item.tax_amount || 0),
          lineTotal: Number(item.line_total || 0),
        }));

      return {
        id: po.id,
        quotationId: po.quotation_id,
        rfqId: po.rfq_id,
        vendorId: po.vendor_id,
        vendorName: po.vendor_name,
        createdById: po.created_by_id,
        createdByName: po.created_by_name,
        issueDate: po.issue_date,
        paymentTerms: po.payment_terms,
        currency: po.currency,
        subtotal: Number(po.subtotal || 0),
        taxAmount: Number(po.tax_amount || 0),
        grandTotal: Number(po.grand_total || 0),
        status: po.status,
        managerComments: po.manager_comments,
        vendorAcceptedDate: po.vendor_accepted_date,
        items,
        createdAt: po.created_at,
        updatedAt: po.updated_at,
      };
    });
  },

  async convertQuotationToPO(payload: { quotationId: string; createdById: string; createdByName: string; taxRatePercent?: number }) {
    const db = await getRelationalDB();
    const quot = await queryOne(db, `SELECT * FROM vendor_quotations WHERE id = ?`, [payload.quotationId]);
    if (!quot) throw new Error("Quotation not found");
    if (quot.status !== "Accepted") throw new Error("Only the accepted quotation can be converted into a Purchase Order");
    const existingPO = await queryOne(db, `SELECT id FROM purchase_orders WHERE quotation_id = ?`, [payload.quotationId]);
    if (existingPO) throw new Error(`Purchase Order ${existingPO.id} has already been created from this quotation`);

    const quotItems = await queryAll(db, `SELECT * FROM quotation_line_items WHERE quotation_id = ?`, [payload.quotationId]);
    const rfqItems = await queryAll(db, `SELECT * FROM rfq_line_items WHERE rfq_id = ?`, [quot.rfq_id]);
    const materials = await queryAll(db, `SELECT * FROM materials`);
    const supplier = await queryOne(db, `SELECT * FROM suppliers WHERE id = ?`, [quot.vendor_id]);

    const taxRate = typeof payload.taxRatePercent === "number" ? payload.taxRatePercent : 10;
    const existing = await queryAll(db, `SELECT id FROM purchase_orders`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const poId = `PO-2026-${pad}`;
    const today = new Date().toISOString().substring(0, 10);
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const createdById = await resolveUserId(db, payload.createdById, "sourcing");
    const createdByName = payload.createdByName || "Sarah Sourcing";

    let subtotal = 0;
    let taxAmountTotal = 0;

    const poItems = quotItems.map((qItem, idx) => {
      const mat = materials.find((m) => m.id === qItem.material_id) || { material_code: qItem.material_id, name: "Material", uom: "PCS" };
      const rItem = rfqItems.find((r) => r.material_id === qItem.material_id);
      const qty = rItem ? rItem.quantity : 1000;
      const lineSub = qty * qItem.unit_price;
      const lineTax = lineSub * (taxRate / 100);
      const lineTot = lineSub + lineTax;

      subtotal += lineSub;
      taxAmountTotal += lineTax;

      return {
        id: `po-item-${Date.now()}-${idx}`,
        materialId: qItem.material_id,
        materialCode: mat.material_code,
        materialName: mat.name,
        uom: mat.uom,
        quantity: qty,
        unitPrice: qItem.unit_price,
        taxRatePercent: taxRate,
        taxAmount: lineTax,
        lineTotal: lineTot,
      };
    });

    const grandTotal = subtotal + taxAmountTotal;

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO purchase_orders (id, quotation_id, rfq_id, vendor_id, vendor_name, created_by_id, created_by_name, issue_date, payment_terms, currency, subtotal, tax_amount, grand_total, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [poId, quot.id, quot.rfq_id, quot.vendor_id, quot.vendor_name, createdById, createdByName, today, supplier?.payment_terms || "Net 30", quot.currency || "USD", subtotal, taxAmountTotal, grandTotal, "Pending Approval", now, now]
      );

      await Promise.all(poItems.map(async (item) => {
        await executeSql(
          db,
          `INSERT INTO po_line_items (id, po_id, material_id, material_code, material_name, uom, quantity, unit_price, tax_rate_percent, tax_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, poId, item.materialId, item.materialCode, item.materialName, item.uom, item.quantity, item.unitPrice, item.taxRatePercent, item.taxAmount, item.lineTotal]
        );
      }))

      // Update Quotation and RFQ lifecycle status so they disappear from pending conversion queue
      await executeSql(db, `UPDATE vendor_quotations SET status = 'PO Generated' WHERE id = ?`, [quot.id]);
      if (quot.rfq_id) {
        await executeSql(db, `UPDATE rfqs SET status = 'Awarded & PO Issued' WHERE id = ?`, [quot.rfq_id]);
      }

      await this.addAuditLog(createdById, createdByName, "sourcing", "CREATE", "purchase_orders", poId, `Converted from ${quot.id}. Total: $${grandTotal}`);

      return {
        id: poId,
        quotationId: quot.id,
        rfqId: quot.rfq_id,
        vendorId: quot.vendor_id,
        vendorName: quot.vendor_name,
        createdById,
        createdByName,
        issueDate: today,
        paymentTerms: supplier?.payment_terms || "Net 30",
        currency: quot.currency || "USD",
        subtotal,
        taxAmount: taxAmountTotal,
        grandTotal,
        status: "Pending Approval",
        items: poItems,
        createdAt: now,
        updatedAt: now,
      };
    });
  },

  async approvePO(poId: string, payload: { decision: "Approved" | "Rejected"; comments: string; approverId: string; approverName: string }) {
    const db = await getRelationalDB();
    const po = await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [poId]);
    if (!po) throw new Error("PO not found");
    if (String(po.status).trim() !== "Pending Approval") {
      throw new Error(`PO ${poId} is already ${po.status}. Only Pending Approval POs can be approved or rejected.`);
    }
    if (payload.decision === "Rejected" && !String(payload.comments || "").trim()) {
      throw new Error("Manager comments are required when rejecting a Purchase Order");
    }

    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const apprId = `appr-${Date.now()}`;
    const approverId = await resolveUserId(db, payload.approverId, "manager");
    const approverName = payload.approverName || "Michael Manager";

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `UPDATE purchase_orders SET status = ?, manager_comments = ?, updated_at = ? WHERE id = ?`,
        [payload.decision === "Approved" ? "Approved" : "Rejected", payload.comments || "", now, poId]
      );

      await executeSql(
        db,
        `INSERT INTO po_approval_history (id, po_id, approver_id, approver_name, decision, comments, decision_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [apprId, poId, approverId, approverName, payload.decision, payload.comments || "", now]
      );

      await this.addAuditLog(approverId, approverName, "manager", payload.decision.toUpperCase(), "purchase_orders", poId, `Decision: ${payload.decision}, Comments: ${payload.comments}`);

      return {
        success: true,
        approvalRecord: {
          id: apprId,
          poId,
          approverId,
          approverName,
          decision: payload.decision,
          comments: payload.comments,
          decisionDate: now,
        },
      };
    });
  },

  async acceptPO(poId: string, actorUserId?: string, actorRole?: string) {
    const db = await getRelationalDB();
    const po = await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [poId]);
    if (!po) throw new Error("Purchase Order not found");
    if (actorRole === "vendor") {
      const actor = await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [actorUserId]);
      if (!actor?.vendor_id || actor.vendor_id !== po.vendor_id) throw new Error("Vendor cannot accept another vendor's PO");
    }
    if (po.status !== "Approved") throw new Error(`Vendor can accept a PO only after Manager approval. Current status: ${po.status}`);
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    await executeAndPersist(db, `UPDATE purchase_orders SET status = 'Confirmed', vendor_accepted_date = ?, updated_at = ? WHERE id = ?`, [now, now, poId]);
    await this.addAuditLog(actorUserId || po.vendor_id, po.vendor_name, actorRole || "vendor", "UPDATE", "purchase_orders", poId, "Vendor confirmed Purchase Order");
    return { success: true, po: { ...po, status: "Confirmed", vendorAcceptedDate: now } };
  },

  // 8. Goods Receipts (Relational: goods_receipts (1) -> (N) goods_receipt_line_items)
  async getGoodsReceipts(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const grRows = vendorId ? await queryAll(db, `SELECT * FROM goods_receipts WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM goods_receipts ORDER BY created_at DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM goods_receipt_line_items`);

    return grRows.map((gr) => {
      const items = lineItemRows
        .filter((item) => item.goods_receipt_id === gr.id)
        .map((item) => ({
          id: item.id,
          poDetailId: item.po_detail_id,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          uom: item.uom,
          orderedQty: item.ordered_qty,
          receivedQty: item.received_qty,
          rejectedQty: item.rejected_qty,
          defectReason: item.defect_reason,
        }));

      return {
        id: gr.id,
        poId: gr.po_id,
        vendorId: gr.vendor_id,
        vendorName: gr.vendor_name,
        receivedByUserId: gr.received_by_user_id,
        receivedByUserName: gr.received_by_user_name,
        receiptDate: gr.receipt_date,
        hasDiscrepancy: Boolean(gr.has_discrepancy),
        notes: gr.notes,
        items,
        createdAt: gr.created_at,
      };
    });
  },

  async createGoodsReceipt(gr: any) {
    const db = await getRelationalDB();
    if (!gr.poId || !Array.isArray(gr.items) || gr.items.length === 0) throw new Error("A Purchase Order and at least one receipt line are required");
    const existing = await queryAll(db, `SELECT id FROM goods_receipts`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const id = `GR-2026-${pad}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const today = gr.receiptDate || new Date().toISOString().substring(0, 10);
    const receivedByUserId = await resolveUserId(db, gr.receivedByUserId, "warehouse");
    const receivedByUserName = gr.receivedByUserName || "Wayne Warehouse";

    const po = gr.poId ? await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [gr.poId]) : null;
    if (!po) throw new Error("Purchase Order not found");
    const shipment = await queryOne(db, `SELECT id FROM shipments WHERE po_id = ? AND status IN ('Shipped', 'Delivered') LIMIT 1`, [gr.poId]);
    if (!["Shipped", "Partially Received"].includes(po.status) && !shipment) throw new Error(`Goods receipt requires a shipped Purchase Order. Current status: ${po.status}`);
    const vendorId = gr.vendorId || po?.vendor_id || "VEND-001";
    const vendorName = gr.vendorName || po?.vendor_name || "Supplier";

    let hasDiscrepancy = false;
    let totalRejected = 0;

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO goods_receipts (id, po_id, vendor_id, vendor_name, received_by_user_id, received_by_user_name, receipt_date, has_discrepancy, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, gr.poId, vendorId, vendorName, receivedByUserId, receivedByUserName, today, 0, gr.notes || null, now]
      );

      if (Array.isArray(gr.items)) {
        await Promise.all(gr.items.map(async (item: any, idx: number) => {
          const itemId = `gr-item-${Date.now()}-${idx}`;
          const rejectedQty = Number(item.rejectedQty) || 0;
          const receivedQty = Number(item.receivedQty) || 0;
          const orderedQty = Number(item.orderedQty) || (receivedQty + rejectedQty);
          totalRejected += rejectedQty;

          await executeSql(
            db,
            `INSERT INTO goods_receipt_line_items (id, goods_receipt_id, po_detail_id, material_id, material_code, material_name, uom, ordered_qty, received_qty, rejected_qty, defect_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.poDetailId || null, item.materialId, item.materialCode, item.materialName, item.uom, orderedQty, receivedQty, rejectedQty, item.defectReason || null]
          );

          // Update stock in Material Master
          await executeSql(
            db,
            `UPDATE materials SET current_stock_qty = current_stock_qty + ?, last_updated = ? WHERE id = ? OR material_code = ?`,
            [receivedQty, today, item.materialId, item.materialCode || item.materialId]
          );

          // Auto-generate Discrepancy Ticket if defect/rejected
          if (rejectedQty > 0) {
            hasDiscrepancy = true;
            const discId = `DISC-2026-${Math.floor(100 + Math.random() * 900)}`;
            await executeSql(
              db,
              `INSERT INTO discrepancy_tickets (id, source_type, source_id, po_id, vendor_id, vendor_name, material_id, material_code, issue_type, description, status, reported_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [discId, "Goods Receipt", id, gr.poId, vendorId, vendorName, item.materialId, item.materialCode, "Damaged Items", `Rejected ${rejectedQty} ${item.uom} of ${item.materialName}. Reason: ${item.defectReason || "Defective material"}`, "Open", receivedByUserName, now, now]
            );
          }
        }))
      }

      if (hasDiscrepancy) {
        await executeSql(db, `UPDATE goods_receipts SET has_discrepancy = 1 WHERE id = ?`, [id]);
      }

      // Update PO Status
      if (gr.poId) {
        await executeSql(
          db,
          `UPDATE purchase_orders SET status = ? WHERE id = ?`,
          [totalRejected > 0 ? "Partially Received" : "Completed", gr.poId]
        );
      }

      await this.addAuditLog(receivedByUserId, receivedByUserName, "warehouse", "POST", "goods_receipts", id, `Posted GR (Rejected: ${totalRejected})`);

      return { ...gr, id, vendorId, vendorName, hasDiscrepancy, createdAt: now };
    });
  },

  // 9. Invoices & 3-Way Match (Relational: invoices (1) -> (N) invoice_line_items)
  async getInvoices(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const invRows = vendorId ? await queryAll(db, `SELECT * FROM invoices WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM invoices ORDER BY created_at DESC`);
    const lineItemRows = await queryAll(db, `SELECT * FROM invoice_line_items`);

    return invRows.map((inv) => {
      const items = lineItemRows
        .filter((item) => item.invoice_id === inv.id)
        .map((item) => ({
          id: item.id,
          materialId: item.material_id,
          materialCode: item.material_code,
          materialName: item.material_name,
          invoicedQty: Number(item.invoiced_qty || 0),
          unitPrice: Number(item.unit_price || 0),
          taxAmount: Number(item.tax_amount || 0),
          lineTotal: Number(item.line_total || 0),
        }));

      return {
        id: inv.id,
        vendorInvoiceNumber: inv.vendor_invoice_number,
        poId: inv.po_id,
        vendorId: inv.vendor_id,
        vendorName: inv.vendor_name,
        invoiceDate: inv.invoice_date,
        currency: inv.currency,
        subtotal: Number(inv.subtotal || 0),
        taxAmount: Number(inv.tax_amount || 0),
        grandTotal: Number(inv.grand_total || 0),
        attachmentUrl: inv.attachment_url,
        status: inv.status,
        matchStatus: inv.match_status,
        verifiedBy: inv.verified_by,
        verifiedDate: inv.verified_date,
        items,
        createdAt: inv.created_at,
      };
    });
  },

  async createInvoice(inv: any, actorUserId?: string, actorRole?: string) {
    const db = await getRelationalDB();
    if (actorRole === "vendor") {
      const actor = await queryOne(db, `SELECT vendor_id FROM users WHERE id = ? AND active = 1`, [actorUserId]);
      if (!actor?.vendor_id) throw new Error("Vendor account is not linked to a supplier");
      const supplier = await queryOne(db, `SELECT name FROM suppliers WHERE id = ?`, [actor.vendor_id]);
      inv = { ...inv, vendorId: actor.vendor_id, vendorName: supplier?.name || inv.vendorName };
      const po = await queryOne(db, `SELECT id FROM purchase_orders WHERE id = ? AND vendor_id = ?`, [inv.poId, actor.vendor_id]);
      if (!po) throw new Error("Vendor cannot invoice this Purchase Order");
    }
    const existing = await queryAll(db, `SELECT id FROM invoices`);
    let nextNum = existing.length + 1;
    let id = `INV-2026-${String(nextNum).padStart(3, "0")}`;
    while (await queryOne(db, `SELECT id FROM invoices WHERE id = ?`, [id])) {
      nextNum++;
      id = `INV-2026-${String(nextNum).padStart(3, "0")}`;
    }
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    const po = inv.poId ? await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [inv.poId]) : null;
    const fallbackSupplier = await queryOne(db, `SELECT * FROM suppliers LIMIT 1`);

    const vendorId = inv.vendorId || (po ? po.vendor_id : fallbackSupplier ? fallbackSupplier.id : "VEND-001");
    const vendorName = inv.vendorName || (po ? po.vendor_name : fallbackSupplier ? fallbackSupplier.name : "Supplier");
    const vendorInvoiceNumber = inv.vendorInvoiceNumber || inv.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const duplicate = await queryOne(db, `SELECT id FROM invoices WHERE vendor_id = ? AND vendor_invoice_number = ?`, [vendorId, vendorInvoiceNumber]);
    if (duplicate) throw new Error(`Vendor invoice number ${vendorInvoiceNumber} has already been submitted`);
    const invoiceDate = inv.invoiceDate || now.substring(0, 10);
    const currency = inv.currency || (po ? po.currency : "USD");
    const grandTotal = Number(inv.grandTotal || inv.totalAmount || (po ? po.grand_total : 0));
    const taxAmount = Number(inv.taxAmount !== undefined ? inv.taxAmount : (po ? po.tax_amount : 0));
    const subtotal = Number(inv.subtotal || (grandTotal - taxAmount) || (po ? po.subtotal : grandTotal));
    const attachmentUrl = inv.attachmentUrl || "/uploads/invoice_e_doc.pdf";

    let lineItems = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : [];
    if (lineItems.length === 0 && inv.poId) {
      const poItems = await queryAll(db, `SELECT * FROM po_line_items WHERE po_id = ?`, [inv.poId]);
      lineItems = poItems.map((pItem) => ({
        materialId: pItem.material_id,
        materialCode: pItem.material_code,
        materialName: pItem.material_name,
        invoicedQty: pItem.quantity,
        unitPrice: pItem.unit_price,
        taxAmount: pItem.tax_amount,
        lineTotal: pItem.line_total,
      }));
    }

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO invoices (id, vendor_invoice_number, po_id, vendor_id, vendor_name, invoice_date, currency, subtotal, tax_amount, grand_total, attachment_url, status, match_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, vendorInvoiceNumber, inv.poId || (po ? po.id : "PO-2026-001"), vendorId, vendorName, invoiceDate, currency, subtotal, taxAmount, grandTotal, attachmentUrl, "Submitted", "Pending Match", now]
      );

      if (lineItems.length > 0) {
        await Promise.all(lineItems.map(async (item: any, idx: number) => {
          const itemId = `inv-item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          await executeSql(
            db,
            `INSERT INTO invoice_line_items (id, invoice_id, material_id, material_code, material_name, invoiced_qty, unit_price, tax_amount, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.materialId, item.materialCode || item.materialId, item.materialName || "Material", item.invoicedQty || item.quantity || 1, item.unitPrice || 0, item.taxAmount || 0, item.lineTotal || 0]
          );
        }))
      }

      await this.addAuditLog(vendorId, vendorName, "vendor", "CREATE", "invoices", id, `Invoice #${vendorInvoiceNumber} submitted. Grand Total: $${grandTotal}`);

      return {
        id,
        vendorInvoiceNumber,
        poId: inv.poId || (po ? po.id : ""),
        vendorId,
        vendorName,
        invoiceDate,
        currency,
        subtotal,
        taxAmount,
        grandTotal,
        attachmentUrl,
        status: "Submitted",
        matchStatus: "Pending Match",
        items: lineItems,
        createdAt: now,
      };
    });
  },

  async deleteInvoice(id: string, actorUserId?: string, actorRole?: string) {
    const db = await getRelationalDB();
    const inv = await queryOne(db, `SELECT * FROM invoices WHERE id = ?`, [id]);
    if (!inv) return { success: false, error: "Invoice not found" };
    if (actorRole === "vendor") {
      const actor = await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [actorUserId]);
      if (!actor?.vendor_id || actor.vendor_id !== inv.vendor_id) throw new Error("Vendor cannot delete another vendor's invoice");
    }
    if (["Verified", "Paid"].includes(inv.status)) throw new Error("Verified or paid invoices cannot be deleted");

    return await runTransaction(db, async () => {
      await executeSql(db, `DELETE FROM payments WHERE invoice_id = ?`, [id]);
      await executeSql(db, `DELETE FROM invoice_line_items WHERE invoice_id = ?`, [id]);
      await executeSql(db, `DELETE FROM invoices WHERE id = ?`, [id]);
      await this.addAuditLog(inv.vendor_id || "VEND", inv.vendor_name || "Vendor", "vendor", "DELETE", "invoices", id, `Deleted Invoice ${inv.vendor_invoice_number || id}`);
      return { success: true };
    });
  },

  async verify3WayMatch(invId: string, payload: { verifiedBy: string; raisesDiscrepancy: boolean; discrepancyNote?: string }, actorUserId = "usr-105", actorRole = "accountant") {
    const db = await getRelationalDB();
    const inv = await queryOne(db, `SELECT * FROM invoices WHERE id = ? OR po_id = ? OR vendor_invoice_number = ?`, [invId, invId, invId]);
    if (!inv) throw new Error("Invoice not found");

    const actualInvId = inv.id;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    if (!["Submitted", "Discrepancy"].includes(inv.status)) throw new Error(`Invoice is already ${inv.status}`);
    const po = await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [inv.po_id]);
    const goodsReceipt = await queryOne(db, `SELECT id FROM goods_receipts WHERE po_id = ?`, [inv.po_id]);
    const amountMatches = po && Math.abs(Number(po.grand_total) - Number(inv.grand_total)) < 0.01;
    if (!payload.raisesDiscrepancy && (!po || !goodsReceipt || !amountMatches)) {
      throw new Error("Invoice cannot be verified: a matching PO, goods receipt, and invoice total are required. Raise a discrepancy instead.");
    }

    return await runTransaction(db, async () => {
      if (payload.raisesDiscrepancy) {
        await executeSql(
          db,
          `UPDATE invoices SET status = 'Discrepancy', match_status = 'Variance Detected' WHERE id = ?`,
          [actualInvId]
        );

        const discId = `DISC-2026-${Math.floor(100 + Math.random() * 900)}`;
        await executeSql(
          db,
          `INSERT INTO discrepancy_tickets (id, source_type, source_id, po_id, vendor_id, vendor_name, issue_type, description, status, reported_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [discId, "Invoice 3-Way Match", actualInvId, inv.po_id, inv.vendor_id, inv.vendor_name, "Price Variance", payload.discrepancyNote || `Variance detected for Invoice ${inv.vendor_invoice_number}`, "Open", payload.verifiedBy || "Alice Accountant", now, now]
        );

        await this.addAuditLog(actorUserId, payload.verifiedBy || "Accountant", actorRole, "UPDATE", "invoices", actualInvId, "Variance Detected - Raised Ticket");
      } else {
        await executeSql(
          db,
          `UPDATE invoices SET status = 'Verified', match_status = 'Matched', verified_by = ?, verified_date = ? WHERE id = ?`,
          [payload.verifiedBy || "Alice Accountant", now, actualInvId]
        );

        await this.addAuditLog(actorUserId, payload.verifiedBy || "Accountant", actorRole, "APPROVE", "invoices", actualInvId, "3-Way Match Verified 100%");
      }

      const updated = await queryOne(db, `SELECT * FROM invoices WHERE id = ?`, [actualInvId]);
      return { success: true, invoice: updated };
    });
  },

  // 10. Payments (Relational: payments (1) -> (1) invoices, payments (N) -> (1) purchase_orders)
  async getPayments(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const rows = vendorId ? await queryAll(db, `SELECT * FROM payments WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM payments ORDER BY created_at DESC`);
    return rows.map((p) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      poId: p.po_id,
      vendorId: p.vendor_id,
      vendorName: p.vendor_name,
      amount: Number(p.amount || 0),
      currency: p.currency,
      paymentDate: p.payment_date,
      reconAccount: p.recon_account,
      paymentMethod: p.payment_method,
      processedByUserId: p.processed_by_user_id,
      processedByUserName: p.processed_by_user_name,
      referenceNumber: p.reference_number,
      status: p.status,
      createdAt: p.created_at,
    }));
  },

  async createPayment(p: any) {
    const db = await getRelationalDB();
    const inv = await queryOne(db, `SELECT * FROM invoices WHERE id = ?`, [p.invoiceId]);
    if (!inv) throw new Error("Invoice not found");
    const existingPayment = await queryOne(db, `SELECT id FROM payments WHERE invoice_id = ? AND status = 'Completed' LIMIT 1`, [p.invoiceId]);
    if (existingPayment) throw new Error("Invoice has already been paid");
    if (inv.status === "Paid") throw new Error("Invoice has already been paid");
    if (inv.status !== "Verified") throw new Error("Only a verified invoice can be paid");

    const existing = await queryAll(db, `SELECT id FROM payments`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const id = `PAY-2026-${pad}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const today = p.paymentDate || new Date().toISOString().substring(0, 10);
    const refNum = `WIRE-AD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const processedByUserId = await resolveUserId(db, p.processedByUserId, "accountant");
    const processedByUserName = p.processedByUserName || "Alice Accountant";

    const paymentMethodMap: Record<string, string> = { "Wire Transfer": "Electronic Wire" };
    const paymentMethod = paymentMethodMap[p.paymentMethod] || p.paymentMethod || "Bank Transfer";
    if (!["Bank Transfer", "Corporate Credit", "Check", "Electronic Wire"].includes(paymentMethod)) throw new Error("Unsupported payment method");
    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO payments (id, invoice_id, po_id, vendor_id, vendor_name, amount, currency, payment_date, recon_account, payment_method, processed_by_user_id, processed_by_user_name, reference_number, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, p.invoiceId, inv.po_id, inv.vendor_id, inv.vendor_name, inv.grand_total, inv.currency || "USD", today, p.reconAccount || "300700 - Accounts Payable", paymentMethod, processedByUserId, processedByUserName, refNum, "Completed", now]
      );

      await executeSql(db, `UPDATE invoices SET status = 'Paid' WHERE id = ?`, [p.invoiceId]);

      await this.addAuditLog(processedByUserId, processedByUserName, "accountant", "POST", "payments", id, `Executed Payment $${inv.grand_total} for ${inv.id}`);

      return {
        id,
        invoiceId: p.invoiceId,
        poId: inv.po_id,
        vendorId: inv.vendor_id,
        vendorName: inv.vendor_name,
        amount: inv.grand_total,
        currency: inv.currency || "USD",
        paymentDate: today,
        reconAccount: p.reconAccount,
        paymentMethod,
        processedByUserId,
        processedByUserName,
        referenceNumber: refNum,
        status: "Completed",
        createdAt: now,
      };
    });
  },

  // 11. Discrepancy Tickets
  async getDiscrepancies(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const rows = vendorId ? await queryAll(db, `SELECT * FROM discrepancy_tickets WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM discrepancy_tickets ORDER BY created_at DESC`);
    return rows.map((d) => ({
      id: d.id,
      sourceType: d.source_type,
      sourceId: d.source_id,
      poId: d.po_id,
      vendorId: d.vendor_id,
      vendorName: d.vendor_name,
      materialId: d.material_id,
      materialCode: d.material_code,
      issueType: d.issue_type,
      description: d.description,
      status: d.status,
      reportedBy: d.reported_by,
      resolutionNotes: d.resolution_notes,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },

  async updateDiscrepancy(id: string, payload: any, userId = "SYS") {
    const db = await getRelationalDB();
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    await executeAndPersist(
      db,
      `UPDATE discrepancy_tickets SET status = ?, resolution_notes = ?, updated_at = ? WHERE id = ?`,
      [payload.status, payload.resolutionNotes, now, id]
    );
    await this.addAuditLog(userId, "Warehouse/Accountant", "warehouse", "UPDATE", "discrepancy_tickets", id, `Status: ${payload.status}`);
    return { ...payload, id, updatedAt: now };
  },

  async deletePurchaseOrder(id: string, userId = "SYS", role = "admin") {
    const db = await getRelationalDB();
    const po = await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [id]);
    if (!po) throw new Error("Purchase Order not found");
    if (role === "sourcing" && !["Draft", "Pending Approval", "Rejected"].includes(po.status)) throw new Error("Only unapproved purchase orders can be deleted");
    return await runTransaction(db, async () => {
      const invoice = await queryOne(db, `SELECT id FROM invoices WHERE po_id = ? LIMIT 1`, [id]);
      const payment = await queryOne(db, `SELECT id FROM payments WHERE po_id = ? LIMIT 1`, [id]);
      const gr = await queryOne(db, `SELECT id FROM goods_receipts WHERE po_id = ? LIMIT 1`, [id]);
      const shipment = await queryOne(db, `SELECT id FROM shipments WHERE po_id = ? LIMIT 1`, [id]);
      if (invoice || payment || gr || shipment) throw new Error("Purchase Order has downstream transactions and cannot be deleted");
      await executeSql(db, `DELETE FROM po_approval_history WHERE po_id = ?`, [id]);
      await executeSql(db, `DELETE FROM po_line_items WHERE po_id = ?`, [id]);
      await executeSql(db, `DELETE FROM purchase_orders WHERE id = ?`, [id]);
      await this.addAuditLog(userId, "User", role, "DELETE", "purchase_orders", id, `Deleted PO ${id}`);
      return true;
    });
  },

  // 12. Shipments
  async getShipments(role?: string, userId?: string) {
    const db = await getRelationalDB();
    const vendorId = role === "vendor" ? (await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [userId]))?.vendor_id : null;
    const rows = vendorId ? await queryAll(db, `SELECT * FROM shipments WHERE vendor_id = ? ORDER BY created_at DESC`, [vendorId]) : await queryAll(db, `SELECT * FROM shipments ORDER BY created_at DESC`);
    return rows.map((s) => ({
      id: s.id,
      poId: s.po_id,
      vendorId: s.vendor_id,
      vendorName: s.vendor_name,
      carrierName: s.carrier_name,
      trackingNumber: s.tracking_number,
      shipDate: s.ship_date,
      estimatedDeliveryDate: s.estimated_delivery_date,
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at,
    }));
  },

  async createShipment(ship: any, actorUserId?: string, actorRole?: string) {
    const db = await getRelationalDB();
    const po = await queryOne(db, `SELECT * FROM purchase_orders WHERE id = ?`, [ship.poId]);
    if (!po) throw new Error("Purchase Order not found");
    const actor = actorRole === "vendor" ? await queryOne(db, `SELECT vendor_id FROM users WHERE id = ?`, [actorUserId]) : null;
    if (actorRole === "vendor" && (!actor?.vendor_id || actor.vendor_id !== po.vendor_id)) throw new Error("Vendor cannot dispatch against another vendor's PO");
    if (!["Confirmed"].includes(po.status)) throw new Error(`Shipment can only be created after vendor confirmation. Current status: ${po.status}`);
    const vendorId = actor?.vendor_id || ship.vendorId || po.vendor_id;
    const vendorName = ship.vendorName || po.vendor_name;

    const existing = await queryAll(db, `SELECT id FROM shipments`);
    const count = existing.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const id = `SHIP-2026-${pad}`;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const today = ship.shipDate || new Date().toISOString().substring(0, 10);
    const eta = ship.estimatedDeliveryDate || new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10);
    const carrier = ship.carrierName || "DHL Supply Chain Express";
    const tracking = ship.trackingNumber || `TRK-${Date.now()}`;

    return await runTransaction(db, async () => {
      await executeSql(
        db,
        `INSERT INTO shipments (id, po_id, vendor_id, vendor_name, carrier_name, tracking_number, ship_date, estimated_delivery_date, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ship.poId, vendorId, vendorName, carrier, tracking, today, eta, "Shipped", ship.notes || null, now]
      );
      await executeSql(db, `UPDATE purchase_orders SET status = 'Shipped', updated_at = ? WHERE id = ?`, [now, ship.poId]);
      await this.addAuditLog(vendorId, vendorName, "vendor", "CREATE", "shipments", id, `Tracking: ${tracking} for PO ${ship.poId}`);
      return { ...ship, id, vendorId, vendorName, carrierName: carrier, trackingNumber: tracking, shipDate: today, estimatedDeliveryDate: eta, status: "Shipped", createdAt: now };
    });
  },

  // 13. Audit Logs
  async getAuditLogs() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 150`);
    return rows.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      employeeId: l.employee_id,
      userName: l.user_name,
      userRole: l.user_role,
      actionType: l.action_type,
      targetTable: l.target_table,
      targetId: l.target_id,
      newValue: l.new_value,
      oldValue: l.old_value,
    }));
  },

  // 14. PO Approval History
  async getPOApprovalHistory() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM po_approval_history ORDER BY decision_date DESC`);
    return rows.map((a) => ({
      id: a.id,
      poId: a.po_id,
      approverId: a.approver_id,
      approverName: a.approver_name,
      decision: a.decision,
      comments: a.comments,
      decisionDate: a.decision_date,
    }));
  },

  // 15. Role Permissions
  async getRolePermissions() {
    const db = await getRelationalDB();
    const rows = await queryAll(db, `SELECT * FROM role_permissions`);
    return rows.map((p) => ({
      moduleName: p.module_name,
      canCreate: Boolean(p.can_create),
      canRead: Boolean(p.can_read),
      canUpdate: Boolean(p.can_update),
      canDelete: Boolean(p.can_delete),
    }));
  },

  async updateRolePermissions(perms: any[]) {
    const db = await getRelationalDB();
    return await runTransaction(db, async () => {
      await Promise.all(perms.map(async (p) => {
        await executeSql(
          db,
          `INSERT INTO role_permissions (id, module_name, can_create, can_read, can_update, can_delete)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             can_create = VALUES(can_create),
             can_read = VALUES(can_read),
             can_update = VALUES(can_update),
             can_delete = VALUES(can_delete)`,
          [p.id || `perm-${Date.now()}-${Math.floor(Math.random() * 1000)}`, p.moduleName, p.canCreate ? 1 : 0, p.canRead ? 1 : 0, p.canUpdate ? 1 : 0, p.canDelete ? 1 : 0]
        );
      }))
      return perms;
    });
  },

  // Full Database State Fetcher for Initial Redux/State Sync
  async getFullState(role?: string, userId?: string) {
    const canViewAdministration = role === "admin" || role === "manager";
    const [
      users,
      materials,
      suppliers,
      prs,
      rfqs,
      quotations,
      pos,
      goodsReceipts,
      discrepancyTickets,
      invoices,
      payments,
      auditLogs,
      shipments,
      approvalHistory,
      rolePermissions,
    ] = await Promise.all([
      canViewAdministration || role === "vendor" ? this.getUsers() : Promise.resolve([]),
      this.getMaterials(),
      this.getSuppliers(),
      this.getPRs(),
      this.getRFQs(role, userId),
      this.getQuotations(role, userId),
      this.getPOs(role, userId),
      this.getGoodsReceipts(role, userId),
      this.getDiscrepancies(role, userId),
      this.getInvoices(role, userId),
      this.getPayments(role, userId),
      canViewAdministration ? this.getAuditLogs() : Promise.resolve([]),
      this.getShipments(role, userId),
      canViewAdministration ? this.getPOApprovalHistory() : Promise.resolve([]),
      canViewAdministration ? this.getRolePermissions() : Promise.resolve([]),
    ]);

    const vendorId = role === "vendor" ? users.find((u: any) => u.id === userId)?.vendorId : undefined;
    const scopedUsers = role === "vendor" ? users.filter((u: any) => u.id === userId) : users;
    const scopedSuppliers = role === "vendor" ? suppliers.filter((s: any) => s.id === vendorId) : suppliers;
    const scopedMaterials = role === "vendor" ? materials.filter((m: any) => m.supplierId === vendorId) : materials;
    const scopedPRs = role === "vendor" ? [] : prs;
    const scopedAuditLogs = role === "vendor" ? auditLogs.filter((l: any) => l.userRole === "vendor" || ["invoices", "shipments", "vendor_quotations"].includes(l.targetTable)) : auditLogs;
    return {
      users: scopedUsers,
      materials: scopedMaterials,
      suppliers: scopedSuppliers,
      prs: scopedPRs,
      rfqs,
      quotations,
      pos,
      goodsReceipts,
      discrepancyTickets,
      invoices,
      payments,
      auditLogs: scopedAuditLogs,
      shipments,
      approvalHistory,
      rolePermissions,
    };
  },

  // ERD & Relational Schema Metadata Provider
  async getERDMetadata() {
    const db = await getRelationalDB();
    const tables = await queryAll(
      db,
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'
       ORDER BY table_name ASC`,
      [process.env.DB_NAME || "adidas_procurement"]
    );

    const tableDetails = await Promise.all(tables.map(async (t) => {
      const columns = await queryAll(
        db,
        `SELECT
           ordinal_position AS cid,
           column_name AS name,
           column_type AS type,
           is_nullable = 'NO' AS notNull,
           column_default AS defaultValue,
           column_key = 'PRI' AS isPrimaryKey
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ordinal_position`,
        [process.env.DB_NAME || "adidas_procurement", t.name]
      );
      const foreignKeys = await queryAll(
        db,
        `SELECT
           kcu.constraint_name AS constraint_name,
           kcu.column_name AS fromColumn,
           kcu.referenced_table_name AS toTable,
           kcu.referenced_column_name AS toColumn,
           rc.update_rule AS onUpdate,
           rc.delete_rule AS onDelete
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.referential_constraints rc
           ON rc.constraint_schema = kcu.constraint_schema
          AND rc.constraint_name = kcu.constraint_name
         WHERE kcu.table_schema = ?
           AND kcu.table_name = ?
           AND kcu.referenced_table_name IS NOT NULL`,
        [process.env.DB_NAME || "adidas_procurement", t.name]
      );
      const row = await queryOne(db, `SELECT COUNT(*) AS count FROM \`${t.name.replace(/`/g, "``")}\``);

      return {
        tableName: t.name,
        rowCount: Number(row?.count || 0),
        columns: columns.map((c) => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notNull: Boolean(c.notNull),
          defaultValue: c.defaultValue,
          isPrimaryKey: Boolean(c.isPrimaryKey),
        })),
        foreignKeys: foreignKeys.map((fk) => ({
          id: fk.constraint_name,
          fromColumn: fk.fromColumn,
          toTable: fk.toTable,
          toColumn: fk.toColumn,
          onUpdate: fk.onUpdate,
          onDelete: fk.onDelete,
        })),
      };
    }));

    return {
      databaseName: "adidas_procurement",
      engine: "MySQL 8.x / MariaDB (InnoDB) with Foreign Key Constraints",
      schemaCompliant: "Normalized Relational Architecture",
      tableCount: tables.length,
      tables: tableDetails,
      relationships: [
        { parent: "suppliers", child: "materials", relation: "1:N", fk: "supplier_id -> suppliers.id", description: "Supplier supplies multiple Materials" },
        { parent: "users", child: "purchase_requisitions", relation: "1:N", fk: "creator_id -> users.id", description: "Planner creates multiple PRs" },
        { parent: "purchase_requisitions", child: "pr_line_items", relation: "1:N", fk: "pr_id -> purchase_requisitions.id", description: "PR contains multiple Material Line Items (Cascading)" },
        { parent: "materials", child: "pr_line_items", relation: "1:N", fk: "material_id -> materials.id", description: "Material requested in multiple PR Line Items" },
        { parent: "users", child: "rfqs", relation: "1:N", fk: "created_by_id -> users.id", description: "Sourcing Specialist creates multiple RFQs" },
        { parent: "rfqs", child: "rfq_line_items", relation: "1:N", fk: "rfq_id -> rfqs.id", description: "RFQ groups multiple consolidated Line Items (Cascading)" },
        { parent: "rfqs", child: "vendor_quotations", relation: "1:N", fk: "rfq_id -> rfqs.id", description: "RFQ receives multiple Vendor Bids (Cascading)" },
        { parent: "suppliers", child: "vendor_quotations", relation: "1:N", fk: "vendor_id -> suppliers.id", description: "Vendor submits multiple Quotations" },
        { parent: "vendor_quotations", child: "quotation_line_items", relation: "1:N", fk: "quotation_id -> vendor_quotations.id", description: "Quotation contains multiple Material Bids (Cascading)" },
        { parent: "suppliers", child: "purchase_orders", relation: "1:N", fk: "vendor_id -> suppliers.id", description: "Vendor receives multiple Purchase Orders" },
        { parent: "users", child: "purchase_orders", relation: "1:N", fk: "created_by_id -> users.id", description: "Sourcing creates multiple Purchase Orders" },
        { parent: "purchase_orders", child: "po_line_items", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "Purchase Order has multiple PO Line Items (Cascading)" },
        { parent: "materials", child: "po_line_items", relation: "1:N", fk: "material_id -> materials.id", description: "Material ordered in multiple PO Line Items" },
        { parent: "purchase_orders", child: "po_approval_history", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "PO stores formal Manager Approval History (Cascading)" },
        { parent: "purchase_orders", child: "shipments", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "PO fulfilled across Shipments" },
        { parent: "purchase_orders", child: "goods_receipts", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "PO inspected via Warehouse Goods Receipts" },
        { parent: "goods_receipts", child: "goods_receipt_line_items", relation: "1:N", fk: "goods_receipt_id -> goods_receipts.id", description: "Goods Receipt inspects individual Material Items (Cascading)" },
        { parent: "purchase_orders", child: "invoices", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "PO billed by Vendor Invoices" },
        { parent: "invoices", child: "invoice_line_items", relation: "1:N", fk: "invoice_id -> invoices.id", description: "Invoice details line items with taxes (Cascading)" },
        { parent: "invoices", child: "payments", relation: "1:1", fk: "invoice_id -> invoices.id", description: "Verified Invoice settled by Payment" },
        { parent: "purchase_orders", child: "discrepancy_tickets", relation: "1:N", fk: "po_id -> purchase_orders.id", description: "PO tracks Goods Receipt and 3-Way Match Discrepancies" },
      ],
    };
  },

  // Direct SQL execution sandbox for verification and live testing
  async executeCustomQuery(sqlQuery: string) {
    const db = await getRelationalDB();
    const trimmed = sqlQuery.trim();
    if (trimmed.toUpperCase().startsWith("SELECT") ||
      trimmed.toUpperCase().startsWith("SHOW") ||
      trimmed.toUpperCase().startsWith("DESCRIBE")) {
      const results = await queryAll(db, trimmed);
      return { type: "SELECT", rows: results, count: results.length };
    } else {
      await executeAndPersist(db, trimmed);
      return { type: "MUTATION", message: "SQL statement executed successfully." };
    }
  },
};
