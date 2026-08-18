# Adidas Procurement OS — XAMPP + MySQL Local

## Architecture

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript (`tsx`)
- Database: MySQL/MariaDB from XAMPP, accessed through `mysql2`
- Database administration: phpMyAdmin
- Development URL: `http://localhost:3000`

Apache is not required for the React/Express application itself. You may keep Apache running in XAMPP, but Node/Express serves the application on port 3000.

## 1. Start XAMPP

Start:

- MySQL — required
- Apache — optional for this application

Open phpMyAdmin:

`http://localhost/phpmyadmin/`

## 2. Create the database

The project database name is:

`adidas_procurement`

Import:

`database.sql`

The SQL file creates the database, tables, foreign keys, indexes/constraints and seed data.

## 3. Environment

Copy `.env.example` to `.env`.

Default local configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=adidas_procurement
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

This matches a standard XAMPP MySQL installation where `root` has no password.

If your XAMPP MySQL root account has a password, set `DB_PASSWORD` accordingly.

## 4. Install and run

From the project directory:

```bash
npm install
npm install mysql2
npm run dev
```

Then open:

`http://localhost:3000`

For a production-style local run:

```bash
npm install
npm run build
npm start
```

## 5. MySQL connection behavior

`src/server/relationalDb.ts` is the single MySQL connection layer.

The backend:

1. Connects to `localhost:3306`.
2. Creates `adidas_procurement` if it does not exist.
3. Uses MySQL tables instead of the previous SQLite/sql.js database.
4. Loads `database.sql` automatically if the database has no tables.
5. Uses InnoDB foreign-key constraints.
6. Persists every INSERT/UPDATE/DELETE directly in MySQL.

The checked-in SQLite files under `data/` are no longer used by the application.

## 6. API and frontend

The frontend uses relative API paths such as:

`/api/auth/login`

Because Express runs Vite in middleware mode during `npm run dev`, frontend and backend share the same origin:

`http://localhost:3000`

The SSE endpoint for live refresh is:

`/api/events`

## 7. Common local errors

### ECONNREFUSED 127.0.0.1:3306

Start MySQL in XAMPP and confirm that port 3306 is available.

### ER_ACCESS_DENIED_ERROR

Check `DB_USER` and `DB_PASSWORD` in `.env`.

### ER_BAD_DB_ERROR / Unknown database

Create/import `adidas_procurement` through phpMyAdmin, or restart the backend; the application can create the database itself when the MySQL account has permission.

### Table doesn't exist

Import `database.sql` into `adidas_procurement`, then restart `npm run dev`.

### Port 3000 already in use

Change `PORT` in `.env`, for example:

```env
PORT=3001
```

Then open `http://localhost:3001`.

## Roles included

The seed database includes the existing application roles:

- planner
- sourcing
- manager
- warehouse
- accountant
- admin
- vendor

No existing page/module has been intentionally removed.

## Workflow Final - Demo Data

The project uses one MySQL source of truth (`adidas_procurement`). The intended workflow is:

PLANNER -> Material Master -> Create PR -> Submitted -> SOURCING -> RFQ -> VENDOR Quotation -> SOURCING Award -> PO -> MANAGER Approval -> VENDOR Confirmation -> Shipment -> WAREHOUSE Goods Receipt -> ACCOUNTANT 3-Way Match -> Payment.

The Material Master now exposes a `CREATE PR` action for each material so the master-data-to-demand flow is explicit. Manager approval no longer links directly to Warehouse execution; the next process owner is Vendor, then Warehouse, then Accountant.

The SQL seed contains an expanded cross-role demo dataset with multiple PRs, RFQs, quotations, POs in different lifecycle states, shipments, goods receipts, discrepancies, invoices, payments, and audit logs.
