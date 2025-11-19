import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the absolute path to the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

// Create data directory in project root to ensure data persistence
const dataDir = path.join(projectRoot, 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory at:', dataDir);
}

const dbPath = path.join(dataDir, 'trading_journal.db');
console.log('💾 Database location:', dbPath);

const db = new Database(dbPath);

// Configure SQLite for better performance and reliability
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('synchronous = NORMAL'); // Balance between safety and performance

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trading Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      account_type TEXT CHECK (account_type IN ('LIVE', 'DEMO', 'PROP_FIRM', 'FUNDED')),
      broker TEXT,
      initial_balance REAL NOT NULL,
      current_balance REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trades table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER REFERENCES trading_accounts(id) ON DELETE SET NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
      entry_date DATETIME NOT NULL,
      exit_date DATETIME,
      entry_price REAL NOT NULL,
      exit_price REAL,
      quantity REAL NOT NULL,
      stop_loss REAL,
      take_profit REAL,
      pnl REAL,
      pnl_percentage REAL,
      fees REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
      strategy TEXT,
      setup TEXT,
      timeframe TEXT,
      market_type TEXT CHECK (market_type IN ('STOCKS', 'FOREX', 'CRYPTO', 'FUTURES', 'OPTIONS')),
      notes TEXT,
      entry_reasoning TEXT,
      exit_reasoning TEXT,
      mistakes TEXT,
      lessons_learned TEXT,
      emotional_state TEXT,
      confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
      screenshot_url TEXT,
      broker TEXT,
      account_balance REAL,
      risk_amount REAL,
      risk_percentage REAL,
      reward_risk_ratio REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trade tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trade_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    )
  `);

  // Trade tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trade_tag_mappings (
      trade_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES trade_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (trade_id, tag_id)
    )
  `);

  // Trading plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily journal entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      market_conditions TEXT,
      emotional_state TEXT,
      pre_market_notes TEXT,
      post_market_notes TEXT,
      lessons_learned TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // User settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      default_risk_percentage REAL DEFAULT 1.0,
      default_account_size REAL,
      currency TEXT DEFAULT 'USD',
      timezone TEXT DEFAULT 'UTC',
      theme TEXT DEFAULT 'light',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trading strategies/frameworks library
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('PRICE_ACTION', 'TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'PATTERN', 'INDICATOR', 'CUSTOM')),
      entry_rules TEXT,
      exit_rules TEXT,
      risk_management TEXT,
      timeframes TEXT,
      markets TEXT,
      win_rate REAL,
      avg_rr REAL,
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      losing_trades INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ SQLite database initialized at:', dbPath);
}

// Initialize on startup
initializeDatabase();

// Helper function to convert PostgreSQL-style queries to SQLite
export const query = async (text: string, params: any[] = []) => {
  try {
    // Replace PostgreSQL $1, $2, etc. with ? for SQLite
    let sqliteQuery = text;
    let sqliteParams = [...params];

    // Replace $1, $2, etc. with ?
    sqliteQuery = text.replace(/\$\d+/g, () => '?');

    // Handle RETURNING clause - check BEFORE removing
    const hasReturning = /RETURNING\s+\*/i.test(text);
    sqliteQuery = sqliteQuery.replace(/RETURNING\s+\*/i, '');

    if (text.includes('UPDATE') && text.includes('RETURNING')) {
      console.log('🔍 Original query has RETURNING:', text.includes('RETURNING'));
      console.log('🔍 hasReturning detected:', hasReturning);
    }

    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sqliteQuery);
      const rows = stmt.all(...sqliteParams);
      return { rows };
    } else if (sqliteQuery.trim().toUpperCase().startsWith('INSERT')) {
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...sqliteParams);

      if (hasReturning) {
        // Get the inserted row
        const table = sqliteQuery.match(/INSERT INTO (\w+)/i)?.[1];
        if (table) {
          const selectStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
          const row = selectStmt.get(info.lastInsertRowid);
          return { rows: [row] };
        }
      }

      return { rows: [{ id: info.lastInsertRowid }] };
    } else if (sqliteQuery.trim().toUpperCase().startsWith('UPDATE')) {
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...sqliteParams);

      console.log('🔄 UPDATE executed, changes:', info.changes);

      if (hasReturning) {
        // Extract table name and WHERE clause to get the updated row
        const tableMatch = sqliteQuery.match(/UPDATE (\w+)/i);
        const whereMatch = text.match(/WHERE (.+?) RETURNING/i);

        if (tableMatch && whereMatch) {
          const table = tableMatch[1];
          const whereClause = whereMatch[1];

          // Count how many placeholders are in the WHERE clause
          const placeholderCount = (whereClause.match(/\$\d+/g) || []).length;

          // Build the SELECT query with the same WHERE clause
          let selectQuery = `SELECT * FROM ${table} WHERE ${whereClause}`;
          selectQuery = selectQuery.replace(/\$\d+/g, () => '?');

          // Get the params used in the WHERE clause (last N params)
          const whereParams = sqliteParams.slice(-placeholderCount);

          console.log('🔍 SELECT query:', selectQuery);
          console.log('🔍 WHERE params:', whereParams);
          console.log('🔍 Total params count:', sqliteParams.length, 'WHERE params count:', placeholderCount);

          const selectStmt = db.prepare(selectQuery);
          const rows = selectStmt.all(...whereParams);

          console.log('🔍 Rows returned:', rows.length);
          if (rows.length === 0) {
            // Check if the record exists at all
            const checkQuery = `SELECT id, user_id FROM ${table} WHERE id = ?`;
            const checkStmt = db.prepare(checkQuery);
            const checkRow = checkStmt.get(whereParams[0]);
            console.log('🔍 Record check (by id only):', checkRow);
          }

          return { rows };
        }
      }

      return { rows: [], rowCount: info.changes };
    } else if (sqliteQuery.trim().toUpperCase().startsWith('DELETE')) {
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...sqliteParams);
      return { rows: [], rowCount: info.changes };
    } else {
      const stmt = db.prepare(sqliteQuery);
      stmt.run(...sqliteParams);
      return { rows: [] };
    }
  } catch (error) {
    console.error('SQLite query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

export default db;
export { db };
