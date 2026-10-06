const path = require('path');
const fs = require('fs');

let dbDriver = null;
let isPostgres = false;

// Check if PostgreSQL is configured via env
if (process.env.PGHOST || process.env.PGDATABASE || process.env.USE_POSTGRES === 'true') {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'storesync',
    });
    isPostgres = true;
    console.log('Connected to PostgreSQL Database');
    dbDriver = {
      query: async (text, params = []) => {
        // Convert ? placeholders to $1, $2 for Postgres if needed
        let paramIndex = 1;
        const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await pool.query(pgText, params);
        return { rows: res.rows, lastID: res.rows[0]?.id || null, changes: res.rowCount };
      }
    };
  } catch (err) {
    console.warn('PostgreSQL connection failed, falling back to embedded SQLite driver:', err.message);
  }
}

if (!dbDriver) {
  // Use Node.js built-in sqlite module or sqlite3
  let DatabaseSync;
  try {
    DatabaseSync = require('node:sqlite').DatabaseSync;
  } catch (e) {
    console.log('node:sqlite not available natively, checking sqlite3 package...');
  }

  const dbPath = path.join(__dirname, '..', '..', 'storesync.db');

  if (DatabaseSync) {
    const sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');

    dbDriver = {
      query: async (sql, params = []) => {
        const trimmed = sql.trim();
        if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
          const stmt = sqliteDb.prepare(sql);
          const rows = stmt.all(...params);
          return { rows };
        } else {
          const stmt = sqliteDb.prepare(sql);
          const info = stmt.run(...params);
          return { rows: [], lastID: Number(info.lastInsertRowid), changes: Number(info.changes) };
        }
      },
      exec: async (sql) => {
        sqliteDb.exec(sql);
      }
    };
    console.log(`Connected to embedded SQLite Database at ${dbPath}`);
  } else {
    // Standard SQLite fallback using sqlite3
    const sqlite3 = require('sqlite3').verbose();
    const sqliteDb = new sqlite3.Database(dbPath);
    sqliteDb.run('PRAGMA foreign_keys = ON;');

    dbDriver = {
      query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          const trimmed = sql.trim();
          if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
            sqliteDb.all(sql, params, (err, rows) => {
              if (err) return reject(err);
              resolve({ rows });
            });
          } else {
            sqliteDb.run(sql, params, function(err) {
              if (err) return reject(err);
              resolve({ rows: [], lastID: this.lastID, changes: this.changes });
            });
          }
        });
      },
      exec: (sql) => {
        return new Promise((resolve, reject) => {
          sqliteDb.exec(sql, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      }
    };
    console.log(`Connected to sqlite3 Database file at ${dbPath}`);
  }
}

// Unified Async Helper Functions
async function query(sql, params = []) {
  return await dbDriver.query(sql, params);
}

async function get(sql, params = []) {
  const result = await dbDriver.query(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await dbDriver.query(sql, params);
  return result.rows || [];
}

async function run(sql, params = []) {
  const result = await dbDriver.query(sql, params);
  return { lastID: result.lastID, changes: result.changes };
}

module.exports = {
  query,
  get,
  all,
  run,
  isPostgres
};
