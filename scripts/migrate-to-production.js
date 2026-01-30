/**
 * Migration script to export local data and import to production
 *
 * Usage:
 *   1. Run: node scripts/migrate-to-production.js export
 *   2. Register/login on production
 *   3. Run: node scripts/migrate-to-production.js import <token>
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PRODUCTION_API = 'https://journaling-backend.up.railway.app/api';
const LOCAL_DB_PATH = path.join(__dirname, '..', 'server', 'data', 'trading_journal.db');
const EXPORT_FILE = path.join(__dirname, 'exported-data.json');

async function exportData() {
  console.log('📦 Exporting data from local database...\n');

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.error('❌ Local database not found at:', LOCAL_DB_PATH);
    process.exit(1);
  }

  const db = new Database(LOCAL_DB_PATH, { readonly: true });

  // Get all users
  const users = db.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} user(s)`);

  const exportData = { users: [] };

  for (const user of users) {
    const userData = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      trades: [],
      accounts: [],
      tags: [],
      strategies: [],
      journals: [],
      plans: [],
      settings: null
    };

    // Get trades
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ?').all(user.id);
    userData.trades = trades.map(t => ({
      symbol: t.symbol,
      side: t.side,
      entryDate: t.entry_date,
      exitDate: t.exit_date,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      quantity: t.quantity,
      stopLoss: t.stop_loss,
      takeProfit: t.take_profit,
      pnl: t.pnl,
      mfe: t.mfe,
      fees: t.fees,
      status: t.status,
      strategy: t.strategy,
      setup: t.setup,
      timeframe: t.timeframe,
      marketType: t.market_type,
      notes: t.notes,
      entryReasoning: t.entry_reasoning,
      exitReasoning: t.exit_reasoning,
      mistakes: t.mistakes,
      lessonsLearned: t.lessons_learned,
      emotionalState: t.emotional_state,
      confidenceLevel: t.confidence_level,
      screenshotUrl: t.screenshot_url,
      screenshotUrl2: t.screenshot_url_2,
      broker: t.broker,
      accountBalance: t.account_balance,
      riskAmount: t.risk_amount,
      riskPercentage: t.risk_percentage,
      rewardRiskRatio: t.reward_risk_ratio
    }));

    // Get trading accounts
    const accounts = db.prepare('SELECT * FROM trading_accounts WHERE user_id = ?').all(user.id);
    userData.accounts = accounts.map(a => ({
      name: a.name,
      accountType: a.account_type,
      broker: a.broker,
      initialBalance: a.initial_balance,
      currentBalance: a.current_balance,
      currency: a.currency,
      isActive: a.is_active,
      notes: a.notes
    }));

    // Get tags
    const tags = db.prepare('SELECT * FROM trade_tags WHERE user_id = ?').all(user.id);
    userData.tags = tags.map(t => ({
      name: t.name,
      color: t.color
    }));

    // Get strategies
    try {
      const strategies = db.prepare('SELECT * FROM trading_strategies WHERE user_id = ?').all(user.id);
      userData.strategies = strategies.map(s => ({
        name: s.name,
        description: s.description,
        category: s.category,
        entryRules: s.entry_rules,
        exitRules: s.exit_rules,
        riskManagement: s.risk_management,
        timeframes: s.timeframes,
        markets: s.markets,
        notes: s.notes,
        isActive: s.is_active
      }));
    } catch (e) {
      // Table might not exist
    }

    // Get journals
    try {
      const journals = db.prepare('SELECT * FROM daily_journals WHERE user_id = ?').all(user.id);
      userData.journals = journals.map(j => ({
        date: j.date,
        marketConditions: j.market_conditions,
        emotionalState: j.emotional_state,
        preMarketNotes: j.pre_market_notes,
        postMarketNotes: j.post_market_notes,
        lessonsLearned: j.lessons_learned,
        rating: j.rating
      }));
    } catch (e) {
      // Table might not exist
    }

    // Get trading plans
    try {
      const plans = db.prepare('SELECT * FROM trading_plans WHERE user_id = ?').all(user.id);
      userData.plans = plans.map(p => ({
        title: p.title,
        content: p.content,
        isActive: p.is_active
      }));
    } catch (e) {
      // Table might not exist
    }

    // Get settings
    try {
      const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);
      if (settings) {
        userData.settings = {
          defaultRiskPercentage: settings.default_risk_percentage,
          defaultAccountSize: settings.default_account_size,
          currency: settings.currency,
          timezone: settings.timezone,
          theme: settings.theme
        };
      }
    } catch (e) {
      // Table might not exist
    }

    exportData.users.push(userData);
    console.log(`  - ${user.email}: ${userData.trades.length} trades, ${userData.accounts.length} accounts`);
  }

  db.close();

  fs.writeFileSync(EXPORT_FILE, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ Data exported to: ${EXPORT_FILE}`);
  console.log('\n📝 Next steps:');
  console.log('  1. Register a new account on production with ONE of these emails:');
  users.forEach(u => console.log(`     - ${u.email}`));
  console.log('  2. Copy the token from the response');
  console.log('  3. Run: node scripts/migrate-to-production.js import <your-token>');
}

async function importData(token) {
  console.log('📥 Importing data to production...\n');

  if (!token) {
    console.error('❌ Please provide your auth token');
    console.log('Usage: node scripts/migrate-to-production.js import <token>');
    process.exit(1);
  }

  if (!fs.existsSync(EXPORT_FILE)) {
    console.error('❌ Export file not found. Run export first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));

  // Get current user info
  const userRes = await fetch(`${PRODUCTION_API}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!userRes.ok) {
    console.error('❌ Invalid token or not logged in');
    process.exit(1);
  }

  const currentUser = await userRes.json();
  console.log(`Logged in as: ${currentUser.email}`);

  // Find matching user data
  const userData = data.users.find(u => u.email === currentUser.email);
  if (!userData) {
    console.log('\n⚠️  No matching email found in export. Importing first user data instead.');
    userData = data.users[0];
  }

  // Import accounts first
  console.log(`\nImporting ${userData.accounts.length} trading accounts...`);
  const accountIdMap = {};
  for (const account of userData.accounts) {
    try {
      const res = await fetch(`${PRODUCTION_API}/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(account)
      });
      if (res.ok) {
        const created = await res.json();
        console.log(`  ✅ ${account.name}`);
      } else {
        console.log(`  ⚠️  ${account.name} - ${res.statusText}`);
      }
    } catch (e) {
      console.log(`  ❌ ${account.name} - ${e.message}`);
    }
  }

  // Import trades
  console.log(`\nImporting ${userData.trades.length} trades...`);
  let imported = 0;
  let failed = 0;
  for (const trade of userData.trades) {
    try {
      const res = await fetch(`${PRODUCTION_API}/trades`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trade)
      });
      if (res.ok) {
        imported++;
      } else {
        failed++;
        const err = await res.text();
        console.log(`  ⚠️  ${trade.symbol} ${trade.entryDate} - ${err}`);
      }
    } catch (e) {
      failed++;
    }
  }
  console.log(`  ✅ Imported: ${imported}, Failed: ${failed}`);

  // Import tags
  if (userData.tags.length > 0) {
    console.log(`\nImporting ${userData.tags.length} tags...`);
    for (const tag of userData.tags) {
      try {
        await fetch(`${PRODUCTION_API}/tags`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tag)
        });
      } catch (e) {}
    }
    console.log('  ✅ Done');
  }

  console.log('\n🎉 Migration complete!');
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

if (command === 'export') {
  exportData();
} else if (command === 'import') {
  importData(arg);
} else {
  console.log('Usage:');
  console.log('  node scripts/migrate-to-production.js export');
  console.log('  node scripts/migrate-to-production.js import <token>');
}
