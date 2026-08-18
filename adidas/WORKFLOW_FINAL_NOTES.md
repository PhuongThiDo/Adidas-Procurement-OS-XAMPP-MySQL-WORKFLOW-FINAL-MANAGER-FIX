# Adidas Procurement OS - Workflow Final

## Cross-role workflow

1. PLANNER creates/maintains Material Master records.
2. PLANNER clicks CREATE PR on a material or opens Create Purchase Requisition.
3. CREATE PR saves to `purchase_requisitions` + `pr_line_items`.
4. SUBMITTED PR appears in SOURCING PR Worklist.
5. SOURCING groups Submitted PRs into an RFQ.
6. VENDOR sees invited RFQs and submits a quotation.
7. SOURCING selects a submitted quotation and converts it to a PO.
8. MANAGER sees Pending Approval POs and Approves/Rejects them.
9. After Approved, VENDOR accepts the PO.
10. After Confirmed, VENDOR creates Shipment/ASN.
11. WAREHOUSE posts Goods Receipt; stock and discrepancy records are updated.
12. ACCOUNTANT performs 3-Way Match and processes Payment only when eligible.

All mutation paths persist through the Express API into MySQL and the UI refetches/synchronizes after successful mutation.
