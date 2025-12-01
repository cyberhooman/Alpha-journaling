import pg from 'pg';
const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
});

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database schema...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trading Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        account_type TEXT CHECK (account_type IN ('LIVE', 'DEMO', 'PROP_FIRM', 'FUNDED')),
        broker TEXT,
        initial_balance DECIMAL(15, 2) NOT NULL,
        current_balance DECIMAL(15, 2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trades table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES trading_accounts(id) ON DELETE SET NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
        entry_date TIMESTAMP NOT NULL,
        exit_date TIMESTAMP,
        entry_price DECIMAL(15, 8),
        exit_price DECIMAL(15, 8),
        quantity DECIMAL(15, 8),
        stop_loss DECIMAL(15, 8),
        take_profit DECIMAL(15, 8),
        pnl DECIMAL(15, 2),
        pnl_percentage DECIMAL(10, 4),
        fees DECIMAL(15, 2) DEFAULT 0,
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
        account_balance DECIMAL(15, 2),
        risk_amount DECIMAL(15, 2),
        risk_percentage DECIMAL(10, 4),
        reward_risk_ratio DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trade tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )
    `);

    // Trade tags junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_tag_mappings (
        trade_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES trade_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (trade_id, tag_id)
      )
    `);

    // Trading plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily journal entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_journals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        market_conditions TEXT,
        emotional_state TEXT,
        pre_market_notes TEXT,
        post_market_notes TEXT,
        lessons_learned TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);

    // User settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_risk_percentage DECIMAL(10, 4) DEFAULT 1.0,
        default_account_size DECIMAL(15, 2),
        currency TEXT DEFAULT 'USD',
        timezone TEXT DEFAULT 'UTC',
        theme TEXT DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trading strategies/frameworks library
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_strategies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT CHECK (category IN ('PRICE_ACTION', 'TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'PATTERN', 'INDICATOR', 'CUSTOM')),
        entry_rules TEXT,
        exit_rules TEXT,
        risk_management TEXT,
        timeframes TEXT,
        markets TEXT,
        win_rate DECIMAL(10, 4),
        avg_rr DECIMAL(10, 2),
        total_trades INTEGER DEFAULT 0,
        winning_trades INTEGER DEFAULT 0,
        losing_trades INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
      CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
      CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
      CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_trade_tags_user_id ON trade_tags(user_id);
    `);

    console.log('✅ PostgreSQL database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Query function compatible with existing code
export const query = async (text: string, params: any[] = []) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default pool;
export { pool as db };
