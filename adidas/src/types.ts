export type UserRole = 
  | 'planner'
  | 'sourcing'
  | 'manager'
  | 'warehouse'
  | 'accountant'
  | 'admin'
  | 'vendor';

export enum SystemRole {
  Planner = 'planner',
  Sourcing = 'sourcing',
  Manager = 'manager',
  Warehouse = 'warehouse',
  Accountant = 'accountant',
  Admin = 'admin',
  Vendor = 'vendor',
}

export type PortalType = 'internal' | 'external';

export interface User {
  id: string;
  employeeId: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  portal: PortalType;
  department: string;
  vendorId?: string; // If user is vendor
  active: boolean;
  createdAt: string;
}

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  uom: string; // Unit of Measure (e.g. PCS, METERS, KG, PAIRS)
  forecastQty: number;
  currentStockQty: number;
  safetyStockQty: number;
  standardCost: number;
  supplierId: string;
  lastUpdated: string;
}

export type TariffImpactLevel = 'High' | 'Medium' | 'Low';

export interface Supplier {
  id: string;
  vendorCode: string;
  name: string;
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  companyCode: string; // e.g. ADVN
  purchasingOrg: string; // e.g. SOUR
  reconAccount: string; // e.g. 300700 - Accounts Payable
  currency: 'USD' | 'EUR' | 'VND';
  paymentTerms: 'Net 30' | 'Net 60' | 'COD';
  tariffImpactLevel: TariffImpactLevel; // Enum 'High' | 'Medium' | 'Low'
  tariffFlag122?: boolean; // legacy fallback
  status: 'Active' | 'Pending Approval' | 'Inactive';
  rating: number; // 1-100
  createdAt: string;
}

export interface PRDetailItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  quantity: number;
  estimatedUnitPrice: number;
}

export interface PurchaseRequisition {
  id: string; // e.g. PR-2026-001
  creatorId: string;
  creatorName: string;
  requestDate: string;
  requiredDeliveryDate: string;
  status: 'Draft' | 'Submitted' | 'Processed' | 'Cancelled';
  items: PRDetailItem[];
  totalEstimatedCost: number;
  rfqId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQDetailItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  quantity: number;
  targetPrice?: number;
}

export interface RFQ {
  id: string; // e.g. RFQ-2026-001
  title: string;
  prIds: string[]; // Linked PRs
  createdById: string;
  createdByName: string;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Published' | 'Under Review' | 'Awarded' | 'Closed';
  items: RFQDetailItem[];
  invitedVendorIds: string[];
  winningQuotationId?: string;
  createdAt: string;
}

export interface QuotationLineItem {
  materialId: string;
  unitPrice: number;
  leadTimeDays: number;
  lineTotal: number;
}

export interface VendorQuotation {
  id: string; // e.g. QUOT-2026-001
  rfqId: string;
  vendorId: string;
  vendorName: string;
  submissionDate: string;
  validUntil: string;
  currency: string;
  items: QuotationLineItem[];
  totalAmount: number;
  leadTimeDays: number;
  costScore: number; // 0-100
  qualityScore: number; // 0-100
  deliveryScore: number; // 0-100
  totalScore: number; // 0-100
  status: 'Submitted' | 'Accepted' | 'Rejected';
  notes?: string;
}

export interface PODetailItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  taxAmount: number;
  lineTotal: number;
}

export interface POApprovalHistory {
  id: string;
  poId: string;
  approverId: string;
  approverName: string;
  decision: 'Approved' | 'Rejected';
  comments: string;
  decisionDate: string;
}

export interface PurchaseOrder {
  id: string; // e.g. PO-2026-001
  quotationId: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  createdById: string;
  createdByName: string;
  issueDate: string;
  paymentTerms: string;
  currency: string;
  items: PODetailItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Confirmed' | 'Shipped' | 'Partially Received' | 'Completed' | 'Cancelled';
  managerComments?: string;
  vendorAcceptedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string; // e.g. SHIP-2026-001
  poId: string;
  vendorId: string;
  vendorName: string;
  carrierName: string;
  trackingNumber: string;
  shipDate: string;
  estimatedDeliveryDate: string;
  status: 'In Production' | 'Shipped' | 'Delivered';
  notes?: string;
}

export interface GoodsReceiptItem {
  id: string;
  poDetailId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  orderedQty: number;
  receivedQty: number; // Accepted qty
  rejectedQty: number; // Defective qty
  defectReason?: string;
}

export interface GoodsReceipt {
  id: string; // e.g. GR-2026-001
  poId: string;
  vendorId: string;
  vendorName: string;
  receivedByUserId: string;
  receivedByUserName: string;
  receiptDate: string;
  items: GoodsReceiptItem[];
  hasDiscrepancy: boolean;
  notes?: string;
  createdAt: string;
}

export interface DiscrepancyTicket {
  id: string; // e.g. DISC-2026-001
  sourceType: 'Goods Receipt' | 'Invoice 3-Way Match';
  sourceId: string; // GR ID or Invoice ID
  poId: string;
  vendorId: string;
  vendorName: string;
  materialId?: string;
  materialCode?: string;
  issueType: 'Damaged Items' | 'Quantity Mismatch' | 'Price Variance' | 'Tax Variance' | 'Specification Deviation';
  description: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  resolutionNotes?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetailItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  invoicedQty: number;
  unitPrice: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string; // e.g. INV-2026-001
  vendorInvoiceNumber: string; // Vendor's own invoice ref number
  poId: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  currency: string;
  items: InvoiceDetailItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  attachmentUrl?: string;
  status: 'Submitted' | 'Verified' | 'Discrepancy' | 'Paid' | 'Cancelled';
  matchStatus?: 'Matched' | 'Variance Detected';
  verifiedBy?: string;
  verifiedDate?: string;
  createdAt: string;
}

export interface Payment {
  id: string; // e.g. PAY-2026-001
  invoiceId: string;
  poId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  reconAccount: string; // e.g. 300700 - Accounts Payable
  paymentMethod: 'Bank Transfer' | 'Corporate Credit' | 'Check' | 'Electronic Wire';
  processedByUserId: string;
  processedByUserName: string;
  referenceNumber: string;
  status: 'Completed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  employeeId: string;
  userName: string;
  userRole: string;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'POST' | 'LOGIN';
  targetTable: string;
  targetId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface RolePermission {
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
