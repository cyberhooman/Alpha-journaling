import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'trading_journal.db');
const db = new Database(dbPath);

console.log('Checking trading_accounts table...');
const accounts = db.prepare('SELECT * FROM trading_accounts').all();
console.log('All accounts:', accounts);

const users = db.prepare('SELECT id, email FROM users').all();
console.log('All users:', users);

db.close();
