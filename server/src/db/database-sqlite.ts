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
      entry_price REAL,
      exit_price REAL,
      quantity REAL,
      stop_loss REAL,
      take_profit REAL,
      pnl REAL,
      mfe REAL,
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

  // Token blacklist for logout functionality
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Create performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
    CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
    CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
    CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
    CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_trade_tags_user ON trade_tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tag_mappings_trade ON trade_tag_mappings(trade_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tag_mappings_tag ON trade_tag_mappings(tag_id);
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
  `);

  console.log('✅ SQLite database initialized at:', dbPath);
}

// Run migrations for existing databases
function runMigrations() {
  // Check if migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration 001: Make entry_price and quantity nullable
  const migration001Applied = db.prepare(
    'SELECT * FROM schema_migrations WHERE name = ?'
  ).get('001_make_entry_price_quantity_nullable');

  if (!migration001Applied) {
    console.log('🔄 Running migration: Make entry_price and quantity nullable...');

    // Check if the trades table has the NOT NULL constraints
    const tableInfo = db.pragma('table_info(trades)') as Array<{ name: string; notnull: number }>;
    const entryPriceCol = tableInfo.find(col => col.name === 'entry_price');
    const quantityCol = tableInfo.find(col => col.name === 'quantity');

    if ((entryPriceCol && entryPriceCol.notnull === 1) || (quantityCol && quantityCol.notnull === 1)) {
      // Need to recreate the table without NOT NULL constraints
      db.exec(`
        -- Create new table with nullable columns
        CREATE TABLE trades_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          account_id INTEGER REFERENCES trading_accounts(id) ON DELETE SET NULL,
          symbol TEXT NOT NULL,
          side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
          entry_date DATETIME NOT NULL,
          exit_date DATETIME,
          entry_price REAL,
          exit_price REAL,
          quantity REAL,
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
        );

        -- Copy data from old table (explicitly list columns to handle schema differences)
        INSERT INTO trades_new (
          id, user_id, account_id, symbol, side, entry_date, exit_date,
          entry_price, exit_price, quantity, stop_loss, take_profit, pnl, pnl_percentage,
          fees, status, strategy, setup, timeframe, market_type, notes, entry_reasoning,
          exit_reasoning, mistakes, lessons_learned, emotional_state, confidence_level,
          screenshot_url, broker, account_balance, risk_amount, risk_percentage,
          reward_risk_ratio, created_at, updated_at
        )
        SELECT
          id, user_id, account_id, symbol, side, entry_date, exit_date,
          entry_price, exit_price, quantity, stop_loss, take_profit, pnl, pnl_percentage,
          fees, status, strategy, setup, timeframe, market_type, notes, entry_reasoning,
          exit_reasoning, mistakes, lessons_learned, emotional_state, confidence_level,
          screenshot_url, broker, account_balance, risk_amount, risk_percentage,
          reward_risk_ratio, created_at, updated_at
        FROM trades;

        -- Drop old table
        DROP TABLE trades;

        -- Rename new table
        ALTER TABLE trades_new RENAME TO trades;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
        CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
        CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
        CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
        CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      `);

      console.log('✅ Migration completed: entry_price and quantity are now nullable');
    } else {
      console.log('✅ Migration skipped: columns already nullable');
    }

    // Record migration as applied
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run('001_make_entry_price_quantity_nullable');
  }

  // Migration 002: Rename pnl_percentage to mfe
  const migration002Applied = db.prepare(
    'SELECT * FROM schema_migrations WHERE name = ?'
  ).get('002_rename_pnl_percentage_to_mfe');

  if (!migration002Applied) {
    console.log('🔄 Running migration: Rename pnl_percentage to mfe...');

    // Check if the trades table has pnl_percentage column
    const tableInfo = db.pragma('table_info(trades)') as Array<{ name: string }>;
    const hasPnlPercentage = tableInfo.some(col => col.name === 'pnl_percentage');
    const hasMfe = tableInfo.some(col => col.name === 'mfe');

    if (hasPnlPercentage && !hasMfe) {
      // SQLite doesn't support RENAME COLUMN in older versions, so we add a new column
      db.exec(`ALTER TABLE trades ADD COLUMN mfe REAL`);
      // Copy data from pnl_percentage to mfe (optional - only if you want to migrate existing data)
      // db.exec(`UPDATE trades SET mfe = pnl_percentage`);
      console.log('✅ Migration completed: Added mfe column');
    } else if (!hasMfe) {
      // No pnl_percentage column, just add mfe
      db.exec(`ALTER TABLE trades ADD COLUMN mfe REAL`);
      console.log('✅ Migration completed: Added mfe column');
    } else {
      console.log('✅ Migration skipped: mfe column already exists');
    }

    // Record migration as applied
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run('002_rename_pnl_percentage_to_mfe');
  }

  // Migration 003: Add screenshot_url_2 for second screenshot
  const migration003Applied = db.prepare(
    'SELECT * FROM schema_migrations WHERE name = ?'
  ).get('003_add_screenshot_url_2');

  if (!migration003Applied) {
    console.log('🔄 Running migration: Add screenshot_url_2...');

    const tableInfo = db.pragma('table_info(trades)') as Array<{ name: string }>;
    const hasScreenshotUrl2 = tableInfo.some(col => col.name === 'screenshot_url_2');

    if (!hasScreenshotUrl2) {
      db.exec(`ALTER TABLE trades ADD COLUMN screenshot_url_2 TEXT`);
      console.log('✅ Migration completed: Added screenshot_url_2 column');
    } else {
      console.log('✅ Migration skipped: screenshot_url_2 column already exists');
    }

    // Record migration as applied
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run('003_add_screenshot_url_2');
  }
}

// Initialize on startup
initializeDatabase();
runMigrations();

// Whitelist of valid table names to prevent SQL injection
const VALID_TABLES = new Set([
  'users',
  'trading_accounts',
  'trades',
  'trade_tags',
  'trade_tag_mappings',
  'trading_plans',
  'daily_journals',
  'user_settings',
  'token_blacklist',
  'trading_strategies',
  'schema_migrations'
]);

function isValidTableName(tableName: string): boolean {
  return VALID_TABLES.has(tableName);
}

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
        if (table && isValidTableName(table)) {
          const selectStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
          const row = selectStmt.get(info.lastInsertRowid);
          return { rows: [row] };
        }
      }

      return { rows: [{ id: info.lastInsertRowid }] };
    } else if (sqliteQuery.trim().toUpperCase().startsWith('UPDATE')) {
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...sqliteParams);

      if (hasReturning) {
        // Extract table name and WHERE clause to get the updated row
        const tableMatch = sqliteQuery.match(/UPDATE (\w+)/i);
        // Use [\s\S]+? to match any character including newlines (non-greedy)
        const whereMatch = text.match(/WHERE\s+([\s\S]+?)\s+RETURNING/i);

        if (tableMatch && whereMatch) {
          const table = tableMatch[1];

          // Validate table name to prevent SQL injection
          if (!isValidTableName(table)) {
            throw new Error(`Invalid table name: ${table}`);
          }

          const whereClause = whereMatch[1];

          // Count how many placeholders are in the WHERE clause
          const placeholderCount = (whereClause.match(/\$\d+/g) || []).length;

          // Build the SELECT query with the same WHERE clause
          let selectQuery = `SELECT * FROM ${table} WHERE ${whereClause}`;
          selectQuery = selectQuery.replace(/\$\d+/g, () => '?');

          // Get the params used in the WHERE clause (last N params)
          const whereParams = sqliteParams.slice(-placeholderCount);

          const selectStmt = db.prepare(selectQuery);
          const rows = selectStmt.all(...whereParams);

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
