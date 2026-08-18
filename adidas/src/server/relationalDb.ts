import "dotenv/config";
import mysql, { Connection } from "mysql2/promise";
import fs from "fs";
import path from "path";

const DB_NAME = process.env.DB_NAME || "adidas_procurement";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

let connection: Connection | null = null;
let initPromise: Promise<Connection> | null = null;

async function connect(): Promise<Connection> {
  if (connection) return connection;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const bootstrap = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });

    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrap.end();

    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // If the database is empty, bootstrap it from the checked-in MySQL schema.
    const [rows] = await conn.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ?`,
      [DB_NAME]
    );
    if (Number(rows[0]?.count || 0) === 0) {
      const schemaPath = path.join(process.cwd(), "database.sql");
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`MySQL database '${DB_NAME}' is empty and database.sql was not found.`);
      }

      let sql = fs.readFileSync(schemaPath, "utf8")
        .replace(/^\s*CREATE DATABASE[\s\S]*?;\s*/i, "")
        .replace(/^\s*USE\s+`?adidas_procurement`?\s*;\s*/im, "");

      await conn.query(sql);
      console.log(`MySQL schema/data initialized from ${schemaPath}`);
    }

    connection = conn;
    return conn;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    connection = null;
    throw error;
  }
}

// Kept as a compatibility layer for procurementRepo. It now returns a mysql2 connection.
export async function getRelationalDB(): Promise<any> {
  return connect();
}

export async function queryAll(db: any, sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await db.query(sql, params);
  return rows as any[];
}

export async function queryOne(db: any, sql: string, params: any[] = []): Promise<any | null> {
  const [rows] = await db.query(sql, params);
  return (rows as any[])[0] || null;
}

export async function executeSql(db: any, sql: string, params: any[] = []): Promise<any> {
  const [result] = await db.execute(sql, params);
  return result;
}

export async function persistDB(_db: any): Promise<void> {
  // MySQL persists changes immediately; retained for backwards compatibility.
}

export async function resetRelationalDB(): Promise<void> {
  const db = await connect();
  const schemaPath = path.join(process.cwd(), "database.sql");
  if (!fs.existsSync(schemaPath)) {
    throw new Error("database.sql not found.");
  }

  const sql = fs.readFileSync(schemaPath, "utf8");
  await db.query(sql);
}

export async function closeRelationalDB(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
  }
}
