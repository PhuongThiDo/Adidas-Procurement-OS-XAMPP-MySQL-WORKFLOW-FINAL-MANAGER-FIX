-- ==============================================================================
-- ADIDAS PROCUREMENT OPERATING SYSTEM (CHAPTER 4.2 COMPLIANT ERD RELATIONAL SCHEMA)
-- Target Database: adidas_procurement
-- Engine: MySQL 8.x / InnoDB (Foreign Key Constraints Enforced)
-- Compatible with XAMPP phpMyAdmin (http://localhost/phpmyadmin)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `adidas_procurement` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `adidas_procurement`;

-- Disable FK checks during schema drops/rebuilds
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `invoice_line_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `discrepancy_tickets`;
DROP TABLE IF EXISTS `goods_receipt_line_items`;
DROP TABLE IF EXISTS `goods_receipts`;
DROP TABLE IF EXISTS `shipments`;
DROP TABLE IF EXISTS `po_approval_history`;
DROP TABLE IF EXISTS `po_line_items`;
DROP TABLE IF EXISTS `purchase_orders`;
DROP TABLE IF EXISTS `quotation_line_items`;
DROP TABLE IF EXISTS `vendor_quotations`;
DROP TABLE IF EXISTS `rfq_invited_vendors`;
DROP TABLE IF EXISTS `rfq_line_items`;
DROP TABLE IF EXISTS `rfq_pr_links`;
DROP TABLE IF EXISTS `rfqs`;
DROP TABLE IF EXISTS `pr_line_items`;
DROP TABLE IF EXISTS `purchase_requisitions`;
DROP TABLE IF EXISTS `materials`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role` ENUM('planner', 'sourcing', 'manager', 'warehouse', 'accountant', 'admin', 'vendor') NOT NULL,
  `portal` ENUM('internal', 'external') NOT NULL DEFAULT 'internal',
  `department` VARCHAR(100) NOT NULL,
  `vendor_id` VARCHAR(50) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `password_hash` CHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. SUPPLIERS / VENDORS TABLE (Vendor Entity in ERD)
-- ------------------------------------------------------------------------------
CREATE TABLE `suppliers` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `vendor_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `tax_id` VARCHAR(100) NOT NULL UNIQUE,
  `address` TEXT NOT NULL,
  `contact_person` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `company_code` VARCHAR(20) NOT NULL DEFAULT 'ADVN',
  `purchasing_org` VARCHAR(20) NOT NULL DEFAULT 'SOUR',
  `recon_account` VARCHAR(100) NOT NULL DEFAULT '300700 - Accounts Payable',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `payment_terms` VARCHAR(50) NOT NULL DEFAULT 'Net 30',
  `tariff_impact_level` ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium' COMMENT 'Data Dictionary 4.2.2 - Tariff Impact Level 2026',
  `status` ENUM('Active', 'Pending Approval', 'Inactive') NOT NULL DEFAULT 'Active',
  `rating` INT NOT NULL DEFAULT 90,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. MATERIALS TABLE (Material Entity in ERD, Relation: Supplier (1) -> Material (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `materials` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `material_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `uom` VARCHAR(20) NOT NULL,
  `forecast_qty` INT NOT NULL DEFAULT 0,
  `current_stock_qty` INT NOT NULL DEFAULT 0,
  `safety_stock_qty` INT NOT NULL DEFAULT 0,
  `standard_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_id` VARCHAR(50) NOT NULL,
  `last_updated` DATE NOT NULL,
  CONSTRAINT `fk_materials_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. PURCHASE REQUISITIONS TABLE (Relation: User (1) -> PR (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `purchase_requisitions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `creator_id` VARCHAR(50) NOT NULL,
  `creator_name` VARCHAR(150) NOT NULL,
  `request_date` DATE NOT NULL,
  `required_delivery_date` DATE NOT NULL,
  `status` ENUM('Draft', 'Submitted', 'Processed', 'Cancelled') NOT NULL DEFAULT 'Draft',
  `total_estimated_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `rfq_id` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pr_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. PR LINE ITEMS TABLE (Relation: PR (1) -> Line Item (N), Material (1) -> Line Item (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `pr_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `pr_id` VARCHAR(50) NOT NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `uom` VARCHAR(20) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `estimated_unit_price` DECIMAL(12,2) NOT NULL,
  `line_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_pr_items_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_pr_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. RFQS (REQUEST FOR QUOTATION) TABLE (Relation: User (1) -> RFQ (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `rfqs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `created_by_id` VARCHAR(50) NOT NULL,
  `created_by_name` VARCHAR(150) NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('Draft', 'Published', 'Under Review', 'Awarded', 'Awarded & PO Issued', 'Closed') NOT NULL DEFAULT 'Published',
  `winning_quotation_id` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rfq_creator` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. RFQ - PR JUNCTION TABLE (Relation: RFQ (1) -> Linked PRs (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `rfq_pr_links` (
  `rfq_id` VARCHAR(50) NOT NULL,
  `pr_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`rfq_id`, `pr_id`),
  CONSTRAINT `fk_rfq_pr_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_rfq_pr_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. RFQ LINE ITEMS TABLE (Relation: RFQ (1) -> RFQ Line Item (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `rfq_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `rfq_id` VARCHAR(50) NOT NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `uom` VARCHAR(20) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `target_price` DECIMAL(12,2) NULL,
  CONSTRAINT `fk_rfq_items_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_rfq_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. RFQ INVITED VENDORS JUNCTION TABLE (Relation: RFQ (N) <-> Vendor (M))
-- ------------------------------------------------------------------------------
CREATE TABLE `rfq_invited_vendors` (
  `rfq_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`rfq_id`, `vendor_id`),
  CONSTRAINT `fk_rfq_inv_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_rfq_inv_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. VENDOR QUOTATIONS TABLE (Relation: RFQ (1) -> Quotation (N), Vendor (1) -> Quotation (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `vendor_quotations` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `rfq_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `submission_date` DATE NOT NULL,
  `valid_until` DATE NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `lead_time_days` INT NOT NULL DEFAULT 14,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `cost_score` INT NOT NULL DEFAULT 85,
  `quality_score` INT NOT NULL DEFAULT 90,
  `delivery_score` INT NOT NULL DEFAULT 88,
  `total_score` INT NOT NULL DEFAULT 88,
  `status` ENUM('Submitted', 'Accepted', 'Rejected', 'PO Generated') NOT NULL DEFAULT 'Submitted',
  `notes` TEXT NULL,
  CONSTRAINT `fk_quot_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_quot_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. QUOTATION LINE ITEMS TABLE (Relation: Quotation (1) -> Line Item (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `quotation_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `quotation_id` VARCHAR(50) NOT NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `lead_time_days` INT NOT NULL DEFAULT 14,
  `line_total` DECIMAL(15,2) NOT NULL,
  CONSTRAINT `fk_quot_items_quot` FOREIGN KEY (`quotation_id`) REFERENCES `vendor_quotations` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_quot_items_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. PURCHASE ORDERS TABLE (Relation: Vendor (1) -> PO (N), User (1) -> PO (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `purchase_orders` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `quotation_id` VARCHAR(50) NULL,
  `rfq_id` VARCHAR(50) NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `created_by_id` VARCHAR(50) NOT NULL,
  `created_by_name` VARCHAR(150) NOT NULL,
  `issue_date` DATE NOT NULL,
  `payment_terms` VARCHAR(50) NOT NULL DEFAULT 'Net 30',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Confirmed', 'Shipped', 'Partially Received', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending Approval',
  `manager_comments` TEXT NULL,
  `vendor_accepted_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_po_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_po_creator` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_po_quot` FOREIGN KEY (`quotation_id`) REFERENCES `vendor_quotations` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_po_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. PO LINE ITEMS TABLE (Relation: Purchase Order (1) -> PO Line Item (N), Material (1) -> PO Line Item (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `po_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `po_id` VARCHAR(50) NOT NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `uom` VARCHAR(20) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `tax_rate_percent` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_po_items_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_po_items_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. PO APPROVAL HISTORY TABLE (Relation: PO (1) -> Approvals (N), User (1) -> Approvals (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `po_approval_history` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `po_id` VARCHAR(50) NOT NULL,
  `approver_id` VARCHAR(50) NOT NULL,
  `approver_name` VARCHAR(150) NOT NULL,
  `decision` ENUM('Approved', 'Rejected') NOT NULL,
  `comments` TEXT NOT NULL,
  `decision_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_po_appr_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_po_appr_user` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. SHIPMENTS TABLE (Relation: PO (1) -> Shipment (N), Vendor (1) -> Shipment (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `shipments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `po_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `carrier_name` VARCHAR(100) NOT NULL,
  `tracking_number` VARCHAR(100) NOT NULL,
  `ship_date` DATE NOT NULL,
  `estimated_delivery_date` DATE NOT NULL,
  `status` ENUM('In Production', 'Shipped', 'Delivered') NOT NULL DEFAULT 'Shipped',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ship_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ship_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. GOODS RECEIPTS TABLE (Relation: PO (1) -> GR (N), Vendor (1) -> GR (N), User (1) -> GR (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `goods_receipts` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `po_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `received_by_user_id` VARCHAR(50) NOT NULL,
  `received_by_user_name` VARCHAR(150) NOT NULL,
  `receipt_date` DATE NOT NULL,
  `has_discrepancy` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_gr_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_gr_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_gr_user` FOREIGN KEY (`received_by_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. GOODS RECEIPT LINE ITEMS TABLE (Relation: Goods Receipt (1) -> GR Line Items (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `goods_receipt_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `goods_receipt_id` VARCHAR(50) NOT NULL,
  `po_detail_id` VARCHAR(50) NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `uom` VARCHAR(20) NOT NULL,
  `ordered_qty` DECIMAL(12,2) NOT NULL,
  `received_qty` DECIMAL(12,2) NOT NULL,
  `rejected_qty` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `defect_reason` VARCHAR(255) NULL,
  CONSTRAINT `fk_gr_items_gr` FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_gr_items_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. DISCREPANCY TICKETS TABLE (Relation: PO (1) -> Discrepancies (N), Material (1) -> Discrepancies (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `discrepancy_tickets` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `source_type` ENUM('Goods Receipt', 'Invoice 3-Way Match') NOT NULL,
  `source_id` VARCHAR(50) NOT NULL,
  `po_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `material_id` VARCHAR(50) NULL,
  `material_code` VARCHAR(50) NULL,
  `issue_type` ENUM('Damaged Items', 'Quantity Mismatch', 'Price Variance', 'Tax Variance', 'Specification Deviation') NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Open', 'Under Review', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  `reported_by` VARCHAR(150) NOT NULL,
  `resolution_notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_disc_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_disc_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. INVOICES TABLE (Relation: PO (1) -> Invoices (N), Vendor (1) -> Invoices (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `invoices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `vendor_invoice_number` VARCHAR(100) NOT NULL,
  `po_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `attachment_url` VARCHAR(255) NULL,
  `status` ENUM('Submitted', 'Verified', 'Discrepancy', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Submitted',
  `match_status` ENUM('Pending Match', 'Matched', 'Variance Detected') NULL,
  `verified_by` VARCHAR(150) NULL,
  `verified_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inv_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_inv_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 20. INVOICE LINE ITEMS TABLE (Relation: Invoice (1) -> Invoice Line Items (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `invoice_line_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `invoice_id` VARCHAR(50) NOT NULL,
  `material_id` VARCHAR(50) NOT NULL,
  `material_code` VARCHAR(50) NOT NULL,
  `material_name` VARCHAR(200) NOT NULL,
  `invoiced_qty` DECIMAL(12,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_inv_items_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_inv_items_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 21. PAYMENTS TABLE (Relation: Invoice (1) -> Payment (1/N), PO (1) -> Payment (N), User (1) -> Payment (N))
-- ------------------------------------------------------------------------------
CREATE TABLE `payments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `invoice_id` VARCHAR(50) NOT NULL,
  `po_id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `vendor_name` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `payment_date` DATE NOT NULL,
  `recon_account` VARCHAR(100) NOT NULL DEFAULT '300700 - Accounts Payable',
  `payment_method` ENUM('Bank Transfer', 'Corporate Credit', 'Check', 'Electronic Wire') NOT NULL DEFAULT 'Bank Transfer',
  `processed_by_user_id` VARCHAR(50) NOT NULL,
  `processed_by_user_name` VARCHAR(150) NOT NULL,
  `reference_number` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('Completed', 'Pending', 'Failed') NOT NULL DEFAULT 'Completed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pay_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_user` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 22. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `employee_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(100) NOT NULL,
  `action_type` VARCHAR(50) NOT NULL,
  `target_table` VARCHAR(100) NOT NULL,
  `target_id` VARCHAR(100) NOT NULL,
  `new_value` TEXT NULL,
  `old_value` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 23. ROLE PERMISSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `role_permissions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `module_name` VARCHAR(100) NOT NULL UNIQUE,
  `can_create` TINYINT(1) NOT NULL DEFAULT 1,
  `can_read` TINYINT(1) NOT NULL DEFAULT 1,
  `can_update` TINYINT(1) NOT NULL DEFAULT 1,
  `can_delete` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 24. CHAPTER 4.2 COMPATIBILITY ALIAS VIEWS & 3-WAY MATCH REPORTING VIEWS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `goods_receipt_items` AS 
SELECT * FROM `goods_receipt_line_items`;

CREATE OR REPLACE VIEW `invoice_items` AS 
SELECT * FROM `invoice_line_items`;

CREATE OR REPLACE VIEW `v_po_full_details` AS
SELECT 
  po.id AS po_number,
  po.issue_date,
  po.status AS po_status,
  s.vendor_code,
  s.name AS vendor_name,
  s.tax_id,
  pli.id AS line_item_id,
  pli.material_code,
  pli.material_name,
  pli.quantity,
  pli.uom,
  pli.unit_price,
  pli.tax_amount,
  pli.line_total,
  po.grand_total AS po_grand_total
FROM purchase_orders po
JOIN suppliers s ON po.vendor_id = s.id
LEFT JOIN po_line_items pli ON po.id = pli.po_id;

CREATE OR REPLACE VIEW `v_three_way_match_status` AS
SELECT 
  po.id AS po_id,
  po.vendor_name,
  po.grand_total AS po_amount,
  po.status AS po_status,
  gr.id AS gr_id,
  gr.receipt_date AS gr_date,
  gr.has_discrepancy AS gr_discrepancy,
  inv.id AS invoice_id,
  inv.vendor_invoice_number,
  inv.grand_total AS invoice_amount,
  inv.status AS invoice_status,
  inv.match_status,
  pay.id AS payment_id,
  pay.reference_number AS payment_ref,
  pay.status AS payment_status
FROM purchase_orders po
LEFT JOIN goods_receipts gr ON po.id = gr.po_id
LEFT JOIN invoices inv ON po.id = inv.po_id
LEFT JOIN payments pay ON inv.id = pay.invoice_id;


-- ==============================================================================
-- INITIAL RELATIONAL SEED DATA
-- ==============================================================================

-- 1. Users
INSERT INTO `users` (`id`, `employee_id`, `username`, `full_name`, `email`, `role`, `portal`, `department`, `vendor_id`, `active`, `password_hash`) VALUES
('usr-101', 'EMP-101', 'planner_alex', 'John Planner', 'j.planner@adidas.com', 'planner', 'internal', 'Supply Chain & Demand', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-102', 'EMP-102', 'sourcing_maria', 'Sarah Sourcing', 's.sourcing@adidas.com', 'sourcing', 'internal', 'Global Procurement & Sourcing', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-103', 'EMP-103', 'manager_david', 'Michael Manager', 'm.manager@adidas.com', 'manager', 'internal', 'Procurement Governance', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-104', 'EMP-104', 'warehouse_kevin', 'Wayne Warehouse', 'w.warehouse@adidas.com', 'warehouse', 'internal', 'Logistics & Quality Inspection', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-105', 'EMP-105', 'accountant_sarah', 'Alice Accountant', 'a.accountant@adidas.com', 'accountant', 'internal', 'Accounts Payable & Finance', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-106', 'EMP-106', 'admin_robert', 'Alex Admin', 'a.admin@adidas.com', 'admin', 'internal', 'IT Systems & Enterprise OS', NULL, 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('usr-201', 'VEND-001', 'vendor_prime', 'Prime Fabrics Co (Supplier Portal)', 'sales@primefabrics.com', 'vendor', 'external', 'Vendor Relations', 'VEND-001', 1, 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');

-- 2. Suppliers
INSERT INTO `suppliers` (`id`, `vendor_code`, `name`, `tax_id`, `address`, `contact_person`, `phone`, `email`, `company_code`, `purchasing_org`, `recon_account`, `currency`, `payment_terms`, `tariff_impact_level`, `status`, `rating`) VALUES
('VEND-001', 'VEND-001', 'Prime Fabrics Co', 'TX-99881122', 'Industrial Zone 4, Herzogenaurach, Germany', 'Hans Weber', '+49 9132 840', 'sales@primefabrics.com', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'USD', 'Net 30', 'High', 'Active', 94),
('VEND-002', 'VEND-002', 'Continental Rubber Polymer Ltd', 'TX-55443322', 'Hanover Supply Hub 12, Hanover, Germany', 'Greta Fischer', '+49 511 9380', 'orders@continental-polymers.com', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'EUR', 'Net 60', 'Medium', 'Active', 91),
('VEND-003', 'VEND-003', 'Global Tech Synthetics Inc', 'TX-11223344', 'Tech Avenue 88, Portland OR, USA', 'David Smith', '+1 503 555 0199', 'b2b@globaltechsynth.com', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'USD', 'Net 30', 'High', 'Active', 88),
('VEND-004', 'VEND-004', 'Lightstrike Innovations GmbH', 'TX-77665544', 'Bavaria Innovation Park 3, Munich, Germany', 'Klaus Braun', '+49 89 20040', 'klaus@lightstrike-foam.de', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'EUR', 'Net 45', 'Low', 'Active', 93),
('VEND-005', 'VEND-005', 'Tuscan Leatherworks SpA', 'TX-88332211', 'Via Conceria 44, Florence, Italy', 'Marco Rossi', '+39 055 49302', 'info@tuscan-leather.it', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'EUR', 'Net 30', 'Medium', 'Active', 90),
('VEND-006', 'VEND-006', 'Alpine Tech Membranes', 'TX-33445566', 'Goreweg 10, Zurich, Switzerland', 'Anna Meyer', '+41 44 89201', 'orders@alpine-membranes.ch', 'ADVN', 'SOUR', '300700 - Accounts Payable', 'USD', 'Net 60', 'Low', 'Active', 95);

-- 3. Materials
INSERT INTO `materials` (`id`, `material_code`, `name`, `category`, `uom`, `forecast_qty`, `current_stock_qty`, `safety_stock_qty`, `standard_cost`, `supplier_id`, `last_updated`) VALUES
('MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 'Yarn & Fiber', 'METERS', 50000, 4200, 10000, 8.50, 'VEND-001', '2026-08-01'),
('MAT-1002', 'MAT-1002', 'Boost Foam Polymer Granules', 'Polymers', 'KG', 30000, 15000, 8000, 14.20, 'VEND-002', '2026-08-02'),
('MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 'Textile', 'METERS', 80000, 6500, 12000, 6.80, 'VEND-001', '2026-08-03'),
('MAT-1004', 'MAT-1004', 'Rubber Outsole Molded Grade A', 'Outsoles', 'PAIRS', 40000, 22000, 9000, 11.50, 'VEND-002', '2026-08-04'),
('MAT-1005', 'MAT-1005', 'TPU Heel Counter Stabilizer', 'Plastics', 'PAIRS', 25000, 18000, 5000, 4.20, 'VEND-003', '2026-08-05'),
('MAT-1006', 'MAT-1006', 'OrthoLite High-Rebound Insole', 'Insoles', 'PAIRS', 35000, 2800, 7500, 5.40, 'VEND-003', '2026-08-06'),
('MAT-1007', 'MAT-1007', 'Continental All-Terrain Rubber Tread', 'Outsoles', 'PAIRS', 30000, 4100, 8000, 15.80, 'VEND-002', '2026-08-07'),
('MAT-1008', 'MAT-1008', 'Lightstrike Pro EVA Midsole Foam', 'Polymers', 'KG', 28000, 3200, 6000, 18.50, 'VEND-004', '2026-08-07'),
('MAT-1009', 'MAT-1009', 'EnergyRods 2.0 Carbon Structure', 'Carbon Fiber', 'SETS', 15000, 1200, 4000, 24.00, 'VEND-003', '2026-08-08'),
('MAT-1010', 'MAT-1010', 'Forum Vintage Full-Grain Leather', 'Leather', 'SQFT', 45000, 8900, 10000, 12.20, 'VEND-005', '2026-08-08'),
('MAT-1011', 'MAT-1011', 'Samba Suede Toe Overlay', 'Leather', 'SQFT', 50000, 14000, 11000, 9.80, 'VEND-005', '2026-08-08'),
('MAT-1012', 'MAT-1012', 'Terrex Waterproof Gore-Tex Membrane', 'Textile', 'METERS', 20000, 3100, 5000, 22.50, 'VEND-006', '2026-08-08');

-- 4. Purchase Requisitions
INSERT INTO `purchase_requisitions` (`id`, `creator_id`, `creator_name`, `request_date`, `required_delivery_date`, `status`, `total_estimated_cost`, `created_at`, `updated_at`) VALUES
('PR-2026-001', 'usr-101', 'John Planner', '2026-08-01', '2026-08-25', 'Submitted', 69800.00, '2026-08-01 09:15:00', '2026-08-01 09:15:00'),
('PR-2026-002', 'usr-101', 'John Planner', '2026-08-03', '2026-08-30', 'Submitted', 25380.00, '2026-08-03 11:20:00', '2026-08-03 11:20:00'),
('PR-2026-003', 'usr-101', 'John Planner', '2026-08-05', '2026-09-05', 'Draft', 14200.00, '2026-08-05 14:00:00', '2026-08-05 14:00:00');

-- 5. PR Line Items
INSERT INTO `pr_line_items` (`id`, `pr_id`, `material_id`, `material_code`, `material_name`, `uom`, `quantity`, `estimated_unit_price`, `line_total`) VALUES
('pr-item-1', 'PR-2026-001', 'MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 'METERS', 6000.00, 8.50, 51000.00),
('pr-item-2', 'PR-2026-001', 'MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 'METERS', 2750.00, 6.80, 18700.00),
('pr-item-3', 'PR-2026-002', 'MAT-1006', 'MAT-1006', 'OrthoLite High-Rebound Insole', 'PAIRS', 4700.00, 5.40, 25380.00),
('pr-item-4', 'PR-2026-003', 'MAT-1002', 'MAT-1002', 'Boost Foam Polymer Granules', 'KG', 1000.00, 14.20, 14200.00);

-- 6. RFQs
INSERT INTO `rfqs` (`id`, `title`, `created_by_id`, `created_by_name`, `issue_date`, `due_date`, `status`, `winning_quotation_id`, `created_at`) VALUES
('RFQ-2026-001', 'Procurement of High-Tenacity Primeknit & Recycled Upper Textiles', 'usr-102', 'Sarah Sourcing', '2026-08-02', '2026-08-15', 'Published', 'QUOT-2026-001', '2026-08-02 10:00:00');

-- 7. RFQ - PR Links
INSERT INTO `rfq_pr_links` (`rfq_id`, `pr_id`) VALUES
('RFQ-2026-001', 'PR-2026-001');

-- 8. RFQ Line Items
INSERT INTO `rfq_line_items` (`id`, `rfq_id`, `material_id`, `material_code`, `material_name`, `uom`, `quantity`, `target_price`) VALUES
('rfq-item-1', 'RFQ-2026-001', 'MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 'METERS', 6000.00, 8.50),
('rfq-item-2', 'RFQ-2026-001', 'MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 'METERS', 2750.00, 6.80);

-- 9. RFQ Invited Vendors
INSERT INTO `rfq_invited_vendors` (`rfq_id`, `vendor_id`) VALUES
('RFQ-2026-001', 'VEND-001'),
('RFQ-2026-001', 'VEND-003');

-- 10. Vendor Quotations
INSERT INTO `vendor_quotations` (`id`, `rfq_id`, `vendor_id`, `vendor_name`, `submission_date`, `valid_until`, `currency`, `lead_time_days`, `total_amount`, `cost_score`, `quality_score`, `delivery_score`, `total_score`, `status`, `notes`) VALUES
('QUOT-2026-001', 'RFQ-2026-001', 'VEND-001', 'Prime Fabrics Co', '2026-08-04', '2026-09-01', 'USD', 14, 66850.00, 92, 96, 90, 93, 'Submitted', 'Direct mill pricing with ISO 9001 certified batch testing included.'),
('QUOT-2026-002', 'RFQ-2026-001', 'VEND-003', 'Global Tech Synthetics Inc', '2026-08-05', '2026-09-01', 'USD', 20, 69700.00, 84, 90, 80, 85, 'Submitted', 'Standard lead time from Oregon warehouse hub.');

-- 11. Quotation Line Items
INSERT INTO `quotation_line_items` (`id`, `quotation_id`, `material_id`, `unit_price`, `lead_time_days`, `line_total`) VALUES
('qitem-1', 'QUOT-2026-001', 'MAT-1001', 8.20, 14, 49200.00),
('qitem-2', 'QUOT-2026-001', 'MAT-1003', 6.42, 14, 17655.00),
('qitem-3', 'QUOT-2026-002', 'MAT-1001', 8.50, 20, 51000.00),
('qitem-4', 'QUOT-2026-002', 'MAT-1003', 6.80, 20, 18700.00);

-- 12. Purchase Orders
INSERT INTO `purchase_orders` (`id`, `quotation_id`, `rfq_id`, `vendor_id`, `vendor_name`, `created_by_id`, `created_by_name`, `issue_date`, `payment_terms`, `currency`, `subtotal`, `tax_amount`, `grand_total`, `status`, `manager_comments`, `vendor_accepted_date`, `created_at`, `updated_at`) VALUES
('PO-2026-001', 'QUOT-2026-001', 'RFQ-2026-001', 'VEND-001', 'Prime Fabrics Co', 'usr-102', 'Sarah Sourcing', '2026-08-06', 'Net 30', 'USD', 66855.00, 6685.50, 73540.50, 'Approved', 'Approved based on optimal total score and past OTIF reliability.', '2026-08-06 14:00:00', '2026-08-06 11:00:00', '2026-08-06 14:00:00');

-- 13. PO Line Items
INSERT INTO `po_line_items` (`id`, `po_id`, `material_id`, `material_code`, `material_name`, `uom`, `quantity`, `unit_price`, `tax_rate_percent`, `tax_amount`, `line_total`) VALUES
('po-item-1', 'PO-2026-001', 'MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 'METERS', 6000.00, 8.20, 10.00, 4920.00, 54120.00),
('po-item-2', 'PO-2026-001', 'MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 'METERS', 2750.00, 6.42, 10.00, 1765.50, 19420.50);

-- 14. PO Approval History
INSERT INTO `po_approval_history` (`id`, `po_id`, `approver_id`, `approver_name`, `decision`, `comments`, `decision_date`) VALUES
('appr-101', 'PO-2026-001', 'usr-103', 'Michael Manager', 'Approved', 'Approved based on optimal total score and past OTIF reliability.', '2026-08-06 13:30:00');

-- 15. Shipments
INSERT INTO `shipments` (`id`, `po_id`, `vendor_id`, `vendor_name`, `carrier_name`, `tracking_number`, `ship_date`, `estimated_delivery_date`, `status`, `notes`, `created_at`) VALUES
('SHIP-2026-001', 'PO-2026-001', 'VEND-001', 'Prime Fabrics Co', 'DHL Supply Chain Express', 'DHL-889977001', '2026-08-07', '2026-08-10', 'Shipped', 'Palletized shipment with moisture barrier packaging.', '2026-08-07 08:00:00');

-- 16. Goods Receipts
INSERT INTO `goods_receipts` (`id`, `po_id`, `vendor_id`, `vendor_name`, `received_by_user_id`, `received_by_user_name`, `receipt_date`, `has_discrepancy`, `notes`, `created_at`) VALUES
('GR-2026-001', 'PO-2026-001', 'VEND-001', 'Prime Fabrics Co', 'usr-104', 'Wayne Warehouse', '2026-08-08', 1, 'Minor yarn fiber fraying detected in roll #4.', '2026-08-08 10:30:00');

-- 17. Goods Receipt Line Items
INSERT INTO `goods_receipt_line_items` (`id`, `goods_receipt_id`, `po_detail_id`, `material_id`, `material_code`, `material_name`, `uom`, `ordered_qty`, `received_qty`, `rejected_qty`, `defect_reason`) VALUES
('gr-item-1', 'GR-2026-001', 'po-item-1', 'MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 'METERS', 6000.00, 5800.00, 200.00, 'Frayed or Damaged Fibers'),
('gr-item-2', 'GR-2026-001', 'po-item-2', 'MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 'METERS', 2750.00, 2750.00, 0.00, NULL);

-- 18. Discrepancy Tickets
INSERT INTO `discrepancy_tickets` (`id`, `source_type`, `source_id`, `po_id`, `vendor_id`, `vendor_name`, `material_id`, `material_code`, `issue_type`, `description`, `status`, `reported_by`, `resolution_notes`, `created_at`, `updated_at`) VALUES
('DISC-2026-001', 'Goods Receipt', 'GR-2026-001', 'PO-2026-001', 'VEND-001', 'Prime Fabrics Co', 'MAT-1001', 'MAT-1001', 'Damaged Items', '200 meters of Primeknit Yarn damaged/frayed upon warehouse arrival inspection.', 'Open', 'Wayne Warehouse', NULL, '2026-08-08 10:30:00', '2026-08-08 10:30:00');

-- 19. Invoices
INSERT INTO `invoices` (`id`, `vendor_invoice_number`, `po_id`, `vendor_id`, `vendor_name`, `invoice_date`, `currency`, `subtotal`, `tax_amount`, `grand_total`, `attachment_url`, `status`, `match_status`, `verified_by`, `verified_date`, `created_at`) VALUES
('INV-2026-001', 'INV-PF-88920', 'PO-2026-001', 'VEND-001', 'Prime Fabrics Co', '2026-08-08', 'USD', 66855.00, 6685.50, 73540.50, '/docs/invoice_pf_88920.pdf', 'Verified', 'Matched', 'Alice Accountant', '2026-08-08 15:00:00', '2026-08-08 12:00:00');

-- 20. Invoice Line Items
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `material_id`, `material_code`, `material_name`, `invoiced_qty`, `unit_price`, `tax_amount`, `line_total`) VALUES
('inv-item-1', 'INV-2026-001', 'MAT-1001', 'MAT-1001', 'Primeknit Yarn High-Tenacity', 6000.00, 8.20, 4920.00, 54120.00),
('inv-item-2', 'INV-2026-001', 'MAT-1003', 'MAT-1003', 'Recycled Polyester Textile Upper', 2750.00, 6.42, 1765.50, 19420.50);

-- 21. Payments
INSERT INTO `payments` (`id`, `invoice_id`, `po_id`, `vendor_id`, `vendor_name`, `amount`, `currency`, `payment_date`, `recon_account`, `payment_method`, `processed_by_user_id`, `processed_by_user_name`, `reference_number`, `status`, `created_at`) VALUES
('PAY-2026-001', 'INV-2026-001', 'PO-2026-001', 'VEND-001', 'Prime Fabrics Co', 73540.50, 'USD', '2026-08-09', '300700 - Accounts Payable', 'Bank Transfer', 'usr-105', 'Alice Accountant', 'WIRE-AD-2026-00992', 'Completed', '2026-08-09 02:00:00');

-- 22. Audit Logs
INSERT INTO `audit_logs` (`id`, `timestamp`, `employee_id`, `user_name`, `user_role`, `action_type`, `target_table`, `target_id`, `new_value`) VALUES
('log-001', '2026-08-01 09:15:00', 'EMP-101', 'John Planner', 'planner', 'CREATE', 'Purchase_Requisition', 'PR-2026-001', 'Submitted PR-2026-001 with 2 items'),
('log-002', '2026-08-02 10:00:00', 'EMP-102', 'Sarah Sourcing', 'sourcing', 'CREATE', 'RFQ', 'RFQ-2026-001', 'Created RFQ-2026-001 from PR-2026-001'),
('log-003', '2026-08-06 13:30:00', 'EMP-103', 'Michael Manager', 'manager', 'APPROVE', 'Purchase_Order', 'PO-2026-001', 'Approved PO-2026-001 (Total: $73,540.50)'),
('log-004', '2026-08-08 10:30:00', 'EMP-104', 'Wayne Warehouse', 'warehouse', 'POST', 'Goods_Receipt', 'GR-2026-001', 'Posted GR-2026-001 (Accepted: 8550, Rejected: 200)'),
('log-005', '2026-08-09 02:00:00', 'EMP-105', 'Alice Accountant', 'accountant', 'POST', 'Payment', 'PAY-2026-001', 'Executed Bank Transfer Payment $73,540.50 for INV-2026-001');


-- 22B. EXTENDED DEMO DATA FOR CROSS-ROLE WORKFLOW TESTING
INSERT INTO `materials` (`id`,`material_code`,`name`,`category`,`uom`,`forecast_qty`,`current_stock_qty`,`safety_stock_qty`,`standard_cost`,`supplier_id`,`last_updated`) VALUES
('MAT-1013','MAT-1013','Adizero Lightweight Mesh','Textile','METERS',62000,9200,10000,7.40,'VEND-001','2026-08-10'),
('MAT-1014','MAT-1014','Cloudfoam EVA Compound','Polymers','KG',26000,7000,6500,13.60,'VEND-002','2026-08-10'),
('MAT-1015','MAT-1015','Primegreen Recycled Thread','Yarn & Fiber','KG',42000,11000,9000,5.90,'VEND-001','2026-08-11'),
('MAT-1016','MAT-1016','Adiwear TPU Film','Plastics','METERS',18000,3600,4500,8.10,'VEND-003','2026-08-11'),
('MAT-1017','MAT-1017','Lightstrike Energy Beads','Polymers','KG',31000,9200,7000,16.20,'VEND-004','2026-08-12'),
('MAT-1018','MAT-1018','Premium Suede Grey','Leather','SQFT',38000,7600,8500,10.40,'VEND-005','2026-08-12'),
('MAT-1019','MAT-1019','GORE-TEX Seam Tape','Textile','METERS',22000,5000,6000,4.80,'VEND-006','2026-08-13'),
('MAT-1020','MAT-1020','Carbon Plate Insert V3','Carbon Fiber','SETS',14000,2500,3000,28.50,'VEND-003','2026-08-13'),
('MAT-1021','MAT-1021','Continental Grip Compound B','Outsoles','KG',27000,6100,7000,12.90,'VEND-002','2026-08-14'),
('MAT-1022','MAT-1022','Primeknit Recycled Blend','Textile','METERS',70000,8800,12000,7.10,'VEND-001','2026-08-14'),
('MAT-1023','MAT-1023','Heel Cushion TPU Soft','Plastics','PAIRS',24000,5200,6000,4.90,'VEND-003','2026-08-15'),
('MAT-1024','MAT-1024','Waterproof Lining Fabric','Textile','METERS',33000,7400,8000,9.30,'VEND-006','2026-08-15');

INSERT INTO `purchase_requisitions` (`id`,`creator_id`,`creator_name`,`request_date`,`required_delivery_date`,`status`,`total_estimated_cost`,`created_at`,`updated_at`) VALUES
('PR-2026-004','usr-101','John Planner','2026-08-06','2026-08-28','Submitted',36480.00,'2026-08-06 09:10:00','2026-08-06 09:10:00'),
('PR-2026-005','usr-101','John Planner','2026-08-07','2026-09-02','Processed',51840.00,'2026-08-07 10:05:00','2026-08-08 13:10:00'),
('PR-2026-006','usr-101','John Planner','2026-08-08','2026-09-08','Submitted',32400.00,'2026-08-08 11:20:00','2026-08-08 11:20:00'),
('PR-2026-007','usr-101','John Planner','2026-08-09','2026-09-12','Submitted',27600.00,'2026-08-09 13:30:00','2026-08-09 13:30:00'),
('PR-2026-008','usr-101','John Planner','2026-08-10','2026-09-15','Processed',45600.00,'2026-08-10 08:40:00','2026-08-11 09:15:00'),
('PR-2026-009','usr-101','John Planner','2026-08-11','2026-09-20','Draft',18900.00,'2026-08-11 15:00:00','2026-08-11 15:00:00'),
('PR-2026-010','usr-101','John Planner','2026-08-12','2026-09-25','Submitted',42750.00,'2026-08-12 14:25:00','2026-08-12 14:25:00');

INSERT INTO `pr_line_items` (`id`,`pr_id`,`material_id`,`material_code`,`material_name`,`uom`,`quantity`,`estimated_unit_price`,`line_total`) VALUES
('pr-item-5','PR-2026-004','MAT-1013','MAT-1013','Adizero Lightweight Mesh','METERS',4800,7.40,35520),
('pr-item-6','PR-2026-005','MAT-1014','MAT-1014','Cloudfoam EVA Compound','KG',3800,13.60,51680),
('pr-item-7','PR-2026-006','MAT-1015','MAT-1015','Primegreen Recycled Thread','KG',5500,5.90,32450),
('pr-item-8','PR-2026-007','MAT-1016','MAT-1016','Adiwear TPU Film','METERS',3400,8.10,27540),
('pr-item-9','PR-2026-008','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,16.20,45360),
('pr-item-10','PR-2026-009','MAT-1018','MAT-1018','Premium Suede Grey','SQFT',1800,10.50,18900),
('pr-item-11','PR-2026-010','MAT-1020','MAT-1020','Carbon Plate Insert V3','SETS',1500,28.50,42750);

INSERT INTO `rfqs` (`id`,`title`,`created_by_id`,`created_by_name`,`issue_date`,`due_date`,`status`,`winning_quotation_id`,`created_at`) VALUES
('RFQ-2026-002','Adizero Mesh & Recycled Thread Sourcing','usr-102','Sarah Sourcing','2026-08-07','2026-08-18','Published',NULL,'2026-08-07 09:00:00'),
('RFQ-2026-003','Performance Foam & TPU Components','usr-102','Sarah Sourcing','2026-08-08','2026-08-19','Awarded','QUOT-2026-004','2026-08-08 10:00:00'),
('RFQ-2026-004','Outdoor Membrane & Grip Materials','usr-102','Sarah Sourcing','2026-08-10','2026-08-22','Awarded & PO Issued','QUOT-2026-006','2026-08-10 10:30:00'),
('RFQ-2026-005','Carbon Plate Strategic Sourcing','usr-102','Sarah Sourcing','2026-08-12','2026-08-25','Published',NULL,'2026-08-12 11:00:00');

INSERT INTO `rfq_pr_links` (`rfq_id`,`pr_id`) VALUES
('RFQ-2026-002','PR-2026-004'),('RFQ-2026-002','PR-2026-006'),('RFQ-2026-003','PR-2026-005'),('RFQ-2026-004','PR-2026-008'),('RFQ-2026-005','PR-2026-010');

INSERT INTO `rfq_line_items` (`id`,`rfq_id`,`material_id`,`material_code`,`material_name`,`uom`,`quantity`,`target_price`) VALUES
('rfq-item-3','RFQ-2026-002','MAT-1013','MAT-1013','Adizero Lightweight Mesh','METERS',4800,7.40),
('rfq-item-4','RFQ-2026-002','MAT-1015','MAT-1015','Primegreen Recycled Thread','KG',5500,5.90),
('rfq-item-5','RFQ-2026-003','MAT-1014','MAT-1014','Cloudfoam EVA Compound','KG',3800,13.60),
('rfq-item-6','RFQ-2026-003','MAT-1016','MAT-1016','Adiwear TPU Film','METERS',3400,8.10),
('rfq-item-7','RFQ-2026-004','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,16.20),
('rfq-item-8','RFQ-2026-004','MAT-1021','MAT-1021','Continental Grip Compound B','KG',2200,12.90),
('rfq-item-9','RFQ-2026-005','MAT-1020','MAT-1020','Carbon Plate Insert V3','SETS',1500,28.50);

INSERT INTO `rfq_invited_vendors` (`rfq_id`,`vendor_id`) VALUES
('RFQ-2026-002','VEND-001'),('RFQ-2026-002','VEND-003'),('RFQ-2026-002','VEND-006'),
('RFQ-2026-003','VEND-002'),('RFQ-2026-003','VEND-003'),('RFQ-2026-004','VEND-004'),('RFQ-2026-004','VEND-006'),
('RFQ-2026-005','VEND-003'),('RFQ-2026-005','VEND-004');

INSERT INTO `vendor_quotations` (`id`,`rfq_id`,`vendor_id`,`vendor_name`,`submission_date`,`valid_until`,`currency`,`lead_time_days`,`total_amount`,`cost_score`,`quality_score`,`delivery_score`,`total_score`,`status`,`notes`) VALUES
('QUOT-2026-003','RFQ-2026-002','VEND-001','Prime Fabrics Co','2026-08-09','2026-09-10','USD',12,67800,91,96,94,94,'Submitted','High OTIF and recycled-content certification.'),
('QUOT-2026-004','RFQ-2026-003','VEND-002','Continental Rubber Polymer Ltd','2026-08-11','2026-09-12','EUR',15,82400,94,93,91,93,'Accepted','Best commercial offer for foam and TPU package.'),
('QUOT-2026-005','RFQ-2026-003','VEND-003','Global Tech Synthetics Inc','2026-08-11','2026-09-12','USD',19,86100,87,95,84,88,'Rejected','Longer lead time.'),
('QUOT-2026-006','RFQ-2026-004','VEND-004','Lightstrike Innovations GmbH','2026-08-12','2026-09-20','EUR',10,80750,95,94,96,95,'PO Generated','Preferred regional supplier.'),
('QUOT-2026-007','RFQ-2026-004','VEND-006','Alpine Tech Membranes','2026-08-12','2026-09-20','USD',16,83900,90,96,90,92,'Rejected','Higher landed cost.'),
('QUOT-2026-008','RFQ-2026-005','VEND-003','Global Tech Synthetics Inc','2026-08-14','2026-09-25','USD',21,42750,88,92,82,87,'Submitted','Carbon plate pilot bid.'),
('QUOT-2026-009','RFQ-2026-005','VEND-004','Lightstrike Innovations GmbH','2026-08-14','2026-09-25','EUR',13,44100,90,94,94,93,'Submitted','Alternative capacity reservation.'),
('QUOT-2026-010','RFQ-2026-002','VEND-006','Alpine Tech Membranes','2026-08-10','2026-09-10','USD',18,70200,88,94,89,90,'Submitted','Secondary source bid.');

INSERT INTO `quotation_line_items` (`id`,`quotation_id`,`material_id`,`unit_price`,`lead_time_days`,`line_total`) VALUES
('qitem-5','QUOT-2026-003','MAT-1013',7.20,12,34560),('qitem-6','QUOT-2026-003','MAT-1015',5.70,12,31350),
('qitem-7','QUOT-2026-004','MAT-1014',13.20,15,50160),('qitem-8','QUOT-2026-004','MAT-1016',7.80,15,26520),
('qitem-9','QUOT-2026-005','MAT-1014',13.70,19,52060),('qitem-10','QUOT-2026-005','MAT-1016',8.10,19,27540),
('qitem-11','QUOT-2026-006','MAT-1017',15.80,10,44240),('qitem-12','QUOT-2026-006','MAT-1021',12.05,10,26510),
('qitem-13','QUOT-2026-007','MAT-1017',16.40,16,45920),('qitem-14','QUOT-2026-007','MAT-1021',12.72,16,27984),
('qitem-15','QUOT-2026-008','MAT-1020',28.50,21,42750),('qitem-16','QUOT-2026-009','MAT-1020',29.40,13,44100),
('qitem-17','QUOT-2026-010','MAT-1013',7.30,18,35040),('qitem-18','QUOT-2026-010','MAT-1015',5.85,18,32175);

INSERT INTO `purchase_orders` (`id`,`quotation_id`,`rfq_id`,`vendor_id`,`vendor_name`,`created_by_id`,`created_by_name`,`issue_date`,`payment_terms`,`currency`,`subtotal`,`tax_amount`,`grand_total`,`status`,`manager_comments`,`vendor_accepted_date`,`created_at`,`updated_at`) VALUES
('PO-2026-002','QUOT-2026-004','RFQ-2026-003','VEND-002','Continental Rubber Polymer Ltd','usr-102','Sarah Sourcing','2026-08-12','Net 60','EUR',76680,7668,84348,'Pending Approval',NULL,NULL,'2026-08-12 10:00:00','2026-08-12 10:00:00'),
('PO-2026-003','QUOT-2026-006','RFQ-2026-004','VEND-004','Lightstrike Innovations GmbH','usr-102','Sarah Sourcing','2026-08-13','Net 45','EUR',70750,7075,77825,'Approved','Approved for strategic outdoor program.','2026-08-13 15:00:00','2026-08-13 11:00:00','2026-08-13 15:00:00'),
('PO-2026-004','QUOT-2026-003','RFQ-2026-002','VEND-001','Prime Fabrics Co','usr-102','Sarah Sourcing','2026-08-14','Net 30','USD',65910,6591,72501,'Rejected','Rejected pending supplier capacity review.',NULL,'2026-08-14 09:00:00','2026-08-14 12:00:00'),
('PO-2026-005','QUOT-2026-006','RFQ-2026-004','VEND-004','Lightstrike Innovations GmbH','usr-102','Sarah Sourcing','2026-08-15','Net 45','EUR',70750,7075,77825,'Confirmed','Vendor confirmed dispatch schedule.','2026-08-15 16:00:00','2026-08-15 10:00:00','2026-08-15 16:00:00'),
('PO-2026-006','QUOT-2026-009','RFQ-2026-005','VEND-004','Lightstrike Innovations GmbH','usr-102','Sarah Sourcing','2026-08-16','Net 45','EUR',40090,4009,44099,'Pending Approval',NULL,NULL,'2026-08-16 09:00:00','2026-08-16 09:00:00');

INSERT INTO `po_line_items` (`id`,`po_id`,`material_id`,`material_code`,`material_name`,`uom`,`quantity`,`unit_price`,`tax_rate_percent`,`tax_amount`,`line_total`) VALUES
('po-item-3','PO-2026-002','MAT-1014','MAT-1014','Cloudfoam EVA Compound','KG',3800,13.20,10,5016,55176),('po-item-4','PO-2026-002','MAT-1016','MAT-1016','Adiwear TPU Film','METERS',3400,7.80,10,2652,29172),
('po-item-5','PO-2026-003','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,15.80,10,4424,48664),('po-item-6','PO-2026-003','MAT-1021','MAT-1021','Continental Grip Compound B','KG',2200,12.05,10,2651,29161),
('po-item-7','PO-2026-004','MAT-1013','MAT-1013','Adizero Lightweight Mesh','METERS',4800,7.20,10,3456,38016),('po-item-8','PO-2026-004','MAT-1015','MAT-1015','Primegreen Recycled Thread','KG',5500,5.70,10,3135,34485),
('po-item-9','PO-2026-005','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,15.80,10,4424,48664),('po-item-10','PO-2026-005','MAT-1021','MAT-1021','Continental Grip Compound B','KG',2200,12.05,10,2651,29161),
('po-item-11','PO-2026-006','MAT-1020','MAT-1020','Carbon Plate Insert V3','SETS',1500,29.40,10,4410,48510);

INSERT INTO `po_approval_history` (`id`,`po_id`,`approver_id`,`approver_name`,`decision`,`comments`,`decision_date`) VALUES
('appr-102','PO-2026-003','usr-103','Michael Manager','Approved','Strategic outdoor program approved.','2026-08-13 14:30:00'),
('appr-103','PO-2026-004','usr-103','Michael Manager','Rejected','Supplier capacity and commercial assumptions require rework.','2026-08-14 11:45:00');

INSERT INTO `shipments` (`id`,`po_id`,`vendor_id`,`vendor_name`,`carrier_name`,`tracking_number`,`ship_date`,`estimated_delivery_date`,`status`,`notes`,`created_at`) VALUES
('SHIP-2026-002','PO-2026-003','VEND-004','Lightstrike Innovations GmbH','DHL Freight','DHL-LS-260813','2026-08-14','2026-08-18','Shipped','Foam compound shipment with temperature-controlled packaging.','2026-08-14 07:30:00'),
('SHIP-2026-003','PO-2026-005','VEND-004','Lightstrike Innovations GmbH','DB Schenker','DBS-260815','2026-08-16','2026-08-20','Shipped','Confirmed dispatch for outdoor materials.','2026-08-16 08:00:00'),
('SHIP-2026-004','PO-2026-001','VEND-001','Prime Fabrics Co','DHL Supply Chain Express','DHL-889977001-B','2026-08-07','2026-08-10','Delivered','Seed shipment delivered and received.','2026-08-07 08:00:00');

INSERT INTO `goods_receipts` (`id`,`po_id`,`vendor_id`,`vendor_name`,`received_by_user_id`,`received_by_user_name`,`receipt_date`,`has_discrepancy`,`notes`,`created_at`) VALUES
('GR-2026-002','PO-2026-003','VEND-004','Lightstrike Innovations GmbH','usr-104','Wayne Warehouse','2026-08-17',0,'Full quantity accepted after quality inspection.','2026-08-17 10:15:00'),
('GR-2026-003','PO-2026-005','VEND-004','Lightstrike Innovations GmbH','usr-104','Wayne Warehouse','2026-08-18',1,'Small quantity variance identified.','2026-08-18 11:00:00'),
('GR-2026-004','PO-2026-001','VEND-001','Prime Fabrics Co','usr-104','Wayne Warehouse','2026-08-10',0,'Remaining accepted quantities posted.','2026-08-10 09:00:00');

INSERT INTO `goods_receipt_line_items` (`id`,`goods_receipt_id`,`po_detail_id`,`material_id`,`material_code`,`material_name`,`uom`,`ordered_qty`,`received_qty`,`rejected_qty`,`defect_reason`) VALUES
('gr-item-3','GR-2026-002','po-item-5','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,2800,0,NULL),('gr-item-4','GR-2026-002','po-item-6','MAT-1021','MAT-1021','Continental Grip Compound B','KG',2200,2200,0,NULL),
('gr-item-5','GR-2026-003','po-item-9','MAT-1017','MAT-1017','Lightstrike Energy Beads','KG',2800,2750,50,'Damaged packaging'),('gr-item-6','GR-2026-003','po-item-10','MAT-1021','MAT-1021','Continental Grip Compound B','KG',2200,2200,0,NULL),
('gr-item-7','GR-2026-004','po-item-1','MAT-1001','MAT-1001','Primeknit Yarn High-Tenacity','METERS',6000,6000,0,NULL),('gr-item-8','GR-2026-004','po-item-2','MAT-1003','MAT-1003','Recycled Polyester Textile Upper','METERS',2750,2750,0,NULL);

INSERT INTO `discrepancy_tickets` (`id`,`source_type`,`source_id`,`po_id`,`vendor_id`,`vendor_name`,`material_id`,`material_code`,`issue_type`,`description`,`status`,`reported_by`,`resolution_notes`,`created_at`,`updated_at`) VALUES
('DISC-2026-002','Goods Receipt','GR-2026-003','PO-2026-005','VEND-004','Lightstrike Innovations GmbH','MAT-1017','MAT-1017','Quantity Mismatch','50 KG rejected due to damaged packaging.','Open','Wayne Warehouse',NULL,'2026-08-18 11:00:00','2026-08-18 11:00:00'),
('DISC-2026-003','Invoice 3-Way Match','INV-2026-003','PO-2026-003','VEND-004','Lightstrike Innovations GmbH','MAT-1021','MAT-1021','Price Variance','Invoice unit price exceeds approved PO by 2.5%.','Under Review','Alice Accountant','Awaiting supplier credit note.','2026-08-17 15:00:00','2026-08-18 08:30:00');

INSERT INTO `invoices` (`id`,`vendor_invoice_number`,`po_id`,`vendor_id`,`vendor_name`,`invoice_date`,`currency`,`subtotal`,`tax_amount`,`grand_total`,`attachment_url`,`status`,`match_status`,`verified_by`,`verified_date`,`created_at`) VALUES
('INV-2026-002','INV-CP-2026-4421','PO-2026-003','VEND-004','Lightstrike Innovations GmbH','2026-08-17','EUR',70750,7075,77825,NULL,'Submitted','Pending Match',NULL,NULL,'2026-08-17 13:00:00'),
('INV-2026-003','INV-CP-2026-4422','PO-2026-003','VEND-004','Lightstrike Innovations GmbH','2026-08-18','EUR',72518,7251.80,79769.80,NULL,'Discrepancy','Variance Detected',NULL,NULL,'2026-08-18 08:00:00'),
('INV-2026-004','INV-PF-88921','PO-2026-005','VEND-004','Lightstrike Innovations GmbH','2026-08-18','EUR',70750,7075,77825,NULL,'Verified','Matched','Alice Accountant','2026-08-18 09:30:00','2026-08-18 08:30:00');

INSERT INTO `invoice_line_items` (`id`,`invoice_id`,`material_id`,`material_code`,`material_name`,`invoiced_qty`,`unit_price`,`tax_amount`,`line_total`) VALUES
('inv-item-3','INV-2026-002','MAT-1017','MAT-1017','Lightstrike Energy Beads',2800,15.80,4424,48664),('inv-item-4','INV-2026-002','MAT-1021','MAT-1021','Continental Grip Compound B',2200,12.05,2651,29161),
('inv-item-5','INV-2026-003','MAT-1017','MAT-1017','Lightstrike Energy Beads',2800,16.40,4592,50472),('inv-item-6','INV-2026-003','MAT-1021','MAT-1021','Continental Grip Compound B',2200,12.72,2798.40,30782.40),
('inv-item-7','INV-2026-004','MAT-1017','MAT-1017','Lightstrike Energy Beads',2800,15.80,4424,48664),('inv-item-8','INV-2026-004','MAT-1021','MAT-1021','Continental Grip Compound B',2200,12.05,2651,29161);

INSERT INTO `payments` (`id`,`invoice_id`,`po_id`,`vendor_id`,`vendor_name`,`amount`,`currency`,`payment_date`,`recon_account`,`payment_method`,`processed_by_user_id`,`processed_by_user_name`,`reference_number`,`status`,`created_at`) VALUES
('PAY-2026-002','INV-2026-004','PO-2026-005','VEND-004','Lightstrike Innovations GmbH',77825,'EUR','2026-08-18','300700 - Accounts Payable','Electronic Wire','usr-105','Alice Accountant','WIRE-AD-2026-01001','Completed','2026-08-18 10:00:00'),
('PAY-2026-003','INV-2026-002','PO-2026-003','VEND-004','Lightstrike Innovations GmbH',77825,'EUR','2026-08-18','300700 - Accounts Payable','Bank Transfer','usr-105','Alice Accountant','WIRE-AD-2026-01002','Pending','2026-08-18 11:00:00');

INSERT INTO `audit_logs` (`id`,`timestamp`,`employee_id`,`user_name`,`user_role`,`action_type`,`target_table`,`target_id`,`new_value`) VALUES
('log-006','2026-08-07 09:10:00','EMP-101','John Planner','planner','CREATE','Purchase_Requisition','PR-2026-004','Submitted PR-2026-004'),
('log-007','2026-08-07 09:00:00','EMP-102','Sarah Sourcing','sourcing','CREATE','RFQ','RFQ-2026-002','Created RFQ-2026-002 from PR-2026-004 and PR-2026-006'),
('log-008','2026-08-13 14:30:00','EMP-103','Michael Manager','manager','APPROVE','Purchase_Order','PO-2026-003','Approved PO-2026-003'),
('log-009','2026-08-14 11:45:00','EMP-103','Michael Manager','manager','REJECT','Purchase_Order','PO-2026-004','Rejected PO-2026-004'),
('log-010','2026-08-17 10:15:00','EMP-104','Wayne Warehouse','warehouse','POST','Goods_Receipt','GR-2026-002','Posted GR-2026-002 without discrepancy'),
('log-011','2026-08-18 08:00:00','VEND-004','Lightstrike Innovations GmbH','vendor','CREATE','Invoice','INV-2026-003','Submitted invoice with variance'),
('log-012','2026-08-18 09:30:00','EMP-105','Alice Accountant','accountant','VERIFY','Invoice','INV-2026-004','Verified invoice after 3-way match'),
('log-013','2026-08-18 10:00:00','EMP-105','Alice Accountant','accountant','POST','Payment','PAY-2026-002','Executed payment for INV-2026-004');

-- Existing seed lifecycle consistency: PO-001 has shipped/received history, so it is completed.
UPDATE `rfqs` SET `status`='Awarded & PO Issued', `winning_quotation_id`='QUOT-2026-001' WHERE `id`='RFQ-2026-001';
UPDATE `rfqs` SET `status`='Awarded', `winning_quotation_id`='QUOT-2026-004' WHERE `id`='RFQ-2026-003';
UPDATE `rfqs` SET `status`='Awarded & PO Issued', `winning_quotation_id`='QUOT-2026-006' WHERE `id`='RFQ-2026-004';
UPDATE `vendor_quotations` SET `status`='PO Generated' WHERE `id`='QUOT-2026-001';
UPDATE `purchase_orders` SET `status`='Completed' WHERE `id`='PO-2026-001';
UPDATE `shipments` SET `status`='Delivered' WHERE `id`='SHIP-2026-001';

-- 23. Role Permissions
INSERT INTO `role_permissions` (`id`, `module_name`, `can_create`, `can_read`, `can_update`, `can_delete`) VALUES
('perm-1', 'Material Master', 1, 1, 1, 1),
('perm-2', 'Supplier Master', 1, 1, 1, 0),
('perm-3', 'Purchase Requisition', 1, 1, 1, 1),
('perm-4', 'RFQ & Bidding', 1, 1, 1, 1),
('perm-5', 'Purchase Order', 1, 1, 1, 1),
('perm-6', 'Goods Receipt', 1, 1, 1, 0),
('perm-7', 'Invoice 3-Way Match', 1, 1, 1, 0),
('perm-8', 'Payments', 1, 1, 1, 0),
('perm-9', 'User & Role Admin', 1, 1, 1, 1);
