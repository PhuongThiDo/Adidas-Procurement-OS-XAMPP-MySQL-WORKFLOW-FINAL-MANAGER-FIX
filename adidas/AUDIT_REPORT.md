# Adidas Procurement OS - XAMPP/MySQL Audit Report

## Current status

This build was audited source-by-source and corrected for the blank-page failures caused by MySQL numeric/DECIMAL values being returned as strings and then passed to JavaScript number methods such as `toFixed()` / `toLocaleString()`.

## Important fixes in this build

- Normalized MySQL DECIMAL/INT values to JavaScript numbers in the repository.
- Added a second normalization layer in `App.tsx` so all shared role data is numeric-safe before rendering.
- Added a React `ErrorBoundary` so a component exception produces an actionable error screen instead of a completely white page.
- Added visible MySQL/API loading and error states with a Retry action.
- Fixed role-specific initial navigation after refresh/login.
- Added a fallback route for stale/unknown module IDs.
- Made Material Master supplier selection resilient when supplier data arrives asynchronously.
- Hardened Purchase Requisition and Purchase Order numeric rendering.
- Hardened Vendor PO delivery numeric rendering.
- Added the database/SQL console to the Admin navigation.
- Kept all business data sourced from the shared MySQL API state.

## Database

Database name: `adidas_procurement`

Connection defaults:

- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: empty

Import `database.sql` in phpMyAdmin.

## Runtime

```text
npm install
npm install mysql2
npm run dev
```

Open `http://localhost:3000`.

## Runtime limitation

The development environment used for this audit does not provide the user's XAMPP MySQL service and npm registry access was unavailable during the final package build attempt. Therefore the final local-machine MySQL handshake must still be performed on the user's Windows/XAMPP installation.

## Workflow Final Changes

- Added Material Master -> Create PR action and callback into the real PR screen.
- Enforced PR -> RFQ rule: only existing `Submitted` PRs can be grouped by Sourcing.
- Enforced PO -> Vendor confirmation -> Shipment lifecycle. Vendors cannot accept Pending Approval POs or dispatch before confirmation.
- Removed Manager's incorrect direct navigation to Warehouse Goods Receipt and replaced it with the correct next-owner workflow guidance.
- Expanded MySQL seed data substantially across all procurement entities.
- Fixed duplicate `fk_pr_items_material` schema constraint in `database.sql`.
- Made existing RFQ/quotation/PO seed lifecycle statuses consistent with downstream shipment/receipt/payment records.
